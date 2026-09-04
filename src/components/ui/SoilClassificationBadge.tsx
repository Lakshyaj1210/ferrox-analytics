import { Mountain } from "lucide-react";
import { classifySoilZone } from "../../lib/soilClassification";
import { useLanguage } from "../../context/LanguageContext";

export function SoilClassificationBadge({ lat, lng }: { lat: number; lng: number }) {
  const { lang, t } = useLanguage();
  const zone = classifySoilZone(lat, lng);
  const label = lang === "hi" ? zone.labelHi : zone.labelEn;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-ochre-500/30 bg-ochre-500/10 px-3 py-1"
      title={t("icarClassification")}
    >
      <Mountain size={11} className="text-ochre-400" />
      <span className="font-mono text-[10px] uppercase tracking-wide text-ochre-400">
        {t("icarClassification")}:
      </span>
      <span className="font-mono text-[10px] text-parchment-100">{label}</span>
    </div>
  );
}
