import { useRef, useState } from "react";
import { Cable, FileUp, PlayCircle, Radio, StopCircle, Upload } from "lucide-react";
import { Panel } from "../ui/Panel";
import { Badge } from "../ui/Panel";
import type { DataSourceMode, TelemetryPayload } from "../../types";
import { generateMockSurvey, streamMockSurvey } from "../../lib/mockSimulator";
import { importFlightLog } from "../../lib/logImporter";
import { useWebSerial } from "../../hooks/useWebSerial";
import { useLanguage } from "../../context/LanguageContext";

interface DataSourcePanelProps {
  dataSource: DataSourceMode;
  onDataSourceChange: (mode: DataSourceMode) => void;
  onLoadFullSurvey: (payload: { fieldName?: string; boundary: import("../../types").GPSWaypoint[]; samples: TelemetryPayload[] }) => void;
  onAddSample: (sample: TelemetryPayload) => void;
  sampleCount: number;
}

const MODES: { id: DataSourceMode; key: "mockSimulator" | "usbSerial" | "importLog"; icon: typeof Radio }[] = [
  { id: "mock", key: "mockSimulator", icon: Radio },
  { id: "serial", key: "usbSerial", icon: Cable },
  { id: "file", key: "importLog", icon: FileUp },
];

export function DataSourcePanel({
  dataSource,
  onDataSourceChange,
  onLoadFullSurvey,
  onAddSample,
  sampleCount,
}: DataSourcePanelProps) {
  const { t } = useLanguage();
  const [isStreaming, setIsStreaming] = useState(false);
  const [importMsgs, setImportMsgs] = useState<{ warnings: string[]; errors: string[] } | null>(null);
  const stopStreamRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const serial = useWebSerial(onAddSample);

  function runMockSurvey(mode: "instant" | "live") {
    const survey = generateMockSurvey({ seed: Math.floor(Math.random() * 10000) });
    if (mode === "instant") {
      onLoadFullSurvey(survey);
      return;
    }
    onLoadFullSurvey({ fieldName: survey.fieldName, boundary: survey.boundary, samples: [] });
    setIsStreaming(true);
    stopStreamRef.current = streamMockSurvey(
      survey.samples,
      (packet) => onAddSample(packet),
      () => setIsStreaming(false),
      700
    );
  }

  function stopStreaming() {
    stopStreamRef.current?.();
    setIsStreaming(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importFlightLog(file);
    setImportMsgs({ warnings: result.warnings, errors: result.errors });
    if (result.samples.length > 0) {
      onLoadFullSurvey({
        fieldName: file.name.replace(/\.(json|csv)$/i, ""),
        boundary: result.boundary,
        samples: result.samples,
      });
    }
    e.target.value = "";
  }

  return (
    <Panel eyebrow={t("dataIngestion")} title={t("telemetrySource")} bodyClassName="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {MODES.map(({ id, key, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onDataSourceChange(id)}
            className={`flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 text-center transition-colors ${
              dataSource === id
                ? "border-signal-500 bg-signal-500/10 text-signal-300"
                : "border-loam-700 bg-loam-800/60 text-parchment-300 hover:border-loam-600"
            }`}
          >
            <Icon size={16} />
            <span className="font-mono text-[10px] uppercase leading-tight">{t(key)}</span>
          </button>
        ))}
      </div>

      {dataSource === "mock" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => runMockSurvey("instant")}
              className="flex-1 rounded-md bg-chlorophyll-600 px-3 py-2 text-xs font-semibold text-loam-950 hover:bg-chlorophyll-500"
            >
              {t("generateFullSurvey")}
            </button>
            {!isStreaming ? (
              <button
                onClick={() => runMockSurvey("live")}
                className="flex items-center gap-1.5 rounded-md border border-loam-600 px-3 py-2 text-xs font-semibold text-parchment-100 hover:border-signal-500"
              >
                <PlayCircle size={14} /> {t("liveDemo")}
              </button>
            ) : (
              <button
                onClick={stopStreaming}
                className="flex items-center gap-1.5 rounded-md border border-rust-500 px-3 py-2 text-xs font-semibold text-rust-400"
              >
                <StopCircle size={14} /> {t("stop")}
              </button>
            )}
          </div>
          {isStreaming && (
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-signal-300">
              <span className="pulse-ring inline-block h-1.5 w-1.5 rounded-full bg-signal-400" />
              {t("streamingPackets")} {sampleCount} {t("received")}
            </p>
          )}
          <p className="text-[11px] leading-relaxed text-parchment-300">{t("mockDescription")}</p>
        </div>
      )}

      {dataSource === "serial" && (
        <div className="space-y-2">
          {!serial.isSupported && (
            <p className="rounded border border-ochre-500/30 bg-ochre-500/10 p-2 text-[11px] text-ochre-400">
              {t("webSerialUnsupported")}
            </p>
          )}
          <div className="flex items-center gap-2">
            {!serial.isConnected ? (
              <button
                onClick={serial.connect}
                disabled={!serial.isSupported}
                className="flex-1 rounded-md bg-signal-500 px-3 py-2 text-xs font-semibold text-loam-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("connectEsp32")}
              </button>
            ) : (
              <button
                onClick={serial.disconnect}
                className="flex-1 rounded-md border border-rust-500 px-3 py-2 text-xs font-semibold text-rust-400"
              >
                {t("disconnect")}
              </button>
            )}
            {serial.isConnected && <Badge tone="signal">{t("live")}</Badge>}
          </div>
          {serial.error && (
            <p className="rounded border border-rust-500/30 bg-rust-500/10 p-2 text-[11px] text-rust-400">
              {serial.error}
            </p>
          )}
          {serial.lastRawLine && (
            <p className="truncate rounded bg-loam-800 p-2 font-mono text-[10px] text-parchment-300">
              {serial.lastRawLine}
            </p>
          )}
          <p className="text-[11px] leading-relaxed text-parchment-300">{t("serialDescription")}</p>
        </div>
      )}

      {dataSource === "file" && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-loam-600 px-3 py-4 text-xs font-semibold text-parchment-200 hover:border-signal-500 hover:text-signal-300"
          >
            <Upload size={16} /> {t("chooseFile")}
          </button>
          {importMsgs && (
            <div className="space-y-1 text-[11px]">
              {importMsgs.errors.map((m, i) => (
                <p key={i} className="rounded border border-rust-500/30 bg-rust-500/10 p-1.5 text-rust-400">
                  {m}
                </p>
              ))}
              {importMsgs.warnings.slice(0, 4).map((m, i) => (
                <p key={i} className="rounded border border-ochre-500/30 bg-ochre-500/10 p-1.5 text-ochre-400">
                  {m}
                </p>
              ))}
              {importMsgs.warnings.length > 4 && (
                <p className="text-parchment-300">…and {importMsgs.warnings.length - 4} more warnings.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
