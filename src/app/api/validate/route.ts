// app/api/validate/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { validateDocument, type DocData, type ValidationIssue } from "@/lib/validator";
import { prisma } from "@/lib/db";
import { analyzeInspectorPatterns, patternWarningsToIssues } from "@/lib/patternAnalysis";
import { validateAgainstStructuredPlan } from "@/lib/structuredValidation";
import type { MasterSafetyPlan, StructuredValidationIssue } from "@/lib/masterPlanSchema";
import { calculateRiskLevel, riskCalculationToIssues } from "@/lib/riskMatrix";
import { analyzeCrossDocumentIssues, crossDocumentIssuesToValidationIssues } from "@/lib/crossDocumentAnalysis";
import { parseDocExtraction } from "@/lib/docSchema";
import { DOCUMENT_EXTRACTION_SCHEMA, type DocumentExtraction } from "@/lib/extractionSchema";
import { validateAgainstTBM } from "@/lib/tbmCrossValidation";
import {
  VERIFICATION_TOOLS,
  shouldVerifyExtraction,
  generateVerificationPrompt,
  reExtractField,
  verifyChecklistItem,
  checkSignaturePresence
} from "@/lib/verificationTools";
import { logger } from "@/lib/logger";

type Provider = "openai" | "claude" | "auto";

/**
 * Standardized error response builder
 * Ensures consistent error format across all endpoints
 */
function createErrorResponse(
  error: string,
  options: {
    fileName?: string;
    chatMessage?: string;
    status?: number;
    details?: string;
    solution?: string;
  } = {}
) {
  const {
    fileName = "Untitled",
    chatMessage,
    status = 400,
    details,
    solution
  } = options;

  return NextResponse.json(
    {
      error,
      fileName,
      ...(details && { details }),
      ...(solution && { solution }),
      issues: [],
      chat: [
        {
          role: "ai",
          text: chatMessage || error
        }
      ]
    },
    { status }
  );
}

// Helper to safely get OpenAI client
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

// Helper to safely get Anthropic client
function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function buildSystemPrompt() {
  return `
?ˆëŠ” ?°ì—…?ˆì „ ?œë¥˜ ê²€ì¦?AI?? ?•í•´ì§??¤í‚¤ë§ˆì— ë§ì¶° ?•ë³´ë¥?"?ˆëŠ” ê·¸ë?ë¡? ì¶”ì¶œ?˜ë¼.
?ë‹¨?˜ì? ë§ê³ , ë¬¸ì„œ???íŒ ?ìŠ¤?¸ì? ?´ìš©??ê¸°ë°˜?¼ë¡œ ê°’ì„ ì±„ì›Œ??

ì¶œë ¥?€ ë°˜ë“œ??"JSONë§? ì¶œë ¥?œë‹¤(?¤ëª…/ë§ˆí¬?¤ìš´ ê¸ˆì?).
?¤í‚¤ë§?
{
  "docType": "?°ì—…?ˆì „ ?ê??? | "?„í—˜???‰ê? ë³´ê³ ?? | "?‘ì—… ???ˆì „?ê??? | "TBM" | "unknown",
  "fields": {
    "?ê??¼ì": string|null,   // ?? 2024-05-20, ?ë³„ ë¶ˆê???null
    "?„ì¥ëª?: string|null,
    "?‘ì—…?´ìš©": string|null,
    "?‘ì—…?¸ì›": string|null    // ?? "3ëª?, "?ê¸¸????2ëª? ??
  },
  "signature": {
    "?´ë‹¹": "present"|"missing"|"unknown", // ?´ë‹¹???‘ì—…ë°˜ì¥ ???¤ë¬´???œëª…
    "?Œì¥": "present"|"missing"|"unknown"  // ê´€ë¦¬ì±…?„ì/?Œì¥ ?œëª…
  },
  "inspectorName": string|null,  // ?ê????´ë‹¹???´ë¦„ (?? "ê¹€ì² ìˆ˜", "ë°•ì•ˆ??)
  "riskLevel": "high"|"medium"|"low"|null,  // ë¬¸ì„œ???œì‹œ???„í—˜???˜ì?
  "checklist": [  // ì²´í¬ë¦¬ìŠ¤????ª©??(?ˆëŠ” ê²½ìš°ë§?
    {
      "id": string,     // ??ª© ID (fall_01, ppe_03 ??
      "category": string,  // ë¶„ë¥˜ (ì¶”ë½?ˆë°©, ë³´í˜¸êµ? ?„ê¸°?ˆì „ ??
      "nameKo": string,    // ?œêµ­????ª©ëª?
      "value": "??|"??|"N/A"|null  // ì²´í¬ ?íƒœ
    }
  ],
  "chat": [
     {"role":"ai", "text": "ë¬¸ì„œ ?”ì•½ ë°??¹ì´?¬í•­ ?œì¤„ ì½”ë©˜??}
  ]
}

ì²´í¬ë¦¬ìŠ¤??ID ê·œì¹™:
- fall_01: ê³ ì†Œ?‘ì—…, fall_02: ì¶”ë½ë°©í˜¸?¥ì¹˜, fall_03: ?ˆì „?œê°„
- ppe_01: ?ˆì „ëª¨ì°©?? ppe_03: ?ˆì „?€ì°©ìš©
- fire_01: ?”ê¸°?‘ì—…, fire_02: ?Œí™”ê¸°ë¹„ì¹?
- conf_01: ë°€?ê³µê°„ì‘?? conf_02: ?°ì†Œ?ë„ì¸¡ì •, conf_03: ?˜ê¸°ì¡°ì¹˜
- exc_01: êµ´ì°©?‘ì—…, exc_02: ?™ë§‰?´ì„¤ì¹? exc_03: ?ˆì¶œ?¬ë‹¤ë¦?
- elec_02: ?„ê¸°?‘ì—…, elec_03: ? ê¸ˆ?¥ì¹˜

ì£¼ì˜:
- "issues" ?„ë“œ???ì„±?˜ì? ë§ˆë¼. (ê²€ì¦ì? ë³„ë„ ë¡œì§?¼ë¡œ ?˜í–‰??
- ?œëª…?€??ë¹„ì–´?ˆìœ¼ë©?"missing"?¼ë¡œ ?œì‹œ?˜ë¼.
- ?´ìš©??ì°¾ì„ ???†ìœ¼ë©?null ?ëŠ” "unknown"???¬ìš©?˜ë¼.
- ?¬ìš©?ê? "?„ë¡œ?íŠ¸ ê·œì¹™" ?ëŠ” "ë§ˆìŠ¤???Œëœ"???œê³µ??ê²½ìš°(?„ë˜ Context), ê·?ê·œì¹™???„ë°°?˜ëŠ” ?¬í•­???ˆë‹¤ë©??¹ì´?¬í•­(chat)???¸ê¸‰?˜ë¼.
- chat ë©”ì‹œì§€??ë¹„íŒ?¨ì (non-judgmental) ?´ì¡°ë¥??¬ìš©?˜ë¼: "ë¶ˆì¼ì¹˜ê? ì¡´ì¬??, "ê¸°ë¡ ?„ë½?? ?±ìœ¼ë¡??œí˜„?˜ê³ , "?„í—˜??, "?˜ëª»?? ê°™ì? ?ë‹¨ ?œí˜„?€ ?¼í•˜??
`;
}

function buildPhotoValidationPrompt(contextText?: string) {
  let prompt = `
?ˆëŠ” ê±´ì„¤ ?„ì¥ ?ˆì „ ê²€?¬ê? AI?? ?…ë¡œ?œëœ ?„ì¥ ?¬ì§„??ë¶„ì„?˜ì—¬ ?ˆì „ ê·œì • ?„ë°˜ ?¬í•­???ë³„?˜ë¼.

ì¶œë ¥?€ ë°˜ë“œ??"JSONë§? ì¶œë ¥?œë‹¤(?¤ëª…/ë§ˆí¬?¤ìš´ ê¸ˆì?).
?¤í‚¤ë§?
{
  "docType": "?„ì¥ ?¬ì§„",
  "fields": {
    "?ê??¼ì": null,
    "?„ì¥ëª?: null,
    "?‘ì—…?´ìš©": string,  // ?¬ì§„?ì„œ ê´€ì°°ëœ ?‘ì—… ?¤ëª… (?? "ê³ ì†Œ?‘ì—…", "?„ê¸°?‘ì—…", "êµ´ì°©?‘ì—…")
    "?‘ì—…?¸ì›": string|null  // ?¬ì§„??ë³´ì´???‘ì—…????(?? "2ëª?, "?•ì¸ ë¶ˆê?")
  },
  "photoAnalysis": {
    "workType": string,  // ?‘ì—… ? í˜• (?? "ê³ ì†Œ?‘ì—…", "ë°€?ê³µê°„ì‘??, "?„ê¸°?‘ì—…")
    "workersVisible": number,  // ?•ì¸???‘ì—…????
    "location": string,  // ?‘ì—… ?„ì¹˜ ?¤ëª… (?? "ê±´ë¬¼ ?¸ë²½ 3ì¸?, "ì§€??ê³µê°„", "?¥ìƒ")
    "conditions": string[]  // ê´€ì°°ëœ ?„ì¥ ?í™© (?? ["?’ì´ 3m ?´ìƒ", "ë°€?ê³µê°?, "?°ì²œ"])
  },
  "safetyViolations": [  // ë°œê²¬???ˆì „ ?„ë°˜ ?¬í•­
    {
      "id": string,  // ?„ë°˜ ID (fall_helmet, ppe_vest ??
      "category": string,  // ë¶„ë¥˜ (ê°œì¸ë³´í˜¸êµ? ?ˆì „?œì„¤, ?‘ì—…?˜ê²½)
      "violation": string,  // ?„ë°˜ ?´ìš© (?? "?ˆì „ëª?ë¯¸ì°©??, "?ˆì „?œê°„ ë¯¸ì„¤ì¹?)
      "severity": "high"|"medium"|"low",  // ?„í—˜??
      "location": string,  // ?¬ì§„ ???„ì¹˜ (?? "?”ë©´ ì¤‘ì•™ ?‘ì—…??, "?¼ìª½ ?ë‹¨ ?ì—­")
      "evidence": string  // êµ¬ì²´??ê·¼ê±° (?? "?¸ë????‘ì—…ë³?ì°©ìš© ?‘ì—…?ì˜ ë¨¸ë¦¬???ˆì „ëª¨ê? ë³´ì´ì§€ ?ŠìŒ")
    }
  ],
  "safetyCompliance": [  // ì¤€???¬í•­
    {
      "item": string,  // ì¤€????ª© (?? "?ˆì „ì¡°ë¼ ì°©ìš©", "?ˆì „?€ ì²´ê²°")
      "evidence": string  // ì¤€??ê·¼ê±°
    }
  ],
  "checklist": [  // ?ˆì „ ì²´í¬ë¦¬ìŠ¤??(?¬ì§„ ê¸°ë°˜ ?ë™ ?‰ê?)
    {
      "id": string,  // ??ª© ID
      "category": string,  // ë¶„ë¥˜
      "nameKo": string,  // ??ª©ëª?
      "value": "??|"??|"N/A"  // ?‰ê? ê²°ê³¼
    }
  ],
  "chat": [
    {"role":"ai", "text": "?¬ì§„ ë¶„ì„ ?”ì•½ ë°?ì£¼ìš” ë°œê²¬ ?¬í•­"}
  ]
}

ë¶„ì„ ê°€?´ë“œ?¼ì¸:

1. ê°œì¸ë³´í˜¸êµ?PPE) ?•ì¸:
   - ?ˆì „ëª?ppe_01): ?„ìˆ˜ ì°©ìš©, ?‰ìƒ/?•íƒœ ?•ì¸
   - ?ˆì „ì¡°ë¼(ppe_02): ?¼ê´‘/ê³ ê??œì„± ì¡°ë¼ ì°©ìš© ?¬ë?
   - ?ˆì „?€(ppe_03): ê³ ì†Œ?‘ì—… ???„ìˆ˜, ê±¸ì´ ?°ê²° ?•ì¸
   - ?ˆì „??ppe_04): ?‘ì—…??ì°©ìš© ?¬ë?
   - ?ˆì „?¥ê°‘(ppe_05): ?‘ì—… ? í˜•??ë§ëŠ” ?¥ê°‘ ì°©ìš©

2. ?ˆì „?œì„¤ ?•ì¸:
   - ì¶”ë½ë°©ì?: ?ˆì „?œê°„(fall_03), ì¶”ë½ë°©í˜¸ë§?fall_02)
   - ?„ê¸°?ˆì „: ?ˆì—°?¥ê°‘, ? ê¸ˆ?¥ì¹˜(elec_03)
   - ?”ê¸°?‘ì—…: ?Œí™”ê¸?ë¹„ì¹˜(fire_02), ë¶ˆê½ƒ ê°ì‹œ??
   - ë°€?ê³µê°? ?˜ê¸°?¥ì¹˜(conf_03), ?°ì†Œ?ë„ê³?conf_02)
   - êµ´ì°©?‘ì—…: ?™ë§‰??exc_02), ?ˆì¶œ?¬ë‹¤ë¦?exc_03)

3. ?‘ì—…?˜ê²½ ?‰ê?:
   - ?‘ì—… ?’ì´: 2m ?´ìƒ = ê³ ì†Œ?‘ì—…(fall_01)
   - ë°€?ê³µê°? ?˜ê¸° ë¶ˆëŸ‰ ê³µê°„ = ë°€?ê³µê°„ì‘??conf_01)
   - ?„ê¸° ?¸ì¶œ: ê°ì „ ?„í—˜ = ?„ê¸°?‘ì—…(elec_02)
   - êµ´ì°© ê¹Šì´: 1.5m ?´ìƒ = êµ´ì°©?‘ì—…(exc_01)

4. ?„ë°˜ ?¬ê°??ê¸°ì?:
   - high: ì¦‰ì‹œ ?ëª… ?„í˜‘ (ì¶”ë½, ê°ì „, ì§ˆì‹ ??
   - medium: ì¤‘ë? ë¶€??ê°€??(?™í•˜ë¬? ?”ìƒ ??
   - low: ê²½ë???ë¶€??ê°€??(ì°°ê³¼?? ?€ë°•ìƒ ??

ì£¼ì˜?¬í•­:
- ?¬ì§„?ì„œ **ëª…í™•???•ì¸ ê°€?¥í•œ ?¬í•­ë§?* ë³´ê³ ?˜ë¼
- ë¶ˆí™•?¤í•œ ê²½ìš° "?•ì¸ ë¶ˆê?" ?ëŠ” "N/A"ë¡??œì‹œ
- ?„ë°˜ ?¬í•­?€ êµ¬ì²´??ê·¼ê±°?€ ?„ì¹˜ë¥??¨ê»˜ ê¸°ìˆ 
- ë¹„íŒ?¨ì  ?´ì¡° ? ì?: "ï½ê? ê´€ì°°ë¨", "ï½í™•?¸ë˜ì§€ ?ŠìŒ"
`;

  if (contextText) {
    prompt += `\n\n[PROJECT CONTEXT / MASTER SAFETY PLAN]\n?¤ìŒ?€ ???„ì¥??ë§ˆìŠ¤???ˆì „ ê³„íš?´ë‹¤. ?¬ì§„ ë¶„ì„ ????ê·œì¹™??ê¸°ì??¼ë¡œ ?„ë°˜ ?¬ë?ë¥??ë‹¨?˜ë¼:\n${contextText}`;
  }

  return prompt;
}

function safeJsonParse(text: string) {
  const trimmed = (text ?? "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // JSONë§??¬ë¼ê³??´ë„ ?ë’¤ë¡?ë§ì´ ë¶™ëŠ” ê²½ìš° ?€ë¹?
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

function sanitizeDocData(raw: unknown) {
  return parseDocExtraction(raw);
}

// ??NEW: Extraction with Structured Outputs (guaranteed valid JSON)
async function callOpenAIStructured(opts: {
  pdfText?: string;
  pageImages?: string[] | null;
  contextText?: string
}): Promise<DocumentExtraction> {
  let sysPrompt = buildSystemPrompt();

  if (opts.contextText) {
    sysPrompt += `\n\n[PROJECT CONTEXT / MASTER PLAN]\n?¤ìŒ?€ ???„ì¥??ë§ˆìŠ¤???ˆì „ ê³„íš?´ë‹¤. ???´ìš©??ì°¸ê³ ?˜ì—¬ ?„ë°˜ ?¬í•­?´ë‚˜ ë¶ˆì¼ì¹??ì´ ?ˆìœ¼ë©?ì§€?í•˜??\n${opts.contextText}`;
  }

  // Add confidence tracking instruction
  sysPrompt += `\n\nì¤‘ìš”: extractionConfidence ?„ë“œ??ì¶”ì¶œ ? ë¢°?„ë? ë°˜ë“œ???¬í•¨?˜ì„¸??
- overall: "high" (ëª¨ë“  ?„ë“œ ëª…í™•), "medium" (?¼ë? ë¶ˆí™•??, "low" (?¬ëŸ¬ ?„ë“œ ë¶ˆí™•??
- uncertainFields: ì¶”ì¶œ??ë¶ˆí™•?¤í•œ ?„ë“œ ëª©ë¡ (?? ["?ê??¼ì", "?ê???])`;

  // Build content array
  const content: any[] = [];
  content.push({ type: "text", text: sysPrompt });

  if (opts.pdfText && opts.pdfText.trim().length >= 50) {
    content.push({ type: "text", text: `ì¶”ì¶œ ?ìŠ¤??\n${opts.pdfText}` });
  }

  if (opts.pageImages?.length) {
    for (const img of opts.pageImages) {
      content.push({
        type: "image_url",
        image_url: {
          url: img,
          detail: "high"
        }
      });
    }
  }

  logger.log("[Structured Extraction] Calling OpenAI with structured outputs...");

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: content
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: DOCUMENT_EXTRACTION_SCHEMA
    },
    max_tokens: 1500,
    temperature: 0,
  });

  const responseText = response.choices[0]?.message?.content ?? "{}";
  const extraction: DocumentExtraction = JSON.parse(responseText);

  logger.log("[Structured Extraction] Success! Confidence:", extraction.extractionConfidence.overall);

  return extraction;
}

// Keep old function for Claude fallback
async function callOpenAI(opts: { pdfText?: string; pageImages?: string[] | null; contextText?: string }) {
  let sysPrompt = buildSystemPrompt();

  if (opts.contextText) {
    sysPrompt += `\n\n[PROJECT CONTEXT / MASTER PLAN]\n?¤ìŒ?€ ???„ì¥??ë§ˆìŠ¤???ˆì „ ê³„íš?´ë‹¤. ???´ìš©??ì°¸ê³ ?˜ì—¬ ?„ë°˜ ?¬í•­?´ë‚˜ ë¶ˆì¼ì¹??ì´ ?ˆìœ¼ë©?ì§€?í•˜??\n${opts.contextText}`;
  }

  const content: any[] = [];
  content.push({ type: "text", text: sysPrompt });

  if (opts.pdfText && opts.pdfText.trim().length >= 50) {
    content.push({ type: "text", text: `ì¶”ì¶œ ?ìŠ¤??\n${opts.pdfText}` });
  }

  if (opts.pageImages?.length) {
    for (const img of opts.pageImages) {
      content.push({
        type: "image_url",
        image_url: {
          url: img,
          detail: "high"
        }
      });
    }
  }

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: content
      }
    ],
    max_tokens: 1500,
    temperature: 0,
  });

  const responseText = response.choices[0]?.message?.content ?? "";
  return safeJsonParse(responseText);
}

async function callClaude(opts: { pdfText?: string; pageImages?: string[] | null; contextText?: string }) {
  const content: any[] = [];

  // ?œìŠ¤???„ë¡¬?„íŠ¸??ì²??ìŠ¤??ë¸”ë¡???¨ê»˜ ?£ëŠ” ë°©ì‹?¼ë¡œ ê°„ë‹¨??ì²˜ë¦¬
  let sysPrompt = buildSystemPrompt();
  if (opts.contextText) {
    sysPrompt += `\n\n[PROJECT CONTEXT / MASTER PLAN]\n?¤ìŒ?€ ???„ì¥??ë§ˆìŠ¤???ˆì „ ê³„íš?´ë‹¤. ???´ìš©??ì°¸ê³ ?˜ì—¬ ?„ë°˜ ?¬í•­?´ë‚˜ ë¶ˆì¼ì¹??ì´ ?ˆìœ¼ë©?ì§€?í•˜??\n${opts.contextText}`;
  }
  content.push({ type: "text", text: sysPrompt });

  if (opts.pdfText && opts.pdfText.trim().length >= 50) {
    content.push({ type: "text", text: `ì¶”ì¶œ ?ìŠ¤??\n${opts.pdfText}` });
  }

  if (opts.pageImages?.length) {
    for (const img of opts.pageImages) {
      // data:image/jpeg;base64,... ?ì„œ base64ë§?ë¶„ë¦¬
      const base64 = img.split(",")[1] ?? "";
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: base64 },
      });
    }
  }

  const msg = await getAnthropic().messages.create({
    model: "claude-sonnet-4-5-20250929", // ??ê³„ì •?ì„œ ê°€?¥í•œ ëª¨ë¸ë¡?ë°”ê¿”????
    max_tokens: 1500,
    messages: [{ role: "user", content }],
  });

  // Claude ?‘ë‹µ?€ content ë°°ì—´ë¡??¤ë‹ˆê¹?textë§??©ì¹˜ê¸?
  const outText =
    msg.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n") ?? "";

  return safeJsonParse(outText);
}

// ??NEW: Verification step with self-correction tools
async function verifyExtraction(
  extraction: DocumentExtraction,
  pdfText: string,
  pageImages?: string[] | null
): Promise<DocumentExtraction> {
  // Check if verification is needed
  if (!shouldVerifyExtraction(extraction)) {
    logger.log("[Verification] High confidence - skipping verification");
    return extraction;
  }

  // TODO: Implement verification correction logic
  // Currently, verification calls are made but results are discarded (wasteful).
  // Until correction step is implemented, skip verification to avoid:
  // - Extra latency (2+ additional API calls)
  // - Token cost (GPT-4o-mini calls with no benefit)
  // - No accuracy improvement (results not applied)
  logger.log("[Verification] Low confidence detected, but verification disabled (correction not implemented)");
  logger.log("[Verification] Uncertain fields:", extraction.extractionConfidence.uncertainFields);
  return extraction;

  /* DISABLED: Verification calls without correction (wasteful)
  logger.log("[Verification] Low confidence - running verification tools");
  logger.log("[Verification] Uncertain fields:", extraction.extractionConfidence.uncertainFields);

  // Build verification messages
  const verificationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "?ˆëŠ” ë¬¸ì„œ ì¶”ì¶œ ?ˆì§ˆ ê²€ì¦??„ë¬¸ê°€?? ì¶”ì¶œ ê²°ê³¼ë¥?ê²€? í•˜ê³??„ìš”?˜ë©´ ?¬ì¶”ì¶??„êµ¬ë¥??¬ìš©?˜ì—¬ ?„ë½???•ë³´ë¥?ë³´ì™„?˜ë¼. ëª¨ë“  ?„êµ¬ ?¬ìš© ??'ê²€ì¦??„ë£Œ'?¼ê³  ?‘ë‹µ?˜ë¼."
    },
    {
      role: "user",
      content: generateVerificationPrompt(extraction)
    }
  ];

  try {
    // Call GPT-4o-mini with verification tools
    const verification = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini", // Cheaper model for verification
      messages: verificationMessages,
      tools: VERIFICATION_TOOLS,
      tool_choice: "auto",
      temperature: 0,
      max_tokens: 1000
    });

    const message = verification.choices[0]?.message;

    // Handle tool calls
    if (message?.tool_calls && message.tool_calls.length > 0) {
      logger.log(`[Verification] AI calling ${message.tool_calls.length} tool(s)`);

      verificationMessages.push(message);

      // Execute each tool call
      for (const toolCall of message.tool_calls) {
        const { name, arguments: argsStr } = (toolCall as any).function;
        const args = JSON.parse(argsStr);

        logger.log(`[Verification] Tool: ${name}`, args);

        let toolResult = "";

        switch (name) {
          case "re_extract_field":
            toolResult = reExtractField(args.fieldName, args.reason, pdfText, pageImages ?? undefined);
            // TODO: In production, actually re-extract from document
            break;

          case "verify_checklist_item":
            toolResult = verifyChecklistItem(args.itemId, args.currentValue, pdfText, pageImages ?? undefined);
            // TODO: In production, actually verify from document
            break;

          case "check_signature_presence":
            toolResult = checkSignaturePresence(args.signatureType, pdfText, pageImages ?? undefined);
            // TODO: In production, actually check document
            break;

          default:
            toolResult = `?????†ëŠ” ?„êµ¬: ${name}`;
        }

        verificationMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult
        });
      }

      // Get final verification response
      const finalVerification = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: verificationMessages,
        temperature: 0,
        max_tokens: 500
      });

      const verificationResult = finalVerification.choices[0]?.message?.content || "";
      logger.log("[Verification] Result:", verificationResult);

      // TODO: Parse verification result and apply corrections to extraction
      // For now, return original extraction (tools are informational)
    } else {
      logger.log("[Verification] No tool calls needed - extraction confirmed good");
    }

    return extraction;
  } catch (error) {
    logger.warn("[Verification] Failed, using original extraction:", error);
    return extraction;
  }
  */
}

export async function POST(req: Request) {
  try {
    const { provider, fileName, pdfText, pageImages, projectId, documentType, tempContextText, latestTBM } = await req.json();

    // VALIDATION: Check if document has sufficient content
    const hasText = pdfText && pdfText.trim().length >= 50;
    const hasImages = pageImages && pageImages.length > 0;

    if (!hasText && !hasImages) {
      return NextResponse.json(
        {
          error: "ë¬¸ì„œ???´ìš©???†ê±°???½ì„ ???†ìŠµ?ˆë‹¤",
          fileName: fileName ?? "Untitled",
          issues: [],
          chat: [
            {
              role: "ai",
              text: "?…ë¡œ?œëœ ë¬¸ì„œê°€ ë¹„ì–´?ˆê±°???´ìš©???½ì„ ???†ìŠµ?ˆë‹¤. ?¬ë°”ë¥??ˆì „ ?ê? ë¬¸ì„œë¥??…ë¡œ?œí•´ì£¼ì„¸??"
            }
          ]
        },
        { status: 400 }
      );
    }

    const p: Provider = (provider ?? "auto") as Provider;

    const normalizedText = (pdfText ?? "").replace(/\s+/g, " ").trim();
    const looksLikeGeneratedReport =
      normalizedText.includes("ê²€ì¦??”ì•½") ||
      normalizedText.includes("AI ë¶„ì„") ||
      normalizedText.includes("AI ?ˆì „?„ìš°ë¯?) ||
      normalizedText.includes("?¤ë§ˆ???ˆì „ì§€?´ì´") ||
      normalizedText.includes("ê²€ì¦?ê²°ê³¼");

    if (looksLikeGeneratedReport) {
      return NextResponse.json(
        {
          error: "ê²€ì¦?ê²°ê³¼ ë¦¬í¬?¸ëŠ” ?…ë¡œ???€?ì´ ?„ë‹™?ˆë‹¤",
          fileName: fileName ?? "Untitled",
          issues: [],
          chat: [
            {
              role: "ai",
              text: "???Œì¼?€ ê²€ì¦?ê²°ê³¼ ë¦¬í¬?¸ë¡œ ë³´ì…?ˆë‹¤. ?ë³¸ ?ˆì „ ?ê? ë¬¸ì„œë¥??…ë¡œ?œí•´ì£¼ì„¸??"
            }
          ]
        },
        { status: 400 }
      );
    }

    // Fetch Project Context if projectId is present, or use temporary context
    let contextText = "";
    let masterPlan: MasterSafetyPlan | null = null;
    let projectIsStructured = false;

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      if (project) {
        // Legacy free-text context
        if (project.contextText) {
          contextText = project.contextText;
        }
        // New structured master plan
        if (project.isStructured && project.masterPlanJson) {
          try {
            masterPlan = JSON.parse(project.masterPlanJson) as MasterSafetyPlan;
            projectIsStructured = true;
          } catch (e) {
            logger.error("Failed to parse master plan JSON:", e);
          }
        }
      }
    } else if (tempContextText) {
      // Use temporary master doc context for non-project validation
      contextText = tempContextText;
    }

    // ??PHOTO VALIDATION: Special handling for site photos
    logger.log("[Route] Document type received:", documentType);
    logger.log("[Route] Is SITE_PHOTO?", documentType === "SITE_PHOTO");

    if (documentType === "SITE_PHOTO") {
      logger.log("\n========== PHOTO VALIDATION MODE ==========");

      if (!hasImages) {
        return NextResponse.json(
          {
            error: "?„ì¥ ?¬ì§„ ê²€ì¦ì—???´ë?ì§€ê°€ ?„ìš”?©ë‹ˆ??,
            fileName: fileName ?? "Untitled",
            issues: [],
            chat: [
              {
                role: "ai",
                text: "?„ì¥ ?¬ì§„???…ë¡œ?œí•´ì£¼ì„¸?? ?´ë?ì§€ ?Œì¼???„ìš”?©ë‹ˆ??"
              }
            ]
          },
          { status: 400 }
        );
      }

      // Use photo validation prompt
      const photoPrompt = buildPhotoValidationPrompt(contextText);

      let photoAnalysis: any;
      try {
        // Try OpenAI GPT-4o (has vision capabilities)
        if (p === "openai" || p === "auto") {
          const content: any[] = [
            { type: "text", text: photoPrompt }
          ];

          // Add images
          for (const img of pageImages) {
            content.push({
              type: "image_url",
              image_url: { url: img, detail: "high" }
            });
          }

          const response = await getOpenAI().chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content }],
            max_tokens: 2000,
            temperature: 0,
          });

          photoAnalysis = safeJsonParse(response.choices[0]?.message?.content ?? "");
        } else {
          // Use Claude for vision analysis
          const content: any[] = [
            { type: "text", text: photoPrompt }
          ];

          for (const img of pageImages) {
            const base64 = img.split(",")[1] ?? "";
            content.push({
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64 },
            });
          }

          const msg = await getAnthropic().messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 2000,
            messages: [{ role: "user", content }],
          });

          const outText = msg.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join("\n") ?? "";

          photoAnalysis = safeJsonParse(outText);
        }

        logger.log("[Photo Analysis] Complete:", JSON.stringify(photoAnalysis, null, 2));

        // Convert photo analysis to standard format
        const extraction: DocumentExtraction = {
          docType: "?„ì¥ ?¬ì§„",
          fields: photoAnalysis.fields || {},
          signature: { ?´ë‹¹: "unknown", ?Œì¥: "unknown" },
          inspectorName: null,
          riskLevel: null,
          checklist: photoAnalysis.checklist || [],
          chat: photoAnalysis.chat || [
            { role: "ai", text: "?„ì¥ ?¬ì§„ ë¶„ì„???„ë£Œ?˜ì—ˆ?µë‹ˆ??" }
          ],
          extractionConfidence: {
            overall: "high",
            uncertainFields: []
          }
        };

        // Convert violations to issues
        const photoIssues: ValidationIssue[] = [];

        if (photoAnalysis.safetyViolations) {
          for (const violation of photoAnalysis.safetyViolations) {
            photoIssues.push({
              severity: violation.severity === "high" ? "error" : violation.severity === "medium" ? "warn" : "info",
              title: violation.violation,
              message: `${violation.evidence}\n\n?„ì¹˜: ${violation.location}`,
              ruleId: `photo_${violation.id}`,
              path: `?¬ì§„ë¶„ì„.${violation.category}`,
            });
          }
        }

        // Store in database
        const createdReport = await prisma.report.create({
          data: {
            fileName,
            docDataJson: JSON.stringify(extraction),
            issuesJson: JSON.stringify(photoIssues),
            chatJson: JSON.stringify(extraction.chat),
            projectId: projectId ?? null,
            documentType: "SITE_PHOTO",
          }
        });

        return NextResponse.json({
          id: createdReport.id,
          fileName,
          issues: photoIssues,
          chat: extraction.chat,
          extracted: extraction,
          documentType: "SITE_PHOTO",
        });
      } catch (e: any) {
        logger.error("[Photo Analysis] Error:", e);
        logger.error("[Photo Analysis] Error details:", {
          message: e.message,
          stack: e.stack,
          documentType,
          hasImages,
        });
        return NextResponse.json(
          {
            error: `?¬ì§„ ë¶„ì„ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤: ${e.message}`,
            fileName,
            issues: [],
            chat: [
              {
                role: "ai",
                text: `?¬ì§„ ë¶„ì„???¤íŒ¨?ˆìŠµ?ˆë‹¤.\n\n?¤ë¥˜: ${e.message}\n\nì°¸ê³ : ?¤ìº”??ë¬¸ì„œ ?´ë?ì§€ë¥??…ë¡œ?œí•˜?œëŠ” ê²½ìš°, ë¬¸ì„œ ì¢…ë¥˜ ? íƒ ??"?„ì¥ ?¬ì§„"???„ë‹Œ ?¤ì œ ë¬¸ì„œ ? í˜•(?? "?°ì—…?ˆì „ ?ê???)??? íƒ?´ì£¼?¸ìš”.`
              }
            ]
          },
          { status: 500 }
        );
      }
    }

    // ??Phase 1: Structured Extraction (Guaranteed Valid JSON)
    logger.log("\n========== PHASE 1: STRUCTURED EXTRACTION ==========");
    let extraction: DocumentExtraction;

    if (p === "openai" || p === "auto") {
      // Use structured outputs (OpenAI only for now)
      try {
        extraction = await callOpenAIStructured({ pdfText, pageImages, contextText });
      } catch (e) {
        logger.warn("[Extraction] Structured extraction failed, falling back to Claude:", e);
        // Fallback to Claude (without structured outputs)
        const result = await callClaude({ pdfText, pageImages, contextText });
        const sanitized = sanitizeDocData(result);
        if ("error" in sanitized) {
          return createErrorResponse(sanitized.error, { fileName });
        }
        // Map to DocumentExtraction format
        extraction = {
          ...sanitized.data,
          extractionConfidence: {
            overall: "medium",
            uncertainFields: []
          }
        } as DocumentExtraction;
      }
    } else {
      // Claude path (no structured outputs yet)
      const result = await callClaude({ pdfText, pageImages, contextText });
      const sanitized = sanitizeDocData(result);
      if ("error" in sanitized) {
        return createErrorResponse(sanitized.error, { fileName });
      }
      extraction = {
        ...sanitized.data,
        extractionConfidence: {
          overall: "medium",
          uncertainFields: []
        }
      } as DocumentExtraction;
    }

    logger.log("[Phase 1] Extraction complete. Confidence:", extraction.extractionConfidence.overall);

    // ??Phase 2: Verification (Conditional, Self-Correcting)
    logger.log("\n========== PHASE 2: VERIFICATION ==========");
    const verified = await verifyExtraction(extraction, pdfText ?? "", pageImages);
    logger.log("[Phase 2] Verification complete");

    // Convert DocumentExtraction to DocData format for validation
    const extracted: any = {
      docType: verified.docType,
      fields: verified.fields,
      signature: verified.signature,
      inspectorName: verified.inspectorName,
      riskLevel: verified.riskLevel,
      checklist: verified.checklist,
      chat: verified.chat
    };

    // VALIDATION: Check if document is safety-related
    // If docType is "unknown" and no safety-related fields are found, reject the document
    const isSafetyDocument =
      extracted.docType !== "unknown" ||
      (extracted.fields?.?ê??¼ì ?? false) ||
      (extracted.fields?.?„ì¥ëª??? false) ||
      (extracted.fields?.?‘ì—…?´ìš© ?? false) ||
      (extracted.signature?.?´ë‹¹ && extracted.signature.?´ë‹¹ !== "unknown") ||
      (extracted.signature?.?Œì¥ && extracted.signature.?Œì¥ !== "unknown") ||
      (extracted.checklist?.length ?? 0) > 0;

    if (!isSafetyDocument) {
      // ??Better error message for images
      const wasImage = pageImages && pageImages.length > 0;
      const errorMessage = wasImage
        ? "?…ë¡œ?œëœ ?´ë?ì§€?ì„œ ?ˆì „ ?ê? ë¬¸ì„œ ?´ìš©??ì°¾ì„ ???†ìŠµ?ˆë‹¤. ?´ë?ì§€ê°€ ? ëª…?˜ê³  ë¬¸ì„œ ?„ì²´ê°€ ??ë³´ì´?”ì? ?•ì¸?´ì£¼?¸ìš”. ?ë¦¿?˜ê±°???¼ë?ë§?ì´¬ì˜??ê²½ìš° ?¤ì‹œ ì´¬ì˜?´ì£¼?¸ìš”."
        : "?…ë¡œ?œëœ ë¬¸ì„œ???ˆì „ ?ê? ê´€??ë¬¸ì„œê°€ ?„ë‹Œ ê²ƒìœ¼ë¡?ë³´ì…?ˆë‹¤. ?°ì—…?ˆì „ ?ê??? ?„í—˜???‰ê? ë³´ê³ ?? TBM ê²°ê³¼ ???ˆì „ ?ê? ë¬¸ì„œë¥??…ë¡œ?œí•´ì£¼ì„¸??";

      return NextResponse.json(
        {
          error: "?ˆì „ ?ê? ë¬¸ì„œê°€ ?„ë‹Œ ê²ƒìœ¼ë¡??ë‹¨?©ë‹ˆ??,
          fileName: fileName ?? "Untitled",
          issues: [],
          chat: [
            {
              role: "ai",
              text: errorMessage
            }
          ]
        },
        { status: 400 }
      );
    }

    const validationIssues = validateDocument(extracted);

    // Map user-selected document type (frontend enum) to AI-detected type (Korean names)
    const documentTypeMap: Record<string, DocData["docType"]> = {
      SAFETY_CHECKLIST: "?°ì—…?ˆì „ ?ê???,
      RISK_ASSESSMENT: "?„í—˜???‰ê? ë³´ê³ ??,
      PRE_WORK_CHECKLIST: "?‘ì—… ???ˆì „?ê???,
      TBM: "TBM",
      SITE_PHOTO: "?„ì¥ ?¬ì§„",
      OTHER: "unknown",
    };
    const selectedDocType = documentType ? documentTypeMap[documentType as keyof typeof documentTypeMap] : undefined;
    const mismatchIssues: ValidationIssue[] = [];

    if (documentType) {
      if (selectedDocType === "unknown") {
        if (extracted.docType !== "unknown") {
          mismatchIssues.push({
            severity: "warn",
            title: "ë¬¸ì„œ ? í˜• ? íƒ???¤ì œ ?´ìš©ê³??¤ë¦…?ˆë‹¤",
            message: `? íƒ?˜ì‹  ë¬¸ì„œ ? í˜•?€ "ê¸°í? ë¬¸ì„œ"?´ì?ë§? AI ë¶„ì„ ê²°ê³¼??"${extracted.docType}"ë¡??¸ì‹?˜ì—ˆ?µë‹ˆ?? ?¬ë°”ë¥?? í˜•??? íƒ?ˆëŠ”ì§€ ?•ì¸?´ì£¼?¸ìš”.`,
            ruleId: "user_doc_type_mismatch",
          });
        }
      } else if (selectedDocType && extracted.docType !== "unknown" && extracted.docType !== selectedDocType) {
        mismatchIssues.push({
          severity: "warn",
          title: "ë¬¸ì„œ ? í˜• ? íƒ???¤ì œ ?´ìš©ê³??¤ë¦…?ˆë‹¤",
          message: `? íƒ?˜ì‹  ë¬¸ì„œ ? í˜•?€ "${selectedDocType}"?´ì?ë§? AI ë¶„ì„ ê²°ê³¼??"${extracted.docType}"ë¡??¸ì‹?˜ì—ˆ?µë‹ˆ?? ë¬¸ì„œ ? í˜•???¤ì‹œ ? íƒ?´ì£¼?¸ìš”.`,
          ruleId: "user_doc_type_mismatch",
        });
      } else if (selectedDocType && extracted.docType === "unknown") {
        mismatchIssues.push({
          severity: "info",
          title: "ë¬¸ì„œ ? í˜• ?•ì¸???„ìš”?©ë‹ˆ??,
          message: "? íƒ?˜ì‹  ë¬¸ì„œ ? í˜•???ˆì?ë§?ë¬¸ì„œ ?´ìš©?ì„œ ? í˜•???•ì •?˜ê¸° ?´ë µ?µë‹ˆ?? ë¬¸ì„œê°€ ?¬ë°”ë¥¸ì? ?•ì¸?´ì£¼?¸ìš”.",
          ruleId: "user_doc_type_uncertain",
        });
      }
    }

    // Stage 3: Structured Master Plan Validation
    let structuredIssues: StructuredValidationIssue[] = [];
    if (masterPlan && projectIsStructured) {
      try {
        structuredIssues = validateAgainstStructuredPlan(extracted, masterPlan);
      } catch (e) {
        logger.warn("Structured validation failed:", e);
        // Non-critical, continue without structured validation
      }
    }

    // Stage 3: Risk Matrix Calculation
    let riskIssues: typeof validationIssues = [];
    try {
      const riskCalculation = calculateRiskLevel(extracted);
      riskIssues = riskCalculationToIssues(riskCalculation);
    } catch (e) {
      logger.warn("Risk calculation failed:", e);
      // Non-critical, continue without risk analysis
    }

    const reportId = crypto.randomUUID();

    // Stage 4: Pattern Analysis - Check for suspicious patterns
    let patternIssues: typeof validationIssues = [];
    if (extracted.inspectorName) {
      try {
        const patternWarnings = await analyzeInspectorPatterns(
          extracted.inspectorName,
          projectId ?? undefined
        );
        patternIssues = patternWarningsToIssues(patternWarnings);
      } catch (e) {
        logger.warn("Pattern analysis failed:", e);
        // Non-critical, continue without pattern warnings
      }
    }

    // Stage 3: Cross-Document Analysis
    let crossDocIssues: typeof validationIssues = [];
    if (projectId) {
      try {
        const crossIssues = await analyzeCrossDocumentIssues(projectId, reportId);
        crossDocIssues = crossDocumentIssuesToValidationIssues(crossIssues);
      } catch (e) {
        logger.warn("Cross-document analysis failed:", e);
        // Non-critical, continue without cross-document analysis
      }
    }

    // Stage 3d: TBM Cross-Validation
    let tbmIssues: typeof validationIssues = [];
    if (latestTBM && latestTBM.extractedHazards && latestTBM.extractedHazards.length > 0) {
      try {
        logger.log("[Stage 3d] Running TBM cross-validation...");
        tbmIssues = validateAgainstTBM(extracted, latestTBM);
        logger.log(`[Stage 3d] TBM validation found ${tbmIssues.length} issues`);
      } catch (e) {
        logger.warn("[Stage 3d] TBM validation failed:", e);
        // Non-critical, continue without TBM validation
      }
    }

    // Merge all issues: validation + structured + risk + pattern + cross-document + TBM analysis
    const allIssues = [...validationIssues, ...mismatchIssues, ...structuredIssues, ...riskIssues, ...patternIssues, ...crossDocIssues, ...tbmIssues].map(issue => ({
      ...issue,
      id: crypto.randomUUID()
    }));
    // --- DB SAVE ---
    // Save the result to the database for history (including Stage 4 fields)
    const extractedChat = Array.isArray((extracted as { chat?: unknown }).chat)
      ? JSON.stringify((extracted as { chat?: unknown[] }).chat)
      : null;

    let savedReport = { id: reportId }; // Default ID if save fails

    try {
      await prisma.report.create({
        data: {
          id: reportId,
          fileName: fileName ?? "Untitled",
          docDataJson: JSON.stringify(extracted),
          issuesJson: JSON.stringify(allIssues),
          chatJson: extractedChat,
          projectId: projectId ?? null,
          documentType: documentType ?? null,
          // Stage 4: Save inspector name and checklist for pattern analysis
          inspectorName: extracted.inspectorName ?? null,
          checklistJson: extracted.checklist ? JSON.stringify(extracted.checklist) : null,
        }
      });
    } catch (e) {
      logger.warn("History save failed (likely read-only DB on Vercel):", e);
      // Continue without failing the user response
    }

    // Stage 5: Risk Signals - Format output with non-judgmental language
    const riskSignals = allIssues
      .filter(issue => issue.ruleId?.startsWith("pattern_"))
      .map(issue => ({
        type: issue.ruleId,
        message: issue.message,
      }));

    const finalResult = {
      ...extracted,
      issues: allIssues,
      riskSignals,
    };

    return NextResponse.json({
      fileName,
      ...finalResult,
      reportId: savedReport.id
    });
  } catch (e: any) {
    logger.error("Validation Error:", e);
    const msg = e?.message ?? "validate failed";
    const fileName = (await req.json().catch(() => ({})))?.fileName;

    // API Key missing errors
    if (msg.includes("API_KEY is not set")) {
      return createErrorResponse(
        "API Key ?¤ì •???„ìš”?©ë‹ˆ??",
        {
          fileName,
          details: msg,
          solution: ".env.local ?Œì¼??API Keyë¥?ì¶”ê??´ì£¼?¸ìš”.",
          status: 500,
          chatMessage: "?œë²„ ?¤ì • ?¤ë¥˜ë¡??¸í•´ ê²€ì¦ì„ ?˜í–‰?????†ìŠµ?ˆë‹¤. ê´€ë¦¬ì?ê²Œ ë¬¸ì˜?´ì£¼?¸ìš”."
        }
      );
    }

    // Generic server error
    return createErrorResponse(
      "ê²€ì¦?ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤",
      {
        fileName,
        details: msg,
        status: 500,
        chatMessage: `ê²€ì¦?ì²˜ë¦¬ ì¤??ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.\n\n?¤ë¥˜ ?´ìš©: ${msg}\n\në¬¸ì œê°€ ê³„ì†?˜ë©´ ê´€ë¦¬ì?ê²Œ ë¬¸ì˜?´ì£¼?¸ìš”.`
      }
    );
  }
}
