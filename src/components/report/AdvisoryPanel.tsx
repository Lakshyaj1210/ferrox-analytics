import { useState } from "react";
import { Sparkles, RefreshCw, Settings2 } from "lucide-react";
import type { AdvisoryResult, SoilHealthReport, WeatherForecastDay } from "../../types";
import { generateAdvisory } from "../../lib/gemini";
import { Badge } from "../ui/Panel";
import { useLanguage } from "../../context/LanguageContext";

export function AdvisoryPanel({
  report,
  weather,
}: {
  report: SoilHealthReport | null;
  weather: WeatherForecastDay[] | null;
}) {
  const { lang, t } = useLanguage();
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [advisory, setAdvisory] = useState<AdvisoryResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAdvisory() {
    if (!report) return;
    setLoading(true);
    const result = await generateAdvisory(report, weather, lang, apiKey || undefined);
    setAdvisory(result);
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={runAdvisory}
          disabled={!report || loading}
          className="flex items-center gap-2 rounded-md bg-chlorophyll-600 px-3 py-2 text-xs font-semibold text-loam-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {t("generateAdvisory")}
        </button>
        <button
          onClick={() => setShowKeyInput((s) => !s)}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-parchment-300 hover:text-signal-300"
        >
          <Settings2 size={12} /> {t("geminiKey")}
        </button>
      </div>

      {showKeyInput && (
        <div className="space-y-1">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t("geminiKeyPlaceholder")}
            className="w-full rounded border border-loam-700 bg-loam-800 px-2 py-1.5 font-mono text-[11px] text-parchment-100 outline-none focus:border-signal-500"
          />
          <p className="font-mono text-[10px] text-parchment-300">{t("geminiKeyNote")}</p>
        </div>
      )}

      {advisory && (
        <div className="space-y-2 rounded-md border border-loam-700 bg-loam-800/50 p-3">
          <div className="flex items-center justify-between">
            <Badge tone={advisory.source === "gemini" ? "signal" : "neutral"}>
              {advisory.source === "gemini" ? t("gemini") : t("offlineTemplate")}
            </Badge>
            <span className="font-mono text-[10px] text-parchment-300">
              {new Date(advisory.generatedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-parchment-100">{advisory.text}</p>
        </div>
      )}
    </div>
  );
}
