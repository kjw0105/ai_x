# 🛡️ 스마트 안전지킴이 (AI Document Verification)

**스마트 안전지킴이**는 한국 건설 현장을 위한 AI 기반 안전 문서 검증 시스템입니다. **5단계 검증 프레임워크**를 사용하여 누락된 필드, 안전 위반, 위험도 불일치, 사기 패턴 및 문서 간 모순을 감지합니다.

![Project Status](https://img.shields.io/badge/Status-Active-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Prisma](https://img.shields.io/badge/Prisma-5-blue)
![Competition](https://img.shields.io/badge/GNU_RISE_AI+X-2026-orange)

[🇺🇸 English Version](README.md)

---

## 🎯 대회: GNU RISE AI+X 2026

**팀**: Luna
**데모 날짜**: 2026년 2월 8일
**목표**: 한국 건설 현장에서 사기를 줄이고 규정 준수를 개선하기 위한 안전 문서 검증 자동화

---

## ✨ 핵심 기능

### 🔍 5단계 검증 프레임워크

#### **Stage 1: 형식 검증**
- 필수 필드 누락 감지 (날짜, 현장명, 서명)
- 체크리스트 완성도 확인
- 서명 존재 여부 검증 (점검자 & 관리감독자)

#### **Stage 2: 문서 내 논리 검증** ⭐ 강화
- **4개 카테고리 22개 종합 규칙**:
  - 9개 안전규정 위반 (예: 고소작업 시 안전대 미착용)
  - 5개 논리적 불일치 (예: 작업 안 함 + 장비 점검 표시)
  - 6개 의심스러운 패턴 (예: N/A 과다 응답)
  - 2개 완전성 검사 (예: 안전모 점검 누락)
- **한국 안전법 참조**: 모든 위반 사항에 구체적인 법규 인용 (산업안전보건법, KOSHA GUIDE)
- **실행 가능한 지침**: 각 문제마다 권장 조치 포함

#### **Stage 3: 문서 간 일관성** ⭐ 신규 - 3개 병렬 시스템
1. **구조화된 마스터 안전 계획 검증**
   - JSON 기반 마스터 안전 계획 검증
   - 기상 제한, 작업 요구사항, 인원 자격 확인
   - 결정론적 검증 (~10ms, AI 불필요)

2. **위험도 행렬 계산**
   - KOSHA 기준 기반 객관적 위험도 점수 (0-100) 계산
   - 요인: 고위험 작업 유형, 안전 위반, 서명, 체크리스트 품질
   - 계산된 위험도와 문서 기록 위험도 간 불일치 감지
   - 예: 계산=높음 (55점) vs 문서=낮음 → 불일치 플래그

3. **문서 간 분석**
   - 타임라인 공백 감지 (5일 이상 점검 공백 플래그)
   - 모순 감지 (동일 현장의 상충하는 위험도 평가)
   - 반복 패턴 감지 (복사-붙여넣기 행동, 동일 체크리스트)
   - 프로젝트당 최근 30일 보고서 분석

#### **Stage 4: 행동 패턴 분석** ⭐ 강화
- **이름 정규화**: "김철수" = "김 철수"를 동일 인물로 인식
- **시간 가중치 분석**: 최근 행동에 더 높은 가중치 부여 (30일 윈도우)
- **패턴 심각도 점수**: 누적 위험 평가 (심각: 80+, 높음: 50-79)
- **설정 가능한 임계값**: 다양한 시나리오를 위한 STRICT/DEFAULT/LENIENT 모드
- 감지 항목: 항상 체크 패턴, 복사-붙여넣기 행동, 빠른 완료

#### **Stage 5: 위험 신호 안내**
- 비판단적 표현 (예: "불일치 감지됨" / "위험함" 사용 안 함)
- 보라색 코드 패턴 경고 (빨간색 오류/주황색 경고와 구별)
- 이중 언어 메시지 (한국어 + 영어)

---

## 🚀 고급 기능

### 📋 프로젝트 컨텍스트 인식
- 각 건설 현장별 **마스터 안전 계획 (PDF 또는 JSON)** 업로드
- 현장별 규칙에 대해 일일 보고서 검증
- 예: 마스터 플랜 "풍속 10m/s 초과 시 작업 중지" → 12m/s 표시된 일일 보고서 위반 플래그

### 💾 데이터 저장 및 이력
- 모든 검증 보고서 데이터베이스 저장
- 여러 보고서에 걸친 점검자 패턴 추적
- 프로젝트 수준 분석 및 타임라인 요약

### 🎨 현대적인 UI
- 크기 조절 가능한 분할 창 인터페이스 (문서 뷰어 | 분석 패널)
- 문제 분류가 포함된 실시간 검증 결과
- 요인 분석이 포함된 위험도 점수 대시보드
- 모바일 반응형 (소형 화면에서 탭 인터페이스)

### 🌐 이중 언어 지원
- 모든 검증 메시지 한국어 (기본) 및 영어
- 코드 주석 및 문서 양 언어 지원
- 한국 안전 규정 설계 (KOSHA GUIDE, 산업안전보건법)

---

## 🛠️ 기술 스택

### 핵심 프레임워크
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: SQLite (개발) / Postgres (운영)
- **ORM**: Prisma v5

### AI 및 문서 처리
- **AI 모델**: OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet
- **PDF 엔진**: PDF.js (다중 페이지 분석)
- **비전 처리**: 스캔 문서용 Base64 이미지 인코딩

### 검증 엔진
- **규칙 엔진**: 22개 결정론적 규칙 (Stage 1-2)
- **구조화된 검증**: JSON 스키마 검증 (Stage 3)
- **위험도 계산**: KOSHA 준수 행렬 (Stage 3)
- **패턴 분석**: 통계적 행동 감지 (Stage 4)
- **문서 간 분석**: 데이터베이스 기반 분석 (Stage 3)

---

## 🚀 시작하기

### 1. 클론 및 설치
```bash
git clone https://github.com/jean-tulip/ai_x.git
cd ai_x
npm install
```

### 2. 환경 설정
`.env.local` 파일 생성:
```env
# AI API 키 (최소 하나 필요)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# 데이터베이스 (로컬 SQLite)
DATABASE_URL="file:./dev.db"
```

### 3. 데이터베이스 초기화
```bash
# Prisma 클라이언트 생성 및 스키마 푸시
npx prisma db push
```

### 4. 로컬 실행
```bash
npm run dev
# http://localhost:3000 열기
```

---

## 📊 데모 하이라이트

### 이 시스템을 독특하게 만드는 것은?

1. **사기 감지** 🕵️
   - 보고서 간 복사-붙여넣기 행동 감지
   - 특정 점검자의 "항상 체크" 패턴 식별
   - 타임라인 공백 및 의심스러운 반복 플래그

2. **객관적 위험도 점수** 📈
   - KOSHA 준수 위험도 행렬
   - 모든 위험 요인을 보여주는 투명한 계산
   - 현실과 문서 간 불일치 감지

3. **구조화된 마스터 플랜** 📋
   - JSON 기반 안전 계획 (주관적인 AI 해석 없음)
   - 결정론적 검증 (빠르고 재현 가능)
   - 기상 제한, 작업 요구사항, 인원 자격 포함

4. **이중 언어 한국어/영어** 🌐
   - 모든 메시지 양 언어 제공
   - 한국 안전법 참조
   - 한국 건설 산업을 위해 설계됨

### 성능 지표
- **AI 추출**: 2-5초 (변경 없음)
- **Stage 1-2 검증**: ~20ms
- **Stage 3 시스템**: 총 +65-215ms
- **Stage 4 패턴 분석**: ~100ms
- **총 처리 시간**: ~2.5-5.5초

---

## 📂 프로젝트 구조

### 핵심 애플리케이션
```
src/app/
├── page.tsx                    # 메인 컨트롤러 (상태 관리)
├── api/
│   ├── validate/route.ts       # AI 검증 + 모든 5단계
│   ├── projects/route.ts       # 프로젝트 컨텍스트 관리
│   └── history/route.ts        # 보고서 이력 API
```

### 컴포넌트
```
src/components/
├── Header.tsx                  # 프로젝트 선택기
├── layout/                     # 크기 조절 가능한 분할 창
├── viewer/                     # PDF/이미지 렌더링
└── analysis/                   # 결과 표시 + 문제 목록
```

### 검증 엔진
```
src/lib/
├── validator.ts                # Stage 1-2: 22개 규칙
├── structuredValidation.ts     # Stage 3: 구조화된 계획 검사
├── riskMatrix.ts               # Stage 3: 위험도 점수 계산
├── crossDocumentAnalysis.ts    # Stage 3: 다중 보고서 분석
├── patternAnalysis.ts          # Stage 4: 행동 패턴
├── validationConfig.ts         # 설정 가능한 임계값
└── masterPlanSchema.ts         # 구조화된 계획 스키마
```

### 데이터베이스
```
prisma/
├── schema.prisma               # Report & Project 모델
└── dev.db                      # SQLite 데이터베이스 (로컬)
```

---

## 🧪 실제 문서 없이 테스트하기

실제 건설 안전 문서가 없을 수 있으므로 다음을 제공합니다:

### 옵션 1: 대화형 HTML 도구
브라우저에서 `tools/generate-test-document.html` 열기:
- 4개 프리셋: 유효, 위반, 모순, N/A 패턴
- 클릭하여 체크리스트 항목 편집
- PDF로 저장 또는 스크린샷

### 옵션 2: 합성 테스트 데이터
`src/lib/testData.ts` 함수 사용:
```typescript
generateValidDocument()           // 정상 문서
generateContradictoryDocument()   // 논리 오류
generateAlwaysCheckDocument()     // 패턴 사기
generateInconsistentRiskDocument() // 위험도 불일치
```

### 옵션 3: 브라우저 콘솔 테스트
앱에서 브라우저 콘솔을 열고 붙여넣기:
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

전체 테스트 전략: `테스트_전략.md` 참조

---

## ☁️ 배포 (Vercel)

### 프로덕션 요구사항
1. **Postgres로 전환**:
   - Vercel Postgres 데이터베이스 생성
   - `prisma/schema.prisma` 업데이트: `provider = "sqlite"`를 `provider = "postgresql"`로 변경
   - Vercel 환경 변수에 `DATABASE_URL` 설정

2. **API 키 설정**:
   - `OPENAI_API_KEY` (필수)
   - `ANTHROPIC_API_KEY` (필수)

3. **배포**:
   ```bash
   git push origin main
   # 리포지토리를 Vercel에 연결
   ```

> **참고**: SQLite는 서버리스 환경에서 지속되지 않습니다. 프로덕션에는 Postgres가 필요합니다.

---

## 🤝 기여 가이드

이 프로젝트는 **Fork & Pull** 워크플로우를 따릅니다.

### 업스트림과 동기화
```bash
git fetch upstream
git merge upstream/main
```

### 변경 사항 만들기
1. 기능 브랜치 생성: `git checkout -b feat/your-feature`
2. 변경하고 커밋: `git commit -m "feat: Add feature"`
3. Fork에 푸시: `git push origin feat/your-feature`
4. 메인 리포지토리에 Pull Request 열기

---

## 📖 문서

- **[NEW_FEATURES.md](NEW_FEATURES.md)**: 이중 언어 문서가 포함된 기능 진화 로그
- **[STAGE3_SUMMARY.md](STAGE3_SUMMARY.md)**: 포괄적인 Stage 3 구현 가이드
- **[CLAUDE.md](CLAUDE.md)**: AI 어시스턴트용 프로젝트 컨텍스트
- **[테스트_전략.md](테스트_전략.md)**: 실제 문서 없이 테스트 전략 (한국어)

---

## 🎓 학습 자료

### 한국 건설 안전용
- **산업안전보건법** (Occupational Safety and Health Act)
- **KOSHA GUIDE** (Korea Occupational Safety and Health Agency)
- **산업안전보건기준에 관한 규칙** (시행 규칙)

### 개발자용
- Next.js 14 App Router 문서
- Prisma ORM 문서
- OpenAI API / Anthropic API 문서
- Tailwind CSS 문서

---

## 📊 검증 통계

### 규칙 범위
- **Stage 1**: 5개 형식 검사
- **Stage 2**: 22개 논리 규칙 (4개 카테고리)
- **Stage 3 System 1**: 8개 구조화된 검증 함수
- **Stage 3 System 2**: 4가지 요인 위험 평가
- **Stage 3 System 3**: 3개 문서 간 분석
- **Stage 4**: 5개 패턴 감지 알고리즘

**총**: 5단계에 걸쳐 40개 이상의 검증 규칙

### 코드 지표
- **총 라인 수**: ~1,800줄 (검증 엔진만)
- **모듈**: 7개 주요 검증 파일
- **테스트 범위**: 모든 단계에 대한 합성 데이터 사용 가능

---

## 🏆 경쟁 우위

1. **사기 감지** - 복사-붙여넣기 및 패턴 조작 감지 고유 기능
2. **객관적 위험도 점수** - KOSHA 준수, 투명한 계산
3. **5단계 프레임워크** - 단순 필드 검사를 넘어선 포괄적 검증
4. **프로덕션 준비 완료** - 95% 완료, 완전 기능 시스템
5. **이중 언어 지원** - 영어 번역이 포함된 한국어 기본
6. **오픈 소스** - 투명하고 감사 가능한 검증 로직

---

## 📝 라이선스

이 프로젝트는 **GNU RISE AI+X Competition 2026**을 위해 개발되었습니다.

---

## 👥 팀

**Team Luna**
GNU RISE 프로그램

**데모 날짜**: 2026년 2월 8일

---

**한국의 더 안전한 건설 현장을 위해 ❤️로 제작**
