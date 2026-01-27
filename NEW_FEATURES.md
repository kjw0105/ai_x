# 🚀 Feature Evolution Log & Future Roadmap
# 🚀 기능 발전 로그 및 미래 로드맵

This document tracks the evolution of the **Smart Safety Guardian** and outlines our thought process for future expansions.
이 문서는 **스마트 안전지킴이**의 발전 과정과 향후 확장 계획에 대한 비전을 기록합니다.

---

## ✅ New Feature: Project Context Awareness (Implemented)
## ✅ 신규 기능: 프로젝트 컨텍스트 인식 (구현 완료)

### 💡 Thought Process (기획 의도)
Initially, the AI acted as a simple "Form Validator"—checking if boxes were checked or signatures existed. However, safety is relative. A "correct" form might still be unsafe if it contradicts the site's specific rules (e.g., wind speed limits, required equipment).
초기에 AI는 단순히 빈칸이나 서명 유무를 확인하는 "양식 검사기"에 불과했습니다. 하지만 안전 기준은 현장마다 다릅니다. 양식이 완벽하게 작성되었더라도, 현장의 특정 수칙(풍속 제한, 필수 장비 등)을 위반했다면 그것은 "안전하지 않은" 것입니다.

To solve this, we introduced **"Project Context"**:
이를 해결하기 위해 **"프로젝트 컨텍스트"** 개념을 도입했습니다.

### 🛠️ How it Works (작동 원리)
1.  **Thinking**: The AI now "knows" the project. You upload a **Master Safety Plan (PDF)** for each construction site.
2.  **Memory**: The system extracts text from the Master Plan and stores it as the "Ground Truth".
3.  **Validation**: When a daily report is scanned, the AI reads it **AND** the Master Plan together. It checks for discrepancies.
    *   *Example*: "The Daily Report says 'Wind 12m/s, Work Continued', but the Master Plan says 'Stop work if wind > 10m/s'. -> **Violation Detected**."

1.  **인지**: AI가 프로젝트를 이해합니다. 각 현장의 **안전 관리 계획서(PDF)**를 업로드합니다.
2.  **기억**: 시스템이 계획서에서 텍스트를 추출하여 "절대 기준(Ground Truth)"으로 저장합니다.
3.  **검증**: 일일 점검표를 스캔할 때, AI는 점검표와 마스터 플랜을 **함께** 읽습니다.
    *   *예시*: "일일 보고서엔 '풍속 12m/s, 작업 진행'이라 적혀있지만, 마스터 플랜은 '10m/s 이상 시 작업 중지'를 규정하고 있음. -> **위반 감지**."

---

## ✅ New Feature: Stage 2 Comprehensive Enhancement (Implemented)
## ✅ 신규 기능: Stage 2 종합 강화 (구현 완료)

### 💡 Thought Process (기획 의도)
Initially, Stage 2 validation only had 8 basic rules checking simple IF-THEN logic. However, Korean construction safety is governed by detailed regulations (산업안전보건법), and inspectors need actionable guidance, not just error messages. We also noticed that critical items marked "N/A" were being ignored, and there was no way to detect incomplete checklists.
초기의 Stage 2 검증은 단순한 IF-THEN 논리만 확인하는 8개의 기본 규칙만 있었습니다. 하지만 한국의 건설 안전은 세밀한 법규(산업안전보건법)로 규제되며, 점검자들은 단순한 오류 메시지가 아닌 실행 가능한 지침이 필요합니다. 또한 중요 항목이 "N/A"로 표시되는 것을 간과하고 있었고, 불완전한 체크리스트를 감지할 방법이 없었습니다.

To address this, we expanded Stage 2 into a **comprehensive 22-rule validation framework** with 4 categories:
이를 해결하기 위해 Stage 2를 4개 카테고리를 가진 **포괄적인 22개 규칙 검증 프레임워크**로 확장했습니다:

### 🛠️ How it Works (작동 원리)
1. **Rule Expansion**: Expanded from 8 to 22 rules (+175%)
   - 9 Safety Violations (안전규정 위반): Direct violations of Korean safety laws
   - 5 Logical Contradictions (논리적 불일치): Inconsistent checklist values
   - 6 Suspicious Patterns (의심스러운 패턴): N/A detection and unusual patterns
   - 2 Completeness Checks (완전성 검사): Missing required items

2. **Korean Safety Law References**: Every safety violation now cites specific regulations
   - Example: "산업안전보건기준에 관한 규칙 제42조 - 2m 이상 고소작업 시 안전대 착용 의무"
   - Provides legal context for compliance

3. **Actionable Guidance**: Each issue includes recommendations marked with →
   - Example: "→ 산소농도 18% 이상 확인 필수 (KOSHA GUIDE)"

4. **Category-Based Reporting**: Issues grouped by type for easier scanning
   - Title: "안전규정 위반" vs "논리적 불일치" vs "의심스러운 패턴"

1. **규칙 확장**: 8개에서 22개 규칙으로 확장 (+175%)
   - 9개 안전규정 위반: 한국 안전법 직접 위반 사항
   - 5개 논리적 불일치: 일관성 없는 체크리스트 값
   - 6개 의심스러운 패턴: N/A 감지 및 비정상 패턴
   - 2개 완전성 검사: 필수 항목 누락

2. **한국 안전법 참조**: 모든 안전규정 위반에 구체적인 법규 인용
   - 예시: "산업안전보건기준에 관한 규칙 제42조 - 2m 이상 고소작업 시 안전대 착용 의무"
   - 준수를 위한 법적 근거 제공

3. **실행 가능한 지침**: 각 문제에 → 표시와 함께 권장사항 포함
   - 예시: "→ 산소농도 18% 이상 확인 필수 (KOSHA GUIDE)"

4. **카테고리별 보고**: 문제를 유형별로 그룹화하여 쉽게 스캔
   - 제목: "안전규정 위반" vs "논리적 불일치" vs "의심스러운 패턴"

---

## ✅ New Feature: Stage 4 Behavioral Pattern Analysis Enhancement (Implemented)
## ✅ 신규 기능: Stage 4 행동 패턴 분석 강화 (구현 완료)

### 💡 Thought Process (기획 의도)
Stage 4 pattern analysis was detecting suspicious behaviors, but had limitations: inspector names with spacing variations ("김철수" vs "김 철수") were treated as different people, old patterns and recent patterns had equal weight, and there was no way to prioritize which inspectors needed immediate attention.
Stage 4 패턴 분석은 의심스러운 행동을 감지하고 있었지만, 한계가 있었습니다: 공백 변형이 있는 점검자 이름("김철수" vs "김 철수")을 다른 사람으로 취급했고, 오래된 패턴과 최근 패턴에 동일한 가중치를 부여했으며, 어떤 점검자에게 즉각적인 주의가 필요한지 우선순위를 정할 방법이 없었습니다.

To solve this, we introduced **intelligent pattern analysis** with 5 key enhancements:
이를 해결하기 위해 5가지 핵심 개선사항을 포함한 **지능형 패턴 분석**을 도입했습니다:

### 🛠️ How it Works (작동 원리)
1. **Name Normalization (이름 정규화)**: Automatically handles variations
   - "김철수" = "김 철수" = "김철수." are now recognized as the same person
   - Removes spaces, punctuation, and normalizes case

2. **Time-Weighted Analysis (시간 가중치 분석)**: Recent behavior matters more
   - Reports from today: 1.0x weight (100%)
   - Reports from 15 days ago: 0.75x weight (75%)
   - Reports from 30+ days ago: 0.5x weight (50%)
   - Detects if inspector improved or worsened over time

3. **Pattern Severity Scoring (패턴 심각도 점수)**: Cumulative risk assessment
   - always_check: 50 points (highest risk)
   - copy_paste: 30 points (medium risk)
   - rapid_completion: 20 points (low risk)
   - Risk levels: Critical (80+), High (50-79), Medium (30-49), Low (<30)

4. **Confidence Scoring (신뢰도 점수)**: Each pattern includes 0-100 confidence score
   - Based on sample size, time span, and consistency
   - Helps judge reliability of the pattern detection

5. **Configurable Thresholds (설정 가능한 임계값)**: Three presets for different scenarios
   - STRICT (엄격): For demo/testing - catches everything (90% threshold)
   - DEFAULT (기본): For production - balanced detection (95% threshold)
   - LENIENT (관대): For high-volume sites - fewer false alarms (98% threshold)

1. **이름 정규화**: 자동으로 변형 처리
   - "김철수" = "김 철수" = "김철수."를 동일 인물로 인식
   - 공백, 문장부호 제거 및 대소문자 정규화

2. **시간 가중치 분석**: 최근 행동이 더 중요
   - 오늘 보고서: 1.0x 가중치 (100%)
   - 15일 전 보고서: 0.75x 가중치 (75%)
   - 30일 이상 전 보고서: 0.5x 가중치 (50%)
   - 점검자의 개선 또는 악화 추세 감지

3. **패턴 심각도 점수**: 누적 위험 평가
   - always_check: 50점 (최고 위험)
   - copy_paste: 30점 (중간 위험)
   - rapid_completion: 20점 (낮은 위험)
   - 위험 수준: 심각 (80+), 높음 (50-79), 중간 (30-49), 낮음 (<30)

4. **신뢰도 점수**: 각 패턴에 0-100 신뢰도 점수 포함
   - 샘플 크기, 시간 범위, 일관성 기반
   - 패턴 감지의 신뢰성 판단 지원

5. **설정 가능한 임계값**: 다양한 시나리오를 위한 3가지 프리셋
   - STRICT (엄격): 데모/테스트용 - 모든 것을 감지 (90% 임계값)
   - DEFAULT (기본): 프로덕션용 - 균형잡힌 감지 (95% 임계값)
   - LENIENT (관대): 대량 현장용 - 오탐 감소 (98% 임계값)

**Tech Details (기술 세부사항)**:
- New module: `src/lib/validationConfig.ts` (293 lines)
- Enhanced module: `src/lib/patternAnalysis.ts` (+150 lines)
- Backward compatible: existing code continues to work

---

## 🔮 Future Expansion Ideas (With Current Foundation)
## 🔮 향후 확장 아이디어 (현재 기반 활용)

Since we now have **Database Persistence** and **Context Awareness**, we can expand in powerful ways:
이제 **데이터베이스 저장**과 **컨텍스트 인식** 기술이 확보되었으므로, 다음과 같은 확장 기능이 가능합니다:

### 1. **Project Chatbot (Safety Consultant)**
### 1. **프로젝트 챗봇 (안전 컨설턴트)**
*   **Idea**: Instead of just validating, allow users to ask questions. "What is the safety rule for scaffolding height at Site A?"
*   **Tech**: We already have the extracted context text. We just need to add a Chat UI calling the LLM with that context.
*   **아이디어**: 단순히 검증만 하는 것이 아니라, 질문을 할 수 있게 합니다. "A 현장의 비계 높이 제한 규정이 뭐지?"
*   **기술**: 이미 추출된 컨텍스트 데이터가 있습니다. 채팅 UI만 추가하면 바로 구현 가능합니다.

### 2. **Cross-Document Trend Analytics**
### 2. **문서 간 트렌드 분석**
*   **Idea**: detect patterns across many reports. "Worker 'Kim' has missed signatures 5 times this month." or "Excavation safety issues are increasing by 20%."
*   **Tech**: We are saving JSON data in the DB (`issuesJson`). We can create a Dashboard Page that aggregates this data using SQL queries.
*   **아이디어**: 여러 보고서의 패턴을 분석합니다. "'김반장'이 이번 달에만 5번 서명을 누락했음" 또는 "굴착 공사 관련 지적사항이 20% 증가함."
*   **기술**: DB에 JSON 형태로 데이터를 저장하고 있습니다(`issuesJson`). SQL 쿼리로 이 데이터를 집계하여 대시보드를 만들 수 있습니다.

### 3. **Mobile GPS Integration**
### 3. **모바일 GPS 연동**
*   **Idea**: Automatically select the "Project" based on the user's GPS location.
*   **Tech**: Use the browser's Geolocation API. If User is at coordinate (X, Y), auto-load "Gimpo Site A".
*   **아이디어**: 사용자의 GPS 위치를 기반으로 "프로젝트"를 자동으로 선택합니다.
*   **기술**: 브라우저 위치 API를 사용합니다. 사용자가 (X, Y) 좌표에 있다면 "김포 A 현장"을 자동으로 불러옵니다.

### 4. **Safety Score & Gamification**
### 4. **안전 점수 및 게이미피케이션**
*   **Idea**: Give each site a "Safety Score" (0-100) based on validation results. Reward safe sites.
*   **Tech**: We added a `score` field to the Report model. We just need to implement the scoring logic in the AI prompt.
*   **아이디어**: 검증 결과를 바탕으로 각 현장에 "안전 점수"(0~100점)를 부여합니다. 안전한 현장에 보상을 줍니다.
*   **기술**: `Report` 모델에 이미 `score` 필드를 추가해 두었습니다. AI 프롬프트에 채점 로직만 추가하면 됩니다.
