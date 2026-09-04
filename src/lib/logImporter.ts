import Papa from "papaparse";
import type { GPSWaypoint, TelemetryPayload } from "../types";

export interface ImportResult {
  samples: TelemetryPayload[];
  boundary: GPSWaypoint[];
  warnings: string[];
  errors: string[];
}

const REQUIRED_SAMPLE_FIELDS = [
  "lat",
  "lng",
  "moisture",
  "temperature",
  "ph",
  "nitrogen",
  "phosphorus",
  "potassium",
];

function toNumber(v: unknown, field: string, row: number, warnings: string[]): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (Number.isNaN(n)) {
    warnings.push(`Row ${row}: field "${field}" is not numeric — defaulted to 0.`);
    return 0;
  }
  return n;
}

/** Normalizes one loosely-typed record into a TelemetryPayload, collecting warnings. */
function coerceSample(
  raw: Record<string, unknown>,
  index: number,
  warnings: string[]
): TelemetryPayload | null {
  const missing = REQUIRED_SAMPLE_FIELDS.filter((f) => raw[f] === undefined || raw[f] === "");
  if (missing.length > 0) {
    warnings.push(`Row ${index}: missing field(s) [${missing.join(", ")}] — row skipped.`);
    return null;
  }
  return {
    packetId: String(raw.packetId ?? raw.packet_id ?? `IMPORT-${index}`),
    sampleIndex: Number(raw.sampleIndex ?? raw.sample_index ?? index),
    timestamp: String(raw.timestamp ?? new Date().toISOString()),
    lat: toNumber(raw.lat, "lat", index, warnings),
    lng: toNumber(raw.lng, "lng", index, warnings),
    moisture: toNumber(raw.moisture, "moisture", index, warnings),
    temperature: toNumber(raw.temperature, "temperature", index, warnings),
    ph: toNumber(raw.ph, "ph", index, warnings),
    nitrogen: toNumber(raw.nitrogen, "nitrogen", index, warnings),
    phosphorus: toNumber(raw.phosphorus, "phosphorus", index, warnings),
    potassium: toNumber(raw.potassium, "potassium", index, warnings),
    landingStability: toNumber(raw.landingStability ?? raw.landing_stability ?? 100, "landingStability", index, warnings),
    batteryPercent: raw.batteryPercent !== undefined ? toNumber(raw.batteryPercent, "batteryPercent", index, warnings) : undefined,
    recoveredFromSD: Boolean(raw.recoveredFromSD ?? raw.recovered_from_sd ?? false),
  };
}

function coerceWaypoint(raw: Record<string, unknown>, index: number, warnings: string[]): GPSWaypoint | null {
  if (raw.lat === undefined || raw.lng === undefined) {
    warnings.push(`Boundary row ${index}: missing lat/lng — point skipped.`);
    return null;
  }
  return {
    seq: Number(raw.seq ?? index),
    lat: toNumber(raw.lat, "lat", index, warnings),
    lng: toNumber(raw.lng, "lng", index, warnings),
    altitude: raw.altitude !== undefined ? toNumber(raw.altitude, "altitude", index, warnings) : undefined,
    timestamp: String(raw.timestamp ?? new Date().toISOString()),
  };
}

/**
 * Accepts either:
 *  - A JSON object: { boundary: [...], samples: [...] }
 *  - A JSON array of sample rows (treated as `samples` only)
 *  - A CSV file of sample rows (headers matching TelemetryPayload field names)
 */
export async function importFlightLog(file: File): Promise<ImportResult> {
  const text = await file.text();
  const warnings: string[] = [];
  const errors: string[] = [];

  if (file.name.toLowerCase().endsWith(".json")) {
    try {
      const parsed = JSON.parse(text);
      let rawSamples: Record<string, unknown>[] = [];
      let rawBoundary: Record<string, unknown>[] = [];
      if (Array.isArray(parsed)) {
        rawSamples = parsed;
      } else {
        rawSamples = Array.isArray(parsed.samples) ? parsed.samples : [];
        rawBoundary = Array.isArray(parsed.boundary) ? parsed.boundary : [];
      }
      const samples = rawSamples
        .map((r, i) => coerceSample(r, i + 1, warnings))
        .filter((r): r is TelemetryPayload => r !== null);
      const boundary = rawBoundary
        .map((r, i) => coerceWaypoint(r, i + 1, warnings))
        .filter((r): r is GPSWaypoint => r !== null);
      if (samples.length === 0) errors.push("No valid sample rows found in JSON file.");
      return { samples, boundary, warnings, errors };
    } catch (e) {
      errors.push(`Invalid JSON: ${(e as Error).message}`);
      return { samples: [], boundary: [], warnings, errors };
    }
  }

  // CSV path
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          result.errors.forEach((e) => warnings.push(`CSV parse warning: ${e.message} (row ${e.row})`));
        }
        const samples = result.data
          .map((r, i) => coerceSample(r, i + 1, warnings))
          .filter((r): r is TelemetryPayload => r !== null);
        if (samples.length === 0) errors.push("No valid sample rows found in CSV file.");
        resolve({ samples, boundary: [], warnings, errors });
      },
      error: (err: Error) => {
        errors.push(`Failed to parse CSV: ${err.message}`);
        resolve({ samples: [], boundary: [], warnings, errors });
      },
    });
  });
}
