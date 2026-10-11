import { systemDesigns } from "@/data/portfolio";
import { MATURITY_LABEL, visible } from "@/lib/content";
import { ArchitectureDiagram } from "@/components/diagram/ArchitectureDiagram";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SampleNotice, StatusBadge } from "@/components/ui/Status";
import { ConveyorTrack } from "@/components/journey/ConveyorTrack";
import { LabTrack } from "@/components/games/LabTrack";
import styles from "./sections.module.css";

export function SystemDesign() {
  const designs = visible(systemDesigns);

  return (
    <section id="system-design" className="section" aria-labelledby="sd-title">
      <div className="container">
        <SectionHeader
          id="sd-title"
          index="05"
          eyebrow="Engineering practice"
          title="System Design"
          lede="Design reasoning: requirements, data flow, bottlenecks, failure handling, and trade-offs. Each design states whether it was built, only designed, or is a learning exercise."
        >
          {designs.some((d) => d.status === "sample") && (
            <SampleNotice>
              These are sample design exercises. None of them is presented as deployed or benchmarked.
            </SampleNotice>
          )}
        </SectionHeader>

        <ul className={styles.legendRow} aria-label="Design maturity levels">
          {Object.entries(MATURITY_LABEL).map(([k, v]) => (
            <li key={k} className={styles.maturity} data-maturity={k}>
              {v}
            </li>
          ))}
        </ul>

        <div className={styles.designList}>
          {designs.map((d, di) => (
            <article key={d.slug} data-anchor className={`panel ${styles.design}`} aria-labelledby={`sd-${d.slug}`}>
              <header className={styles.designHead}>
                <h3 id={`sd-${d.slug}`} className={styles.h3}>
                  {d.title}
                </h3>
                <div className={styles.badges}>
                  <span className={styles.maturity} data-maturity={d.maturity}>
                    {MATURITY_LABEL[d.maturity]}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
              </header>

              <div className={styles.designTop}>
                <div>
                  <h4 className={styles.h4}>Requirements</h4>
                  <ul className="list-dash">
                    {d.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className={styles.h4}>Constraints</h4>
                  <ul className="list-dash">
                    {d.constraints.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* First machine: the jetpack lab. The rest: conveyor rides. */}
              {di === 0 ? (
                <LabTrack id={`lab-${d.slug}`} />
              ) : (
                <ConveyorTrack id={`conveyor-${d.slug}`} label="Machine room" />
              )}
              <div className={styles.machine}>
                <ArchitectureDiagram diagram={d.diagram} />
              </div>

              <details className={styles.disclosure}>
                <summary>Full design notes — storage, APIs, caching, failures, security, monitoring, cost</summary>
                <dl className={styles.kv}>
                  <div>
                    <dt>Data flow</dt>
                    <dd>
                      <ul className="list-dash">
                        {d.dataFlow.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>Storage</dt>
                    <dd>{d.storage}</dd>
                  </div>
                  <div>
                    <dt>API contracts</dt>
                    <dd>
                      <ul className="list-dash">
                        {d.apiContracts.map((x) => (
                          <li key={x}>
                            <code>{x}</code>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>Scaling bottlenecks</dt>
                    <dd>
                      <ul className="list-dash">
                        {d.bottlenecks.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>Caching</dt>
                    <dd>{d.caching}</dd>
                  </div>
                  <div>
                    <dt>Failure handling</dt>
                    <dd>
                      <ul className="list-dash">
                        {d.failureHandling.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>Security boundaries</dt>
                    <dd>
                      <ul className="list-dash">
                        {d.securityBoundaries.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>Monitoring</dt>
                    <dd>
                      <ul className="list-dash">
                        {d.monitoring.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>Cost</dt>
                    <dd>{d.cost}</dd>
                  </div>
                </dl>
              </details>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
