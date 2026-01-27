# 🛡️ 스마트 안전지킴이 (AI Document Verification)

**스마트 안전지킴이**는 산업 안전 문서를 자동으로 검증하는 AI 시스템입니다. PDF나 이미지 문서를 업로드하면 LLM(GPT-4o / Claude 3.5 Sonnet)이 핵심 데이터를 추출하고 안전 규정 준수 여부를 확인합니다.

![Project Status](https://img.shields.io/badge/Status-Active-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Prisma](https://img.shields.io/badge/Prisma-5-blue)

[🇺🇸 English Version](README.md)

## ✨ 핵심 기능

-   **📄 다페이지 분석**: PDF의 모든 페이지를 자동으로 스캔하고 처리합니다.
-   **💰 토큰 최적화**: 중요 정보(날짜, 서명 등)가 위치한 **첫 페이지와 마지막 페이지**만 이미지로 분석하고 나머지는 텍스트로 처리하여 API 비용을 절감합니다.
-   **💾 이력 자동 저장**: 모든 검증 결과는 로컬 데이터베이스에 자동으로 저장됩니다. "기록" 사이드바에서 과거 내역을 조회할 수 있습니다.
-   **🎨 유연한 UI**: 사용자가 크기를 조절할 수 있는 대시보드 형태의 UI를 제공합니다. 문서를 보면서 동시에 AI 분석 결과를 확인할 수 있습니다.
-   **📱 모바일 반응형**: 모바일 환경에서는 탭 방식의 인터페이스로 자동 전환되어 최적의 사용자 경험을 제공합니다.

## 🛠️ 기술 스택

-   **Framework**: Next.js 14 (App Router)
-   **Data Persistence**: Prisma (v5) + SQLite (로컬) / Postgres (운영)
-   **Styling**: Tailwind CSS
-   **AI Engine**: OpenAI API (GPT-4o) / Anthropic API (Claude 3.5 Sonnet)
-   **PDF Engine**: PDF.js

---

## 🚀 시작하기

### 1. 설치 및 클론
이 프로젝트는 Fork된 리포지토리입니다.
```bash
# Fork한 리포지토리 클론
git clone https://github.com/jean-tulip/ai_x.git
cd ai_x

# 의존성 패키지 설치
npm install
```

### 2. 환경 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 추가하세요:
```env
# AI API 키 (둘 중 하나는 필수)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# 데이터베이스 (로컬 개발용 SQLite)
DATABASE_URL="file:./dev.db"
```

### 3. 데이터베이스 초기화
```bash
# Prisma 클라이언트를 생성하고 로컬 DB 스키마를 업데이트합니다.
npx prisma db push
```

### 4. 로컬 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

---

## 🤝 기여 가이드 (Contribution)

이 프로젝트는 **Fork & Pull** 워크플로우를 따릅니다.

### 최신 코드 동기화 (Upstream)
원본 리포지토리(kjw0105/ai_x)의 변경사항을 가져오려면:
```bash
git fetch upstream
git merge upstream/main
```

### 코드 수정 및 푸시
1.  새로운 기능을 개발하거나 버그를 수정합니다.
2.  커밋: `git commit -m "feat: 멋진 기능 추가"`
3.  내 Fork 저장소로 푸시: `git push origin main`

---

## ☁️ 배포하기 (Vercel)

Vercel에 배포하려면 SQLite 대신 **Postgres**를 사용해야 합니다.

1.  **데이터베이스**: Vercel Postgres 등을 생성합니다.
2.  **환경 변수**: Vercel 프로젝트 설정에서 `DATABASE_URL`, `OPENAI_API_KEY` 등을 설정합니다.
3.  **스키마 변경**:
    -   `prisma/schema.prisma` 파일을 엽니다.
    -   `provider = "sqlite"`를 `provider = "postgresql"`로 변경합니다.
    -   변경사항을 커밋하고 푸시합니다.

> **주의**: SQLite는 파일 기반이므로 Vercel과 같은 서버리스 환경에서는 데이터가 유지되지 않습니다. 반드시 Postgres를 사용하세요.

---

## 📂 프로젝트 구조

-   `src/app/page.tsx`: 메인 컨트롤러 (상태 관리)
-   `src/components/layout`: 레이아웃 컴포넌트 (크기 조절 가능한 패널)
-   `src/components/viewer`: PDF 및 이미지 렌더링 로직
-   `src/components/analysis`: 채팅 및 이슈 리스트 UI
-   `src/lib/validator.ts`: 비즈니스 로직 및 유효성 검사 규칙
-   `src/lib/db.ts`: Prisma DB 클라이언트
