import type { ArchitectureDiagram as Diagram, DiagramNode } from "@/data/types";
import styles from "./ArchitectureDiagram.module.css";

const KIND_LABEL: Record<DiagramNode["kind"], string> = {
  client: "client",
  edge: "edge / api",
  service: "service",
  worker: "worker",
  store: "datastore",
  cache: "cache",
  queue: "queue",
  data: "data",
  process: "process",
  model: "model",
  eval: "evaluation",
  output: "output",
};

const BASIS_LABEL: Record<Diagram["basis"], string> = {
  implemented: "Implemented system",
  planned: "Planned design",
  illustrative: "Illustrative — sample design",
};

/**
 * Data-driven architecture diagram. Stages flow left → right on wide screens
 * and stack top → bottom on narrow screens. Node kinds are printed as text and
 * use distinct border styles, so the diagram never relies on color alone.
 */
export function ArchitectureDiagram({ diagram, compact = false }: { diagram: Diagram; compact?: boolean }) {
  const titleId = `diagram-${diagram.title.replace(/\W+/g, "-").toLowerCase()}`;

  if (compact) {
    return (
      <ol className={styles.strip} aria-label={`${diagram.title}: ${diagram.stages.map((s) => s.label).join(" to ")}`}>
        {diagram.stages.map((s, i) => (
          <li key={s.label}>
            {i > 0 && (
              <span className={styles.stripArrow} aria-hidden="true">
                →
              </span>
            )}
            <span className={styles.stripBox}>{s.nodes[0]?.label ?? s.label}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <figure className={styles.figure} aria-labelledby={titleId}>
      <figcaption id={titleId} className={styles.caption}>
        <span className={styles.captionTitle}>{diagram.title}</span>
        <span className={`badge ${diagram.basis === "implemented" ? "badge-neutral" : "badge-sample"}`}>
          {BASIS_LABEL[diagram.basis]}
        </span>
      </figcaption>

      <div className={styles.scroller}>
        <ol className={styles.flow}>
          {diagram.stages.map((stage, i) => (
            <li key={stage.label} className={styles.stageWrap}>
              {i > 0 && (
                <span className={styles.arrow} aria-hidden="true">
                  <span className={styles.arrowLine} />
                </span>
              )}
              <div className={styles.stage}>
                <p className={styles.stageLabel}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span> {stage.label}
                </p>
                <ul className={styles.nodes}>
                  {stage.nodes.map((n) => (
                    <li key={n.label} className={styles.node} data-kind={n.kind}>
                      <span className={styles.kind}>{KIND_LABEL[n.kind]}</span>
                      <span className={styles.nodeLabel}>{n.label}</span>
                      {n.note && <span className={styles.note}>{n.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.flows}>
        <p className={styles.flowsTitle}>How it connects</p>
        <ol>
          {diagram.flows.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
