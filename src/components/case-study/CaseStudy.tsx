import Link from "next/link";
import type { AimlProject, Evidence, MaybeApplicable, Project, SdeProject } from "@/data/types";
import { getProjects, isNotApplicable, PHASE_LABEL, TRACK_LABEL } from "@/lib/content";
import { ArchitectureDiagram } from "@/components/diagram/ArchitectureDiagram";
import { DevPlaceholder, ReplaceMe, SampleNotice, StatusBadge } from "@/components/ui/Status";
import { LevelLink } from "@/components/level/LevelLink";
import { Checkpoints } from "@/components/level/Checkpoints";
import styles from "./CaseStudy.module.css";

/* ---------------------------- building blocks ---------------------------- */

type TocItem = { id: string; label: string };

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={styles.block} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.blockTitle}>
        {title}
      </h2>
      <div className={styles.blockBody}>{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.sub}>
      <h3 className={styles.subTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-dash">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function NotApplicableNote({ reason }: { reason: string }) {
  return (
    <p className={styles.na}>
      <span className="badge badge-neutral">Not applicable</span> {reason}
    </p>
  );
}

function MaybeBullets({ value }: { value: MaybeApplicable<string[]> }) {
  return isNotApplicable(value) ? <NotApplicableNote reason={value.notApplicable} /> : <Bullets items={value} />;
}

function EvidenceList({ items }: { items: Evidence[] }) {
  if (!items.length) return <ReplaceMe>REPLACE ME — add measured results</ReplaceMe>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Measurement</th>
            <th scope="col">Result</th>
            <th scope="col">Conditions / evidence</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.label}>
              <th scope="row">
                {r.label} <StatusBadge status={r.status} />
              </th>
              <td>{r.value ?? <ReplaceMe>REPLACE ME — verified result</ReplaceMe>}</td>
              <td>
                {r.conditions ?? "—"}
                {r.evidenceUrl && (
                  <>
                    {" "}
                    <a href={r.evidenceUrl} className="text-link" target="_blank" rel="noopener noreferrer">
                      evidence ↗
                    </a>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------- SDE body -------------------------------- */

function sdeToc(): TocItem[] {
  return [
    { id: "problem", label: "Problem" },
    { id: "requirements", label: "Requirements" },
    { id: "architecture", label: "Architecture" },
    { id: "implementation", label: "Implementation" },
    { id: "decisions", label: "Engineering decisions" },
    { id: "testing", label: "Testing" },
    { id: "reliability", label: "Reliability & security" },
    { id: "results", label: "Results" },
    { id: "limitations", label: "Limitations" },
    { id: "next", label: "Next steps" },
  ];
}

function SdeBody({ p }: { p: SdeProject }) {
  return (
    <>
      <Block id="problem" title="Problem">
        <p>{p.problem}</p>
        <p className="muted">{p.summary}</p>
      </Block>

      <Block id="requirements" title="Requirements">
        <div className={styles.cols2}>
          <Sub title="Functional">
            <Bullets items={p.requirements.functional} />
          </Sub>
          <Sub title="Non-functional">
            <Bullets items={p.requirements.nonFunctional} />
          </Sub>
        </div>
      </Block>

      <Block id="architecture" title="Architecture">
        <ArchitectureDiagram diagram={p.diagram} />
        <Sub title="Key components">
          <dl className={styles.defs}>
            {p.components.map((c) => (
              <div key={c.name}>
                <dt>{c.name}</dt>
                <dd>{c.responsibility}</dd>
              </div>
            ))}
          </dl>
        </Sub>
      </Block>

      <Block id="implementation" title="Implementation">
        <Bullets items={p.implementation} />
        <Sub title="API design">
          {isNotApplicable(p.api) ? (
            <NotApplicableNote reason={p.api.notApplicable} />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Method</th>
                    <th scope="col">Path</th>
                    <th scope="col">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {p.api.map((a) => (
                    <tr key={a.method + a.path}>
                      <td>
                        <code className={styles.method}>{a.method}</code>
                      </td>
                      <td>
                        <code>{a.path}</code>
                      </td>
                      <td>{a.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Sub>
        <Sub title="Data model">
          {isNotApplicable(p.dataModel) ? (
            <NotApplicableNote reason={p.dataModel.notApplicable} />
          ) : (
            <div className={styles.entities}>
              {p.dataModel.map((e) => (
                <div key={e.entity} className={styles.entity}>
                  <p className={styles.entityName}>{e.entity}</p>
                  <ul>
                    {e.fields.map((f) => (
                      <li key={f}>
                        <code>{f}</code>
                      </li>
                    ))}
                  </ul>
                  {e.notes && <p className={styles.entityNote}>{e.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </Sub>
        <div className={styles.cols2}>
          <Sub title="Authentication & authorization">
            <MaybeBullets value={p.auth} />
          </Sub>
          <Sub title="Validation & error handling">
            <Bullets items={p.validation} />
          </Sub>
        </div>
      </Block>

      <Block id="decisions" title="Engineering decisions">
        <div className={styles.decisions}>
          {p.decisions.map((d) => (
            <article key={d.decision} className={styles.decision}>
              <h3 className={styles.decisionTitle}>{d.decision}</h3>
              <dl className={styles.defs}>
                <div>
                  <dt>Alternatives</dt>
                  <dd>{d.alternatives.join(" · ")}</dd>
                </div>
                <div>
                  <dt>Why</dt>
                  <dd>{d.rationale}</dd>
                </div>
                <div>
                  <dt>Trade-off</dt>
                  <dd>{d.tradeoff}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Block>

      <Block id="testing" title="Testing">
        <dl className={styles.defs}>
          {p.testing.map((t) => (
            <div key={t.level}>
              <dt>{t.level}</dt>
              <dd>{t.approach}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block id="reliability" title="Reliability & security">
        <div className={styles.cols3}>
          <Sub title="Concurrency & reliability">
            <MaybeBullets value={p.concurrency} />
          </Sub>
          <Sub title="Performance & scalability">
            <Bullets items={p.performance} />
          </Sub>
          <Sub title="Security">
            <Bullets items={p.security} />
          </Sub>
        </div>
      </Block>
    </>
  );
}

/* ------------------------------ AI/ML body ------------------------------- */

function aimlToc(): TocItem[] {
  return [
    { id: "problem", label: "Problem" },
    { id: "pipeline", label: "Pipeline" },
    { id: "data", label: "Data" },
    { id: "baseline", label: "Baseline" },
    { id: "method", label: "Method" },
    { id: "evaluation", label: "Evaluation" },
    { id: "errors", label: "Error analysis" },
    { id: "reproducibility", label: "Reproducibility" },
    { id: "inference", label: "Inference" },
    { id: "results", label: "Results" },
    { id: "limitations", label: "Limitations" },
    { id: "next", label: "Next steps" },
  ];
}

function AimlBody({ p }: { p: AimlProject }) {
  return (
    <>
      <Block id="problem" title="Problem">
        <p>{p.problem}</p>
        <p className="muted">{p.summary}</p>
        <dl className={styles.defs}>
          <div>
            <dt>Task type</dt>
            <dd>{p.taskType}</dd>
          </div>
          <div>
            <dt>Intended use</dt>
            <dd>{p.useCase}</dd>
          </div>
        </dl>
      </Block>

      <Block id="pipeline" title="Pipeline">
        <ArchitectureDiagram diagram={p.diagram} />
      </Block>

      <Block id="data" title="Data">
        <dl className={styles.defs}>
          <div>
            <dt>Sources</dt>
            <dd>{p.data.sources.join(" · ")}</dd>
          </div>
          <div>
            <dt>Provenance</dt>
            <dd>{p.data.provenance}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{p.data.size ?? <ReplaceMe>REPLACE ME — dataset size</ReplaceMe>}</dd>
          </div>
          <div>
            <dt>Split</dt>
            <dd>{p.data.split}</dd>
          </div>
        </dl>
        <div className={styles.cols2}>
          <Sub title="Preprocessing">
            <Bullets items={p.data.preprocessing} />
          </Sub>
          <Sub title="Known quality issues">
            <Bullets items={p.data.qualityIssues} />
          </Sub>
        </div>
      </Block>

      <Block id="baseline" title="Baseline">
        <p>{p.baseline}</p>
      </Block>

      <Block id="method" title="Method">
        <Bullets items={p.method} />
        <Sub title="Model selection rationale">
          <p>{p.modelRationale}</p>
        </Sub>
        <div className={styles.cols2}>
          <Sub title="Features">
            <MaybeBullets value={p.features} />
          </Sub>
          <Sub title="Training">
            <MaybeBullets value={p.training} />
          </Sub>
        </div>
      </Block>

      <Block id="evaluation" title="Evaluation">
        <p>
          <span className={styles.inlineLabel}>Validation:</span> {p.validation}
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">Why this metric</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {p.metrics.map((m) => (
                <tr key={m.name}>
                  <th scope="row">{m.name}</th>
                  <td>{m.why}</td>
                  <td>{m.value ?? <ReplaceMe>REPLACE ME</ReplaceMe>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      <Block id="errors" title="Error analysis">
        <Bullets items={p.errorAnalysis} />
        <Sub title="Ablations & comparisons">
          <MaybeBullets value={p.ablations} />
        </Sub>
      </Block>

      <Block id="reproducibility" title="Reproducibility">
        <dl className={styles.defs}>
          {p.reproducibility.map((r) => (
            <div key={r.item}>
              <dt>{r.item}</dt>
              <dd>{r.detail}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block id="inference" title="Inference & deployment">
        <Bullets items={p.inference} />
        <dl className={styles.defs}>
          <div>
            <dt>Deployment status</dt>
            <dd>{p.deployment}</dd>
          </div>
        </dl>
        <Sub title="Performance & resources">
          <Bullets items={p.resources} />
        </Sub>
      </Block>
    </>
  );
}

/* ------------------------------- page body ------------------------------- */

export function CaseStudy({ project: p }: { project: Project }) {
  const toc = p.track === "sde" ? sdeToc() : aimlToc();
  const all = getProjects();
  const idx = all.findIndex((x) => x.slug === p.slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];

  return (
    <article className={styles.page} aria-labelledby="cs-title">
      <div className="container">
        <nav aria-label="Breadcrumb" className={styles.crumbs}>
          <LevelLink href="/#projects" mode="exit" className="text-link">
            ← Exit level · Project archive
          </LevelLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{p.slug}</span>
        </nav>

        <header className={styles.header}>
          <div className={styles.metaRow}>
            <span className={styles.levelTag}>Level 2-{idx + 1}</span>
            <span className={styles.track}>{TRACK_LABEL[p.track]}</span>
            <span className="chip">Status: {PHASE_LABEL[p.phase]}</span>
            <StatusBadge status={p.status} label={p.status === "sample" ? "Sample case study" : undefined} />
          </div>
          <h1 id="cs-title" className={styles.title}>
            {p.title}
          </h1>
          <p className={styles.lede}>{p.problem}</p>
          {p.status === "sample" && (
            <SampleNotice>
              This is a demonstration case study showing the documentation format. It does not describe real work, and
              every result is intentionally left as REPLACE ME.
            </SampleNotice>
          )}

          <dl className={styles.facts}>
            <div>
              <dt>My contribution</dt>
              <dd>{p.contribution}</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>
                <ul className="chip-list">
                  {p.stack.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt>Links</dt>
              <dd className={styles.linkCell}>
                {p.links.repo && (
                  <a href={p.links.repo} className="btn btn-sm" target="_blank" rel="noopener noreferrer">
                    Repository ↗
                  </a>
                )}
                {p.links.demo && (
                  <a href={p.links.demo} className="btn btn-sm" target="_blank" rel="noopener noreferrer">
                    Live demo ↗
                  </a>
                )}
                {!p.links.repo && !p.links.demo && (
                  <>
                    <span className="muted">Not published yet.</span> <DevPlaceholder hint="Set links.repo / links.demo" />
                  </>
                )}
              </dd>
            </div>
          </dl>
        </header>

        <Checkpoints ids={[...toc.map((t) => t.id), "results", "limitations", "next"].filter((v, i, a) => a.indexOf(v) === i)} />
        <div className={styles.layout}>
          <nav className={styles.toc} aria-label="Case study sections">
            <p className={styles.tocTitle}>Contents</p>
            <ol>
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} data-checkpoint={t.id}>
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={styles.content}>
            {p.track === "sde" ? <SdeBody p={p} /> : <AimlBody p={p} />}

            <Block id="results" title="Results">
              <p className="muted">
                Only measured results with stated conditions belong here. Empty values are intentional placeholders.
              </p>
              <EvidenceList items={p.results} />
            </Block>

            <Block id="limitations" title="Limitations">
              <Bullets items={p.limitations} />
            </Block>

            <Block id="next" title="Next steps">
              <Bullets items={p.nextSteps} />
            </Block>
          </div>
        </div>

        {all.length > 1 && (
          <nav className={styles.pager} aria-label="More projects">
            <Link href={`/projects/${prev.slug}`} className={styles.pagerLink}>
              <span className={styles.pagerDir}>← Previous</span>
              <span>{prev.title}</span>
            </Link>
            <Link href={`/projects/${next.slug}`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
              <span className={styles.pagerDir}>Next →</span>
              <span>{next.title}</span>
            </Link>
          </nav>
        )}
      </div>
    </article>
  );
}
