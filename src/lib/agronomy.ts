import { CROP_BENCHMARKS } from "../data/cropBenchmarks";
import type {
  CropBenchmark,
  CropMatchScore,
  FertilityStatus,
  FertilizerPrescription,
  SoilHealthReport,
  TelemetryPayload,
} from "../types";

/**
 * Scores how far a measured value sits inside (or outside) a benchmark
 * range. 100 = comfortably inside the range, decaying to 0 the further the
 * value strays outside it (tolerance = half the range width, floor of 20%).
 */
function rangeScore(value: number, [lo, hi]: [number, number]): number {
  if (value >= lo && value <= hi) return 100;
  const width = Math.max(hi - lo, 0.001);
  const tolerance = Math.max(width * 0.6, width * 0.2);
  const distance = value < lo ? lo - value : value - hi;
  const score = 100 * (1 - distance / tolerance);
  return Math.max(0, Math.round(score));
}

/** Weighted multi-factor suitability score against a single crop benchmark. */
export function scoreCrop(sample: TelemetryPayload, crop: CropBenchmark): CropMatchScore {
  const breakdown = {
    ph: rangeScore(sample.ph, crop.phRange),
    moisture: rangeScore(sample.moisture, crop.moistureRange),
    temperature: rangeScore(sample.temperature, crop.tempRange),
    nitrogen: rangeScore(sample.nitrogen, crop.targetN),
    phosphorus: rangeScore(sample.phosphorus, crop.targetP),
    potassium: rangeScore(sample.potassium, crop.targetK),
  };
  // pH and moisture are the strongest viability gates; NPK is correctable
  // via fertilizer, so it is weighted lower than the two soil-physical factors.
  const weights = {
    ph: 0.25,
    moisture: 0.25,
    temperature: 0.15,
    nitrogen: 0.12,
    phosphorus: 0.11,
    potassium: 0.12,
  };
  const score = Math.round(
    breakdown.ph * weights.ph +
      breakdown.moisture * weights.moisture +
      breakdown.temperature * weights.temperature +
      breakdown.nitrogen * weights.nitrogen +
      breakdown.phosphorus * weights.phosphorus +
      breakdown.potassium * weights.potassium
  );
  return { crop, score, breakdown };
}

/** Ranks every crop in the benchmark matrix for a given sample; top N returned. */
export function rankCrops(sample: TelemetryPayload, topN = 5): CropMatchScore[] {
  return CROP_BENCHMARKS.map((crop) => scoreCrop(sample, crop))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/** Nutrient deficit = max(0, target midpoint - tested level). */
function deficit(tested: number, target: [number, number]): number {
  const midpoint = (target[0] + target[1]) / 2;
  return Math.max(0, Math.round((midpoint - tested) * 100) / 100);
}

export function calculateFertilizer(
  sample: TelemetryPayload,
  crop: CropBenchmark
): FertilizerPrescription {
  const nitrogenDeficit = deficit(sample.nitrogen, crop.targetN);
  const phosphorusDeficit = deficit(sample.phosphorus, crop.targetP);
  const potassiumDeficit = deficit(sample.potassium, crop.targetK);

  const ureaKgPerAcre = round2(nitrogenDeficit / 0.46);
  const dapKgPerAcre = round2(phosphorusDeficit / 0.46);
  const mopKgPerAcre = round2(potassiumDeficit / 0.6);

  // DAP itself supplies ~18% N — subtract that contribution from the
  // remaining urea requirement, floored at zero.
  const nitrogenFromDAP = dapKgPerAcre * 0.18;
  const adjustedUreaKgPerAcre = Math.max(
    0,
    round2(ureaKgPerAcre - nitrogenFromDAP / 0.46)
  );

  return {
    nitrogenDeficit,
    phosphorusDeficit,
    potassiumDeficit,
    ureaKgPerAcre,
    dapKgPerAcre,
    mopKgPerAcre,
    adjustedUreaKgPerAcre,
    irrigationAdvice: irrigationTrigger(sample.moisture),
  };
}

export function irrigationTrigger(moisture: number): string {
  if (moisture < 35) return "Immediate irrigation required (35–45 mm).";
  if (moisture <= 65) return "Optimal moisture profile. No immediate irrigation needed.";
  return "High moisture / waterlogged. Hold irrigation, ensure drainage.";
}

export function fertilityStatus(topScore: number): FertilityStatus {
  if (topScore >= 75) return "optimal";
  if (topScore >= 45) return "moderate";
  return "deficient";
}

export function buildSoilHealthReport(sample: TelemetryPayload): SoilHealthReport {
  const topCrops = rankCrops(sample, 5);
  const bestCrop = topCrops[0].crop;
  return {
    sample,
    fertilityStatus: fertilityStatus(topCrops[0].score),
    topCrops,
    fertilizer: calculateFertilizer(sample, bestCrop),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
