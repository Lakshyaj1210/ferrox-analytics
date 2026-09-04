import { Droplet } from "lucide-react";
import type { FertilizerPrescription } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { irrigationAdviceText } from "../../lib/i18n";

export function FertilizerPlan({
  plan,
  moisture,
  rainProbability = 0,
}: {
  plan: FertilizerPrescription | null;
  moisture?: number;
  rainProbability?: number;
}) {
  const { lang, t } = useLanguage();

  if (!plan) {
    return <p className="font-mono text-xs text-parchment-300">{t("noSampleSelectedShort")}</p>;
  }

  const items = [
    { label: "Urea", value: plan.adjustedUreaKgPerAcre, note: `${t("nDeficit")} ${plan.nitrogenDeficit} kg/ac` },
    { label: "DAP", value: plan.dapKgPerAcre, note: `${t("pDeficit")} ${plan.phosphorusDeficit} kg/ac` },
    { label: "MOP", value: plan.mopKgPerAcre, note: `${t("kDeficit")} ${plan.potassiumDeficit} kg/ac` },
  ];

  const irrigationText =
    moisture !== undefined
      ? irrigationAdviceText(moisture, lang, rainProbability)
      : plan.irrigationAdvice;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <div key={it.label} className="rounded-md border border-loam-700 bg-loam-800/60 p-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wide text-parchment-300">{it.label}</p>
            <p className="font-mono text-lg font-semibold text-parchment-100">{it.value}</p>
            <p className="font-mono text-[9px] text-parchment-300">{t("kgPerAcre")}</p>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 rounded-md border border-signal-500/30 bg-signal-500/10 p-3">
        <Droplet size={15} className="mt-0.5 shrink-0 text-signal-400" />
        <p className="text-xs leading-relaxed text-parchment-100">{irrigationText}</p>
      </div>
      {items.some((it) => it.value === 0) && (
        <p className="font-mono text-[10px] text-parchment-300">{t("zeroDosageNote")}</p>
      )}
    </div>
  );
}
