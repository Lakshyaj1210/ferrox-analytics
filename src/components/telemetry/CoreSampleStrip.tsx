import type { TelemetryPayload } from "../../types";
import { fertilityStatus, rankCrops } from "../../lib/agronomy";
import { useLanguage } from "../../context/LanguageContext";

interface Band {
  label: string;
  value: string;
  pct: number; // fill 0-100
  color: string;
}

/**
 * Renders the probe's reading as a vertical "soil core" — visually
 * borrowing from geological core-sample logs, which is the closest real
 * analogue to what the drone's probe actually does (drives a sensor
 * package down through the soil column and reads back layered data).
 */
export function CoreSampleStrip({ sample }: { sample: TelemetryPayload | null }) {
  const { t } = useLanguage();
  if (!sample) return null;

  const top = rankCrops(sample, 1)[0];
  const status = fertilityStatus(top.score);

  const bands: Band[] = [
    { label: t("gaugeMoisture"), value: `${sample.moisture}%`, pct: sample.moisture, color: "#4FD1C5" },
    { label: t("gaugePh"), value: `${sample.ph}`, pct: (sample.ph / 14) * 100, color: "#8BAF3F" },
    { label: t("gaugeNitrogen"), value: `${sample.nitrogen}`, pct: (sample.nitrogen / 70) * 100, color: "#9DBE55" },
    { label: t("gaugePhosphorus"), value: `${sample.phosphorus}`, pct: (sample.phosphorus / 35) * 100, color: "#D98B2B" },
    { label: t("gaugePotassium"), value: `${sample.potassium}`, pct: (sample.potassium / 45) * 100, color: "#C96246" },
  ];

  const statusLabel =
    status === "optimal" ? t("statusFertile") : status === "moderate" ? t("statusWorkable") : t("statusDepleted");
  const statusColor = status === "optimal" ? "#8BAF3F" : status === "moderate" ? "#D98B2B" : "#B8452F";

  return (
    <div className="flex gap-4">
      {/* The core tube */}
      <div className="relative w-14 shrink-0 overflow-hidden rounded-full border border-loam-600 bg-loam-800">
        <div className="absolute inset-x-0 top-0 flex flex-col" style={{ height: "100%" }}>
          {bands.map((b, i) => (
            <div
              key={i}
              className="relative flex items-center justify-center border-b border-loam-950/40"
              style={{
                height: `${100 / bands.length}%`,
                background: `linear-gradient(180deg, ${b.color}55, ${b.color}22)`,
              }}
            >
              <div
                className="absolute left-0 top-0 h-full"
                style={{ width: `${Math.max(4, Math.min(100, b.pct))}%`, background: `${b.color}55` }}
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-parchment-100/10" />
      </div>

      {/* Legend / readout */}
      <div className="flex-1 space-y-1.5">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
          />
          <span className="font-display text-sm font-semibold text-parchment-100">
            {t("coreSample")} #{sample.sampleIndex} — {statusLabel}
          </span>
        </div>
        {bands.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-parchment-300">
              {b.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-loam-700">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(3, Math.min(100, b.pct))}%`, background: b.color }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-[11px] text-parchment-100">
              {b.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
