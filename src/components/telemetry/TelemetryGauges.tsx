import { Droplets, Thermometer, FlaskConical, Sprout, Gauge as GaugeIcon, Battery } from "lucide-react";
import type { TelemetryPayload } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface GaugeProps {
  icon: typeof Droplets;
  label: string;
  value: string;
  sub?: string;
  pct: number; // 0-100, drives the bar fill
  tone: "signal" | "chlorophyll" | "ochre" | "rust";
}

const TONE_BAR: Record<GaugeProps["tone"], string> = {
  signal: "bg-signal-400",
  chlorophyll: "bg-chlorophyll-500",
  ochre: "bg-ochre-500",
  rust: "bg-rust-500",
};
const TONE_ICON: Record<GaugeProps["tone"], string> = {
  signal: "text-signal-400",
  chlorophyll: "text-chlorophyll-400",
  ochre: "text-ochre-400",
  rust: "text-rust-400",
};

function GaugeCard({ icon: Icon, label, value, sub, pct, tone }: GaugeProps) {
  return (
    <div className="rounded-md border border-loam-700 bg-loam-800/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <Icon size={14} className={TONE_ICON[tone]} />
        <span className="font-mono text-[10px] uppercase tracking-wide text-parchment-300">{label}</span>
      </div>
      <p className="font-mono text-xl font-semibold text-parchment-100">{value}</p>
      {sub && <p className="mt-0.5 font-mono text-[10px] text-parchment-300">{sub}</p>}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-loam-700">
        <div
          className={`h-full rounded-full ${TONE_BAR[tone]} transition-all duration-500`}
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function TelemetryGauges({ sample }: { sample: TelemetryPayload | null }) {
  const { t } = useLanguage();

  if (!sample) {
    return (
      <div className="rounded-md border border-dashed border-loam-700 p-6 text-center font-mono text-xs text-parchment-300">
        {t("noSampleSelected")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <GaugeCard
        icon={Droplets}
        label={t("gaugeMoisture")}
        value={`${sample.moisture}%`}
        pct={sample.moisture}
        tone={sample.moisture < 35 || sample.moisture > 65 ? "rust" : "signal"}
      />
      <GaugeCard
        icon={Thermometer}
        label={t("gaugeSoilTemp")}
        value={`${sample.temperature}°C`}
        pct={(sample.temperature / 45) * 100}
        tone="ochre"
      />
      <GaugeCard
        icon={FlaskConical}
        label={t("gaugePh")}
        value={`${sample.ph}`}
        pct={(sample.ph / 14) * 100}
        tone={sample.ph < 5.5 || sample.ph > 8 ? "rust" : "chlorophyll"}
      />
      <GaugeCard
        icon={Sprout}
        label={t("gaugeNitrogen")}
        value={`${sample.nitrogen}`}
        sub={t("kgPerAcre")}
        pct={(sample.nitrogen / 70) * 100}
        tone="chlorophyll"
      />
      <GaugeCard
        icon={Sprout}
        label={t("gaugePhosphorus")}
        value={`${sample.phosphorus}`}
        sub={t("kgPerAcre")}
        pct={(sample.phosphorus / 35) * 100}
        tone="chlorophyll"
      />
      <GaugeCard
        icon={Sprout}
        label={t("gaugePotassium")}
        value={`${sample.potassium}`}
        sub={t("kgPerAcre")}
        pct={(sample.potassium / 45) * 100}
        tone="chlorophyll"
      />
      <GaugeCard
        icon={GaugeIcon}
        label={t("gaugeLandingStability")}
        value={`${sample.landingStability}`}
        pct={sample.landingStability}
        tone={sample.landingStability < 60 ? "rust" : "signal"}
      />
      {sample.batteryPercent !== undefined && (
        <GaugeCard
          icon={Battery}
          label={t("gaugeBattery")}
          value={`${sample.batteryPercent}%`}
          pct={sample.batteryPercent}
          tone={sample.batteryPercent < 25 ? "rust" : "signal"}
        />
      )}
    </div>
  );
}
