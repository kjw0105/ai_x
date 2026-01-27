# 🛡️ Smart Safety Guardian (AI Document Verification)

**Smart Safety Guardian** is an AI-powered safety document verification system designed to streamline industrial safety checks. It allows users to upload PDF or image documents, auto-extracts key data using LLMs (GPT-4o / Claude 3.5 Sonnet), and validates compliance with safety regulations.

![Project Status](https://img.shields.io/badge/Status-Active-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Prisma](https://img.shields.io/badge/Prisma-5-blue)

[🇰🇷 Korean Version (한국어)](README.ko.md)

## ✨ Key Features

-   **📄 Multi-Page Analysis**: Automatically processes all pages of a PDF.
-   **💰 Token Optimization**: intelligently analyzes only the **First & Last pages** (plus full text) to verify critical details (dates, signatures) while minimizing API costs.
-   **💾 History & Persistence**: Automatically saves every validation report to a local database. View past scans via the "History" sidebar.
-   **🎨 Flexible UI**: Modern, resizable dashboard. Drag to adjust the split between the Document Viewer and AI Analysis panel.
-   **📱 Mobile Responsive**: Automatically switches to a tabbed interface on smaller screens.

## 🛠️ Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Styling**: Tailwind CSS
-   **Database**: SQLite (Local Dev) / Postgres (Production)
-   **ORM**: Prisma (v5)
-   **AI**: OpenAI API (GPT-4o) / Anthropic API (Claude 3.5 Sonnet)
-   **PDF Engine**: PDF.js

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
# Clone your fork
git clone https://github.com/jean-tulip/ai_x.git
cd ai_x

# Install dependencies
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
# AI API Keys (at least one is required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Database (Local SQLite)
DATABASE_URL="file:./dev.db"
```

### 3. Initialize Database
```bash
# Generate Prisma Client and push schema to local SQLite DB
npx prisma db push
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤝 Contribution Guide

This project follows a **Fork & Pull** workflow since we are working from a fork.

### Syncing with Upstream
If the original repository receives updates, force pull them to your local branch:
```bash
git fetch upstream
git merge upstream/main
```

### Making Changes
1.  Make your changes.
2.  Commit: `git commit -m "feat: Add cool feature"`
3.  Push to *your* fork: `git push origin main`

---

## ☁️ Deployment (Vercel)

To deploy this application to Vercel, you must switch from SQLite to Postgres.

1.  **Database**: Create a Vercel Postgres database.
2.  **Environment Variables**: Set `DATABASE_URL`, `OPENAI_API_KEY`, etc. in Vercel Project Settings.
3.  **Schema Update**:
    -   Open `prisma/schema.prisma`
    -   Change `provider = "sqlite"` to `provider = "postgresql"`
    -   Commit and push this change before deploying.

> **Note**: SQLite is file-based and will not persist data on Vercel's serverless environment. You MUST use Postgres for production.

---

## 📂 Project Structure

-   `src/app/page.tsx`: Main Controller (State Management)
-   `src/components/layout`: Layout components (Resizable Split Pane)
-   `src/components/viewer`: PDF/Image Rendering Logic
-   `src/components/analysis`: Chat & Issue List UI
-   `src/lib/validator.ts`: Business Logic & Validation Rules
-   `src/lib/db.ts`: Prisma Client Instance