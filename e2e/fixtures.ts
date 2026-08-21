import type { BrowserContext } from '@playwright/test';

/**
 * The app boots empty: no profile, no applications. That is correct product
 * behaviour — a first run should not open inside a stranger's job search — but
 * it means a spec that wants a populated workspace has to say so.
 *
 * Seeding through `addInitScript` keeps each spec's preconditions explicit and
 * local, instead of depending on whatever the app happens to ship as defaults.
 */

export const SEED_PROFILE = {
  name: 'Moayed Badawy',
  title: 'Senior Quality Assurance Lead & SDET Architect',
  location: 'Cairo, Egypt / Prepared for UK/EU Relocation',
  email: 'moayed@example.com',
  target_roles: ['Lead QA Engineer', 'SDET Architect', 'Principal Test Engineer'],
  core_competencies: ['Test Architecture', 'CI/CD Quality Gates', 'Performance Engineering'],
  tech_stack: ['Playwright', 'TypeScript', 'k6', 'CodeQL', 'cherenkov-qa'],
  experience: '9 years building automated quality systems for regulated fintech platforms.',
  learning_certs: [],
};

export const SEED_APPLICATIONS = [
  {
    id: 'seed-monzo',
    jobTitle: 'Lead QA Infrastructure Engineer',
    company: 'Monzo Bank',
    location: 'London, UK / Remote (UK Sponsorship)',
    salary: '£95k - £115k',
    column: 'Ready to Apply',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
    jobDescription: 'Own the automated test platform for dozens of microservice squads.',
    matchScore: 96,
  },
  {
    id: 'seed-revolut',
    jobTitle: 'Senior QA Lead - Core Banking',
    company: 'Revolut',
    location: 'London / Remote (EU & UK Visa)',
    salary: '£90k - £110k',
    column: 'Applied',
    createdAt: '2026-07-28',
    updatedAt: '2026-08-02',
    jobDescription: 'Lead quality for the core banking ledger.',
    matchScore: 94,
  },
  {
    id: 'seed-deliveroo',
    jobTitle: 'Staff SDET / QA Architect',
    company: 'Deliveroo',
    location: 'London, UK',
    salary: '£100k - £125k',
    column: 'Saved',
    createdAt: '2026-07-25',
    updatedAt: '2026-07-25',
    jobDescription: 'Define the testing strategy across consumer and rider platforms.',
    matchScore: 91,
  },
];

export interface SeedOptions {
  /** Skip the guided tour. On by default — it blocks almost every interaction. */
  tourCompleted?: boolean;
  profile?: unknown;
  applications?: unknown[];
}

/** Put a populated workspace in place before the first navigation. */
export async function seedWorkspace(context: BrowserContext, options: SeedOptions = {}) {
  const {
    tourCompleted = true,
    profile = SEED_PROFILE,
    applications = SEED_APPLICATIONS,
  } = options;

  await context.addInitScript(
    ([tour, prof, apps]) => {
      if (tour) localStorage.setItem('cherenkov_tour_completed', 'true');
      localStorage.setItem('cherenkov_master_profile', JSON.stringify(prof));
      localStorage.setItem('cherenkov_applications', JSON.stringify(apps));
    },
    [tourCompleted, profile, applications] as const
  );
}
