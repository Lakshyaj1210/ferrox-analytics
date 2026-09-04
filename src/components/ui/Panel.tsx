import type { PropsWithChildren, ReactNode } from "react";

interface PanelProps {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  eyebrow,
  action,
  className = "",
  bodyClassName = "",
  children,
}: PropsWithChildren<PanelProps>) {
  return (
    <section
      className={`rounded-lg border border-loam-700 bg-loam-900/80 shadow-panel backdrop-blur-sm ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-loam-700 px-4 py-3">
          <div>
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal-400">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="font-display text-sm font-semibold text-parchment-100">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function StatusDot({ status }: { status: "optimal" | "moderate" | "deficient" }) {
  const color =
    status === "optimal" ? "bg-chlorophyll-500" : status === "moderate" ? "bg-ochre-500" : "bg-rust-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "signal" | "ochre" | "rust" | "chlorophyll" }>) {
  const tones: Record<string, string> = {
    neutral: "bg-loam-700 text-parchment-200 border-loam-600",
    signal: "bg-signal-500/10 text-signal-300 border-signal-500/30",
    ochre: "bg-ochre-500/10 text-ochre-400 border-ochre-500/30",
    rust: "bg-rust-500/10 text-rust-400 border-rust-500/30",
    chlorophyll: "bg-chlorophyll-500/10 text-chlorophyll-400 border-chlorophyll-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
