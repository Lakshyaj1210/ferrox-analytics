import { Radar } from "lucide-react";
import type { AreaUnit, FieldSurveySession } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { SoilClassificationBadge } from "../ui/SoilClassificationBadge";
import { AreaUnitSelector } from "../ui/AreaUnitSelector";
import { centroid } from "../../lib/geo";

interface HeaderProps {
  session: FieldSurveySession;
  onFieldNameChange: (name: string) => void;
  areaUnit: AreaUnit;
  onAreaUnitChange: (unit: AreaUnit) => void;
}

function formatArea(session: FieldSurveySession, unit: AreaUnit): string {
  if (unit === "hectare") return session.areaHectares ? `${session.areaHectares} ha` : "—";
  if (unit === "bigha") return session.areaBigha ? `${session.areaBigha} bigha` : "—";
  return session.areaAcres ? `${session.areaAcres} ac` : "—";
}

export function Header({ session, onFieldNameChange, areaUnit, onAreaUnitChange }: HeaderProps) {
  const { lang, setLang, t } = useLanguage();
  const point = session.boundary.length > 0 ? session.boundary : session.samples;
  const zonePoint = point.length > 0 ? centroid(point) : null;

  return (
    <header className="border-b border-loam-700 bg-loam-950/90">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-chlorophyll-500/15">
            <Radar size={18} className="text-chlorophyll-400" strokeWidth={2} />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal-400">
              {t("teamTag")}
            </p>
            <h1 className="font-display text-lg font-semibold leading-tight text-parchment-100">
              {t("appTitle")}
            </h1>
          </div>
        </div>

        <div className="hidden flex-1 flex-col items-center gap-1.5 md:flex">
          <input
            value={session.fieldName}
            onChange={(e) => onFieldNameChange(e.target.value)}
            className="w-72 rounded border border-loam-700 bg-loam-900 px-3 py-1.5 text-center font-display text-sm text-parchment-100 outline-none focus:border-signal-500"
            aria-label={t("fieldNameLabel")}
          />
          {zonePoint && <SoilClassificationBadge lat={zonePoint.lat} lng={zonePoint.lng} />}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-parchment-300">{t("session")}</p>
            <p className="font-mono text-xs text-signal-300">{session.sessionId}</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[10px] uppercase tracking-widest text-parchment-300">{t("fieldArea")}</p>
            <p className="font-mono text-xs text-parchment-100">{formatArea(session, areaUnit)}</p>
          </div>
          <AreaUnitSelector value={areaUnit} onChange={onAreaUnitChange} />

          {/* EN | हिन्दी language switcher */}
          <div className="flex items-center overflow-hidden rounded-md border border-loam-600">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                lang === "en" ? "bg-signal-500 text-loam-950" : "bg-loam-800 text-parchment-300 hover:text-parchment-100"
              }`}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                lang === "hi" ? "bg-signal-500 text-loam-950" : "bg-loam-800 text-parchment-300 hover:text-parchment-100"
              }`}
              aria-pressed={lang === "hi"}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
