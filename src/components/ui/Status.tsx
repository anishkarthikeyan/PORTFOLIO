import type { ContentStatus } from "@/data/types";

/** Visible content-status label. Verified content renders nothing. */
export function StatusBadge({ status, label }: { status: ContentStatus; label?: string }) {
  if (status === "verified") return null;
  return (
    <span className={`badge ${status === "sample" ? "badge-sample" : "badge-draft"}`}>
      {label ?? (status === "sample" ? "Sample" : "Draft")}
    </span>
  );
}

/** Rendered wherever a real value has not been provided yet. */
export function ReplaceMe({ children = "REPLACE ME" }: { children?: React.ReactNode }) {
  return <span className="placeholder">{children}</span>;
}

/** Value-or-placeholder helper for metrics and counts. */
export function ValueOr({ value, fallback = "REPLACE ME" }: { value: string | number | null; fallback?: string }) {
  return value === null || value === "" ? <ReplaceMe>{fallback}</ReplaceMe> : <>{value}</>;
}

/** Notice shown at the top of sections that still contain sample content. */
export function SampleNotice({ children }: { children?: React.ReactNode }) {
  return (
    <p className="notice" role="note">
      <span className="badge badge-sample">Sample</span>
      <span>
        {children ??
          "Demonstration content — illustrative placeholders, not real work or verified results."}
      </span>
    </p>
  );
}

/**
 * Development-only reminder for unconfigured links. Renders nothing in
 * production so the public site never shows broken or fake links.
 */
export function DevPlaceholder({ hint }: { hint: string }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <span className="placeholder" title="Visible in development only">
      DEV · {hint}
    </span>
  );
}
