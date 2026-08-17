# Contributing

Welcome! We appreciate your interest in contributing to this project. Our goal is to make the onboarding process as frictionless and user-centric as possible.

## Quick Start

To get your local development environment set up quickly, follow these steps:

1. **Install Dependencies:**
   ```bash
   npm install
   ```
   *Note: Our `package.json` includes a `postinstall` script that automatically downloads the required Playwright browser binaries, so they are ready out-of-the-box.*

2. **Manual Playwright Setup (Fallback):**
   If you ever need to manually install or update the Playwright Chromium browser for the End-to-End (E2E) test suite, run the following command:
   ```bash
   npx playwright install chromium
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   This boots up the application on port 3000.

4. **Run the Test Suite:**
   Verify your environment is correctly configured by executing the automated E2E tests:
   ```bash
   npm run test
   ```

## Development Workflow

1. Create a feature branch for your work.
2. Ensure all tests pass (`npm run test`) before pushing.
3. Open a Pull Request with a clear description of the problem being solved.
