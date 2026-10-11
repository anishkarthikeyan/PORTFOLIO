import { Corridor } from "@/components/journey/Corridor";
import { WorldMap } from "@/components/worldmap/WorldMap";
import styles from "./WorldSelect.module.css";

/**
 * World map: the six worlds of the portfolio as an overworld. Every node is
 * a normal link to its section; the character walks the path beneath it.
 * The same map opens from the header as the pause menu.
 */
export function WorldSelect() {
  return (
    <section id="world" className={styles.section} aria-labelledby="world-title">
      <div className="container">
        <div className={styles.head} data-reveal>
          <p className="eyebrow">World map</p>
          <h2 id="world-title" className={styles.title}>
            Choose a world
          </h2>
          <p className={styles.hint}>
            Each world is a part of the portfolio. Jump straight in, or keep scrolling to travel through all six.
          </p>
        </div>
        <WorldMap variant="inline" />
        {/* Overworld path: the character walks node to node under the map. */}
        <Corridor id="overworld" world={1} label="Overworld" theme="map" stopSelector="[data-world-node]" stopKind="node" />
      </div>
    </section>
  );
}
