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

### Stage 1: Format Validation ✅ (Partially implemented)
- Missing required fields (date, task name, inspector signature)
- Checklist values present (✔/✖/N/A)
- **Location**: `src/lib/validator.ts`

### Stage 2: Intra-Checklist Logic ⬜ (TODO)
- IF-THEN consistency within a single document
- Example: "Not working at height" ✔ BUT "Fall protection PPE" ✔ → contradiction
- **Location**: `src/lib/validator.ts` (add structured rules)

### Stage 3: Cross-Document Consistency ⬜ (TODO)
- Multiple documents about same work should tell same story
- Example: Risk assessment says "high-risk" but pre-work checklist says "no issues"
- **Location**: `src/app/api/validate/route.ts` (AI reasoning)

### Stage 4: Behavioral Pattern Analysis ⬜ (TODO)
- Detecting "always ✔" patterns, copy-paste behavior
- Repetitive patterns by specific inspector
- **Location**: Needs DB queries + `route.ts` for analysis

### Stage 5: Risk Signal Guidance ⬜ (TODO)
- Non-judgmental alerts based on rule violations
- Phrasing: "Inconsistency exists" NOT "This is unsafe"
- **Location**: `src/app/api/validate/route.ts` (AI output formatting)

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
- Need sample safety documents to test validation stages