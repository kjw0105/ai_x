import { logger } from "@/lib/logger";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : "";
}

function buildTBMSystemPrompt() {
  return `
?ˆëŠ” ê±´ì„¤/?°ì—…?„ì¥??TBM(?‘ì—… ???€?? ê¸°ë¡??ë¶„ì„?˜ëŠ” AI??

?¬ìš©?ê? ?¹ìŒ???€?”ë? ?„ì‚¬???ìŠ¤?¸ë? ë°”íƒ•?¼ë¡œ ?„ë˜ ?•ì‹?¼ë¡œ ?”ì•½?´ë¼.
?œêµ­?´ë¡œ, ?„ì¥ ?¤ë¬´?ê? ë°”ë¡œ ?????ˆê²Œ ê°„ê²°?˜ê³  êµ¬ì¡°?ìœ¼ë¡?

**ì¤‘ìš”: ë°˜ë“œ??? íš¨??JSON?¼ë¡œë§?ì¶œë ¥?´ë¼. ì£¼ì„(//), ?¤ëª…, ì½”ë“œë¸”ë¡ ?¬ìš© ê¸ˆì?.**

?¤í‚¤ë§?
{
  "workType": "string",  // ?‘ì—… ì¢…ë¥˜ (?? "ë¹„ê³„ ì¡°ë¦½", "?©ì ‘ ?‘ì—…", "?¸ë²½ ?„ì¥")
  "extractedHazards": ["ì¶”ë½", "?”ì¬", ...],  // ?¼ì˜???„í—˜?”ì¸ (?µì‹¬ ?¤ì›Œ?œë§Œ)
  "extractedInspector": "string|null",  // ?´ë‹¹???´ë¦„ (ëª…í™•???¸ê¸‰??ê²½ìš°ë§?
  "participants": ["?´ë¦„1", "?´ë¦„2", ...],  // ì°¸ì„???´ë¦„??
  "work_overview": "string",
  "risks": ["string", "... (ìµœë? 5)"],
  "controls": ["string", "... (risks?€ ê°€?¥í•œ 1:1 ?€??"],
  "ppe": ["string", "..."],
  "roles_contact": ["string", "..."],
  "action_items": [{"task":"string","owner":"string|null","due":"string|null"}],
  "unclear_points": ["string", "..."],
  "cautions": ["string", "... (ìµœë? 5)"]
}

?„ë“œ ?¤ëª…:
- workType: êµ¬ì²´?ì¸ ?‘ì—…ëª?(?? "ë¹„ê³„ ì¡°ë¦½", "ì½˜í¬ë¦¬íŠ¸ ?€??, "?©ì ‘ ?‘ì—…")
- extractedHazards: ?µì‹¬ ?„í—˜?”ì¸ë§?(?? ["ì¶”ë½", "?™í•˜ë¬?, "?”ì¬"])
- extractedInspector: ?´ë‹¹??ì±…ì„???´ë¦„ (ëª…ì‹œ?˜ì? ?Šìœ¼ë©?null)
- participants: ì°¸ì„???´ë¦„ ë¦¬ìŠ¤??

?„ë¡œ?íŠ¸ ì»¨í…?¤íŠ¸ ?œìš©:
- ?¬ìš©?ê? [?„ë¡œ?íŠ¸ ì»¨í…?¤íŠ¸]ë¥??œê³µ??ê²½ìš°, ?´ë‹¹ ?•ë³´ë¥?ì°¸ê³ ?˜ì—¬:
  * ?„ë¡œ?íŠ¸??ì£¼ìš” ?„í—˜?”ì¸??TBM?ì„œ ?¸ê¸‰?˜ì—ˆ?”ì? ?•ì¸
  * ?„ìˆ˜ ë³´í˜¸êµ¬ê? ì²´í¬?˜ì—ˆ?”ì? ê²€??
  * ?µì‹¬ ?ˆì°¨ê°€ ?¼ì˜?˜ì—ˆ?”ì? ê²€??
  * ?„ë½??ì¤‘ìš” ??ª©???ˆë‹¤ë©?"unclear_points"??ëª…ì‹œ
- ?„ë¡œ?íŠ¸ ì»¨í…?¤íŠ¸?€ TBM ?´ìš©??ë¶ˆì¼ì¹˜í•˜ë©?ê°ê??ìœ¼ë¡?ê¸°ë¡

ì£¼ì˜:
- ?¬ì‹¤??ê·¼ê±°???‘ì„±?˜ê³ , ì¶”ì¸¡?€ "ì¶”ì •"?¼ë¡œ ?œì‹œ.
- ê°œì¸ ë¹„ë‚œ/?ë‹¨ ê¸ˆì?. ë¹„íŒ?¨ì  ?´ì¡° ?¬ìš© ("?•ì¸ ?„ìš”", "?„ë½?? ??.
- ?„ë¡œ?íŠ¸ ì»¨í…?¤íŠ¸??ì°¸ê³  ?ë£Œ??ë¿? TBM ?„ì‚¬ë³??´ìš©??ìµœìš°??
`.trim();
}


function normalizeAudioFile(file: File) {
  const type = (file.type || "").toLowerCase();

  let ext = "webm";
  if (type.includes("x-m4a") || type.includes("m4a") || type.includes("mp4")) ext = "m4a";
  else if (type.includes("mpeg") || type.includes("mp3")) ext = "mp3";
  else if (type.includes("wav")) ext = "wav";
  else if (type.includes("ogg") || type.includes("oga")) ext = "ogg";
  else if (type.includes("webm")) ext = "webm";

  // Whisperê°€ ?¬ë§· ?ŒíŠ¸ë¥??????¡ê²Œ ?Œì¼ëª??•ì¥?ë? ë§ì¶°????Fileë¡?ê°ìŒˆ
  const fixedName = `tbm.${ext}`;
  return new File([file], fixedName, { type: file.type || "application/octet-stream" });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    const projectId = safeText(form.get("projectId"));

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: "audio ?Œì¼???„ìš”?©ë‹ˆ??" }, { status: 400 });
    }

    logger.log("[TBM] audio:", { name: audio.name, type: audio.type, size: audio.size });

    if (audio.size < 8000) {
      return NextResponse.json({ error: "?¤ë””???Œì¼???ˆë¬´ ?‘ê±°??ë¹„ì–´?ˆìŠµ?ˆë‹¤." }, { status: 400 });
    }

    // MIME?€ ?˜ê²½ë§ˆë‹¤ ?œë©‹?€ë¡œë¼??"ì°¨ë‹¨"ë³´ë‹¤ "ê²½ê³  ??ì§„í–‰"???ˆì •??
    const type = (audio.type || "").toLowerCase();
    const allowed = new Set([
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/x-m4a",
      "audio/aac",
      "video/mp4",
    ]);

    if (type && !allowed.has(type)) {
      logger.warn("[TBM] unknown mime type, proceed anyway:", type);
    }

    const client = getOpenAI();
    const normalizedAudio = normalizeAudioFile(audio);

    // 1) Transcribe (Whisper)
    logger.log("[TBM] step=transcribe start");
    const transcriptRes = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: normalizedAudio,
      language: "ko",
    });
    logger.log("[TBM] step=transcribe done");

    const transcript = safeText((transcriptRes as any).text);
    if (!transcript.trim()) {
      return NextResponse.json({ error: "?„ì‚¬ ê²°ê³¼ê°€ ë¹„ì–´?ˆìŠµ?ˆë‹¤." }, { status: 500 });
    }

    // 2) Load project context if projectId provided
    let contextInfo = "";
    if (projectId) {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            name: true,
            description: true,
            contextText: true,
            masterPlanJson: true,
            isStructured: true,
          },
        });

        if (project) {
          contextInfo = `\n\n[?„ë¡œ?íŠ¸ ì»¨í…?¤íŠ¸]\n?„ë¡œ?íŠ¸ëª? ${project.name}`;

          if (project.description) {
            contextInfo += `\n?„ë¡œ?íŠ¸ ?¤ëª…: ${project.description}`;
          }

          // Use structured master plan if available
          if (project.isStructured && project.masterPlanJson) {
            try {
              const plan = JSON.parse(project.masterPlanJson);
              if (plan.risks && Array.isArray(plan.risks) && plan.risks.length > 0) {
                const riskNames = plan.risks.map((r: any) => r.name || r.description).filter(Boolean);
                if (riskNames.length > 0) {
                  contextInfo += `\nì£¼ìš” ?„í—˜?”ì¸: ${riskNames.join(", ")}`;
                }
              }
              if (plan.requiredPPE && Array.isArray(plan.requiredPPE) && plan.requiredPPE.length > 0) {
                contextInfo += `\n?„ìˆ˜ ë³´í˜¸êµ? ${plan.requiredPPE.join(", ")}`;
              }
              if (plan.criticalProcedures && Array.isArray(plan.criticalProcedures) && plan.criticalProcedures.length > 0) {
                contextInfo += `\n?µì‹¬ ?ˆì°¨: ${plan.criticalProcedures.map((p: any) => p.name || p.description).filter(Boolean).join(", ")}`;
              }
            } catch (e) {
              logger.warn("[TBM] Failed to parse structured plan:", e);
            }
          }
          // Fallback to legacy context text
          else if (project.contextText && project.contextText.trim()) {
            contextInfo += `\në§ˆìŠ¤???ˆì „ ê³„íš:\n${project.contextText.substring(0, 500)}`;
          }

          logger.log("[TBM] Using project context:", contextInfo.substring(0, 200) + "...");
        } else {
          logger.warn("[TBM] Project not found:", projectId);
        }
      } catch (e) {
        logger.error("[TBM] Error loading project context:", e);
      }
    }

    // 3) Summarize with context
    logger.log("[TBM] step=summarize start");
    const summaryRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildTBMSystemPrompt() },
        {
          role: "user",
          content: `?¤ìŒ?€ TBM ?¹ìŒ ?„ì‚¬ë³¸ì´?? ?´ë? ?”ì•½?´ë¼.\n\n[TRANSCRIPT]\n${transcript}${contextInfo}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });
    logger.log("[TBM] step=summarize done");

    const raw = summaryRes.choices[0]?.message?.content ?? "{}";

    let parsed: any = null;
    try {
      // Remove comments from JSON before parsing
      const cleanedJson = raw.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
      parsed = JSON.parse(cleanedJson);
    } catch (e) {
      logger.error("[TBM] JSON parse error:", e);
      logger.error("[TBM] Raw response:", raw);
      // fallback: ?Œì‹± ?¤íŒ¨ ??raw ê·¸ë?ë¡??¬ìš©
    }

    const summary =
      parsed
        ? [
            `1) ?¤ëŠ˜ ?‘ì—… ê°œìš”\n- ${parsed.work_overview ?? ""}`,
            `\n2) ì£¼ìš” ?„í—˜?”ì¸\n${(parsed.risks ?? []).map((x: string) => `- ${x}`).join("\n")}`,
            `\n3) ?ˆë°©/?µì œ ì¡°ì¹˜\n${(parsed.controls ?? []).map((x: string) => `- ${x}`).join("\n")}`,
            `\n4) PPE/?¥ë¹„ ì²´í¬\n${(parsed.ppe ?? []).map((x: string) => `- ${x}`).join("\n")}`,
            `\n5) ??• /?´ë‹¹ ë°??°ë½ ì²´ê³„\n${(parsed.roles_contact ?? []).map((x: string) => `- ${x}`).join("\n")}`,
            `\n6) ê²°ì •?¬í•­/?¡ì…˜?„ì´??n${(parsed.action_items ?? []).map((it: any) =>
              `- ${it.task} (?´ë‹¹: ${it.owner ?? "ë¯¸ìƒ"}, ê¸°í•œ: ${it.due ?? "ë¯¸ìƒ"})`
            ).join("\n")}`,
            `\n7) ?„ë½/ë¶ˆëª…?•í•œ ë¶€ë¶?n${(parsed.unclear_points ?? []).map((x: string) => `- ${x}`).join("\n")}`,
            `\n8) ì£¼ì˜?¬í•­\n${(parsed.cautions ?? []).map((x: string) => `- ${x}`).join("\n")}`,
          ].join("\n")
        : raw;

    const cautions = parsed?.cautions ?? [];

    return NextResponse.json({
      transcript,
      summary,
      cautions,
      workType: parsed?.workType || null,
      extractedHazards: parsed?.extractedHazards || [],
      extractedInspector: parsed?.extractedInspector || null,
      participants: parsed?.participants || [],
    });
  } catch (e: any) {
    logger.error("/api/tbm error raw:", e);
    const msg =
      e?.response?.data?.error?.message ||
      e?.error?.message ||
      e?.message ||
      "TBM ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
