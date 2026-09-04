import { CloudRain, CloudSun } from "lucide-react";
import type { WeatherForecastDay } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { translateWeatherCode } from "../../lib/i18n";

export function WeatherStrip({ forecast, loading }: { forecast: WeatherForecastDay[] | null; loading: boolean }) {
  const { lang, t } = useLanguage();

  if (loading) {
    return <p className="font-mono text-xs text-parchment-300">{t("fetchingForecast")}</p>;
  }
  if (!forecast) {
    return (
      <p className="flex items-center gap-2 font-mono text-xs text-parchment-300">
        <CloudSun size={14} /> {t("weatherUnavailable")}
      </p>
    );
  }
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {forecast.map((d) => (
        <div
          key={d.date}
          className="flex min-w-[76px] flex-col items-center gap-1 rounded-md border border-loam-700 bg-loam-800/60 px-2 py-2"
        >
          <span className="font-mono text-[10px] text-parchment-300">
            {new Date(d.date).toLocaleDateString(lang === "hi" ? "hi-IN" : undefined, { weekday: "short" })}
          </span>
          <CloudRain size={14} className="text-signal-400" />
          <span className="font-mono text-[10px] text-parchment-100">{translateWeatherCode(d.weatherCode, lang)}</span>
          <span className="font-mono text-[11px] font-semibold text-parchment-100">
            {Math.round(d.tempMinC)}–{Math.round(d.tempMaxC)}°
          </span>
          <span className="font-mono text-[10px] text-signal-300">
            {d.precipitationProbability}% {t("rain")}
          </span>
        </div>
      ))}
    </div>
  );
}
