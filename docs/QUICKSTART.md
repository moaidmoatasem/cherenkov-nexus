# 🚀 Developer Quickstart & Runnable Product Guide

## 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Git**
- **Google Gemini API Key** (optional for local WebLLM mode, required for cloud synthesis)

---

## 2. Fast Setup (PowerShell / Windows)

> [!TIP]
> Always use semicolon `;` for command chaining in PowerShell instead of `&&`.

### Step 1: Clone Repository & Install Dependencies
```powershell
git clone https://github.com/moaidmoatasem/cherenkov-nexus.git
cd cherenkov-nexus
npm install
```

*Note: The `postinstall` script automatically downloads the necessary Playwright Chromium browser binaries.*

### Step 2: Configure Environment Variables
Create your local `.env` configuration:
```powershell
cp .env.example .env
```
Open `.env` and configure your keys:
```env
PORT=3000
GEMINI_API_KEY="your-google-gemini-api-key"
TURSO_DATABASE_URL=""
TURSO_AUTH_TOKEN=""
LOCAL_LLM_URL="http://localhost:11434/v1"
```

### Step 3: Seed the Sponsor Database
Initialize the embedded SQLite database (`nexus.db`) with pre-indexed UK Home Office and EU visa sponsors:
```powershell
npx tsx seed-database.ts
```

### Step 4: Boot the Application Hub
```powershell
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 3. Running via Standalone Terminal CLI

You can execute the entire extraction, visa validation, and synthesis pipeline directly in your terminal:

```powershell
# Run with Cloud Gemini Engine
npx tsx cherenkov.ts --url "https://careers.google.com/jobs/results/12345" --mode cloud

# Run in Zero-Trust Local Mode
npx tsx cherenkov.ts --url "https://monzo.com/careers/lead-qa-engineer" --mode local --out result.json
```

---

## 4. Verification & Testing Commands

Execute the test suites to verify that your environment is fully operational:

```powershell
# Run all Playwright E2E tests
npm run test

# Run the comprehensive system integration suite
npx playwright test e2e/comprehensive-system.spec.ts

# Run the test runner in visual UI mode
npx playwright test --ui
```
