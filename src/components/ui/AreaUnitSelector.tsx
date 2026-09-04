import type { AreaUnit } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

const UNITS: { id: AreaUnit; key: "unitAcre" | "unitHectare" | "unitBigha" }[] = [
  { id: "acre", key: "unitAcre" },
  { id: "hectare", key: "unitHectare" },
  { id: "bigha", key: "unitBigha" },
];

export function AreaUnitSelector({
  value,
  onChange,
}: {
  value: AreaUnit;
  onChange: (unit: AreaUnit) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-loam-600" title={t("areaUnit")}>
      {UNITS.map((u) => (
        <button
          key={u.id}
          onClick={() => onChange(u.id)}
          className={`px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors ${
            value === u.id ? "bg-signal-500 text-loam-950" : "bg-loam-800 text-parchment-300 hover:text-parchment-100"
          }`}
          aria-pressed={value === u.id}
        >
          {t(u.key)}
        </button>
      ))}
    </div>
  );
}
