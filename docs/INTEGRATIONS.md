# External Integrations

## 1. UK Home Office Visa Sponsorship Dataset
Instead of AI hallucination, the backend verifies sponsorship deterministically against the official UK Register of Licensed Sponsors. 

* **Data Ingestion:** A `node-cron` job runs daily at 02:00 UTC, downloading the official Home Office CSV file.
* **Schema Mapping:** The integration specifically targets companies listed under the `Worker Licence` type, prioritizing the `Skilled Worker` route. It extracts the `Organisation Name`, `Town/City`, and `Type & Licence Rating`. A-rated sponsors are prioritized.
* **Fuzzy Matching:** Because job postings use trading names, the backend uses `Fuse.js` with a threshold of `0.3` against the `Organisation Name` field.

## 2. Learning Platform Synchronization (xAPI)
The Node.js backend exposes a secure webhook endpoint (`/api/webhooks/xapi`) acting as a lightweight Learning Record Store (LRS).
* **Payload Structure:** Listens for standard JSON payloads containing `Actor -> Verb -> Object`. 
* **Trigger Logic:** Upon receiving a `"verb": {"display": {"en-US": "completed"}}` payload, a Firebase Cloud Function fires, using `@google/genai` to parse the course syllabus and extract the core tech stack tools (e.g., "CodeQL"), appending them to the `masterProfile.learning_certs` array.

## 3. Playwright Stealth Scraper (ATS Bypassing)
To extract data from heavily fortified Single Page Applications (SPAs) like Workday or Lever:
* **Configuration:** Utilizes `playwright-extra` coupled with `puppeteer-extra-plugin-stealth` to strip the `navigator.webdriver` flag.
* **Semantic Targets:** Avoids brittle CSS classes. Relies on the accessibility tree (e.g., `page.getByRole('heading', { name: 'Qualifications' })`).

## 4. Mailto URI Protocol
For direct outreach, the React client compiles AI-generated text into a URL-encoded `mailto:` string. This bypasses SMTP/OAuth overhead, instantly launching the user's native email client with the Hiring Manager's address, the tailored subject line, and the generated pitch body ready to send.
