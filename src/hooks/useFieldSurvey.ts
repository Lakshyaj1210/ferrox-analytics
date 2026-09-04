import { useCallback, useMemo, useState } from "react";
import type { DataSourceMode, FieldSurveySession, GPSWaypoint, TelemetryPayload } from "../types";
import { computeFieldArea } from "../lib/geo";

function newSessionId() {
  return `FERROX-${Date.now().toString(36).toUpperCase()}`;
}

export function useFieldSurvey() {
  const [session, setSession] = useState<FieldSurveySession>(() => ({
    sessionId: newSessionId(),
    fieldName: "Untitled Field",
    createdAt: new Date().toISOString(),
    dataSource: "mock",
    boundary: [],
    samples: [],
  }));

  const setDataSource = useCallback((mode: DataSourceMode) => {
    setSession((s) => ({ ...s, dataSource: mode }));
  }, []);

  const setBoundary = useCallback((boundary: GPSWaypoint[]) => {
    setSession((s) => {
      const { areaAcres, areaHectares, areaBigha } = computeFieldArea(boundary);
      return { ...s, boundary, areaAcres, areaHectares, areaBigha };
    });
  }, []);

  const addSample = useCallback((sample: TelemetryPayload) => {
    setSession((s) => {
      const existingIdx = s.samples.findIndex((x) => x.packetId === sample.packetId);
      const samples =
        existingIdx >= 0
          ? s.samples.map((x, i) => (i === existingIdx ? sample : x))
          : [...s.samples, sample];
      return { ...s, samples };
    });
  }, []);

  const loadFullSurvey = useCallback(
    (payload: { fieldName?: string; boundary: GPSWaypoint[]; samples: TelemetryPayload[] }) => {
      setSession((s) => {
        const { areaAcres, areaHectares, areaBigha } = computeFieldArea(payload.boundary);
        return {
          ...s,
          fieldName: payload.fieldName ?? s.fieldName,
          boundary: payload.boundary,
          samples: payload.samples,
          areaAcres,
          areaHectares,
          areaBigha,
        };
      });
    },
    []
  );

  const resetSession = useCallback(() => {
    setSession({
      sessionId: newSessionId(),
      fieldName: "Untitled Field",
      createdAt: new Date().toISOString(),
      dataSource: "mock",
      boundary: [],
      samples: [],
    });
  }, []);

  const setFieldName = useCallback((fieldName: string) => {
    setSession((s) => ({ ...s, fieldName }));
  }, []);

  const stats = useMemo(() => {
    const n = session.samples.length;
    const avg = (f: (t: TelemetryPayload) => number) => (n === 0 ? 0 : session.samples.reduce((sum, s) => sum + f(s), 0) / n);
    return {
      sampleCount: n,
      avgMoisture: round1(avg((s) => s.moisture)),
      avgTemperature: round1(avg((s) => s.temperature)),
      avgPh: round2(avg((s) => s.ph)),
      avgNitrogen: round1(avg((s) => s.nitrogen)),
      avgPhosphorus: round1(avg((s) => s.phosphorus)),
      avgPotassium: round1(avg((s) => s.potassium)),
    };
  }, [session.samples]);

  return { session, stats, setDataSource, setBoundary, addSample, loadFullSurvey, resetSession, setFieldName };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
