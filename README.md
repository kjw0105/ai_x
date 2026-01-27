# 🛡️ Smart Safety Guardian (AI Document Verification)

**Smart Safety Guardian** is an AI-powered safety document verification system designed for Korean construction sites. It uses a **5-stage validation framework** to detect missing fields, safety violations, risk inconsistencies, fraudulent patterns, and cross-document contradictions.

![Project Status](https://img.shields.io/badge/Status-Active-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Prisma](https://img.shields.io/badge/Prisma-5-blue)
![Competition](https://img.shields.io/badge/GNU_RISE_AI+X-2026-orange)

[🇰🇷 Korean Version (한국어)](README.ko.md)

---

## 🎯 Competition: GNU RISE AI+X 2026

**Team**: Luna
**Demo Date**: February 8, 2026
**Goal**: Automate safety document validation to reduce fraud and improve compliance in Korean construction sites.

---

## ✨ Key Features

### 🔍 5-Stage Validation Framework

#### **Stage 1: Format Validation**
- Detects missing required fields (date, site name, signatures)
- Checks checklist completeness
- Validates signature presence (inspector & supervisor)

#### **Stage 2: Intra-Document Logic** ⭐ Enhanced
- **22 comprehensive rules** across 4 categories:
  - 9 Safety Violations (e.g., height work without harness)
  - 5 Logical Contradictions (e.g., no work but equipment checked)
  - 6 Suspicious Patterns (e.g., excessive N/A responses)
  - 2 Completeness Checks (e.g., missing helmet checks)
- **Korean Safety Law References**: Every violation cites specific regulations (산업안전보건법, KOSHA GUIDE)
- **Actionable Guidance**: Each issue includes recommended actions

#### **Stage 3: Cross-Document Consistency** ⭐ NEW - 3 Parallel Systems
1. **Structured Master Safety Plan Validation**
   - Validates against JSON-based master safety plans
   - Checks weather limits, work requirements, personnel qualifications
   - Deterministic validation (~10ms, no AI needed)

2. **Risk Matrix Calculation**
   - Calculates objective risk scores (0-100) based on KOSHA standards
   - Factors: High-risk work types, safety violations, signatures, checklist quality
   - Detects mismatch between calculated and documented risk levels
   - Example: Calculated=High (55 pts) vs Documented=Low → Flags inconsistency

3. **Cross-Document Analysis**
   - Timeline gap detection (flags 5+ day inspection gaps)
   - Contradiction detection (conflicting risk assessments for same site)
   - Repetition pattern detection (copy-paste behavior, identical checklists)
   - Analyzes last 30 days of reports per project

#### **Stage 4: Behavioral Pattern Analysis** ⭐ Enhanced
- **Name Normalization**: Recognizes "김철수" = "김 철수" as same person
- **Time-Weighted Analysis**: Recent behavior weighted higher (30-day window)
- **Pattern Severity Scoring**: Cumulative risk assessment (Critical: 80+, High: 50-79)
- **Configurable Thresholds**: STRICT/DEFAULT/LENIENT modes for different scenarios
- Detects: Always-check patterns, copy-paste behavior, rapid completion

#### **Stage 5: Risk Signal Guidance**
- Non-judgmental phrasing (e.g., "Inconsistency detected" not "This is unsafe")
- Purple-coded pattern warnings (distinct from red errors/orange warnings)
- Bilingual messages (Korean + English)

---

## 🚀 Advanced Capabilities

### 📋 Project Context Awareness
- Upload a **Master Safety Plan (PDF or JSON)** for each construction site
- AI validates daily reports against site-specific rules
- Example: Master Plan says "Stop work if wind > 10m/s" → Daily report showing 12m/s flags violation

### 💾 Data Persistence & History
- All validation reports saved to database
- Inspector pattern tracking across multiple reports
- Project-level analytics and timeline summaries

### 🎨 Modern UI
- Resizable split-pane interface (Document Viewer | Analysis Panel)
- Real-time validation results with issue categorization
- Risk score dashboard with factor breakdown
- Mobile responsive (tabbed interface on small screens)

### 🌐 Bilingual Support
- All validation messages in Korean (primary) and English
- Code comments and documentation in both languages
- Designed for Korean safety regulations (KOSHA GUIDE, 산업안전보건법)

---

## 🛠️ Tech Stack

### Core Framework
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (Dev) / Postgres (Production)
- **ORM**: Prisma v5

### AI & Document Processing
- **AI Models**: OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet
- **PDF Engine**: PDF.js (multi-page analysis)
- **Vision Processing**: Base64 image encoding for scanned documents

### Validation Engine
- **Rule Engine**: 22 deterministic rules (Stage 1-2)
- **Structured Validation**: JSON schema validation (Stage 3)
- **Risk Calculation**: KOSHA-compliant matrix (Stage 3)
- **Pattern Analysis**: Statistical behavioral detection (Stage 4)
- **Cross-Document**: Database-driven analysis (Stage 3)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/jean-tulip/ai_x.git
cd ai_x
npm install
```

### 2. Environment Setup
Create a `.env.local` file:
```env
# AI API Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Database (Local SQLite)
DATABASE_URL="file:./dev.db"
```

### 3. Initialize Database
```bash
# Generate Prisma Client and push schema
npx prisma db push
```

### 4. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📊 Demo Highlights

### What Makes This System Unique?

1. **Fraud Detection** 🕵️
   - Detects copy-paste behavior across reports
   - Identifies "always check" patterns by specific inspectors
   - Flags timeline gaps and suspicious repetition

2. **Objective Risk Scoring** 📈
   - KOSHA-compliant risk matrix
   - Transparent calculation showing all risk factors
   - Detects mismatch between reality and documentation

3. **Structured Master Plans** 📋
   - JSON-based safety plans (no subjective AI interpretation)
   - Deterministic validation (fast, reproducible)
   - Covers weather limits, work requirements, personnel qualifications

4. **Bilingual Korean/English** 🌐
   - All messages in both languages
   - Korean safety law references
   - Designed for Korean construction industry

### Performance Metrics
- **AI Extraction**: 2-5 seconds (unchanged)
- **Stage 1-2 Validation**: ~20ms
- **Stage 3 Systems**: +65-215ms total
- **Stage 4 Pattern Analysis**: ~100ms
- **Total Processing**: ~2.5-5.5 seconds

---

## 📂 Project Structure

### Core Application
```
src/app/
├── page.tsx                    # Main controller (state management)
├── api/
│   ├── validate/route.ts       # AI validation + all 5 stages
│   ├── projects/route.ts       # Project context management
│   └── history/route.ts        # Report history API
```

### Components
```
src/components/
├── Header.tsx                  # Project selector
├── layout/                     # Resizable split-pane
├── viewer/                     # PDF/Image rendering
└── analysis/                   # Results display + issue list
```

### Validation Engine
```
src/lib/
├── validator.ts                # Stage 1-2: 22 rules
├── structuredValidation.ts     # Stage 3: Structured plan checks
├── riskMatrix.ts               # Stage 3: Risk scoring
├── crossDocumentAnalysis.ts    # Stage 3: Multi-report analysis
├── patternAnalysis.ts          # Stage 4: Behavioral patterns
├── validationConfig.ts         # Configurable thresholds
└── masterPlanSchema.ts         # Structured plan schema
```

### Database
```
prisma/
├── schema.prisma               # Report & Project models
└── dev.db                      # SQLite database (local)
```

---

## 🧪 Testing Without Real Documents

Since real construction safety documents may not be available, we provide:

### Option 1: Interactive HTML Tool
Open `tools/generate-test-document.html` in a browser:
- 4 presets: Valid, Violation, Contradiction, N/A Pattern
- Click-to-edit checklist items
- Save as PDF or screenshot

### Option 2: Synthetic Test Data
Use `src/lib/testData.ts` functions:
```typescript
generateValidDocument()           // Clean document
generateContradictoryDocument()   // Logic errors
generateAlwaysCheckDocument()     // Pattern fraud
generateInconsistentRiskDocument() // Risk mismatch
```

### Option 3: Browser Console Testing
Open browser console on the app and paste:
```javascript
fetch('/api/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'auto',
    fileName: 'test.pdf',
    pdfText: JSON.stringify({ /* mock DocData */ }),
    projectId: null
  })
}).then(r => r.json()).then(console.log);
```

Full testing strategy: See `테스트_전략.md`

---

## ☁️ Deployment (Vercel)

### Production Requirements
1. **Switch to Postgres**:
   - Create Vercel Postgres database
   - Update `prisma/schema.prisma`: Change `provider = "sqlite"` to `provider = "postgresql"`
   - Set `DATABASE_URL` in Vercel environment variables

2. **Set API Keys**:
   - `OPENAI_API_KEY` (required)
   - `ANTHROPIC_API_KEY` (required)

3. **Deploy**:
   ```bash
   git push origin main
   # Connect repository to Vercel
   ```

> **Note**: SQLite does not persist in serverless environments. Postgres is required for production.

---

## 🤝 Contribution Guide

This project follows a **Fork & Pull** workflow.

### Syncing with Upstream
```bash
git fetch upstream
git merge upstream/main
```

### Making Changes
1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes and commit: `git commit -m "feat: Add feature"`
3. Push to your fork: `git push origin feat/your-feature`
4. Open Pull Request to main repository

---

## 📖 Documentation

- **[NEW_FEATURES.md](NEW_FEATURES.md)**: Feature evolution log with bilingual documentation
- **[STAGE3_SUMMARY.md](STAGE3_SUMMARY.md)**: Comprehensive Stage 3 implementation guide
- **[CLAUDE.md](CLAUDE.md)**: Project context for AI assistants
- **[테스트_전략.md](테스트_전략.md)**: Testing strategy without real documents (Korean)

---

## 🎓 Learning Resources

### For Korean Construction Safety
- **산업안전보건법** (Occupational Safety and Health Act)
- **KOSHA GUIDE** (Korea Occupational Safety and Health Agency)
- **산업안전보건기준에 관한 규칙** (Enforcement Rules)

### For Developers
- Next.js 14 App Router documentation
- Prisma ORM documentation
- OpenAI API / Anthropic API documentation
- Tailwind CSS documentation

---

## 📊 Validation Statistics

### Rule Coverage
- **Stage 1**: 5 format checks
- **Stage 2**: 22 logic rules (4 categories)
- **Stage 3 System 1**: 8 structured validation functions
- **Stage 3 System 2**: 4-factor risk assessment
- **Stage 3 System 3**: 3 cross-document analyses
- **Stage 4**: 5 pattern detection algorithms

**Total**: 40+ validation rules across 5 stages

### Code Metrics
- **Total Lines**: ~1,800 lines (validation engine only)
- **Modules**: 7 major validation files
- **Test Coverage**: Synthetic data available for all stages

---

## 🏆 Competition Advantages

1. **Fraud Detection** - Unique capability detecting copy-paste and pattern manipulation
2. **Objective Risk Scoring** - KOSHA-compliant, transparent calculations
3. **5-Stage Framework** - Comprehensive validation beyond simple field checks
4. **Production Ready** - 95% complete, fully functional system
5. **Bilingual Support** - Korean primary with English translations
6. **Open Source** - Transparent, auditable validation logic

---

## 📝 License

This project is developed for the **GNU RISE AI+X Competition 2026**.

---

## 👥 Team

**Team Luna**
GNU RISE Program

**Demo Date**: February 8, 2026

---

**Built with ❤️ for safer construction sites in Korea**
