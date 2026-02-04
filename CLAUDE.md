# Smart Safety Guardian - Claude Code Context

## Project Overview
AI-powered safety document validation system for Korean construction sites.
- **Team**: Luna (GNU RISE AI+X Competition)
- **Demo Date**: February 8, 2026
- **Deadline**: February 7, 2026

## What This System Does
Validates the *reliability and consistency* of safety inspection records.
**Critical framing**: We do NOT judge whether a site is safe. We verify whether the *documentation* is complete, consistent, and shows evidence of real inspection activity.

## Core Validation Framework (5 Stages)

### Stage 1: Format Validation ✅ IMPLEMENTED
- Missing required fields (date, task name, inspector signature)
- Checklist values present (✔/✖/N/A)
- Signature verification (담당/소장)
- **Location**: `src/lib/validator.ts:632` - `validateDocument()`
- **Triggers**: Always runs on every document

### Stage 2: Intra-Checklist Logic ✅ IMPLEMENTED
- IF-THEN consistency within a single document (25+ rules)
- Safety violation detection: fall protection, fire safety, confined space, excavation, electrical
- Logical contradiction detection
- Example: "Not working at height" ✔ BUT "Fall protection PPE" ✔ → contradiction
- **Location**: `src/lib/validator.ts:473` - `validateIntraChecklistLogic()`
- **Triggers**: When `checklist` array exists in document

### Stage 3: Cross-Document Consistency ✅ IMPLEMENTED (3 sub-modules)

#### 3a. Structured Master Plan Validation
- Validates document against project's structured Master Safety Plan
- Checks required risks, PPE, procedures
- **Location**: `src/lib/structuredValidation.ts`
- **Triggers**: When project has `isStructured=true` and `masterPlanJson` exists
- **API Call**: `validate/route.ts:354-363`

#### 3b. Risk Matrix Calculation
- Calculates risk level from checklist items
- Identifies risk mismatches (claimed low-risk but high-risk items present)
- **Location**: `src/lib/riskMatrix.ts`
- **Triggers**: Always runs when checklist exists
- **API Call**: `validate/route.ts:365-373`

#### 3c. Cross-Document Analysis
- Multiple documents about same work should tell same story
- Example: Risk assessment says "high-risk" but pre-work checklist says "no issues"
- **Location**: `src/lib/crossDocumentAnalysis.ts`
- **Triggers**: When `projectId` exists (project context available)
- **API Call**: `validate/route.ts:392-402`

### Stage 4: Behavioral Pattern Analysis ✅ IMPLEMENTED
- Detecting "always ✔" patterns (>95% check rate)
- Copy-paste behavior (3+ identical descriptions)
- Rapid completion detection (5+ reports in 30 minutes)
- Inspector-specific patterns across multiple reports
- **Location**: `src/lib/patternAnalysis.ts`
- **Triggers**: When `inspectorName` exists in document
- **API Call**: `validate/route.ts:377-390`
- **Requires**: Database history (5+ reports for meaningful analysis)

### Stage 5: Risk Signal Guidance ✅ IMPLEMENTED
- Non-judgmental alerts based on rule violations
- Phrasing: "Inconsistency exists" NOT "This is unsafe"
- Includes KOSHA/MOEL reference links
- Actionable recommendations
- **Location**: `src/lib/riskMatrix.ts`, `src/app/api/validate/route.ts:429-435`
- **Triggers**: When pattern issues exist (Stage 4 results)

---

## Stage Trigger Summary

| Stage | Always Runs? | Condition | Notes |
|-------|-------------|-----------|-------|
| Stage 1 | ✅ Yes | None | Format validation always runs |
| Stage 2 | ⚠️ Conditional | `checklist.length > 0` | Most documents have checklists |
| Stage 3a | ⚠️ Conditional | `isStructured && masterPlanJson` | Only structured projects |
| Stage 3b | ✅ Yes | `checklist` exists | Risk matrix calculation |
| Stage 3c | ⚠️ Conditional | `projectId` exists | Only in projects |
| Stage 4 | ⚠️ Conditional | `inspectorName` exists | Needs 5+ reports for patterns |
| Stage 5 | ⚠️ Conditional | Stage 4 triggered | Formats pattern warnings |

**All stages wrapped in try-catch** - failures are logged but don't break validation process.

## Architecture

### Hybrid Validation Approach
1. **AI Extraction + Context Check** → `src/app/api/validate/route.ts`
   - Extracts fields from documents (date, signatures, checklist items)
   - Checks against Project Context (Master Safety Plan)
   - Handles cross-document reasoning (Stages 3, 5)

2. **Deterministic Rule Checks** → `src/lib/validator.ts`
   - Runs after AI extraction
   - Checks missing fields, missing signatures
   - Handles structured IF-THEN logic (Stages 1, 2)

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: SQLite (dev) / Postgres (prod)
- **ORM**: Prisma v5
- **AI**: OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet
- **PDF**: PDF.js

## Key Files

### Backend API (`src/app/api/`)
- `validate/route.ts` - Core AI validation logic, accepts projectId
- `projects/route.ts` - Create/list projects with Master Plan context
- `history/route.ts` - Fetch validation history

### Frontend (`src/app/`)
- `page.tsx` - Main controller, state management

### Components (`src/components/`)
- `Header.tsx` - Contains Project Selector
- `ProjectSelector.tsx` - Switch between projects
- `NewProjectModal.tsx` - Upload Master Safety Plan
- `HistorySidebar.tsx` - Past reports
- `layout/ResizableSplitLayout.tsx` - Resizable viewer/analysis split
- `viewer/DocumentViewer.tsx` - PDF/Image renderer
- `analysis/AnalysisPanel.tsx` - AI results display

### Utilities (`src/lib/`)
- `validator.ts` - Types + deterministic validation rules
- `db.ts` - Prisma client singleton

### Database
- `prisma/schema.prisma` - Report & Project models
- `prisma/dev.db` - Local SQLite

## Document Types We Validate
1. Toolbox Meeting (TBM) results
2. Industrial safety inspection checklist (산업안전 점검표)
3. Risk assessment report (위험성 평가 보고서)
4. Pre-work safety inspection checklist (작업 전 안전점검표)

## Output Format
- **Status**: Pass / Needs Review
- **Issues list**: Missing fields, inconsistencies, logical errors
- **Summary report**: What safety activities were recorded

## DO NOT WORK ON (Post-competition scope)
- ❌ Project Chatbot / Safety Consultant feature
- ❌ Mobile GPS Integration
- ❌ Safety Score & Gamification
- ❌ Photo-based validation (Stage 6)

These are documented in NEW_FEATURES.md as future roadmap only.

## Korean Field Names Reference
Common fields in safety documents:
- 점검일자 (Inspection date)
- 현장명 (Site name)
- 작업내용 (Work description)
- 점검자 (Inspector)
- 관리감독자 (Supervisor)
- 서명 (Signature)

## Testing Notes
- Local dev: `npm run dev` → http://localhost:3000
- Database: `npx prisma db push` to sync schema
- Test documents: `test-documents/` folder with 7 categories

---

## 🚨 CRITICAL BUG - AI EXTRACTION NOT WORKING PROPERLY

**Status**: IDENTIFIED - Needs immediate fix before demo (Feb 8)

### Problem Description

**Symptom**: Valid documents from `test-documents/1-valid/` return warnings when they shouldn't.

**Expected**: No warnings (these are valid, complete documents)
**Actual**: 3 warnings appear:
1. "Document selection differs from actual content"
2. "AI returns suspicious pattern"
3. (Third warning unspecified)

### Root Cause Hypothesis

The AI extraction is likely **not working correctly** or **not running at all**:
- Documents may not be sent to LLM properly
- Only deterministic validation checks run (Stages 1-2)
- AI extraction returns incomplete/incorrect data
- LLM might not be receiving images/text properly

### Evidence

1. **Valid documents fail validation** - Documents specifically created as "valid" baseline tests trigger warnings
2. **Pattern of false positives** - Suggests validation is working but extraction is broken
3. **Suspicious warnings** - Warnings about "suspicious patterns" on valid docs indicates bad extraction data

### Document Upload → Analysis Flow

```
User Upload File
    ↓
onPickFile(file) - validates file, shows doc type selector
    ↓
handleDocTypeSelect(type) → runValidation(file, type)
    ↓
STEP 1: Extract Content
    • PDF: renderPdfPages() → optimize → store images[]
            extractPdfText() → store text
    • Image: readAsDataURL() → optimize → store images[0]
    ↓
STEP 2: Send to API
    POST /api/validate
    Body: {
        fileName,
        pdfText,           ← Extracted text
        pageImages,        ← [base64, base64] (1-2 images)
        projectId,
        documentType,
        tempContextText
    }
    ↓
STEP 3: AI Extraction (validate/route.ts:253-271)
    if (has images):
        Try: callOpenAI({ pdfText, pageImages, contextText })
        Catch: callClaude({ pdfText, pageImages, contextText })
    else:
        Try: callClaude({ pdfText, contextText })
        Catch: callOpenAI({ pdfText, contextText })
    ↓
    🔴 SUSPECTED ISSUE HERE! 🔴
    AI should extract:
    {
        isSafetyDocument: true,
        inspectionDate: "2026-02-04",
        siteName: "테스트 현장",
        inspectorName: "김철수",
        checklist: [
            { item: "고소작업", checked: true },
            { item: "안전대착용", checked: true },
            ...
        ],
        workersSignature: true,
        supervisorSignature: true,
        ...
    }
    ↓
STEP 4: Run Validation Stages (validate/route.ts:316-403)
    Stage 1-2: validateDocument(extracted)
    Stage 3a-c: Cross-doc, risk matrix, structured validation
    Stage 4: Pattern analysis
    Stage 5: Risk signals
    ↓
STEP 5: Return Results
    { id, fileName, issues[], chat[], extracted, documentType }
    ↓
STEP 6: Display in UI
    IssuesList, ChatPanel, AnalysisPanel
```

### Debugging Steps for Next Session

1. **Check if AI is being called**:
   ```bash
   # Add logging in validate/route.ts:
   console.log("[AI Call] Provider:", p);
   console.log("[AI Input] Text length:", pdfText?.length);
   console.log("[AI Input] Images count:", pageImages?.length);
   console.log("[AI Response]", JSON.stringify(result, null, 2));
   ```

2. **Test with simple document**:
   - Upload: `test-documents/1-valid/valid-safety-checklist.pdf`
   - Expected: NO warnings, all fields extracted correctly
   - Check browser console + network tab for API response

3. **Verify image optimization**:
   - Check console logs: `[Image Optimizer] ... reduction`
   - Ensure optimized images are valid base64 data URLs
   - Verify images aren't corrupted during optimization

4. **Check AI provider selection**:
   - Is correct provider (OpenAI/Claude) being chosen?
   - Are API keys valid?
   - Are rate limits being hit?

5. **Inspect extraction result**:
   ```typescript
   // In validate/route.ts after AI call:
   console.log("Extracted data:", {
     isSafetyDoc: result.isSafetyDocument,
     date: result.inspectionDate,
     inspector: result.inspectorName,
     checklistCount: result.checklist?.length,
     signatures: {
       worker: result.workersSignature,
       supervisor: result.supervisorSignature
     }
   });
   ```

6. **Test prompts directly**:
   - Extract system prompt from `buildSystemPrompt()`
   - Test in OpenAI playground with sample document
   - Verify JSON schema is being followed

### Files to Investigate

1. `src/app/api/validate/route.ts:102-126` - `callOpenAI()` function
2. `src/app/api/validate/route.ts:128-166` - `callClaude()` function
3. `src/app/api/validate/route.ts:28-99` - `buildSystemPrompt()` - AI extraction instructions
4. `src/app/page.tsx:420-603` - `runValidation()` - image/text preparation
5. `src/lib/imageOptimizer.ts` - Verify optimization doesn't corrupt images

### Potential Fixes

1. **Image format issue**: Optimized images might be corrupted or wrong format
2. **Prompt issue**: System prompt might not be clear enough
3. **Token limit**: Combined text + images might exceed token limits
4. **JSON parsing**: AI response might not match expected schema
5. **Error swallowing**: Try-catch blocks might hide errors

### Test Case to Reproduce

```bash
# 1. Start dev server
npm run dev

# 2. Open browser → localhost:3000

# 3. Upload test file
File: test-documents/1-valid/valid-safety-checklist.pdf

# 4. Select document type: "산업안전 점검표"

# 5. Expected result:
✅ Status: Pass
✅ No warnings
✅ All fields extracted:
   - Date: present
   - Site: present
   - Inspector: present
   - Checklist: multiple items checked
   - Signatures: both present

# 6. Actual result (BROKEN):
❌ 3 warnings appear
❌ False positives on valid document
```

### MCP Integration Plan (After Fix)

Once AI extraction is fixed, implement Model Context Protocol:
- Structured tool definitions for each validation stage
- Better prompt engineering with MCP tools
- Cleaner separation of extraction vs validation
- Easier testing and debugging
- More reliable extraction with schema enforcement

**Priority**: Fix AI extraction FIRST, then consider MCP migration.