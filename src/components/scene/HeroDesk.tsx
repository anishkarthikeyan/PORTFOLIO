import Image from "next/image";
import desk from "../../../public/hero-desk.png";
import styles from "./HeroDesk.module.css";

/**
 * Objects in the hero picture that link to sections. Boxes are percentages of
 * the square image (left, top, width, height), drawn around each object.
 */
export const DESK_HOTSPOTS = [
  { id: "laptop", object: "Laptop", target: "Projects", href: "/#projects", box: [34.5, 63, 39.5, 21.5] },
  { id: "headphones", object: "Headphones", target: "Skills", href: "/#skills", box: [31.5, 39, 7, 11] },
  { id: "mug", object: "Mug", target: "Profile", href: "/#about", box: [13.5, 72, 14, 13] },
  { id: "plant", object: "Plant", target: "Experience", href: "/#experience", box: [1.5, 63, 13, 21.5] },
  { id: "phone", object: "Phone", target: "Contact", href: "/#contact", box: [74.5, 81, 14.5, 6] },
] as const;

/** The developer at the desk: one picture, with its objects as links. */
export function HeroDesk() {
  return (
    <div className={styles.frame}>
      <Image
        src={desk}
        alt="Pixel-art Anish at a desk with headphones, coding on a laptop, with a plant, a mug and a phone"
        priority
        placeholder="blur"
        sizes="(max-width: 860px) 100vw, 900px"
        className={styles.img}
      />
      {DESK_HOTSPOTS.map((h) => {
        const [left, top, width, height] = h.box;
        return (
          <a
            key={h.id}
            href={h.href}
            className={styles.hot}
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
            aria-label={`${h.object}: go to ${h.target}`}
          >
            <span className={styles.tip} aria-hidden="true">
              {h.object} → {h.target}
            </span>
          </a>
        );
      })}
    </div>
  );
}
