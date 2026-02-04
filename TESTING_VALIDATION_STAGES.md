# Testing All 5 Validation Stages

This guide helps you verify that all validation stages are working correctly.

## Prerequisites

1. **Create a Project with Structured Master Plan**
   - Go to Projects → Create New Project
   - Upload a Master Safety Plan PDF that mentions:
     - Risks: "고소작업 (Working at height)"
     - Required PPE: "안전모, 안전대"
     - Critical procedures

2. **Prepare Test Documents**
   - Use `src/lib/testData.ts` generators or create real documents
   - Upload at least 5 documents with same inspector name for pattern analysis

---

## Stage 1: Format Validation

**What It Tests:**
- Missing required fields (date, site name, work description)
- Missing signatures (담당/소장)

**How to Test:**

### Test 1.1: Missing Date
Upload a document WITHOUT "점검일자" field.

**Expected Result:**
```
❌ 점검일자 누락
필수 필드인 "점검일자"가 누락되었습니다.
```

### Test 1.2: Missing Signature
Upload a document without supervisor signature.

**Expected Result:**
```
❌ 관리감독자 서명 누락
관리책임자/소장 서명이 누락되었습니다.
```

**Pass Criteria:** ✅ Issues appear in results panel

---

## Stage 2: Intra-Checklist Logic

**What It Tests:**
- IF-THEN consistency (25+ rules)
- Logical contradictions

**How to Test:**

### Test 2.1: Fall Protection Violation
Create document with:
- "고소작업" (Working at height): ✔ YES
- "안전대착용" (Safety harness): ✖ NO

**Expected Result:**
```
❌ 고소작업 시 안전대 착용 필수
고소작업을 실시하는 경우 반드시 안전대를 착용해야 합니다.
Reference: 산업안전보건기준에 관한 규칙 제42조
```

### Test 2.2: Logical Contradiction
Create document with:
- "고소작업" (Working at height): ✖ NO
- "추락방호장치" (Fall protection installed): ✔ YES

**Expected Result:**
```
⚠️  고소작업 미실시이나 추락방호장치 사용으로 표시됨 (모순)
고소작업을 하지 않는다고 표시되어 있으나 추락방호장치가 설치되었다고 기록됨.
```

**Pass Criteria:** ✅ Contradiction detected

---

## Stage 3a: Structured Master Plan Validation

**What It Tests:**
- Validates against project's structured Master Safety Plan
- Checks required risks, PPE, procedures

**How to Test:**

### Test 3a.1: Missing Required Risk Coverage
1. Create project with Master Plan listing "고소작업" as high risk
2. Upload document WITHOUT any fall protection checklist items

**Expected Result:**
```
⚠️  마스터 플랜에서 요구하는 위험요인이 점검표에 포함되지 않음
마스터 플랜의 위험요인 "고소작업"이 점검표에서 확인되지 않습니다.
```

### Test 3a.2: Missing Required PPE
1. Master Plan requires: "안전모, 안전대, 보안경"
2. Upload document with only "안전모" checked

**Expected Result:**
```
⚠️  마스터 플랜에서 요구하는 보호구가 점검되지 않음
필수 보호구: 안전대, 보안경이 누락되었습니다.
```

**Pass Criteria:** ✅ Only triggers when project has `isStructured=true`

---

## Stage 3b: Risk Matrix Calculation

**What It Tests:**
- Calculates risk level from checklist items
- Detects risk mismatches

**How to Test:**

### Test 3b.1: High-Risk Work with Low Risk Label
Create document with:
- Work description: "고소 용접 작업" (High-risk welding at height)
- Checklist: Multiple high-risk items checked
- Risk level field: "low" or "medium"

**Expected Result:**
```
⚠️  위험도 평가 불일치
문서는 "저위험"으로 표시되었으나 체크리스트 항목 분석 결과 "고위험" 작업으로 판단됩니다.
```

**Pass Criteria:** ✅ Always runs when checklist exists

---

## Stage 3c: Cross-Document Analysis

**What It Tests:**
- Multiple documents about same work tell same story
- Risk level consistency across documents

**How to Test:**

### Test 3c.1: Inconsistent Risk Levels
1. Upload "위험성 평가 보고서" with risk level: "high"
2. On same project/date, upload "작업 전 안전점검표" with risk level: "low"

**Expected Result:**
```
⚠️  동일 프로젝트의 다른 문서와 위험도 불일치
다른 문서에서는 고위험으로 평가되었으나 이 문서는 저위험으로 기록됨.
```

**Pass Criteria:** ✅ Only triggers when `projectId` exists

---

## Stage 4: Behavioral Pattern Analysis

**What It Tests:**
- "Always ✔" patterns (>95% check rate)
- Copy-paste behavior (3+ identical descriptions)
- Rapid completion (5+ reports in 30 minutes)

**How to Test:**

### Test 4.1: Always Check Pattern
Upload 5 documents from same inspector with ALL items checked ✔

**Use testData.ts:**
```typescript
import { generateAlwaysCheckDocument } from '@/lib/testData';

// Generate 5 documents with all items checked
for (let i = 0; i < 5; i++) {
  const doc = generateAlwaysCheckDocument("최만점", i);
  // Convert to PDF and upload
}
```

**Expected Result:**
```
⚠️  항상 체크 패턴 감지
점검자 "최만점"의 최근 5개 보고서에서 95% 이상의 항목이 항상 체크되어 있습니다.
```

### Test 4.2: Copy-Paste Pattern
Upload 3+ documents with identical "작업내용" (work description):
- All say: "일상 점검"

**Expected Result:**
```
⚠️  동일한 작업 내용 반복
점검자 "최만점"의 최근 보고서 중 3개 이상에서 동일한 작업 내용이 발견되었습니다.
```

### Test 4.3: Rapid Completion
Manually create 5 reports in database with same inspector, timestamps within 30 minutes.

**Expected Result:**
```
⚠️  짧은 시간 내 다수 보고서 작성
30분 이내에 5개 이상의 보고서가 작성되었습니다.
```

**Pass Criteria:** ✅ Only triggers when `inspectorName` exists and 5+ reports in database

---

## Stage 5: Risk Signal Guidance

**What It Tests:**
- Non-judgmental language
- KOSHA/MOEL references
- Actionable recommendations

**How to Test:**

### Test 5.1: Pattern Warning Format
Trigger any Stage 4 pattern warning.

**Expected Result:**
Check that message uses:
- ❌ NOT: "This is dangerous" or "Inspector is lying"
- ✅ YES: "Pattern detected" or "Inconsistency found"

**Example Good Message:**
```
⚠️  동일한 패턴이 감지되었습니다
점검자의 최근 보고서에서 유사한 패턴이 관찰되었습니다.
실제 점검이 이루어졌는지 확인이 필요합니다.

권장 조치:
- 현장 관리자가 점검 프로세스 확인
- 점검 시간 및 방법 개선
```

**Pass Criteria:** ✅ Language is objective, not accusatory

---

## Full Integration Test

**Test All Stages at Once:**

1. **Create Project** with structured Master Plan
2. **Upload 5 documents** from same inspector with:
   - Missing signatures (Stage 1)
   - Contradictory checklist (Stage 2)
   - Missing required risks from Master Plan (Stage 3a)
   - Risk level mismatch (Stage 3b)
   - Inconsistent with other docs (Stage 3c)
   - All items always checked (Stage 4)

**Expected Result:**
```
검증 결과: Needs Review

발견된 문제점:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stage 1 (2 issues)
❌ 점검일자 누락
❌ 관리감독자 서명 누락

Stage 2 (1 issue)
❌ 고소작업 시 안전대 착용 필수

Stage 3 (3 issues)
⚠️  마스터 플랜 위험요인 미포함
⚠️  위험도 평가 불일치
⚠️  프로젝트 내 문서 간 불일치

Stage 4 (2 issues)
⚠️  항상 체크 패턴 감지
⚠️  동일한 작업 내용 반복

Total: 8 issues detected
```

**Pass Criteria:** ✅ All 5 stages produce issues

---

## Troubleshooting

### Stage 3a Not Triggering
**Cause:** Project is not structured
**Fix:** Ensure project has:
```typescript
isStructured: true
masterPlanJson: "{ ... }" // Valid JSON
```

### Stage 4 Not Triggering
**Cause:** Not enough historical reports
**Fix:** Upload at least 5 reports with same inspector name

### Stage 3c Not Triggering
**Cause:** No project context
**Fix:** Upload documents within a project (not standalone)

---

## Console Logs to Monitor

Watch for these logs during validation:

```
[TBM] Using project context: 프로젝트명: OO 건설 현장...
[API Validate] Pattern analysis triggered for inspector: 김철수
[API Validate] Cross-document analysis triggered for project: abc-123
[API Validate] Structured validation triggered
[API Validate] Risk calculation complete
```

If you don't see these, the stages aren't triggering due to missing conditions.

---

## Summary

| Stage | Easy to Test? | Requirements |
|-------|---------------|--------------|
| Stage 1 | ✅ Very Easy | Just upload incomplete document |
| Stage 2 | ✅ Very Easy | Create contradictory checklist |
| Stage 3a | ⚠️ Medium | Need structured project |
| Stage 3b | ✅ Easy | Document with checklist |
| Stage 3c | ⚠️ Medium | Need project with multiple docs |
| Stage 4 | ⚠️ Hard | Need 5+ reports from same inspector |
| Stage 5 | ✅ Easy | Triggered by Stage 4 |

**Recommended Test Order:**
1. Stage 1, 2 (immediate feedback)
2. Stage 3b (always runs)
3. Stage 3a (if you have structured project)
4. Stage 3c (upload multiple docs to same project)
5. Stage 4, 5 (build up historical data)
