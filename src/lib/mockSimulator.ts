import type { GPSWaypoint, TelemetryPayload } from "../types";

/** Seeded PRNG so demo runs are reproducible across judges / re-runs. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface MockSurveyOptions {
  fieldName?: string;
  /** Approx. center of the demo field */
  centerLat?: number;
  centerLng?: number;
  /** Field footprint, meters (roughly square) */
  sizeMeters?: number;
  /** Sample grid resolution, e.g. 3 => 3x3 = 9 landing points */
  gridResolution?: number;
  seed?: number;
}

/**
 * Generates a realistic-looking rectangular boundary + a grid of sample
 * points whose soil metrics vary smoothly across the field (a dry corner,
 * a nutrient-poor corner, etc.) so the heatmap and crop ranking demo well
 * without any hardware connected.
 */
export function generateMockSurvey(opts: MockSurveyOptions = {}) {
  const {
    fieldName = "Demo Field — Jaipur Belt",
    centerLat = 26.9124,
    centerLng = 75.7873,
    sizeMeters = 140,
    gridResolution = 4,
    seed = 42,
  } = opts;

  const rand = mulberry32(seed);
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);
  const halfLat = sizeMeters / 2 / metersPerDegLat;
  const halfLng = sizeMeters / 2 / metersPerDegLng;

  // Slightly irregular quadrilateral boundary (more realistic than a
  // perfect rectangle — real field edges are never square).
  const jitter = () => (rand() - 0.5) * 0.15;
  const corners: [number, number][] = [
    [centerLat - halfLat * (1 + jitter()), centerLng - halfLng * (1 + jitter())],
    [centerLat - halfLat * (1 + jitter()), centerLng + halfLng * (1 + jitter())],
    [centerLat + halfLat * (1 + jitter()), centerLng + halfLng * (1 + jitter())],
    [centerLat + halfLat * (1 + jitter()), centerLng - halfLng * (1 + jitter())],
  ];

  const boundary: GPSWaypoint[] = [];
  let seq = 0;
  const segmentsPerEdge = 8;
  for (let e = 0; e < 4; e++) {
    const [lat1, lng1] = corners[e];
    const [lat2, lng2] = corners[(e + 1) % 4];
    for (let s = 0; s < segmentsPerEdge; s++) {
      const t = s / segmentsPerEdge;
      boundary.push({
        seq: seq++,
        lat: lerp(lat1, lat2, t) + (rand() - 0.5) * 0.00002,
        lng: lerp(lng1, lng2, t) + (rand() - 0.5) * 0.00002,
        altitude: 45 + rand() * 3,
        timestamp: new Date(Date.now() - (40 - seq) * 1500).toISOString(),
      });
    }
  }

  // Two independent smooth gradients across the field: one drives
  // moisture (e.g. a low corner that collects water), the other drives
  // nutrient richness (e.g. an old manure-treated corner).
  const moistureGradientAngle = rand() * Math.PI * 2;
  const nutrientGradientAngle = rand() * Math.PI * 2;

  const samples: TelemetryPayload[] = [];
  let sampleIndex = 0;
  for (let row = 0; row < gridResolution; row++) {
    for (let col = 0; col < gridResolution; col++) {
      const u = gridResolution === 1 ? 0.5 : row / (gridResolution - 1);
      const v = gridResolution === 1 ? 0.5 : col / (gridResolution - 1);

      const lat = centerLat - halfLat + 2 * halfLat * u;
      const lng = centerLng - halfLng + 2 * halfLng * v;

      const moistureField =
        0.5 + 0.5 * Math.sin(u * Math.cos(moistureGradientAngle) + v * Math.sin(moistureGradientAngle));
      const nutrientField =
        0.5 + 0.5 * Math.sin(u * Math.cos(nutrientGradientAngle) + v * Math.sin(nutrientGradientAngle) + 1.3);

      const noise = () => (rand() - 0.5) * 6;

      // Semi-arid / sandy loam conditions typical of eastern Rajasthan:
      // lower baseline moisture, slightly alkaline pH, low organic nitrogen,
      // moderate potassium, warmer soil temperatures.
      const moisture = clamp(lerp(18, 35, moistureField) + noise() * 0.6, 5, 60);
      const temperature = clamp(lerp(26, 38, 1 - moistureField * 0.3) + (rand() - 0.5) * 2, 15, 46);
      const ph = clamp(lerp(7.4, 8.1, nutrientField) + (rand() - 0.5) * 0.15, 6.8, 8.6);
      const nitrogen = clamp(lerp(8, 26, nutrientField) + noise() * 0.5, 0, 60);
      const phosphorus = clamp(lerp(5, 18, nutrientField) + noise() * 0.4, 0, 40);
      const potassium = clamp(lerp(14, 34, nutrientField) + noise() * 0.5, 0, 60);

      sampleIndex++;
      samples.push({
        packetId: `MOCK-${sampleIndex.toString().padStart(3, "0")}`,
        sampleIndex,
        timestamp: new Date(Date.now() - (gridResolution * gridResolution - sampleIndex) * 9000).toISOString(),
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        moisture: round1(moisture),
        temperature: round1(temperature),
        ph: round2(ph),
        nitrogen: round1(nitrogen),
        phosphorus: round1(phosphorus),
        potassium: round1(potassium),
        landingStability: Math.round(clamp(88 + (rand() - 0.5) * 20, 40, 100)),
        batteryPercent: Math.round(clamp(96 - sampleIndex * 3.2, 18, 100)),
        recoveredFromSD: rand() > 0.92,
      });
    }
  }

  return { fieldName, boundary, samples };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Streams a pre-generated mock survey one packet at a time, simulating a
 * live drone flight for demo purposes. Returns an unsubscribe function.
 */
export function streamMockSurvey(
  samples: TelemetryPayload[],
  onPacket: (packet: TelemetryPayload, index: number) => void,
  onDone?: () => void,
  intervalMs = 1200
) {
  let i = 0;
  const timer = setInterval(() => {
    if (i >= samples.length) {
      clearInterval(timer);
      onDone?.();
      return;
    }
    onPacket(samples[i], i);
    i++;
  }, intervalMs);
  return () => clearInterval(timer);
}
