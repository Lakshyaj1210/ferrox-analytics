import type { CropMatchScore } from "../../types";
import { Badge } from "../ui/Panel";
import { useLanguage } from "../../context/LanguageContext";
import { cropName, translateSeason } from "../../lib/i18n";

function scoreTone(score: number): "chlorophyll" | "ochre" | "rust" {
  if (score >= 75) return "chlorophyll";
  if (score >= 45) return "ochre";
  return "rust";
}

export function CropRankingCards({
  matches,
  onSelect,
  selectedCropId,
}: {
  matches: CropMatchScore[];
  onSelect: (m: CropMatchScore) => void;
  selectedCropId?: string;
}) {
  const { lang, t } = useLanguage();

  if (matches.length === 0) {
    return <p className="font-mono text-xs text-parchment-300">{t("noCropRanking")}</p>;
  }

  return (
    <div className="space-y-2">
      {matches.map((m, i) => (
        <button
          key={m.crop.id}
          onClick={() => onSelect(m)}
          className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
            selectedCropId === m.crop.id
              ? "border-signal-500 bg-signal-500/10"
              : "border-loam-700 bg-loam-800/50 hover:border-loam-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-parchment-300">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="font-display text-sm font-medium text-parchment-100">{cropName(m.crop, lang)}</p>
              <p className="font-mono text-[10px] uppercase tracking-wide text-parchment-300">
                {translateSeason(m.crop.season, lang)}
              </p>
            </div>
          </div>
          <Badge tone={scoreTone(m.score)}>{m.score}/100</Badge>
        </button>
      ))}
    </div>
  );
}
