# Testing Strategy Without Real Safety Documents

**Date**: January 27, 2026
**Purpose**: Comprehensive testing guide for demo preparation (Feb 7, 2026)

---

## Overview

Since you don't have real Korean construction safety documents, we'll use three approaches:

1. **Synthetic Documents** - Generate realistic test documents programmatically
2. **Manual Mock Documents** - Create realistic PDFs/images manually
3. **Browser Testing** - Test with screenshot uploads and text input

---

## Approach 1: Synthetic Test Data (Programmatic)

### Already Available: `src/lib/testData.ts`

This file contains functions to generate realistic test documents:

```typescript
// Valid document with no issues
const validDoc = generateValidDocument();

// Document with contradictions (Stage 2 test)
const contradictoryDoc = generateContradictoryDocument();

// Document with suspicious patterns (Stage 4 test)
const suspiciousDoc = generateAlwaysCheckDocument("김만점", 0);

// Document with inconsistent risk (Stage 3 test)
const inconsistentDoc = generateInconsistentRiskDocument();
```

### How to Use for API Testing

Create a test API endpoint that bypasses document upload:

**File**: `src/app/api/test-validate/route.ts` (NEW)

```typescript
import { NextResponse } from "next/server";
import { validateDocument } from "@/lib/validator";
import {
  generateValidDocument,
  generateContradictoryDocument,
  generateAlwaysCheckDocument
} from "@/lib/testData";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const testCase = url.searchParams.get("case") || "valid";

  let testDoc;
  switch (testCase) {
    case "contradiction":
      testDoc = generateContradictoryDocument();
      break;
    case "suspicious":
      testDoc = generateAlwaysCheckDocument("김만점", 0);
      break;
    case "valid":
    default:
      testDoc = generateValidDocument();
  }

  const issues = validateDocument(testDoc);

  return NextResponse.json({
    testCase,
    document: testDoc,
    issues,
    issueCount: issues.length
  });
}
```

**Usage**: Visit `http://localhost:3000/api/test-validate?case=contradiction`

---

## Approach 2: Create Mock PDF Documents

### Option A: Use Google Docs/MS Word

Create a Korean safety checklist document with:

1. **Header Section**:
   ```
   안전점검표 (Safety Inspection Checklist)

   점검일자: 2026-01-27
   현장명: 김포 한강신도시 A공구
   작업내용: 철골 구조물 설치 작업
   작업인원: 5명
   ```

2. **Checklist Section**:
   ```
   [ ✓ ] 1. 안전모 착용
   [ ✓ ] 2. 고소작업 실시
   [ ✗ ] 3. 안전대 착용  ← This creates a violation!
   [ ✓ ] 4. 화기작업 실시
   [ ✗ ] 5. 소화기 비치  ← Another violation!
   ```

3. **Signature Section**:
   ```
   담당자: [서명] 김철수
   소장: [서명] 박현장
   ```

4. **Export as PDF** and upload to your app

### Option B: Use Korean Document Templates

Search for:
- "산업안전 점검표 양식" (safety checklist template)
- "TBM 기록표" (Toolbox Meeting template)
- "위험성 평가 보고서" (Risk Assessment template)

Download template, fill it out with test data, save as PDF.

---

## Approach 3: Screenshot Testing (Easiest!)

### Create a Simple HTML File

**File**: `test-document.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>안전점검표</title>
  <style>
    body { font-family: "Malgun Gothic", sans-serif; padding: 40px; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #333; padding: 10px; text-align: left; }
    th { background: #f0f0f0; }
    .signature { margin-top: 40px; }
  </style>
</head>
<body>
  <h1>산업안전 점검표</h1>

  <table>
    <tr>
      <th>점검일자</th>
      <td>2026-01-27</td>
      <th>현장명</th>
      <td>김포 한강신도시 A공구</td>
    </tr>
    <tr>
      <th>작업내용</th>
      <td colspan="3">철골 구조물 설치 작업 (10층 높이)</td>
    </tr>
    <tr>
      <th>작업인원</th>
      <td>5명</td>
      <th>점검자</th>
      <td>김안전</td>
    </tr>
  </table>

  <h2>안전 점검 항목</h2>
  <table>
    <tr>
      <th width="50%">점검 항목</th>
      <th>적합</th>
      <th>부적합</th>
      <th>N/A</th>
    </tr>
    <tr>
      <td>1. 안전모 착용</td>
      <td>✔</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>2. 고소작업 (2m 이상)</td>
      <td>✔</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>3. 안전대 착용</td>
      <td></td>
      <td>✔</td>
      <td></td>
    </tr>
    <tr>
      <td>4. 추락방호장치 설치</td>
      <td></td>
      <td>✔</td>
      <td></td>
    </tr>
    <tr>
      <td>5. 화기작업 실시</td>
      <td>✔</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>6. 소화기 비치</td>
      <td></td>
      <td>✔</td>
      <td></td>
    </tr>
  </table>

  <div class="signature">
    <p><strong>담당자:</strong> [서명] 김안전</p>
    <p><strong>현장소장:</strong> [서명] 박현장</p>
  </div>
</body>
</html>
```

**Steps**:
1. Save this as `test-document.html`
2. Open in browser
3. Take a screenshot (Print Screen or Snipping Tool)
4. Upload the screenshot image to your app

**Expected Results**:
- ❌ Error: "고소작업 시 안전대 착용 필수" (rule_height_harness)
- ❌ Error: "고소작업 시 추락방호장치 설치 필수" (rule_height_protection)
- ❌ Error: "화기작업 시 소화기 비치 필수" (rule_fire_extinguisher)

---

## Approach 4: Test Each Stage Individually

### Stage 1: Format Validation
**Test**: Upload document with missing fields

**Create**: Document with no date or signatures
```
Expected Issues:
- "점검일자 누락"
- "담당자 서명 누락"
- "관리책임자 서명 미비"
```

### Stage 2: Intra-Checklist Logic
**Test**: Upload document with contradictory checklist

**Create**:
- High work (✔) + No harness (✗) → Error
- No high work (✗) + Fall protection (✔) → Warning

```
Expected Issues:
- "안전규정 위반 - 고소작업 시 안전대 착용 필수"
- "논리적 불일치 - 고소작업 미실시이나 추락방호장치 사용"
```

### Stage 3: Cross-Document Consistency
**Test**: Create project with Master Plan, then upload contradicting document

**Steps**:
1. Create project with Master Plan text:
   ```
   이 현장은 고위험 작업 현장입니다.
   - 모든 작업은 고소작업으로 분류
   - 안전대 및 추락방호망 필수
   - 화기작업 시 소화기 2개 이상 비치
   ```

2. Upload document that says:
   - Risk Level: Low (위험도: 낮음)
   - Work: "일상 점검" (routine inspection)

```
Expected: AI chat message warning about inconsistency
```

### Stage 4: Behavioral Pattern Analysis
**Test**: Submit multiple documents from same inspector

**Steps**:
1. Upload 6 documents with same inspector name "김만점"
2. All documents have 100% ✔ checklist items
3. On 6th document, should see pattern warning

```
Expected Issue:
- "패턴 경고: 일관된 전체 체크"
- "이 점검자는 최근 6건에서 100%를 ✔로 표시"
```

### Stage 5: Risk Signal Guidance
**Test**: Verify pattern warnings have purple styling

**Steps**:
1. Trigger any pattern warning (Stage 4)
2. Check UI displays purple icon/border instead of red/orange

```
Expected:
- Purple query_stats icon
- Purple border-l-purple-500
- Title: "패턴 경고: ..."
```

---

## Quick Test Script (Browser Console)

For rapid testing without file uploads, use browser console:

```javascript
// Open browser console on your app
// Create a mock document
const mockDoc = {
  docType: "산업안전 점검표",
  fields: {
    점검일자: "2026-01-27",
    현장명: "테스트 현장",
    작업내용: "철골 설치",
    작업인원: "5명"
  },
  signature: {
    담당: "present",
    소장: "present"
  },
  checklist: [
    { id: "fall_01", category: "추락예방", nameKo: "고소작업", value: "✔" },
    { id: "ppe_03", category: "보호구", nameKo: "안전대착용", value: "✖" }
  ]
};

// Send to validation API
fetch('/api/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'auto',
    fileName: 'test.pdf',
    pdfText: JSON.stringify(mockDoc),
    pageImages: null,
    projectId: null
  })
}).then(r => r.json()).then(console.log);
```

---

## Recommended Testing Sequence

### Day 1: Basic Validation (Stage 1 + 2)
1. Test valid document → Should pass with 0 issues
2. Test missing fields → Should flag 3-5 issues
3. Test safety violations → Should flag specific rules
4. Test contradictions → Should flag logical issues

### Day 2: Pattern Testing (Stage 4)
1. Submit 10 identical documents → Should trigger "always ✔" warning
2. Submit 5 documents in 5 minutes → Should trigger "rapid completion"
3. Use same work description 4 times → Should trigger "copy-paste"

### Day 3: Integration Testing (Stage 3)
1. Create 3 projects with different Master Plans
2. Upload contradicting documents to each
3. Verify AI flags inconsistencies correctly

### Day 4: UI/UX Testing
1. Test on mobile (responsive design)
2. Test dark mode
3. Test drag-resize functionality
4. Test project switching

### Day 5: Demo Rehearsal
1. Prepare 3 demo documents (valid, violation, pattern)
2. Practice full workflow: Create project → Upload → Review
3. Time the demo (should be < 5 minutes)

---

## Sample Test Cases Matrix

| Test Case | Document Type | Expected Issues | Stage |
|-----------|---------------|-----------------|-------|
| Valid Document | 점검표 with all ✔ | 0 errors, maybe 1 info | 1 |
| Missing Date | 점검표 with no date | "점검일자 누락" | 1 |
| Missing Signature | 점검표 with no 담당 signature | "담당자 서명 누락" | 1 |
| Height + No Harness | 점검표: fall_01=✔, ppe_03=✗ | "안전대 착용 필수" | 2 |
| Fire + No Extinguisher | 점검표: fire_01=✔, fire_02=✗ | "소화기 비치 필수" | 2 |
| Contradiction | 점검표: fall_01=✗, fall_02=✔ | "기록 불일치" | 2 |
| Excessive N/A | 점검표 with 60% N/A | "N/A 과다 표시" | 2 |
| All Checked | 점검표 with 100% ✔ | "전체 항목 적합 표시" (info) | 2 |
| Project Mismatch | High-risk work marked low risk | AI chat warning | 3 |
| Always Check Pattern | 6 docs from "김만점" all ✔ | "일관된 전체 체크" (purple) | 4 |
| Copy-Paste Pattern | 4 docs with "일상 점검" | "동일 작업내용 반복" (purple) | 4 |
| Rapid Completion | 5 docs in 10 minutes | "빠른 연속 제출" (purple) | 4 |

---

## Demo Day Preparation

### Before Demo (Feb 6)
- [ ] Create 3 test PDFs (valid, violation, pattern)
- [ ] Create 2 test projects with Master Plans
- [ ] Pre-load 5 reports for pattern detection
- [ ] Test on target presentation laptop
- [ ] Prepare backup screenshots (in case internet fails)

### Demo Script (5 minutes)
1. **Introduction** (30s): Explain the 5-stage framework
2. **Stage 1-2 Demo** (2m): Upload violation document, show errors
3. **Stage 3 Demo** (1m): Show project context checking
4. **Stage 4 Demo** (1m): Show pattern warning with purple styling
5. **Conclusion** (30s): Explain real-world impact

---

## Troubleshooting

### Problem: AI doesn't extract Korean text correctly
**Solution**: Use clearer fonts, higher resolution screenshots

### Problem: Pattern warnings don't appear
**Solution**: Need minimum 5 reports from same inspector in database

### Problem: Project Context doesn't work
**Solution**: Ensure projectId is passed to validation API

### Problem: UI doesn't update after upload
**Solution**: Check browser console for errors, verify API response

---

## Summary

**Easiest Testing Method**:
1. Create HTML file with Korean checklist
2. Take screenshot
3. Upload screenshot to app
4. Verify validation results

**Most Realistic Method**:
1. Download Korean safety template from internet
2. Fill with test data
3. Save as PDF
4. Upload to app

**For Demo**:
- Prepare 3 pre-made documents
- Have backup screenshots
- Practice the workflow 3-5 times
- Keep demo under 5 minutes

**Key Testing Insight**: You don't need real documents - realistic mock documents with intentional errors will demonstrate all validation stages effectively!

---

**Created by**: Claude Sonnet 4.5
**Date**: January 27, 2026
**Branch**: `feat/stage2-post-demo-enhancements`
