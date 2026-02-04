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

## ✅ CRITICAL BUG FIXED - AI Extraction Working

**Status**: RESOLVED (Fixed on Feb 4, 2026)

### Issues Found & Fixed

**Issue 1: Wrong OpenAI API Usage**
- `callOpenAI()` was using deprecated `responses.create()` API
- Incorrect image format: `{ type: "input_image", image_url: ... }`
- Both OpenAI and Claude rejected invalid image data

**Fix Applied** (`src/app/api/validate/route.ts:102-143`):
- Changed to standard Chat Completions API: `chat.completions.create()`
- Correct image format: `{ type: "image_url", image_url: { url: ..., detail: "high" } }`
- AI extraction now works perfectly with text and images ✅

**Issue 2: Overly Strict Validation Rules**
- Rules flagged N/A as suspicious for confined space, excavation, fire, electrical, height work
- N/A is **valid** when those activities aren't being performed
- Created false positives on valid documents

**Fix Applied** (`src/lib/validator.ts:369-428`):
- Removed 5 overly strict "critical N/A" rules:
  - `rule_critical_na_height`
  - `rule_critical_na_fire`
  - `rule_critical_na_confined`
  - `rule_critical_na_excavation`
  - `rule_critical_na_electrical`
- N/A values now correctly accepted when activities aren't performed ✅

### Verification

Test with `test-documents/1-valid/valid-safety-checklist.pdf`:
- ✅ Status: 200 (success)
- ✅ All fields extracted correctly (date, inspector, site, checklist)
- ✅ No false warnings
- ✅ Only 1 info-level notice (risk factor identification - expected behavior)

---

**Ready for demo (Feb 8, 2026)** ✅