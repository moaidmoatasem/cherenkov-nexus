export type CandidateArchetype =
  | 'international_seeker'
  | 'zero_trust_specialist'
  | 'upskilling_switcher'
  | 'staff_executive'
  | 'automation_power_user';

export interface UserWorkspaceConfig {
  defaultTab: TabId;
  enabledTabs: TabId[];
  enableVisaFiltering: boolean;
  enableGhostJobDetection: boolean;
  enableAutomatedSubmitter: boolean;
  activeMcpPackages: string[];
}

export interface MasterProfile {
  name: string;
  title: string;
  location: string;
  /**
   * Contact address used to sign generated outreach and exports. Optional so an
   * imported profile without one is handled explicitly rather than silently
   * inheriting somebody else's address.
   */
  email?: string;
  archetype?: CandidateArchetype;
  workspaceConfig?: UserWorkspaceConfig;
  target_roles: string[];
  core_competencies: string[];
  tech_stack: string[];
  experience: string;
  learning_certs: LearningCert[];
  preferences?: MasterProfilePreferences;
}

export interface LearningCert {
  id: string;
  title: string;
  provider: string; // e.g. "Coursera", "Udemy", "xAPI", "AWS", "GitHub"
  status: 'In Progress' | 'Completed';
  dateCompleted?: string;
  extracted_skills: string[];
  credential_url?: string;
  badge_color?: string;
}

export interface ATSAnswer {
  question: string;
  answer: string;
}

export interface SynthesizedResult {
  visa_sponsorship_likely: boolean;
  tailored_summary: string;
  identified_skill_gaps: string[];
  upskilling_recommendation: string;
  cold_email: string;
  ats_answers: ATSAnswer[];
  isLicensedSponsor?: boolean;
  matchedSponsor?: string;
  extractedRequirements?: string[];
  /** Which engine produced this result, e.g. "Google Gemini 3.7 Flash". */
  inferenceEngine?: string;
  /** True when no model ran and the content is a profile-derived scaffold. */
  isDeterministicFallback?: boolean;
  /** Why the fallback was used, shown to the user verbatim. */
  fallbackReason?: string;
  /** Where the sponsor verdict came from. */
  sponsorSource?: 'register' | 'offline-list' | 'none';
  /** False when the Register of Licensed Sponsors could not be consulted. */
  registerAvailable?: boolean;
  /** The posting advertises sponsorship — the employer's claim, not a check. */
  postingClaimsSponsorship?: boolean;
}

export type KanbanColumn = 'Saved' | 'Upskilling' | 'Ready to Apply' | 'Applied' | 'Interviewing';

export interface ApplicationCard {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  salary?: string;
  url?: string;
  column: KanbanColumn;
  createdAt: string;
  updatedAt: string;
  jobDescription: string;
  synthesis?: SynthesizedResult;
  notes?: string;
  matchScore?: number;
  contactEmail?: string;
  /**
   * Set on rows loaded through "Load sample data". Demo records are fine; not
   * being able to tell them from your own applications is not.
   */
  isSample?: boolean;
}

export type AppTheme =
  | 'cyber'
  | 'synthwave'
  | 'emerald'
  | 'solar'
  | 'slate'
  | 'light-executive'
  | 'light-frost'
  | 'light-ceramic';

export type TabId = 'synthesizer' | 'kanban' | 'learning' | 'marketplace' | 'orchestrator' | 'hivemind' | 'oracle';

export interface StageTransition {
  id: string;
  fromStage: KanbanColumn;
  toStage: KanbanColumn;
  timestamp: string;
  daysInStage: number;
}

export interface LinkedInPost {
  id: string;
  title: string;
  snippet: string;
  date: string;
  topic: string;
  likes: number;
}

export interface LinkedInScoutResult {
  recruiterName: string;
  recruiterTitle: string;
  company: string;
  location: string;
  profileUrl: string;
  technicalFocus: string[];
  recentPosts: LinkedInPost[];
  personalizedOutreach: {
    subject: string;
    body: string;
    hookReason: string;
  };
  recruiter_profile_status?: 'live' | 'simulated';
  live?: boolean;
  scoutNotes?: string;
}

export interface InterviewQuestionItem {
  id: string;
  question: string;
  techTopic: string;
  difficulty: 'Mid' | 'Senior' | 'Staff/Lead';
  expectedStarPoints: string[];
  idealAnswer: string;
  userAnswer?: string;
  feedback?: {
    /** Present only when an engine actually assessed the answer. */
    score?: number; // 1-100
    technicalAccuracy?: string;
    starStructure?: string;
    improvements?: string;
    /** False when no assessment was made; `reason` says why. */
    scored?: boolean;
    reason?: string;
    expectedPoints?: string[];
    isDeterministicFallback?: boolean;
    fallbackReason?: string;
    inferenceEngine?: string;
  };
}

export interface TelemetryMetrics {
  scraperSuccessRate: number;
  avgLatencyMs: number;
  sponsorRegisterDate: string;
  totalIndexedSponsors: number;
  astValidationScore: number;
  geminiModel: string;
  localFallbackStatus: string;
}

// MCP Marketplace & Extensible Registry Types
export type McpCategory = 'visa' | 'ats' | 'strategy' | 'tool';

export interface McpPackage {
  id: string;
  name: string;
  version: string;
  author: string;
  category: McpCategory;
  description: string;
  tags: string[];
  installed: boolean;
  active: boolean;
  githubUrl?: string;
  transport: 'stdio' | 'sse' | 'http';
  commandExample: string;
  capabilities: string[];
  latencyMs?: number;
}

// Visual Multi-Agent Orchestrator Types
export type AgentNodeType = 'scout' | 'visa-validator' | 'synthesizer' | 'approval' | 'ats-submitter' | 'lrs-sync';

export interface AgentNode {
  id: string;
  type: AgentNodeType;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  status: 'idle' | 'running' | 'success' | 'paused_approval' | 'failed';
  config: Record<string, any>;
  lastOutput?: string;
}

export interface AgentEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  active?: boolean;
}

// Community Hive-Mind & Telemetry Types
export interface GhostJobSignal {
  id: string;
  company: string;
  role: string;
  applicantsReported: number;
  interviewsReported: number;
  ghostScore: number; // 0-100 (high = likely ghost job)
  avgDaysOpen: number;
  atsUsed: string;
  status: 'active' | 'flagged' | 'verified_hiring';
  lastActivity: string;
}

export interface VisaHeatmapItem {
  id: string;
  company: string;
  industry: string;
  location: string;
  recentApprovalsCount: number;
  avgRelocationDays: number;
  verifiedSponsor: boolean;
  tierRating: 'A-rated' | 'Premium' | 'Standard';
  targetRoles: string[];
}

export interface AtsHealthStatus {
  id: string;
  atsName: string;
  ariaTreeHealth: number; // 0-100%
  /**
   * How the connector last behaved. The app queries published board APIs; it
   * does not circumvent anyone's bot protection, which is what the previous
   * name for this field claimed.
   */
  fetchStatus: 'operational' | 'degraded' | 'patch_pending';
  lastTested: string;
  avgLatencyMs: number;
}

// Zero-Trust Routing & Portable Identity
export interface RoutingConfig {
  mode: 'hybrid' | 'cloud_only' | 'local_only';
  cloudProvider: 'google_genai';
  cloudModel: string;
  localEndpoint: string;
  localModel: string;
  piiProtectionEnabled: boolean;
  e2eeVaultLocked: boolean;
  vaultKeyHash?: string;
}

export interface VerifiableBadge {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  cryptoSignature: string;
  verified: boolean;
  iconType: 'github' | 'leetcode' | 'coursera' | 'codeql' | 'aws';
}


export interface MasterProfilePreferences {
  theme?: string;
  archetype?: CandidateArchetype;
  localLlmEnabled?: boolean;
  autoSyncLrs?: boolean;
  location: string;
  readiness: string;
  target_roles: string[];
  sponsorship_regions: {
    UK: boolean;
    EU: boolean;
    GCC: boolean;
    US: boolean;
  };
  learning_sync: {
    enabled: boolean;
    provider: string;
  };
  workspaceConfig?: UserWorkspaceConfig;
}
