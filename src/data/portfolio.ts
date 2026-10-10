/**
 * ============================================================================
 *  ANISH.EXE — CENTRAL CONTENT FILE
 * ============================================================================
 *
 *  Edit this file to update the portfolio. UI components only read from here.
 *
 *  CONFIRMED (real) information:
 *    - Name: Anish Karthikeyan
 *    - B.E. Computer Science and Engineering, Chennai Institute of Technology
 *    - Expected graduation: 2028
 *
 *  EVERYTHING ELSE below is SAMPLE / PLACEHOLDER content, marked with
 *  `status: "sample"`. Replace it with real information and change the status
 *  to "verified" (or "draft" while you are still checking it).
 *
 *  Rules for replacing content:
 *    - Metrics: keep `value: null` until you have a real, reproducible number.
 *    - Links: keep `href: null` / `url: null` until the real URL exists.
 *      Null links are hidden on the public site.
 *    - Set `site.hideSampleContent = true` to hide every remaining sample
 *      record at once (empty sections disappear automatically).
 * ============================================================================
 */

import type {
  Achievement,
  CodingProfile,
  ConfigurableLink,
  DsaTopic,
  Education,
  ExperienceEntry,
  ProblemExample,
  Profile,
  Project,
  SiteConfig,
  SkillCategory,
  SystemDesignCase,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  SITE                                                                      */
/* -------------------------------------------------------------------------- */

export const site: SiteConfig = {
  url: null, // REPLACE ME: "https://your-domain.dev" (used for canonical + Open Graph URLs)
  title: "ANISH.EXE — Anish Karthikeyan",
  description:
    "Portfolio of Anish Karthikeyan, B.E. Computer Science and Engineering student at Chennai Institute of Technology (expected 2028), focused on software engineering, backend systems, and applied AI.",
  hideSampleContent: false,
  sections: {
    dsa: true,
    systemDesign: true,
    experience: true,
    achievements: true,
  },
};

/* -------------------------------------------------------------------------- */
/*  PROFILE                                                                   */
/* -------------------------------------------------------------------------- */

export const profile: Profile = {
  name: "Anish Karthikeyan", // confirmed
  brand: "ANISH.EXE",
  taglineWords: ["CODE", "AI", "BUILD", "LEARN", "GROW"],
  positioning: ["SOFTWARE ENGINEER", "APPLIED AI", "BACKEND SYSTEMS"],
  headline: "BUILDING SOFTWARE SYSTEMS AND AI-POWERED APPLICATIONS",
  summaries: {
    sde: {
      status: "sample",
      text: "Computer Science and Engineering student interested in software engineering, backend systems, data structures, algorithms, databases, and reliable software design. Focused on building maintainable systems, solving technical problems, and understanding engineering trade-offs.",
    },
    aiml: {
      status: "sample",
      text: "Computer Science and Engineering student interested in applied AI, machine learning, data pipelines, model evaluation, and production-oriented AI systems. Focused on understanding model behavior and building reproducible, useful applications.",
    },
  },
  focusAreas: ["Backend systems", "Data structures & algorithms", "Applied machine learning", "Model evaluation"],
  interests: [
    { text: "REPLACE ME — an engineering topic you are genuinely exploring", status: "sample" },
    { text: "REPLACE ME — a domain you would like to build software for", status: "sample" },
    { text: "REPLACE ME — something you do outside of code", status: "sample" },
  ],
  philosophy: [
    {
      status: "sample",
      title: "Measure before claiming",
      text: "Sample principle: a result is only reported with the conditions it was measured under and the evidence behind it.",
    },
    {
      status: "sample",
      title: "Make trade-offs explicit",
      text: "Sample principle: every design choice records the alternatives considered and what was given up.",
    },
    {
      status: "sample",
      title: "Simple first, then scale",
      text: "Sample principle: start with the simplest correct system and add complexity only where a bottleneck is demonstrated.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  LINKS — keep `href: null` until the real URL exists                       */
/* -------------------------------------------------------------------------- */

export const links: Record<"resume" | "github" | "linkedin" | "email", ConfigurableLink> = {
  resume: {
    label: "Resume",
    href: null, // REPLACE ME: "/resume.pdf" (place the file in /public) or a hosted URL
    placeholder: "Add resume: put resume.pdf in /public and set href to '/resume.pdf'",
  },
  github: {
    label: "GitHub",
    href: null, // REPLACE ME: "https://github.com/<username>"
    placeholder: "Add GitHub profile URL",
  },
  linkedin: {
    label: "LinkedIn",
    href: null, // REPLACE ME: "https://www.linkedin.com/in/<handle>"
    placeholder: "Add LinkedIn profile URL",
  },
  email: {
    label: "Email",
    href: null, // REPLACE ME: "mailto:you@example.com"
    placeholder: "Add email as mailto: link",
  },
};

/** Additional profiles (coding platforms, blog, etc.). Null hrefs are hidden. */
export const extraLinks: ConfigurableLink[] = [
  { label: "LeetCode", href: null, placeholder: "Add LeetCode profile URL" },
  { label: "Codeforces", href: null, placeholder: "Add Codeforces profile URL" },
];

/* -------------------------------------------------------------------------- */
/*  EDUCATION — confirmed core details; optional fields left empty           */
/* -------------------------------------------------------------------------- */

export const education: Education[] = [
  {
    institution: "Chennai Institute of Technology", // confirmed
    degree: "B.E.", // confirmed
    field: "Computer Science and Engineering", // confirmed
    expectedGraduation: "2028", // confirmed
    location: null, // optional: e.g. "Chennai, India"
    coursework: [], // REPLACE ME: e.g. ["Data Structures", "Operating Systems"]
    relevantSubjects: [], // REPLACE ME
    academicProjects: [], // REPLACE ME
    status: "verified",
  },
];

/* -------------------------------------------------------------------------- */
/*  PROJECTS — ALL SAMPLE / DEMONSTRATION CONTENT                             */
/*                                                                            */
/*  These four projects demonstrate the case-study format. They are not real  */
/*  work. Replace each one with a real project (or delete it). Metrics stay   */
/*  `null` until you have measured, reproducible evidence.                    */
/* -------------------------------------------------------------------------- */

export const projects: Project[] = [
  /* ------------------------------ SDE #1 ------------------------------- */
  {
    slug: "project-atlas",
    title: "PROJECT ATLAS — BACKEND SYSTEM",
    track: "sde",
    status: "sample",
    phase: "concept",
    problem: "Sample: student clubs double-book shared rooms because reservations live in chat threads.",
    summary:
      "Illustrative case study of a reservation API that prevents overlapping bookings for shared campus rooms. Demonstrates how a backend project would be documented: requirements, data model, consistency strategy, and testing.",
    contribution: "REPLACE ME — describe exactly what you designed, built, and tested.",
    stack: ["TypeScript", "Node.js", "Fastify", "PostgreSQL", "Docker", "Vitest"],
    tags: ["REST API", "PostgreSQL", "Transactions", "Auth"],
    highlight: "Overlap prevention enforced by a database exclusion constraint instead of application-level checks.",
    diagram: {
      title: "Request path",
      basis: "illustrative",
      stages: [
        { label: "Client", nodes: [{ label: "Web client", kind: "client" }] },
        { label: "Edge", nodes: [{ label: "REST API", kind: "edge", note: "auth + validation" }] },
        {
          label: "Application",
          nodes: [
            { label: "Booking service", kind: "service" },
            { label: "Rooms service", kind: "service" },
          ],
        },
        { label: "Storage", nodes: [{ label: "PostgreSQL", kind: "store", note: "exclusion constraint" }] },
      ],
      flows: [
        "Web client sends authenticated HTTPS requests to the REST API.",
        "REST API validates input and routes to the Booking or Rooms service.",
        "Booking service writes reservations to PostgreSQL inside a transaction.",
        "PostgreSQL rejects overlapping time ranges for the same room.",
      ],
    },
    links: { repo: null, demo: null },
    requirements: {
      functional: [
        "Members can list rooms and see availability for a date.",
        "Members can create, view, and cancel their reservations.",
        "Admins can create rooms and set booking rules.",
      ],
      nonFunctional: [
        "No two confirmed bookings for the same room may overlap — even under concurrent requests.",
        "Clear, consistent error responses for invalid or conflicting requests.",
        "Runs locally with one command (Docker Compose).",
      ],
    },
    components: [
      { name: "REST API layer", responsibility: "Routing, schema validation, authentication, error mapping." },
      { name: "Booking service", responsibility: "Reservation rules, cancellation, conflict handling." },
      { name: "Rooms service", responsibility: "Room catalog and availability queries." },
      { name: "PostgreSQL", responsibility: "Source of truth; enforces no-overlap invariant." },
    ],
    implementation: [
      "Sample: request schemas defined once and used for both validation and API documentation.",
      "Sample: reservation time ranges stored as tstzrange to allow range operators and constraints.",
      "Sample: domain errors mapped to stable error codes (e.g. BOOKING_CONFLICT) at the API boundary.",
    ],
    api: [
      { method: "GET", path: "/rooms?date=YYYY-MM-DD", purpose: "List rooms with free slots for a day." },
      { method: "POST", path: "/bookings", purpose: "Create a reservation (409 on overlap)." },
      { method: "GET", path: "/bookings/me", purpose: "List the caller's reservations." },
      { method: "DELETE", path: "/bookings/:id", purpose: "Cancel own reservation." },
    ],
    dataModel: [
      { entity: "users", fields: ["id (uuid, pk)", "email (unique)", "role (member | admin)"] },
      { entity: "rooms", fields: ["id (uuid, pk)", "name", "capacity"] },
      {
        entity: "bookings",
        fields: ["id (uuid, pk)", "room_id (fk)", "user_id (fk)", "during (tstzrange)", "status"],
        notes: "EXCLUDE USING gist (room_id WITH =, during WITH &&) WHERE status = 'confirmed'",
      },
    ],
    auth: [
      "Sample: session or token authentication handled at the API layer.",
      "Sample: role-based authorization — members manage only their own bookings; admins manage rooms.",
    ],
    validation: [
      "Reject end time ≤ start time and bookings outside room hours.",
      "Uniform error envelope: { code, message, details }.",
      "Constraint violations translated to 409 Conflict, not 500.",
    ],
    testing: [
      { level: "Unit", approach: "Booking rules (time bounds, ownership) tested in isolation." },
      { level: "Integration", approach: "API tests against a disposable PostgreSQL container." },
      { level: "Concurrency", approach: "Parallel requests for the same slot; assert exactly one succeeds." },
    ],
    concurrency: [
      "Overlap invariant enforced by the database, so concurrent requests cannot both commit.",
      "Idempotency key on POST /bookings to make client retries safe.",
    ],
    performance: [
      "GiST index on (room_id, during) supports both the constraint and availability queries.",
      "Pagination on list endpoints.",
    ],
    security: [
      "Parameterized queries only.",
      "Authorization checked on every booking mutation (no IDOR).",
      "Rate limiting on authentication endpoints.",
    ],
    decisions: [
      {
        decision: "Enforce no-overlap with a PostgreSQL exclusion constraint.",
        alternatives: ["Check-then-insert in application code", "Distributed lock per room"],
        rationale: "The database is the single place that sees every concurrent write.",
        tradeoff: "Ties the design to PostgreSQL-specific features.",
      },
      {
        decision: "Modular monolith instead of microservices.",
        alternatives: ["Separate booking and room services"],
        rationale: "One deployable unit is simpler to test and operate at this scale.",
        tradeoff: "Services cannot be scaled independently.",
      },
    ],
    results: [
      { label: "Concurrent double-booking test", value: null, conditions: "REPLACE ME — test setup", status: "sample" },
      { label: "p95 latency for POST /bookings", value: null, conditions: "REPLACE ME — load profile + hardware", status: "sample" },
    ],
    limitations: [
      "No recurring reservations.",
      "Single region, single database instance.",
      "No notification when a booking is cancelled.",
    ],
    nextSteps: ["Recurring bookings with conflict preview.", "Waitlist for full slots.", "Audit log for admin actions."],
  },

  /* ------------------------------ SDE #2 ------------------------------- */
  {
    slug: "project-orbit",
    title: "PROJECT ORBIT — DISTRIBUTED APPLICATION",
    track: "sde",
    status: "sample",
    phase: "concept",
    problem: "Sample: slow, failure-prone work (emails, report generation) blocks API requests.",
    summary:
      "Illustrative case study of a background job system: an API enqueues work, workers process it with retries, and failed jobs land in a dead-letter queue for inspection.",
    contribution: "REPLACE ME — describe your actual role and what you implemented.",
    stack: ["Go", "Redis", "PostgreSQL", "Docker Compose", "Prometheus"],
    tags: ["Queues", "Workers", "Retries", "Observability"],
    highlight: "At-least-once delivery with idempotent handlers and a dead-letter queue.",
    diagram: {
      title: "Job lifecycle",
      basis: "illustrative",
      stages: [
        { label: "Producers", nodes: [{ label: "API service", kind: "service", note: "enqueue + 202" }] },
        { label: "Broker", nodes: [{ label: "Job queue", kind: "queue", note: "Redis streams" }] },
        {
          label: "Consumers",
          nodes: [
            { label: "Worker pool", kind: "worker", note: "N goroutines" },
            { label: "Dead-letter queue", kind: "queue" },
          ],
        },
        {
          label: "State",
          nodes: [
            { label: "Job store", kind: "store", note: "PostgreSQL" },
            { label: "Metrics", kind: "output", note: "Prometheus" },
          ],
        },
      ],
      flows: [
        "API service validates a request, records the job, enqueues it, and returns 202 Accepted.",
        "Worker pool consumes jobs from the queue and updates job status in the job store.",
        "Jobs that exceed the retry limit move to the dead-letter queue.",
        "Workers and API export metrics for queue depth, failures, and processing time.",
      ],
    },
    links: { repo: null, demo: null },
    requirements: {
      functional: [
        "Clients submit jobs and poll job status.",
        "Failed jobs retry with backoff; permanently failed jobs are inspectable.",
      ],
      nonFunctional: [
        "API stays responsive regardless of job duration.",
        "No job silently lost when a worker crashes.",
        "Duplicate processing must not cause duplicate side effects.",
      ],
    },
    components: [
      { name: "API service", responsibility: "Accepts jobs, stores metadata, exposes status." },
      { name: "Queue", responsibility: "Durable hand-off between API and workers." },
      { name: "Worker pool", responsibility: "Executes handlers with timeouts and retries." },
      { name: "Dead-letter queue", responsibility: "Holds jobs that exhausted retries." },
    ],
    implementation: [
      "Sample: consumer groups with explicit acknowledgement after a handler succeeds.",
      "Sample: exponential backoff with jitter between retries.",
      "Sample: graceful shutdown drains in-flight jobs before exit.",
    ],
    api: [
      { method: "POST", path: "/jobs", purpose: "Submit a job; returns 202 with job id." },
      { method: "GET", path: "/jobs/:id", purpose: "Job status, attempts, last error." },
      { method: "POST", path: "/jobs/:id/retry", purpose: "Re-enqueue a dead-lettered job." },
    ],
    dataModel: [
      {
        entity: "jobs",
        fields: ["id (uuid)", "type", "payload (jsonb)", "status", "attempts", "last_error", "idempotency_key (unique)"],
      },
    ],
    auth: { notApplicable: "Internal service in this sample design; would sit behind a private network or gateway." },
    validation: ["Per-job-type payload schemas.", "Unknown job types rejected at submission."],
    testing: [
      { level: "Unit", approach: "Retry/backoff policy and handler logic." },
      { level: "Integration", approach: "Kill a worker mid-job; assert the job is redelivered and completes once." },
      { level: "End-to-end", approach: "Submit → process → status transitions via the public API." },
    ],
    concurrency: [
      "Worker pool size bounded to protect downstream services.",
      "Idempotency keys make redelivered jobs safe.",
      "Pending-entry reclaim for jobs held by crashed consumers.",
    ],
    performance: ["Queue depth and processing time tracked to size the worker pool.", "Batch acknowledgement considered."],
    security: ["Payloads validated before execution.", "No secrets stored in job payloads."],
    decisions: [
      {
        decision: "At-least-once delivery with idempotent handlers.",
        alternatives: ["Exactly-once via distributed transactions"],
        rationale: "Simpler to reason about and operate; duplicates are neutralized by idempotency.",
        tradeoff: "Every handler must be written to be idempotent.",
      },
    ],
    results: [
      { label: "Throughput at fixed worker count", value: null, conditions: "REPLACE ME — job type, pool size, hardware", status: "sample" },
      { label: "Crash-recovery test", value: null, conditions: "REPLACE ME — test description", status: "sample" },
    ],
    limitations: ["Single Redis node is a single point of failure.", "No job priorities.", "No scheduled/cron jobs."],
    nextSteps: ["Priority queues.", "Scheduled jobs.", "Tracing across API and workers."],
  },

  /* ------------------------------ AI/ML #1 ----------------------------- */
  {
    slug: "project-vector",
    title: "PROJECT VECTOR — AI/ML PIPELINE",
    track: "aiml",
    status: "sample",
    phase: "concept",
    problem: "Sample: students struggle to find answers spread across long course PDFs.",
    summary:
      "Illustrative case study of a retrieval-augmented question-answering pipeline over course material, with citations and an evaluation set to measure retrieval quality.",
    contribution: "REPLACE ME — describe exactly what you built and evaluated.",
    stack: ["Python", "FastAPI", "sentence-transformers", "FAISS", "pytest"],
    tags: ["RAG", "Embeddings", "Retrieval eval", "FastAPI"],
    highlight: "Retrieval evaluated separately from generation so failures can be attributed correctly.",
    taskType: "Retrieval-augmented generation (LLM application)",
    useCase: "A student asks a question about course material and receives an answer with page citations.",
    diagram: {
      title: "Indexing and query pipeline",
      basis: "illustrative",
      stages: [
        { label: "Data", nodes: [{ label: "Course PDFs", kind: "data" }] },
        {
          label: "Preprocess",
          nodes: [
            { label: "Text extraction", kind: "process" },
            { label: "Chunking", kind: "process", note: "with page ids" },
          ],
        },
        {
          label: "Retrieval",
          nodes: [
            { label: "Embedding model", kind: "model" },
            { label: "Vector index", kind: "store", note: "FAISS" },
          ],
        },
        {
          label: "Answer",
          nodes: [
            { label: "LLM generation", kind: "model", note: "grounded prompt" },
            { label: "Eval harness", kind: "eval" },
          ],
        },
        { label: "Serve", nodes: [{ label: "API + citations", kind: "output" }] },
      ],
      flows: [
        "PDFs are converted to text and split into chunks that keep page references.",
        "Chunks are embedded and stored in a vector index.",
        "A query is embedded, top-k chunks are retrieved, and passed to the LLM with instructions to cite sources.",
        "The eval harness scores retrieval and answers against a labeled question set.",
        "The API returns the answer with cited pages.",
      ],
    },
    links: { repo: null, demo: null },
    data: {
      sources: ["Sample: publicly shareable lecture notes or open textbooks."],
      provenance: "REPLACE ME — exact documents, licenses, and collection date.",
      size: null,
      split: "Sample: a held-out set of hand-written questions with the page(s) that answer them.",
      preprocessing: ["PDF text extraction", "Header/footer removal", "Chunking with overlap", "Deduplication"],
      qualityIssues: ["Equations and tables extract poorly.", "Scanned pages need OCR."],
    },
    features: { notApplicable: "No manual feature engineering — dense embeddings are used." },
    baseline: "BM25 keyword retrieval over the same chunks.",
    method: [
      "Dense retrieval with a sentence-embedding model.",
      "Top-k chunks inserted into a prompt that requires page citations.",
      "Answer refuses when retrieved context is insufficient.",
    ],
    modelRationale: "Small open embedding model chosen so indexing runs locally; compared against BM25 baseline.",
    training: { notApplicable: "No model training — pretrained models are used as-is." },
    validation: "Held-out question set; retrieval and answer quality scored separately.",
    metrics: [
      { name: "Recall@k (retrieval)", why: "Does the right page appear in the retrieved context?", value: null, status: "sample" },
      { name: "MRR (retrieval)", why: "How high is the first correct chunk ranked?", value: null, status: "sample" },
      { name: "Citation accuracy", why: "Do cited pages actually support the answer?", value: null, status: "sample" },
    ],
    errorAnalysis: [
      "Sample category: questions answered by tables or equations.",
      "Sample category: questions that need information from two distant sections.",
    ],
    ablations: ["Chunk size and overlap", "Dense vs BM25 vs hybrid retrieval", "Value of k"],
    reproducibility: [
      { item: "Config", detail: "Chunking + retrieval parameters stored in a versioned config file." },
      { item: "Dataset", detail: "Document list with checksums; evaluation questions committed to the repo." },
      { item: "Environment", detail: "Pinned dependencies; model versions recorded." },
    ],
    inference: [
      "Index built offline; query path embeds the question and searches the index.",
      "Generation call has a timeout and a fallback that returns retrieved passages only.",
    ],
    deployment: "Not deployed — sample design for local use.",
    resources: ["Embedding computation is the main indexing cost.", "LLM calls dominate per-query latency and cost."],
    results: [
      { label: "Retrieval: dense vs BM25", value: null, conditions: "REPLACE ME — question set size, k, model versions", status: "sample" },
    ],
    limitations: [
      "Answers can still be wrong when retrieved context is misleading.",
      "Evaluation set is small and written by one person.",
      "No handling of images or diagrams.",
    ],
    nextSteps: ["Hybrid retrieval with re-ranking.", "Larger, multi-annotator eval set.", "OCR for scanned pages."],
  },

  /* ------------------------------ AI/ML #2 ----------------------------- */
  {
    slug: "project-signal",
    title: "PROJECT SIGNAL — DATA / MODEL EVALUATION",
    track: "aiml",
    status: "sample",
    phase: "concept",
    problem: "Sample: a text classifier looks accurate overall but fails on specific user groups.",
    summary:
      "Illustrative case study of an evaluation harness for a text classifier: stratified splits, baseline comparison, per-slice metrics, and an error-analysis report.",
    contribution: "REPLACE ME — describe the parts you designed, implemented, and analyzed.",
    stack: ["Python", "scikit-learn", "pandas", "MLflow", "pytest"],
    tags: ["Classification", "Evaluation", "Error analysis", "Reproducibility"],
    highlight: "Per-slice metrics surface failures that a single aggregate score hides.",
    taskType: "Supervised text classification + evaluation tooling",
    useCase: "An engineer compares model versions and sees where each one fails before shipping.",
    diagram: {
      title: "Evaluation workflow",
      basis: "illustrative",
      stages: [
        { label: "Data", nodes: [{ label: "Labeled dataset", kind: "data", note: "public, versioned" }] },
        { label: "Split", nodes: [{ label: "Stratified split", kind: "process", note: "train / val / test" }] },
        {
          label: "Models",
          nodes: [
            { label: "Baseline", kind: "model", note: "TF-IDF + LR" },
            { label: "Candidate", kind: "model" },
          ],
        },
        {
          label: "Evaluate",
          nodes: [
            { label: "Metrics by slice", kind: "eval" },
            { label: "Error report", kind: "output" },
          ],
        },
      ],
      flows: [
        "A versioned public dataset is split with fixed seeds, stratified by label.",
        "A baseline and a candidate model are trained on the training split.",
        "Both models are scored on the same test split, overall and per data slice.",
        "Misclassified examples are grouped into an error-analysis report.",
      ],
    },
    links: { repo: null, demo: null },
    data: {
      sources: ["Sample: a public labeled text dataset with a documented license."],
      provenance: "REPLACE ME — dataset name, version, license, and link.",
      size: null,
      split: "Stratified train / validation / test with a fixed seed; test set used once.",
      preprocessing: ["Lowercasing and normalization", "Duplicate removal across splits", "Label sanity checks"],
      qualityIssues: ["Possible label noise.", "Class imbalance."],
    },
    features: ["TF-IDF n-grams for the baseline.", "Learned representations for the candidate model."],
    baseline: "TF-IDF + logistic regression.",
    method: [
      "Same splits and preprocessing for every model.",
      "Hyperparameters selected on validation only.",
      "Slices defined up front (e.g. text length, source) before looking at results.",
    ],
    modelRationale: "A strong linear baseline sets a floor; a more complex model must beat it on slices that matter.",
    training: ["Fixed seeds.", "Early stopping on validation loss for neural candidates."],
    validation: "Hold-out validation for selection; untouched test split for final numbers.",
    metrics: [
      { name: "Macro-F1", why: "Treats every class equally under imbalance.", value: null, status: "sample" },
      { name: "Per-class precision / recall", why: "Shows which classes fail and how.", value: null, status: "sample" },
      { name: "Calibration (ECE)", why: "Are confidence scores trustworthy?", value: null, status: "sample" },
    ],
    errorAnalysis: [
      "Sample method: cluster misclassified examples and label each cluster by cause.",
      "Sample method: review high-confidence errors first — they often reveal label noise.",
    ],
    ablations: ["Baseline vs candidate", "With vs without deduplication", "Effect of class weighting"],
    reproducibility: [
      { item: "Seeds", detail: "Recorded for splitting and training." },
      { item: "Tracking", detail: "Parameters, metrics, and artifacts logged per run." },
      { item: "Data version", detail: "Dataset checksum stored with each run." },
    ],
    inference: ["Batch scoring script that loads a logged model by run id."],
    deployment: "Not deployed — offline evaluation tooling in this sample.",
    resources: ["Baseline trains on CPU.", "Candidate model cost depends on chosen architecture."],
    results: [
      { label: "Baseline vs candidate (macro-F1)", value: null, conditions: "REPLACE ME — dataset version, seed, split sizes", status: "sample" },
    ],
    limitations: ["Slices limited to available metadata.", "Single dataset — no claims of generalization."],
    nextSteps: ["Confidence intervals via bootstrap.", "Automated regression checks between model versions."],
  },
];

/* -------------------------------------------------------------------------- */
/*  SKILLS — SAMPLE. No proficiency scores by design.                         */
/* -------------------------------------------------------------------------- */

const s = (name: string, note?: string) => ({ name, note, status: "sample" as const });

export const skillCategories: SkillCategory[] = [
  {
    id: "programming",
    title: "Programming & DSA",
    description: "Languages and problem-solving fundamentals.",
    groups: [
      { title: "Languages", items: [s("C++"), s("Python"), s("Java"), s("TypeScript"), s("SQL")] },
      {
        title: "Fundamentals",
        items: [s("Data structures"), s("Algorithms"), s("Complexity analysis"), s("Problem decomposition")],
      },
    ],
  },
  {
    id: "backend",
    title: "Backend Engineering",
    description: "Designing services that are correct, observable, and maintainable.",
    groups: [
      { title: "Services", items: [s("REST API design"), s("Authentication & authorization"), s("Validation & error handling")] },
      { title: "Data", items: [s("Relational data modeling"), s("Transactions"), s("Indexing"), s("Caching")] },
      { title: "Reliability", items: [s("Concurrency"), s("Testing"), s("Security basics"), s("System design")] },
    ],
  },
  {
    id: "aiml",
    title: "AI / ML",
    description: "From data to evaluated models and useful applications.",
    groups: [
      { title: "Foundations", items: [s("Linear algebra"), s("Probability & statistics"), s("Optimization basics")] },
      {
        title: "Modeling",
        items: [s("Data preprocessing"), s("Feature engineering"), s("Classical ML"), s("Deep learning")],
      },
      {
        title: "Evaluation & ops",
        items: [s("Model evaluation"), s("Error analysis"), s("Experiment tracking"), s("Inference & serving")],
      },
      { title: "LLM systems", items: [s("Retrieval (RAG)"), s("Prompt design"), s("LLM evaluation")] },
    ],
  },
  {
    id: "infra",
    title: "Infrastructure",
    description: "Shipping and operating software.",
    groups: [
      { title: "Tooling", items: [s("Git & GitHub"), s("Linux"), s("Docker")] },
      { title: "Delivery", items: [s("CI/CD"), s("Cloud platforms"), s("Monitoring & observability")] },
    ],
  },
  {
    id: "frontend",
    title: "Frontend & Mobile",
    description: "Interfaces for the systems behind them.",
    groups: [
      { title: "Web", items: [s("TypeScript"), s("React"), s("HTML / CSS / web fundamentals"), s("Responsive UI")] },
      { title: "Mobile", items: [s("Android or cross-platform", "REPLACE ME — keep only if applicable")] },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  DSA — SAMPLE. All numbers null until real.                               */
/* -------------------------------------------------------------------------- */

export const codingProfiles: CodingProfile[] = [
  {
    platform: "LeetCode",
    url: null, // REPLACE ME
    problemsSolved: null,
    contestsParticipated: null,
    contestRating: null,
    strongTopics: [],
    status: "sample",
  },
  {
    platform: "Codeforces",
    url: null, // REPLACE ME
    problemsSolved: null,
    contestsParticipated: null,
    contestRating: null,
    strongTopics: [],
    status: "sample",
  },
];

export const dsaTopics: DsaTopic[] = [
  "Arrays & hashing",
  "Two pointers & sliding window",
  "Binary search",
  "Linked lists",
  "Stacks & queues",
  "Trees & graphs",
  "Heaps",
  "Greedy",
  "Backtracking",
  "Dynamic programming",
  "Complexity analysis",
].map((topic) => ({ topic, evidence: null, status: "sample" as const }));

export const problemExamples: ProblemExample[] = [
  {
    title: "Sample — Sliding window maximum",
    platform: "REPLACE ME",
    url: null,
    pattern: "Monotonic deque",
    approach: "Keep indices in a deque with decreasing values; drop indices that leave the window.",
    complexity: "O(n) time, O(k) space",
    status: "sample",
  },
  {
    title: "Sample — Course schedule (cycle detection)",
    platform: "REPLACE ME",
    url: null,
    pattern: "Topological sort",
    approach: "Kahn's algorithm on the prerequisite graph; a cycle exists if not all nodes are processed.",
    complexity: "O(V + E) time and space",
    status: "sample",
  },
  {
    title: "Sample — Longest increasing subsequence",
    platform: "REPLACE ME",
    url: null,
    pattern: "DP + binary search",
    approach: "Maintain the smallest tail for each subsequence length; binary-search the insert position.",
    complexity: "O(n log n) time, O(n) space",
    status: "sample",
  },
];

/* -------------------------------------------------------------------------- */
/*  SYSTEM DESIGN — SAMPLE learning exercises                                */
/* -------------------------------------------------------------------------- */

export const systemDesigns: SystemDesignCase[] = [
  {
    slug: "url-shortener",
    title: "URL Shortener",
    maturity: "learning-exercise",
    status: "sample",
    requirements: [
      "Create a short code for a long URL.",
      "Redirect short code → long URL with low latency.",
      "Optional expiry and click counts.",
    ],
    constraints: ["Read-heavy: redirects vastly outnumber creations (assumed).", "Codes must be unguessable enough to avoid enumeration."],
    diagram: {
      title: "Redirect path (hypothetical)",
      basis: "planned",
      stages: [
        { label: "Client", nodes: [{ label: "Browser", kind: "client" }] },
        { label: "Edge", nodes: [{ label: "Load balancer", kind: "edge" }] },
        { label: "App", nodes: [{ label: "Redirect service", kind: "service" }, { label: "Write API", kind: "service" }] },
        { label: "Data", nodes: [{ label: "Cache", kind: "cache" }, { label: "Key-value store", kind: "store" }] },
      ],
      flows: [
        "Browser requests /:code through the load balancer.",
        "Redirect service checks the cache, then the key-value store on a miss.",
        "Write API generates a code and stores the mapping.",
        "Click events are recorded asynchronously so redirects stay fast.",
      ],
    },
    dataFlow: ["Create: validate URL → generate code → store mapping.", "Read: cache lookup → store fallback → 301/302 redirect."],
    storage: "Key-value store keyed by code — access pattern is a single-key lookup.",
    apiContracts: ["POST /links { url, expiresAt? } → { code }", "GET /:code → 302 Location"],
    bottlenecks: ["Hot links overwhelming one cache shard.", "Code-generation collisions at high write rates."],
    caching: "Read-through cache for code → URL with TTL; negative caching for unknown codes.",
    failureHandling: ["Cache outage falls back to the store.", "Click logging failures never block a redirect."],
    securityBoundaries: ["Validate and block known-malicious URLs.", "Rate-limit link creation."],
    monitoring: ["Redirect latency percentiles", "Cache hit ratio", "Creation error rate"],
    cost: "Hypothetical: dominated by cache memory and egress; not estimated with real numbers.",
  },
  {
    slug: "rate-limiter",
    title: "API Rate Limiter",
    maturity: "designed-not-implemented",
    status: "sample",
    requirements: ["Limit requests per client per time window.", "Return 429 with retry information."],
    constraints: ["Must add minimal latency to every request.", "Works across multiple API instances."],
    diagram: {
      title: "Token bucket check (design)",
      basis: "planned",
      stages: [
        { label: "Client", nodes: [{ label: "API client", kind: "client" }] },
        { label: "Gateway", nodes: [{ label: "Limiter middleware", kind: "edge" }] },
        { label: "State", nodes: [{ label: "Shared counter store", kind: "cache" }] },
        { label: "Upstream", nodes: [{ label: "API service", kind: "service" }] },
      ],
      flows: [
        "Every request passes through the limiter middleware.",
        "Middleware atomically updates the client's bucket in the shared store.",
        "Allowed requests continue to the API service; others receive 429.",
      ],
    },
    dataFlow: ["Identify client → atomic bucket update → allow or reject."],
    storage: "In-memory shared store with per-key TTL.",
    apiContracts: ["Response headers: RateLimit-Limit, RateLimit-Remaining, Retry-After"],
    bottlenecks: ["Shared store round-trip on every request."],
    caching: "Not applicable — the store itself is the cache.",
    failureHandling: ["Configurable fail-open vs fail-closed if the store is unreachable."],
    securityBoundaries: ["Key on authenticated identity where possible, not only IP."],
    monitoring: ["Rejected request rate per route", "Store latency"],
    cost: "Hypothetical; not estimated.",
  },
];

/* -------------------------------------------------------------------------- */
/*  EXPERIENCE — SAMPLE TEMPLATE ENTRIES                                      */
/*  Delete these (or set site.hideSampleContent = true) once real.            */
/* -------------------------------------------------------------------------- */

export const experience: ExperienceEntry[] = [
  {
    organization: "SAMPLE ORGANIZATION",
    role: "REPLACE ME — Software Engineering Intern",
    start: "MMM YYYY",
    end: "MMM YYYY",
    type: "Internship",
    responsibilities: ["Sample: describe the scope of the work you owned."],
    contributions: ["Sample: one concrete technical contribution, with the technologies used."],
    outcomes: [{ label: "Outcome", value: null, conditions: "REPLACE ME — how it was measured", status: "sample" }],
    links: [],
    status: "sample",
  },
  {
    organization: "SAMPLE CAMPUS CLUB",
    role: "REPLACE ME — Member / Contributor",
    start: "MMM YYYY",
    end: "Present",
    type: "Club",
    responsibilities: ["Sample: workshops, events, or projects you contributed to."],
    contributions: ["Sample: something you built or organized."],
    outcomes: [],
    links: [],
    status: "sample",
  },
];

/* -------------------------------------------------------------------------- */
/*  ACHIEVEMENTS — SAMPLE CARDS FOR LAYOUT ONLY                               */
/* -------------------------------------------------------------------------- */

export const achievements: Achievement[] = [
  {
    kind: "Hackathon",
    title: "SAMPLE — Hackathon name",
    issuer: "REPLACE ME",
    date: "YYYY",
    outcome: null,
    description: "Sample: what you built, your role, and the stack. Record the exact outcome (e.g. Participant).",
    link: null,
    status: "sample",
  },
  {
    kind: "Certification",
    title: "SAMPLE — Certification name",
    issuer: "REPLACE ME",
    date: "YYYY",
    outcome: null,
    description: "Sample: include a verification link once added.",
    link: null,
    status: "sample",
  },
  {
    kind: "Open Source",
    title: "SAMPLE — Open-source contribution",
    issuer: "REPLACE ME — repository",
    date: "YYYY",
    outcome: null,
    description: "Sample: link the merged pull request and summarize the change.",
    link: null,
    status: "sample",
  },
];
