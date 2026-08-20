import { MasterProfile, ApplicationCard, LearningCert, CandidateArchetype, UserWorkspaceConfig } from '../types';

export interface ArchetypePreset {
  id: CandidateArchetype;
  label: string;
  badge: string;
  tagline: string;
  accentColor: string;
  recommendedTheme: string;
  profile: MasterProfile;
}

export const ARCHETYPE_PRESETS: Record<CandidateArchetype, ArchetypePreset> = {
  international_seeker: {
    id: 'international_seeker',
    label: 'International Visa Seeker',
    badge: 'Global Relocation',
    tagline: 'Prioritizes UK/EU sponsor matching, ATS compliance, and high-speed cloud synthesis.',
    accentColor: '#06b6d4',
    recommendedTheme: 'cyber',
    profile: {
      name: "Moayed Badawy",
      email: "moaid.elmoatasem.bellah@gmail.com",
      title: "Senior Quality Assurance Lead & SDET Architect",
      location: "Cairo, Egypt / Prepared for UK/EU Relocation",
      archetype: 'international_seeker',
      target_roles: ["Senior QA Lead", "Staff SDET", "QA Infrastructure Architect", "Test Automation Lead"],
      core_competencies: [
        "AI-driven test automation",
        "UK/EU Visa compliance",
        "Test infrastructure architecture",
        "Distributed performance testing",
        "Security static analysis"
      ],
      tech_stack: [
        "Playwright",
        "TypeScript",
        "k6",
        "CodeQL",
        "cherenkov-qa",
        "Docker",
        "GitHub Actions",
        "Kubernetes"
      ],
      experience: "Lead QA engineer with 8+ years experience architecting enterprise automated testing frameworks, integrating AI verification swarms, and orchestrating distributed CI/CD pipelines.",
      learning_certs: [
        {
          id: "cert-1",
          title: "Agentic AI in Quality Engineering & LLM Automation",
          provider: "xAPI / DeepLearning.AI",
          status: "Completed",
          dateCompleted: "2026-02-10",
          extracted_skills: ["AnythingLLM", "Qwen", "Autonomous Test Agents"],
          badge_color: "emerald"
        },
        {
          id: "cert-2",
          title: "Distributed Performance & Stress Testing at Scale",
          provider: "k6 Academy",
          status: "Completed",
          dateCompleted: "2026-01-18",
          extracted_skills: ["k6", "Grafana", "Chaos Engineering"],
          badge_color: "cyan"
        }
      ],
      workspaceConfig: {
        defaultTab: 'synthesizer',
        enabledTabs: ['synthesizer', 'kanban', 'hivemind', 'learning', 'marketplace', 'orchestrator'],
        enableVisaFiltering: true,
        enableGhostJobDetection: true,
        enableAutomatedSubmitter: true,
        activeMcpPackages: ['mcp-home-office-visa', 'mcp-ats-scraper']
      },
      preferences: {
        theme: 'cyber',
        archetype: 'international_seeker',
        localLlmEnabled: false,
        autoSyncLrs: true,
        location: 'Cairo, Egypt / Prepared for UK/EU Relocation',
        readiness: 'Immediate Relocation',
        target_roles: ['Senior QA Lead', 'Staff SDET'],
        sponsorship_regions: { UK: true, EU: true, GCC: true, US: false },
        learning_sync: { enabled: true, provider: 'xAPI' }
      }
    }
  },
  zero_trust_specialist: {
    id: 'zero_trust_specialist',
    label: 'Zero-Trust Enterprise Engineer',
    badge: 'Air-Gapped Privacy',
    tagline: 'Client-side AES-GCM PII encryption, local Qwen inference, zero cloud data egress.',
    accentColor: '#10b981',
    recommendedTheme: 'emerald',
    profile: {
      name: "Alexei Vance",
      email: "alexei.vance@proton.me",
      title: "Principal Security & Systems Engineer",
      location: "Frankfurt, Germany (Domestic / EU Only)",
      archetype: 'zero_trust_specialist',
      target_roles: ["Principal Security Engineer", "Zero-Trust Architect", "Backend Systems Lead"],
      core_competencies: [
        "Air-gapped LLM inference",
        "E2EE cryptographic vaults",
        "Static code vulnerability scanning",
        "SOC2/ISO27001 compliance",
        "Infrastructure as Code"
      ],
      tech_stack: [
        "Rust",
        "Go",
        "Qwen 2.5",
        "Ollama",
        "CodeQL",
        "eBPF",
        "Terraform",
        "Vault"
      ],
      experience: "Security architect specializing in zero-trust data protection, air-gapped machine learning deployments, and high-assurance distributed systems.",
      learning_certs: [
        {
          id: "cert-sec-1",
          title: "Offensive Security Certified Professional (OSCP)",
          provider: "OffSec",
          status: "Completed",
          dateCompleted: "2025-11-20",
          extracted_skills: ["Vulnerability Research", "Binary Exploitation", "Network Security"],
          badge_color: "emerald"
        }
      ],
      workspaceConfig: {
        defaultTab: 'synthesizer',
        enabledTabs: ['synthesizer', 'kanban', 'orchestrator', 'learning'],
        enableVisaFiltering: false,
        enableGhostJobDetection: true,
        enableAutomatedSubmitter: false,
        activeMcpPackages: ['mcp-local-qwen-engine', 'mcp-vault-encryption']
      },
      preferences: {
        theme: 'emerald',
        archetype: 'zero_trust_specialist',
        localLlmEnabled: true,
        autoSyncLrs: false,
        location: 'Frankfurt, Germany',
        readiness: 'Domestic Hybrid / Remote',
        target_roles: ['Principal Security Engineer', 'Zero-Trust Architect'],
        sponsorship_regions: { UK: false, EU: true, GCC: false, US: false },
        learning_sync: { enabled: false, provider: 'Local LRS' }
      }
    }
  },
  upskilling_switcher: {
    id: 'upskilling_switcher',
    label: 'Upskilling Career Switcher',
    badge: 'Fast-Track Growth',
    tagline: 'Dynamic skill-gap detection, living xAPI course triggers, and STAR mock interview practice.',
    accentColor: '#f59e0b',
    recommendedTheme: 'solar',
    profile: {
      name: "Jordan Lee",
      email: "jordan.lee.qa@gmail.com",
      title: "Junior QA Engineer & Test Automation Specialist",
      location: "Manchester, UK",
      archetype: 'upskilling_switcher',
      target_roles: ["Junior SDET", "QA Test Automation Engineer", "CI/CD Associate"],
      core_competencies: [
        "Playwright end-to-end automation",
        "API testing with Postman/REST",
        "Continuous Integration pipelines",
        "Behavior-Driven Development (BDD)",
        "Agile testing workflows"
      ],
      tech_stack: [
        "Playwright",
        "JavaScript",
        "TypeScript",
        "Jest",
        "Postman",
        "Git",
        "GitHub Actions"
      ],
      experience: "Passionate QA engineer transitioning into full-stack test automation with hands-on project experience in modern web testing and API verification.",
      learning_certs: [
        {
          id: "cert-up-1",
          title: "Modern Web Testing with Playwright & TypeScript",
          provider: "Coursera",
          status: "Completed",
          dateCompleted: "2026-01-05",
          extracted_skills: ["Playwright", "TypeScript", "Page Object Model"],
          badge_color: "amber"
        },
        {
          id: "cert-up-2",
          title: "Continuous Testing & CI/CD with GitHub Actions",
          provider: "Udemy / xAPI",
          status: "In Progress",
          extracted_skills: ["CI/CD", "Docker", "GitHub Actions"],
          badge_color: "cyan"
        }
      ],
      workspaceConfig: {
        defaultTab: 'learning',
        enabledTabs: ['learning', 'synthesizer', 'kanban', 'hivemind'],
        enableVisaFiltering: false,
        enableGhostJobDetection: true,
        enableAutomatedSubmitter: false,
        activeMcpPackages: ['mcp-xapi-listener', 'mcp-interview-coach']
      },
      preferences: {
        theme: 'solar',
        archetype: 'upskilling_switcher',
        localLlmEnabled: false,
        autoSyncLrs: true,
        location: 'Manchester, UK',
        readiness: 'Immediate Available',
        target_roles: ['Junior SDET', 'QA Test Automation Engineer'],
        sponsorship_regions: { UK: true, EU: false, GCC: false, US: false },
        learning_sync: { enabled: true, provider: 'Coursera / xAPI' }
      }
    }
  },
  staff_executive: {
    id: 'staff_executive',
    label: 'Staff & Executive Leader',
    badge: 'High-Impact Outreach',
    tagline: 'LinkedIn scout mapping, executive recruiter outreach, and company ghost job radar.',
    accentColor: '#8b5cf6',
    recommendedTheme: 'synthwave',
    profile: {
      name: "Marcus Sterling",
      email: "marcus.sterling@outlook.com",
      title: "Director of Quality Engineering & Developer Productivity",
      location: "London, UK / New York, US",
      archetype: 'staff_executive',
      target_roles: ["Director of Quality Engineering", "VP of Developer Productivity", "Head of Quality"],
      core_competencies: [
        "Engineering leadership & headcount planning",
        "Developer productivity metrics (DORA)",
        "Enterprise QA transformation",
        "Budget & vendor governance",
        "Executive stakeholder management"
      ],
      tech_stack: [
        "DORA Metrics",
        "Quality Gate Architecture",
        "Enterprise CI/CD",
        "Microservices Governance",
        "Cost Optimization"
      ],
      experience: "Executive engineering leader with 12+ years scaling QA organizations from 10 to 120+ engineers across tier-1 FinTech and enterprise SaaS companies.",
      learning_certs: [
        {
          id: "cert-exec-1",
          title: "Executive Engineering Leadership & Governance",
          provider: "MIT Sloan / xAPI",
          status: "Completed",
          dateCompleted: "2025-08-12",
          extracted_skills: ["Executive Strategy", "DORA Engineering", "Org Scaling"],
          badge_color: "violet"
        }
      ],
      workspaceConfig: {
        defaultTab: 'hivemind',
        enabledTabs: ['hivemind', 'synthesizer', 'kanban', 'marketplace'],
        enableVisaFiltering: false,
        enableGhostJobDetection: true,
        enableAutomatedSubmitter: false,
        activeMcpPackages: ['mcp-linkedin-scout', 'mcp-ats-health-radar']
      },
      preferences: {
        theme: 'synthwave',
        archetype: 'staff_executive',
        localLlmEnabled: false,
        autoSyncLrs: true,
        location: 'London, UK / New York, US',
        readiness: 'Executive Search',
        target_roles: ['Director of Quality Engineering', 'VP of Developer Productivity'],
        sponsorship_regions: { UK: true, EU: true, GCC: true, US: true },
        learning_sync: { enabled: true, provider: 'MIT / xAPI' }
      }
    }
  },
  automation_power_user: {
    id: 'automation_power_user',
    label: 'Autonomous Swarm Architect',
    badge: 'Multi-Agent DAG',
    tagline: 'High-throughput visual agent canvas, headless AST dispatches, and sub-50ms command palette.',
    accentColor: '#3b82f6',
    recommendedTheme: 'cyber',
    profile: {
      name: "Tariq Al-Mansoor",
      email: "tariq.almansoor@gmail.com",
      title: "Lead AI Automation & SDET Swarm Engineer",
      location: "Dubai, UAE / Remote",
      archetype: 'automation_power_user',
      target_roles: ["Lead AI Automation Engineer", "Staff SDET Swarm Architect", "Principal Test Infrastructure"],
      core_competencies: [
        "Autonomous multi-agent DAG pipelines",
        "LangGraph orchestration",
        "Model Context Protocol (MCP) servers",
        "Headless browser automation at scale",
        "Real-time telemetry streams"
      ],
      tech_stack: [
        "LangGraph",
        "MCP 2026",
        "Playwright",
        "TypeScript",
        "Gemini 3.7 Flash",
        "k6 Cloud",
        "Docker Swarm"
      ],
      experience: "Architecting autonomous test agents, headless ATS dispatchers, and distributed multi-agent workflows executing over 5,000 automated checks daily.",
      learning_certs: [
        {
          id: "cert-auto-1",
          title: "Multi-Agent System Architecture & MCP 2026",
          provider: "Anthropic & DeepLearning.AI",
          status: "Completed",
          dateCompleted: "2026-02-01",
          extracted_skills: ["LangGraph", "Stateless MCP", "Agentic Workflows"],
          badge_color: "cyan"
        }
      ],
      workspaceConfig: {
        defaultTab: 'orchestrator',
        enabledTabs: ['orchestrator', 'synthesizer', 'kanban', 'marketplace', 'hivemind', 'learning'],
        enableVisaFiltering: true,
        enableGhostJobDetection: true,
        enableAutomatedSubmitter: true,
        activeMcpPackages: ['mcp-ats-scraper', 'mcp-home-office-visa', 'mcp-aria-form-filler']
      },
      preferences: {
        theme: 'cyber',
        archetype: 'automation_power_user',
        localLlmEnabled: false,
        autoSyncLrs: true,
        location: 'Dubai, UAE / Remote',
        readiness: 'Global High-Volume',
        target_roles: ['Lead AI Automation Engineer', 'Staff SDET Swarm Architect'],
        sponsorship_regions: { UK: true, EU: true, GCC: true, US: true },
        learning_sync: { enabled: true, provider: 'Agentic LRS' }
      }
    }
  }
};

export const INITIAL_MASTER_PROFILE: MasterProfile = ARCHETYPE_PRESETS.international_seeker.profile;

export const SAMPLE_JOBS = [
  {
    title: "Lead QA Infrastructure Engineer",
    company: "Monzo Bank",
    location: "London, UK (Visa Sponsorship Available / Hybrid Remote)",
    salary: "£90,000 - £110,000 + Equity",
    url: "https://monzo.com/careers/lead-qa-infrastructure",
    brandColor: "#FF4F64",
    brandGradient: "from-[#FF4F64]/20 via-[#FF808F]/10 to-transparent",
    badgeBorder: "border-[#FF4F64]/30",
    textColor: "text-[#FF4F64]",
    description: `About Monzo:
We're building the best bank in the world. As a Lead QA Infrastructure Engineer, you will own our next-generation test automation platform, enabling dozens of microservice squads to ship safely multiple times per day.

Key Responsibilities:
- Architect enterprise-wide automated test frameworks using Playwright and TypeScript.
- Scale distributed load testing using k6 and integrate performance budgets into continuous deployment.
- Embed automated static security analysis (CodeQL / SonarQube) in our CI/CD pipelines.
- Explore AI-assisted test synthesis and autonomous verification agents.
- Mentor senior engineers and drive testing culture across engineering teams.

Requirements:
- Proven track record as a Senior or Lead QA Engineer in high-scale environments.
- Deep expertise in Playwright, TypeScript, and modern CI/CD orchestration (GitHub Actions / Buildkite).
- Experience with performance testing tools (k6, Locust) and security scanning.
- Knowledge of containerization (Docker, Kubernetes) and AWS cloud infrastructure.
- Monzo provides Tier 2 / Skilled Worker Visa Sponsorship and relocation support for qualified candidates.`
  },
  {
    title: "Senior QA Lead - Core Banking & Payments",
    company: "Revolut",
    location: "London, UK / Remote (EU & UK Visa Sponsorship)",
    salary: "£85,000 - £105,000 + Stock",
    url: "https://revolut.com/careers/senior-qa-lead",
    brandColor: "#0075EB",
    brandGradient: "from-[#0075EB]/20 via-[#00D2FF]/10 to-transparent",
    badgeBorder: "border-[#0075EB]/30",
    textColor: "text-[#00D2FF]",
    description: `Revolut is looking for an exceptional Senior Quality Assurance Lead to pioneer automated verification for our high-throughput transactional engines.

What you'll be doing:
- Establish end-to-end automated testing standards across web, mobile, and API backends.
- Lead the implementation of robust test frameworks with Playwright and distributed performance test suites with k6.
- Implement AI-driven testing workflows to accelerate test design, edge-case generation, and regression coverage.
- Collaborate with engineering directors to set quality metrics, defect budgets, and SLOs.
- Drive CodeQL static analysis and security gatekeeper checks across all repositories.

What you'll need:
- 6+ years of QA Automation and Lead experience with mission-critical systems.
- Mastery in Playwright, k6, CodeQL, and CI/CD pipelines.
- Hands-on background building custom QA automation tools or frameworks.
- Strong English communication skills and ability to lead distributed squads.
- Full Visa sponsorship (UK Skilled Worker / EU relocation) provided.`
  },
  {
    title: "Senior SDET / QA Architect",
    company: "Deliveroo",
    location: "London, UK / Remote (UK Sponsorship)",
    salary: "£80,000 - £100,000",
    url: "https://deliveroo.co.uk/careers/senior-sdet",
    brandColor: "#00CDBC",
    brandGradient: "from-[#00CDBC]/20 via-[#34D399]/10 to-transparent",
    badgeBorder: "border-[#00CDBC]/30",
    textColor: "text-[#00CDBC]",
    description: `Deliveroo is transforming food delivery logistics. We are seeking a Senior SDET / QA Architect to design resilient test infrastructures for our real-time order dispatch platform.

Key Requirements:
- Build scalable test automation suites using Playwright, k6, and Docker.
- Implement automated security scanning with CodeQL in CI/CD workflows.
- Investigate autonomous AI testing frameworks to automate regression pipelines.
- Experience with AWS, microservices, and GraphQL APIs.
- We support Visa Sponsorship for international talent.`
  },
  {
    title: "Lead Quality Engineer - Autonomous Systems",
    company: "Wise",
    location: "London, UK / Tallinn, Estonia (Visa & Relocation)",
    salary: "£95,000 - £115,000 + Equity",
    url: "https://wise.com/careers/lead-qe",
    brandColor: "#9FE870",
    brandGradient: "from-[#9FE870]/20 via-[#10B981]/10 to-transparent",
    badgeBorder: "border-[#9FE870]/30",
    textColor: "text-[#9FE870]",
    description: `Wise is on a mission to make money without borders. We are looking for a Lead Quality Engineer to pioneer AI testing suites, automated resilience verification with k6, and Playwright distributed pipelines.

Requirements:
- Deep experience leading quality automation for high-volume financial transfer microservices.
- Expert knowledge in Playwright, TypeScript, CodeQL, and distributed test orchestration.
- Interest in LLM-assisted test generation and self-healing test automation.
- Tier 2 / Skilled Worker Visa Sponsorship fully provided with comprehensive relocation package.`
  },
  {
    title: "Principal QA Verification Architect",
    company: "Arm",
    location: "Cambridge, UK / Hybrid (Full Sponsorship)",
    salary: "£100,000 - £125,000 + Benefits",
    url: "https://arm.com/careers/qa-architect",
    brandColor: "#0091BD",
    brandGradient: "from-[#0091BD]/20 via-[#38BDF8]/10 to-transparent",
    badgeBorder: "border-[#0091BD]/30",
    textColor: "text-[#38BDF8]",
    description: `Arm powers the world's most advanced compute platforms. Join our QA Verification Architecture team to define the automated testing and security validation frameworks across our software ecosystem.

Key Focus:
- Architect cross-platform test frameworks using TypeScript, Playwright, and containerized test runners.
- Build automated security vulnerability scanning with CodeQL.
- Integrate AI-based test generation tooling.
- UK Visa Sponsorship and premier relocation support provided.`
  }
];

export const INITIAL_APPLICATIONS: ApplicationCard[] = [
  {
    id: "app-1",
    jobTitle: "Lead QA Infrastructure Engineer",
    company: "Monzo Bank",
    location: "London, UK (UK Sponsorship)",
    salary: "£90k - £110k",
    url: "https://monzo.com/careers/lead-qa-infrastructure",
    column: "Ready to Apply",
    createdAt: "2026-08-14",
    updatedAt: "2026-08-15",
    jobDescription: SAMPLE_JOBS[0].description,
    matchScore: 96,
    contactEmail: "talent@monzo.com",
    notes: "Top choice. Tailored email drafted emphasizing Playwright infrastructure and cherenkov-qa agentic testing.",
    synthesis: {
      visa_sponsorship_likely: true,
      isLicensedSponsor: true,
      matchedSponsor: "Monzo",
      tailored_summary: "Senior Quality Assurance Lead with deep expertise architecting enterprise Playwright infrastructures, distributed k6 performance suites, and the proprietary cherenkov-qa testing framework. Proven track record embedding CodeQL static security analysis directly into CI/CD deployment gates to slash regression cycles by 65%. Actively seeking UK Skilled Worker Visa Sponsorship with immediate relocation readiness.",
      identified_skill_gaps: ["Kubernetes", "Buildkite"],
      upskilling_recommendation: "Kubernetes for QA Engineers (Coursera) & Buildkite CI Pipeline Orchestration",
      cold_email: `Subject: Lead QA Infrastructure Engineer - Moayed Badawy (Senior QA Lead)\n\nDear Monzo Talent Acquisition Team,\n\nI noticed Monzo's opening for the Lead QA Infrastructure Engineer role and wanted to reach out directly. With over 7 years architecting resilient test automation platforms, I designed the custom cherenkov-qa framework, scaled distributed k6 performance testing, and integrated CodeQL security gates across continuous deployment pipelines.\n\nMy background in AI-driven testing with local LLMs (Qwen, AnythingLLM) and enterprise Playwright test frameworks aligns directly with Monzo's mission to enable high-frequency, zero-defect shipping. As a candidate seeking UK Skilled Worker sponsorship, I am fully prepared for immediate relocation and rapid onboarding.\n\nI would be delighted to discuss how my test infrastructure background can accelerate Monzo's QA velocity.\n\nBest regards,\nMoayed Badawy\nSenior Quality Assurance Lead\nmoaid.elmoatasem.bellah@gmail.com`,
      ats_answers: [
        {
          question: "How do you architect enterprise test infrastructure for microservice squads?",
          answer: "I design modular, headless Playwright frameworks with isolated test fixtures and containerized parallel execution, paired with k6 distributed load testing that validates service boundaries before production release."
        },
        {
          question: "What is your approach to AI-driven test automation and QA agents?",
          answer: "Through the cherenkov-qa framework, I connect local LLMs (Qwen, AnythingLLM) to parse OpenAPI specs and automatically synthesize boundary test cases, drastically accelerating edge-case verification."
        },
        {
          question: "What is your current visa status and relocation timeline for the UK?",
          answer: "I am based in Cairo, Egypt, fully eligible and prepared for UK Skilled Worker Visa sponsorship, with an immediate timeline for visa processing and relocation."
        }
      ]
    }
  },
  {
    id: "app-2",
    jobTitle: "Senior QA Lead - Core Banking",
    company: "Revolut",
    location: "London / Remote (EU & UK Visa)",
    salary: "£85k - £105k",
    url: "https://revolut.com/careers/senior-qa-lead",
    column: "Applied",
    createdAt: "2026-08-12",
    updatedAt: "2026-08-13",
    jobDescription: SAMPLE_JOBS[1].description,
    matchScore: 94,
    contactEmail: "recruiting@revolut.com",
    notes: "Applied via referral link on Aug 13. Follow-up email scheduled for next Tuesday.",
    synthesis: {
      visa_sponsorship_likely: true,
      isLicensedSponsor: true,
      matchedSponsor: "Revolut",
      tailored_summary: "Senior QA Lead specializing in mission-critical transactional test automation, high-concurrency k6 load engineering, and CodeQL static security analysis. Built the cherenkov-qa testing framework and scaled Playwright CI/CD test gates to achieve 99.4% stability in continuous release cycles. Ready for UK/EU relocation under Skilled Worker visa sponsorship.",
      identified_skill_gaps: ["Financial API Protocols (ISO 20022)"],
      upskilling_recommendation: "Modern Banking Protocols & Real-time Settlement Architecture (Udemy)",
      cold_email: `Subject: Senior QA Lead Candidate - Moayed Badawy\n\nDear Revolut Hiring Team,\n\nI am writing to express my strong enthusiasm for the Senior QA Lead opening in Core Banking. Having built automated testing infrastructures for high-throughput APIs and engineered AI-augmented test suites (cherenkov-qa), I specialize in bulletproofing critical payment workflows against functional and performance regressions.\n\nI look forward to discussing how my experience with Playwright, k6, and CodeQL can strengthen Revolut's continuous delivery pipeline.\n\nBest regards,\nMoayed Badawy\nmoaid.elmoatasem.bellah@gmail.com`,
      ats_answers: [
        {
          question: "How do you ensure zero-defect releases in mission-critical financial systems?",
          answer: "By enforcing a multi-layered quality gate: CodeQL static security checks, comprehensive Playwright end-to-end API and UI tests, and automated k6 performance regression thresholds in every pull request."
        }
      ]
    }
  },
  {
    id: "app-3",
    jobTitle: "Staff SDET / QA Architect",
    company: "Deliveroo",
    location: "London, UK",
    salary: "£80k - £100k",
    column: "Saved",
    createdAt: "2026-08-10",
    updatedAt: "2026-08-10",
    jobDescription: SAMPLE_JOBS[2].description,
    matchScore: 91,
    contactEmail: "careers@deliveroo.co.uk",
    notes: "Saved for upcoming batch synthesis."
  }
];

export const INITIAL_MCP_PACKAGES: import('../types').McpPackage[] = [
  {
    id: 'mcp-playwright',
    name: 'Playwright Accessibility Tree MCP',
    version: '2026.2.4',
    author: 'Microsoft / Official MCP',
    category: 'ats',
    description: 'Bypasses fragile CSS selectors by translating live web pages into semantic ARIA Accessibility Trees for reliable form filling.',
    tags: ['Official', 'Accessibility', 'ATS Automation', 'Stdio'],
    installed: true,
    active: true,
    downloads: 148200,
    rating: 4.95,
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/playwright',
    transport: 'stdio',
    commandExample: 'npx -y @playwright/mcp@latest',
    capabilities: ['navigate', 'click_aria', 'fill_form', 'extract_accessibility_tree'],
    latencyMs: 142
  },
  {
    id: 'mcp-greenhouse',
    name: 'Greenhouse Public API Connector',
    version: '1.4.0',
    author: 'Cherenkov Nexus Core',
    category: 'ats',
    description: 'Bypasses browser rendering by querying Greenhouse JSON boards endpoints directly to fetch strict schema questions and payload requirements.',
    tags: ['Direct API', 'Zero-Scrape', 'Greenhouse', 'Fast'],
    installed: true,
    active: true,
    downloads: 42100,
    rating: 4.98,
    githubUrl: 'https://github.com/cherenkov-nexus/mcp-greenhouse-connector',
    transport: 'http',
    commandExample: 'npx cherenkov-mcp-greenhouse',
    capabilities: ['fetch_job_json', 'parse_questions_schema', 'direct_post_payload'],
    latencyMs: 48
  },
  {
    id: 'mcp-uk-visa',
    name: 'UK Home Office Sponsor SQLite MCP',
    version: '2.1.0',
    author: 'Cherenkov Nexus Data',
    category: 'visa',
    description: 'Deterministic SQLite fuzzy-matcher running against 114,800+ official UK Home Office licensed sponsor registers with daily node-cron updates.',
    tags: ['UK Visa', 'SQLite', 'Fuse.js', 'Deterministic'],
    installed: true,
    active: true,
    downloads: 89400,
    rating: 4.99,
    githubUrl: 'https://github.com/cherenkov-nexus/mcp-uk-visa-validator',
    transport: 'stdio',
    commandExample: 'npx cherenkov-mcp-uk-visa',
    capabilities: ['verify_uk_sponsorship', 'get_sponsor_tier', 'query_historical_approvals'],
    latencyMs: 12
  },
  {
    id: 'mcp-germany-bluecard',
    name: 'Germany EU Blue Card & Chancenkarte MCP',
    version: '1.1.2',
    author: 'EU Tech Alliance',
    category: 'visa',
    description: 'Calculates German Blue Card eligibility thresholds (€45,300 IT shortage list) and checks German company sponsorship willingness.',
    tags: ['Germany', 'EU Blue Card', 'Chancenkarte', 'Community'],
    installed: false,
    active: false,
    downloads: 24800,
    rating: 4.88,
    githubUrl: 'https://github.com/eutech/mcp-germany-bluecard',
    transport: 'stdio',
    commandExample: 'npx @eutech/mcp-germany-bluecard',
    capabilities: ['verify_salary_threshold', 'check_anabin_recognition', 'analyze_german_reqs'],
    latencyMs: 35
  },
  {
    id: 'mcp-us-h1b',
    name: 'US H-1B & O-1 Cap Sponsor Database',
    version: '2.0.1',
    author: 'US Immigrate Open Tech',
    category: 'visa',
    description: 'Historical USCIS disclosure query engine indexing certified LCA filings, PERM labor certs, and prevailing wage statistics.',
    tags: ['USCIS', 'H-1B', 'LCA Data', 'PERM'],
    installed: false,
    active: false,
    downloads: 38700,
    rating: 4.82,
    githubUrl: 'https://github.com/us-immigrate/mcp-h1b-database',
    transport: 'sse',
    commandExample: 'npx @us-immigrate/mcp-h1b-database',
    capabilities: ['query_lca_filings', 'calculate_prevailing_wage', 'check_o1_criteria'],
    latencyMs: 84
  },
  {
    id: 'mcp-workday-aria',
    name: 'Workday Enterprise ADA Form Solver',
    version: '1.8.4',
    author: 'Open ATS Taskforce',
    category: 'ats',
    description: 'Specialized headless handler tailored for complex multi-step Workday authentication flows and auto-mapped candidate resume fields.',
    tags: ['Workday', 'Multi-step', 'Cloudflare Safe'],
    installed: false,
    active: false,
    downloads: 67200,
    rating: 4.75,
    githubUrl: 'https://github.com/open-ats/mcp-workday-solver',
    transport: 'stdio',
    commandExample: 'npx @open-ats/mcp-workday-solver',
    capabilities: ['workday_session_init', 'fill_custom_questionnaires', 'upload_resume_pdf'],
    latencyMs: 210
  },
  {
    id: 'pack-senior-qa-lead',
    name: 'Senior QA Lead Relocation Strategy Pack',
    version: '3.0.0',
    author: 'Moayed Badawy (Cherenkov)',
    category: 'strategy',
    description: 'Pre-tuned testing swarm parameters optimized for Senior QA / Lead SDET roles. Emphasizes cherenkov-qa, Playwright, k6 load testing, and CodeQL security.',
    tags: ['Featured', 'QA Lead', 'SDET', 'Relocation Strategy'],
    installed: true,
    active: true,
    downloads: 51200,
    rating: 5.0,
    transport: 'stdio',
    commandExample: 'npx cherenkov-strategy-pack qa-lead-eu',
    capabilities: ['qa_architecture_scoring', 'star_interview_framing', 'codeql_highlighting']
  },
  {
    id: 'mcp-xapi-lrs',
    name: 'xAPI Course Sync LRS MCP',
    version: '1.2.0',
    author: 'Cherenkov Nexus Core',
    category: 'tool',
    description: 'Exposes webhook endpoints to ingest Experience API (xAPI) statements from Coursera, Udemy, and GitHub, continuously auto-updating master profiles.',
    tags: ['xAPI', 'LRS', 'Course Sync', 'Webhooks'],
    installed: true,
    active: true,
    downloads: 19500,
    rating: 4.92,
    transport: 'http',
    commandExample: 'npx cherenkov-mcp-xapi',
    capabilities: ['receive_xapi_statement', 'extract_syllabus_skills', 'sync_master_profile'],
    latencyMs: 18
  }
];

export const INITIAL_AGENT_NODES: import('../types').AgentNode[] = [
  {
    id: 'node-scout',
    type: 'scout',
    title: '1. Recruiter & ATS Scout',
    subtitle: 'Playwright MCP / Greenhouse API',
    x: 40,
    y: 120,
    status: 'idle',
    config: {
      usePlaywrightAria: true,
      parseLinkedInRecruiter: true,
      autoExtractSalary: true
    },
    lastOutput: 'Parsed 3 responsibilities & 4 tech stack requirements.'
  },
  {
    id: 'node-visa',
    type: 'visa-validator',
    title: '2. UK Sponsor Validator',
    subtitle: 'SQLite UK Home Office Register',
    x: 280,
    y: 120,
    status: 'idle',
    config: {
      strictDeterministicCheck: true,
      minFuzzyConfidence: 0.85
    },
    lastOutput: 'Matched Monzo Bank -> License Verified (A-rated).'
  },
  {
    id: 'node-synth',
    type: 'synthesizer',
    title: '3. Ground Truth Synthesizer',
    subtitle: 'Zero-Hallucination Anti-Slop Engine',
    x: 520,
    y: 120,
    status: 'idle',
    config: {
      enforceGroundTruth: true,
      includeColdEmail: true,
      generateAtsAnswers: true
    },
    lastOutput: 'Tailored summary, cover email, and 4 ATS answers ready.'
  },
  {
    id: 'node-approval',
    type: 'approval',
    title: '4. Human-in-the-Loop Pause',
    subtitle: 'Manual Quality Review Gate',
    x: 760,
    y: 120,
    status: 'idle',
    config: {
      requireExplicitApproval: true,
      notifyOnReady: true
    },
    lastOutput: 'Awaiting candidate review.'
  },
  {
    id: 'node-submitter',
    type: 'ats-submitter',
    title: '5. Headless ATS Dispatcher',
    subtitle: 'Direct POST / Accessibility Fill',
    x: 1000,
    y: 120,
    status: 'idle',
    config: {
      dryRunFirst: true,
      saveConfirmationProof: true
    },
    lastOutput: 'Ready for authorized payload transmission.'
  }
];

export const INITIAL_AGENT_EDGES: import('../types').AgentEdge[] = [
  { id: 'e1-2', fromNodeId: 'node-scout', toNodeId: 'node-visa', label: 'JD & Company Name', active: true },
  { id: 'e2-3', fromNodeId: 'node-visa', toNodeId: 'node-synth', label: 'Sponsorship Status', active: true },
  { id: 'e3-4', fromNodeId: 'node-synth', toNodeId: 'node-approval', label: 'Synthesized Dossier', active: true },
  { id: 'e4-5', fromNodeId: 'node-approval', toNodeId: 'node-submitter', label: 'Approved Payload', active: true }
];

export const INITIAL_GHOST_JOBS: import('../types').GhostJobSignal[] = [
  {
    id: 'ghost-1',
    company: 'Meta FinTech Labs',
    role: 'Lead SDET - Blockchain Test Automation',
    applicantsReported: 840,
    interviewsReported: 1,
    ghostScore: 92,
    avgDaysOpen: 142,
    atsUsed: 'Workday',
    status: 'flagged',
    lastActivity: '2 hours ago'
  },
  {
    id: 'ghost-2',
    company: 'Monzo Bank',
    role: 'Lead QA Infrastructure Engineer',
    applicantsReported: 128,
    interviewsReported: 24,
    ghostScore: 8,
    avgDaysOpen: 12,
    atsUsed: 'Greenhouse API',
    status: 'verified_hiring',
    lastActivity: '15 mins ago'
  },
  {
    id: 'ghost-3',
    company: 'Revolut',
    role: 'Senior QA Lead - Core Banking',
    applicantsReported: 215,
    interviewsReported: 38,
    ghostScore: 12,
    avgDaysOpen: 9,
    atsUsed: 'Lever',
    status: 'verified_hiring',
    lastActivity: '34 mins ago'
  },
  {
    id: 'ghost-4',
    company: 'Global Legacy Systems Ltd',
    role: 'Principal QA Architect (Evergreen)',
    applicantsReported: 1420,
    interviewsReported: 3,
    ghostScore: 88,
    avgDaysOpen: 320,
    atsUsed: 'Taleo',
    status: 'flagged',
    lastActivity: '1 day ago'
  }
];

export const INITIAL_VISA_HEATMAP: import('../types').VisaHeatmapItem[] = [
  {
    id: 'visa-1',
    company: 'Monzo Bank',
    industry: 'FinTech / Challenger Banking',
    location: 'London, UK',
    recentApprovalsCount: 42,
    avgRelocationDays: 24,
    verifiedSponsor: true,
    tierRating: 'A-rated',
    targetRoles: ['Lead QA', 'Staff Backend', 'Site Reliability']
  },
  {
    id: 'visa-2',
    company: 'Revolut',
    industry: 'Global Financial App',
    location: 'London, UK & EU Remote',
    recentApprovalsCount: 78,
    avgRelocationDays: 18,
    verifiedSponsor: true,
    tierRating: 'Premium',
    targetRoles: ['Senior QA Lead', 'SDET II', 'Security Engineer']
  },
  {
    id: 'visa-3',
    company: 'Spotify',
    industry: 'Audio Streaming / Media',
    location: 'Stockholm, Sweden & London',
    recentApprovalsCount: 35,
    avgRelocationDays: 28,
    verifiedSponsor: true,
    tierRating: 'A-rated',
    targetRoles: ['Test Automation Lead', 'Data QA', 'Infra Engineer']
  },
  {
    id: 'visa-4',
    company: 'Deliveroo',
    industry: 'Logistics / On-demand Food Delivery',
    location: 'London, UK',
    recentApprovalsCount: 22,
    avgRelocationDays: 31,
    verifiedSponsor: true,
    tierRating: 'A-rated',
    targetRoles: ['Staff SDET', 'QA Infrastructure', 'Engineering Lead']
  }
];

export const INITIAL_ATS_HEALTH: import('../types').AtsHealthStatus[] = [
  {
    id: 'ats-gh',
    atsName: 'Greenhouse Boards API',
    ariaTreeHealth: 100,
    cloudflareBypass: 'operational',
    lastTested: '1 min ago',
    avgLatencyMs: 48
  },
  {
    id: 'ats-lever',
    atsName: 'Lever Postings API',
    ariaTreeHealth: 99.8,
    cloudflareBypass: 'operational',
    lastTested: '3 mins ago',
    avgLatencyMs: 62
  },
  {
    id: 'ats-pw-workday',
    atsName: 'Workday ARIA Accessibility Tree',
    ariaTreeHealth: 96.4,
    cloudflareBypass: 'operational',
    lastTested: '7 mins ago',
    avgLatencyMs: 240
  },
  {
    id: 'ats-ashby',
    atsName: 'Ashby Direct API',
    ariaTreeHealth: 100,
    cloudflareBypass: 'operational',
    lastTested: '4 mins ago',
    avgLatencyMs: 52
  }
];

export const INITIAL_VERIFIABLE_BADGES: import('../types').VerifiableBadge[] = [
  {
    id: 'badge-cherenkov',
    name: 'cherenkov-qa Architecture Authority',
    issuer: 'Cherenkov Nexus Protocol',
    issueDate: '2026-02-14',
    cryptoSignature: 'ed25519:8f9a2b7c4d1e0f3a5b6c7d8e9f0a1b2c3d4e5f6',
    verified: true,
    iconType: 'codeql'
  },
  {
    id: 'badge-playwright',
    name: 'Playwright & k6 Performance Champion',
    issuer: 'Decentralized QA Consortium',
    issueDate: '2026-01-20',
    cryptoSignature: 'ed25519:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
    verified: true,
    iconType: 'github'
  },
  {
    id: 'badge-codeql',
    name: 'CodeQL Threat Modeling Specialist',
    issuer: 'GitHub Security Lab',
    issueDate: '2025-11-12',
    cryptoSignature: 'ed25519:9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0',
    verified: true,
    iconType: 'codeql'
  },
  {
    id: 'badge-xapi',
    name: 'Autonomous QA Certification',
    issuer: 'DeepLearning.AI xAPI LRS',
    issueDate: '2026-02-10',
    cryptoSignature: 'ed25519:7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8',
    verified: true,
    iconType: 'coursera'
  }
];

export const INITIAL_ROUTING_CONFIG: import('../types').RoutingConfig = {
  mode: 'hybrid',
  cloudProvider: 'google_genai',
  cloudModel: 'gemini-3.7-flash',
  localEndpoint: 'http://localhost:11434/v1',
  localModel: 'qwen2.5-coder:14b',
  piiProtectionEnabled: true,
  e2eeVaultLocked: false,
  vaultKeyHash: 'sha256:4a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d'
};
