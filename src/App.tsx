import { useEffect, useMemo, useState } from "react";
import { FileDown, Layers, RefreshCw } from "lucide-react";
import { Header } from "./components/layout/Header";
import { DataSourcePanel } from "./components/ingestion/DataSourcePanel";
import { SampleList } from "./components/telemetry/SampleList";
import { FieldMap } from "./components/map/FieldMap";
import { TelemetryGauges } from "./components/telemetry/TelemetryGauges";
import { CoreSampleStrip } from "./components/telemetry/CoreSampleStrip";
import { DeficiencyRadar } from "./components/charts/DeficiencyRadar";
import { CropRankingCards } from "./components/crops/CropRankingCards";
import { FertilizerPlan } from "./components/report/FertilizerPlan";
import { WeatherStrip } from "./components/report/WeatherStrip";
import { AdvisoryPanel } from "./components/report/AdvisoryPanel";
import { Panel } from "./components/ui/Panel";
import { useFieldSurvey } from "./hooks/useFieldSurvey";
import { calculateFertilizer, fertilityStatus, rankCrops } from "./lib/agronomy";
import { centroid } from "./lib/geo";
import { fetchWeatherForecast } from "./lib/weather";
import { generateSoilHealthCardPDF } from "./lib/pdfReport";
import { useLanguage } from "./context/LanguageContext";
import type { AreaUnit, CropMatchScore, TelemetryPayload, WeatherForecastDay } from "./types";

const HEATMAP_METRICS = [
  { id: "moisture", key: "metricMoisture" },
  { id: "nitrogen", key: "metricNitrogen" },
  { id: "phosphorus", key: "metricPhosphorus" },
  { id: "potassium", key: "metricPotassium" },
] as const;

function App() {
  const { t, lang } = useLanguage();
  const { session, setDataSource, setBoundary, addSample, loadFullSurvey, setFieldName } = useFieldSurvey();
  const [selectedSample, setSelectedSample] = useState<TelemetryPayload | null>(null);
  const [selectedCropMatch, setSelectedCropMatch] = useState<CropMatchScore | null>(null);
  const [heatmapMetric, setHeatmapMetric] = useState<(typeof HEATMAP_METRICS)[number]["id"]>("moisture");
  const [weather, setWeather] = useState<WeatherForecastDay[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("acre");
  const [exportingPdf, setExportingPdf] = useState(false);

  // Auto-select the latest sample as it streams in.
  useEffect(() => {
    if (session.samples.length === 0) return;
    const latest = session.samples[session.samples.length - 1];
    setSelectedSample((prev) => prev ?? latest);
  }, [session.samples]);

  useEffect(() => {
    if (!selectedSample) return;
    const ranked = rankCrops(selectedSample, 6);
    setSelectedCropMatch(ranked[0]);
  }, [selectedSample]);

  // Fetch weather once we have geo data, based on the field centroid
  // (defaults to Jaipur, Rajasthan via lib/geo.ts's centroid() fallback).
  useEffect(() => {
    const points = session.boundary.length > 0 ? session.boundary : session.samples;
    if (points.length === 0) return;
    const c = centroid(points);
    setWeatherLoading(true);
    fetchWeatherForecast(c.lat, c.lng)
      .then(setWeather)
      .finally(() => setWeatherLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.samples.length > 0, session.boundary.length]);

  const topCrops = useMemo(
    () => (selectedSample ? rankCrops(selectedSample, 6) : []),
    [selectedSample]
  );

  const fertilizer = useMemo(() => {
    if (!selectedSample || !selectedCropMatch) return null;
    return calculateFertilizer(selectedSample, selectedCropMatch.crop);
  }, [selectedSample, selectedCropMatch]);

  const report = useMemo(() => {
    if (!selectedSample || !fertilizer || topCrops.length === 0) return null;
    return {
      sample: selectedSample,
      fertilityStatus: fertilityStatus(topCrops[0].score),
      topCrops,
      fertilizer,
    };
  }, [selectedSample, fertilizer, topCrops]);

  function handleLoadFullSurvey(payload: Parameters<typeof loadFullSurvey>[0]) {
    loadFullSurvey(payload);
    setBoundary(payload.boundary);
    setSelectedSample(null);
  }

  async function handleExportPdf() {
    if (!report) return;
    setExportingPdf(true);
    try {
      await generateSoilHealthCardPDF(session, report, null, lang, areaUnit);
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="min-h-screen bg-loam-950">
      <Header
        session={session}
        onFieldNameChange={setFieldName}
        areaUnit={areaUnit}
        onAreaUnitChange={setAreaUnit}
      />

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-6 py-5 lg:grid-cols-12">
        {/* LEFT: Ingestion + sample list */}
        <div className="space-y-4 lg:col-span-3">
          <DataSourcePanel
            dataSource={session.dataSource}
            onDataSourceChange={setDataSource}
            onLoadFullSurvey={handleLoadFullSurvey}
            onAddSample={addSample}
            sampleCount={session.samples.length}
          />
          <Panel eyebrow={`${session.samples.length} ${t("landings")}`} title={t("samplePoints")}>
            <SampleList
              samples={session.samples}
              selectedId={selectedSample?.packetId ?? null}
              onSelect={setSelectedSample}
            />
          </Panel>
        </div>

        {/* CENTER: Map + core sample */}
        <div className="space-y-4 lg:col-span-5">
          <Panel
            eyebrow={t("spatialMappingEngine")}
            title={t("fieldBoundaryHeatmap")}
            action={
              <div className="flex items-center gap-1 rounded-md border border-loam-700 bg-loam-800/60 p-0.5">
                <Layers size={12} className="ml-1.5 text-parchment-300" />
                {HEATMAP_METRICS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setHeatmapMetric(m.id)}
                    className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${
                      heatmapMetric === m.id
                        ? "bg-signal-500 text-loam-950"
                        : "text-parchment-300 hover:text-parchment-100"
                    }`}
                  >
                    {t(m.key)}
                  </button>
                ))}
              </div>
            }
            bodyClassName="p-0 overflow-hidden rounded-b-lg"
          >
            <div className="h-[420px]">
              <FieldMap
                session={session}
                heatmapMetric={heatmapMetric}
                selectedSampleId={selectedSample?.packetId ?? null}
                onSelectSample={setSelectedSample}
              />
            </div>
          </Panel>

          <Panel eyebrow={t("probeReadout")} title={t("soilCoreSample")}>
            <CoreSampleStrip sample={selectedSample} />
          </Panel>

          <Panel eyebrow={t("sensorHub")} title={t("liveTelemetry")}>
            <TelemetryGauges sample={selectedSample} />
          </Panel>
        </div>

        {/* RIGHT: Analytics + report */}
        <div className="space-y-4 lg:col-span-4">
          <Panel eyebrow={t("hybridAgronomicEngine")} title={t("deficiencyProfile")}>
            <DeficiencyRadar match={selectedCropMatch} />
          </Panel>

          <Panel eyebrow={t("offlineMatching")} title={t("cropRanking")}>
            <CropRankingCards
              matches={topCrops}
              onSelect={setSelectedCropMatch}
              selectedCropId={selectedCropMatch?.crop.id}
            />
          </Panel>

          <Panel eyebrow={t("commercialDosage")} title={t("fertilizerPrescription")}>
            <FertilizerPlan plan={fertilizer} moisture={selectedSample?.moisture} />
          </Panel>

          <Panel eyebrow={t("openMeteo")} title={t("sevenDayForecast")}>
            <WeatherStrip forecast={weather} loading={weatherLoading} />
          </Panel>

          <Panel eyebrow={t("geminiFreeTier")} title={t("farmerAdvisory")}>
            <AdvisoryPanel report={report} weather={weather} />
          </Panel>

          <button
            disabled={!report || exportingPdf}
            onClick={handleExportPdf}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-loam-600 bg-loam-800 px-4 py-3 text-sm font-semibold text-parchment-100 transition-colors hover:border-signal-500 hover:text-signal-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exportingPdf ? <RefreshCw size={16} className="animate-spin" /> : <FileDown size={16} />}
            {t("exportPdf")}
          </button>
        </div>
      </main>

      <footer className="mx-auto max-w-[1400px] px-6 pb-8 pt-2">
        <p className="font-mono text-[10px] text-parchment-300">{t("disclaimer")}</p>
      </footer>
    </div>
  );
}

export default App;
