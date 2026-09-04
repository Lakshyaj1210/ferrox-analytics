import type { TelemetryPayload } from "../../types";
import { fertilityStatus, rankCrops } from "../../lib/agronomy";
import { StatusDot } from "../ui/Panel";
import { useLanguage } from "../../context/LanguageContext";

export function SampleList({
  samples,
  selectedId,
  onSelect,
}: {
  samples: TelemetryPayload[];
  selectedId: string | null;
  onSelect: (s: TelemetryPayload) => void;
}) {
  const { t } = useLanguage();

  if (samples.length === 0) {
    return <p className="font-mono text-xs text-parchment-300">{t("noLandingPoints")}</p>;
  }

  return (
    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
      {samples.map((s) => {
        const top = rankCrops(s, 1)[0];
        const status = fertilityStatus(top.score);
        const isSelected = s.packetId === selectedId;
        return (
          <button
            key={s.packetId}
            onClick={() => onSelect(s)}
            className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-left transition-colors ${
              isSelected ? "bg-signal-500/10 text-signal-300" : "hover:bg-loam-800/70"
            }`}
          >
            <span className="flex items-center gap-2 font-mono text-xs">
              <StatusDot status={status} />
              Sample #{s.sampleIndex}
              {s.recoveredFromSD && (
                <span className="rounded bg-ochre-500/10 px-1 text-[9px] text-ochre-400">SD</span>
              )}
            </span>
            <span className="font-mono text-[10px] text-parchment-300">
              {s.moisture}% · pH {s.ph}
            </span>
          </button>
        );
      })}
    </div>
  );
}
