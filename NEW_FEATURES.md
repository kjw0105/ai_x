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
