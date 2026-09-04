# FERROX Ground Analytics Station

Ground Station web app for the Team FERROX Autonomous Agricultural Survey Drone (SIH 2026).
React + Vite + TypeScript + Tailwind CSS.

## Quick start

```bash
npm install
npm run dev       # local dev server
npm run build     # production build -> dist/
```

No API keys are required to run the full demo. The Mock Simulator generates a
realistic multi-point survey centered near **Jaipur, Rajasthan** (26.9124,
75.7873) with spatially-varying semi-arid moisture/NPK gradients, so every
module (map, heatmap, crop ranking, fertilizer calc, PDF export) works
completely offline.

## Bilingual (English / Hindi)

Toggle **EN | हिन्दी** in the header. This switches:
- All UI labels, gauge titles, and status indicators (`src/lib/i18n.ts`)
- Crop names (गेहूँ, सरसों, बाजरा, कपास, ग्वार, …)
- Fertilizer dosages and irrigation advice text
- The Gemini prompt (requests full Devanagari output) and its offline
  fallback template
- The exported Soil Health Card PDF

**Technical note on the Hindi PDF:** jsPDF's built-in text renderer does not
perform OpenType shaping, so embedding a Devanagari font directly produces
broken conjuncts/matras. `src/lib/canvasText.ts` works around this by
rasterizing each Hindi text block on an offscreen `<canvas>` (the browser's
own text engine shapes Devanagari correctly) and placing the resulting PNG
into the PDF via `jsPDF.addImage`. The bundled webfont lives in
`public/fonts/NotoSansDevanagari-Regular.woff2` (subset from
`@fontsource/noto-sans-devanagari`). English PDFs still use fast vector text
via `jspdf-autotable`.

Optional integrations:
- **Gemini advisory** — paste a free-tier Gemini API key in the "Farmer
  Advisory" panel. Without a key, a deterministic offline template is used
  instead (in the selected language), so the demo never breaks without
  internet access.
- **Open-Meteo weather** — used automatically once a field boundary or
  sample point exists; no key needed. Fails soft if offline.

## Regional soil classification & land units

- A GPS-bounding-box classifier (`src/lib/soilClassification.ts`) tags the
  survey with an indicative ICAR-style soil macro-zone — e.g. "Arid / Sandy
  Loam Soil — Eastern Rajasthan" — shown as a badge in the header.
- Field area can be displayed in **Acres**, **Hectares**, or **Bigha**
  (1 acre ≈ 1.61 Pucca Bigha, the Rajasthan standard) via the selector next
  to the area readout.

## Project structure

```
src/
  types/index.ts            Core TS interfaces (TelemetryPayload, CropBenchmark, ...)
  data/cropBenchmarks.ts    Offline agronomic benchmark matrix (17 crops)
  lib/
    geo.ts                  Shoelace area formula, lat/lng -> local XY, IDW interpolation
    agronomy.ts             Crop scoring engine, fertilizer calculator, irrigation trigger
    mockSimulator.ts        Seeded mock survey generator + live packet streamer
    logImporter.ts          CSV/JSON flight-log importer with validation
    weather.ts               Open-Meteo integration
    gemini.ts                Gemini advisory + offline fallback template
    pdfReport.ts             Soil Health Card PDF generator (jsPDF)
  hooks/
    useWebSerial.ts          Browser USB Serial connection to ESP32 (115200 baud)
    useFieldSurvey.ts        Central survey session state
  components/
    layout/Header.tsx
    ingestion/DataSourcePanel.tsx   Mock / Serial / File import controls
    map/FieldMap.tsx               Leaflet boundary + heatmap + markers
    telemetry/                     Gauges, core-sample strip, sample list
    charts/DeficiencyRadar.tsx     Recharts radar of the 6 scoring factors
    crops/CropRankingCards.tsx
    report/                        Fertilizer plan, weather strip, advisory panel
    ui/Panel.tsx                   Shared panel/badge primitives
  App.tsx                    Dashboard layout
```

## Data flow

1. A `TelemetryPayload` arrives from one of three sources (Mock, Serial, or
   File import) and is appended to the `FieldSurveySession` via
   `useFieldSurvey`.
2. `lib/agronomy.ts` scores every sample against the 17-crop benchmark
   matrix (`rankCrops`), picks the best fit, and computes a fertilizer
   prescription (`calculateFertilizer`).
3. `lib/geo.ts` computes field acreage from the boundary log (Shoelace
   formula) and interpolates a fertility heatmap from sparse samples
   (inverse-distance weighting).
4. The dashboard renders live telemetry, the map, crop rankings, and a
   fertilizer/irrigation plan; `lib/gemini.ts` optionally turns the
   structured report into a farmer-friendly paragraph; `lib/pdfReport.ts`
   exports the whole thing as a one-page PDF.

## Extending the crop matrix

Add entries to `src/data/cropBenchmarks.ts` — each `CropBenchmark` just
needs pH/moisture/temperature ranges and N/P/K targets (kg/acre). No other
code changes are required; the scoring engine, ranking UI, and PDF export
all read from this single source of truth.

## Notes on accuracy

The agronomic ranges are indicative planning values for a rule-based demo
engine, not a substitute for certified lab soil testing or local
Krishi Vigyan Kendra (KVK) advisory — this is stated on the exported PDF.
