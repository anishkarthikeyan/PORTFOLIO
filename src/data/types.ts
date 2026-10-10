/**
 * Content model for ANISH.EXE.
 *
 * Every record that is not a confirmed personal fact carries a `status`:
 *   - "verified": real, checked information. Rendered without a label.
 *   - "draft":    real information that is still being written/checked.
 *   - "sample":   illustrative placeholder content. Always rendered with a
 *                 visible SAMPLE label and never presented as fact.
 *
 * A `null` value for any metric, link, or count means "not provided yet".
 * The UI renders nulls as an explicit REPLACE ME placeholder (metrics) or
 * omits them entirely (public links).
 */

export type ContentStatus = "verified" | "draft" | "sample";

export type Track = "sde" | "aiml";

/** A link that may not be configured yet. `href: null` hides it publicly. */
export interface ConfigurableLink {
  label: string;
  href: string | null;
  /** Developer hint shown only in `next dev` when `href` is null. */
  placeholder?: string;
}

/** Explicitly mark a case-study field as not part of a project's design. */
export interface NotApplicable {
  notApplicable: string;
}

export type MaybeApplicable<T> = T | NotApplicable;

export interface Evidence {
  label: string;
  /** Measured value. `null` renders as "REPLACE ME — verified result". */
  value: string | null;
  /** Measurement conditions: hardware, dataset, load, commit, etc. */
  conditions?: string;
  evidenceUrl?: string | null;
  status: ContentStatus;
}

export interface DiagramNode {
  label: string;
  /** Kind is printed as text so diagrams never rely on color alone. */
  kind:
    | "client"
    | "edge"
    | "service"
    | "worker"
    | "store"
    | "cache"
    | "queue"
    | "data"
    | "process"
    | "model"
    | "eval"
    | "output";
  note?: string;
}

export interface DiagramStage {
  label: string;
  nodes: DiagramNode[];
}

export interface ArchitectureDiagram {
  title: string;
  /** Stages are drawn left → right (stacked top → bottom on small screens). */
  stages: DiagramStage[];
  /** Plain-language description of every connection, for screen readers and clarity. */
  flows: string[];
  /** Whether this diagram describes a built system or a planned design. */
  basis: "implemented" | "planned" | "illustrative";
}

export interface EngineeringDecision {
  decision: string;
  alternatives: string[];
  rationale: string;
  tradeoff: string;
}

export type ProjectPhase = "concept" | "planned" | "in-progress" | "completed" | "archived";

interface ProjectBase {
  slug: string;
  title: string;
  track: Track;
  status: ContentStatus;
  phase: ProjectPhase;
  /** One-line problem statement for cards. */
  problem: string;
  summary: string;
  contribution: string;
  stack: string[];
  /** 3–5 short labels shown on cards. */
  tags: string[];
  /** One meaningful engineering highlight for the card. */
  highlight: string;
  diagram: ArchitectureDiagram;
  links: { repo: string | null; demo: string | null };
  results: Evidence[];
  limitations: string[];
  nextSteps: string[];
}

export interface SdeProject extends ProjectBase {
  track: "sde";
  requirements: { functional: string[]; nonFunctional: string[] };
  components: { name: string; responsibility: string }[];
  implementation: string[];
  api: MaybeApplicable<{ method: string; path: string; purpose: string }[]>;
  dataModel: MaybeApplicable<{ entity: string; fields: string[]; notes?: string }[]>;
  auth: MaybeApplicable<string[]>;
  validation: string[];
  testing: { level: string; approach: string }[];
  concurrency: MaybeApplicable<string[]>;
  performance: string[];
  security: string[];
  decisions: EngineeringDecision[];
}

export interface AimlProject extends ProjectBase {
  track: "aiml";
  /** Flexible: supervised, retrieval, LLM application, unsupervised, analytics… */
  taskType: string;
  useCase: string;
  data: {
    sources: string[];
    provenance: string;
    /** `null` renders as REPLACE ME. */
    size: string | null;
    split: string;
    preprocessing: string[];
    qualityIssues: string[];
  };
  features: MaybeApplicable<string[]>;
  baseline: string;
  method: string[];
  modelRationale: string;
  training: MaybeApplicable<string[]>;
  validation: string;
  metrics: { name: string; why: string; value: string | null; status: ContentStatus }[];
  errorAnalysis: string[];
  ablations: MaybeApplicable<string[]>;
  reproducibility: { item: string; detail: string }[];
  inference: string[];
  deployment: string;
  resources: string[];
}

export type Project = SdeProject | AimlProject;

export interface SkillItem {
  name: string;
  note?: string;
  status: ContentStatus;
}

export interface SkillCategory {
  id: string;
  title: string;
  description: string;
  groups: { title: string; items: SkillItem[] }[];
}

export interface CodingProfile {
  platform: string;
  url: string | null;
  problemsSolved: number | null;
  contestsParticipated: number | null;
  contestRating: number | null;
  strongTopics: string[];
  status: ContentStatus;
}

export interface DsaTopic {
  topic: string;
  /** What has actually been practiced; `null` = REPLACE ME. */
  evidence: string | null;
  status: ContentStatus;
}

export interface ProblemExample {
  title: string;
  platform: string;
  url: string | null;
  pattern: string;
  approach: string;
  complexity: string;
  status: ContentStatus;
}

export type DesignMaturity = "implemented-tested" | "designed-not-implemented" | "learning-exercise";

export interface SystemDesignCase {
  slug: string;
  title: string;
  maturity: DesignMaturity;
  status: ContentStatus;
  requirements: string[];
  constraints: string[];
  diagram: ArchitectureDiagram;
  dataFlow: string[];
  storage: string;
  apiContracts: string[];
  bottlenecks: string[];
  caching: string;
  failureHandling: string[];
  securityBoundaries: string[];
  monitoring: string[];
  cost: string;
}

export interface ExperienceEntry {
  organization: string;
  role: string;
  start: string;
  end: string;
  type: "Internship" | "Part-time" | "Full-time" | "Freelance" | "Research" | "Volunteer" | "Club";
  responsibilities: string[];
  contributions: string[];
  outcomes: Evidence[];
  links: ConfigurableLink[];
  status: ContentStatus;
}

export type AchievementKind =
  | "Hackathon"
  | "Competition"
  | "Award"
  | "Certification"
  | "Publication"
  | "Open Source"
  | "Talk";

export interface Achievement {
  kind: AchievementKind;
  title: string;
  issuer: string;
  date: string;
  /** Be exact: "Participant", "Finalist", "Winner". Never upgrade participation. */
  outcome: string | null;
  description: string;
  link: string | null;
  status: ContentStatus;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  expectedGraduation: string;
  location: string | null;
  /** Optional, leave empty until filled with real data. */
  coursework: string[];
  relevantSubjects: string[];
  academicProjects: string[];
  status: ContentStatus;
}

export interface Profile {
  name: string;
  brand: string;
  taglineWords: string[];
  positioning: string[];
  headline: string;
  summaries: {
    sde: { text: string; status: ContentStatus };
    aiml: { text: string; status: ContentStatus };
  };
  focusAreas: string[];
  interests: { text: string; status: ContentStatus }[];
  philosophy: { title: string; text: string; status: ContentStatus }[];
}

export interface SiteConfig {
  /** Public URL, e.g. "https://example.dev". `null` until a domain exists. */
  url: string | null;
  title: string;
  description: string;
  /**
   * When true, every record with `status: "sample"` is filtered out and
   * empty sections are hidden. Flip this once real content is in place.
   */
  hideSampleContent: boolean;
  sections: {
    dsa: boolean;
    systemDesign: boolean;
    experience: boolean;
    achievements: boolean;
  };
}
