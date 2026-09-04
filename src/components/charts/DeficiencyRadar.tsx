import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { CropMatchScore } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { cropName } from "../../lib/i18n";

export function DeficiencyRadar({ match }: { match: CropMatchScore | null }) {
  const { lang, t } = useLanguage();

  if (!match) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-parchment-300">
        {t("selectSampleForProfile")}
      </div>
    );
  }

  const data = [
    { factor: t("factorPh"), score: match.breakdown.ph },
    { factor: t("factorMoisture"), score: match.breakdown.moisture },
    { factor: t("factorTemp"), score: match.breakdown.temperature },
    { factor: t("factorNitrogen"), score: match.breakdown.nitrogen },
    { factor: t("factorPhosphorus"), score: match.breakdown.phosphorus },
    { factor: t("factorPotassium"), score: match.breakdown.potassium },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#3F3226" />
          <PolarAngleAxis dataKey="factor" tick={{ fill: "#CBBFA0", fontSize: 11, fontFamily: "monospace" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={cropName(match.crop, lang)}
            dataKey="score"
            stroke="#4FD1C5"
            fill="#4FD1C5"
            fillOpacity={0.28}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: "#2E2519",
              border: "1px solid #3F3226",
              borderRadius: 6,
              fontFamily: "monospace",
              fontSize: 11,
              color: "#EFE9DA",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
