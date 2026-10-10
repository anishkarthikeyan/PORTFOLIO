interface SectionHeaderProps {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  lede?: React.ReactNode;
  children?: React.ReactNode;
}

/** Shared section heading. `id` is applied to the h2 for aria-labelledby. */
export function SectionHeader({ id, index, eyebrow, title, lede, children }: SectionHeaderProps) {
  return (
    <header className="section-head" data-reveal>
      <p className="eyebrow">
        <span aria-hidden="true">{index} — </span>
        {eyebrow}
      </p>
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {lede && <p className="section-lede">{lede}</p>}
      {children}
    </header>
  );
}
