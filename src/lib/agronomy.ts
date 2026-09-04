import { CROP_BENCHMARKS } from "../data/cropBenchmarks";
import type {
  CropBenchmark,
  CropMatchScore,
  FertilityStatus,
  FertilizerPrescription,
  Language,
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
  crop: CropBenchmark,
  rainProbability: number = 0,
  lang: Language = "en"
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
    irrigationAdvice: irrigationTrigger(sample.moisture, rainProbability, lang),
  };
}

export function irrigationTrigger(
  moisture: number,
  rainProbability: number = 0,
  lang: Language = "en"
): string {
  // Scenario 1: Already high moisture / waterlogged
  if (moisture > 65) {
    return lang === "hi"
      ? "अत्यधिक नमी / जलभराव। सिंचाई रोकें और जल निकासी सुनिश्चित करें।"
      : "High moisture / waterlogged. Hold irrigation, ensure drainage.";
  }

  // Scenario 2: Soil is dry, BUT imminent rain is predicted (> 60%)
  if (moisture < 35 && rainProbability >= 60) {
    return lang === "hi"
      ? `मृदा शुष्क है, लेकिन 24 घंटे में बारिश (${rainProbability}%) की संभावना है। जलभराव रोकने हेतु सिंचाई स्थगित करें।`
      : `Soil is dry, but rain is likely within 24h (${rainProbability}% chance). Delay irrigation to prevent waterlogging.`;
  }

  // Scenario 3: Soil is dry and no significant rain is expected
  if (moisture < 35) {
    return lang === "hi"
      ? "तत्काल सिंचाई आवश्यक है (35–45 मिमी)।"
      : "Immediate irrigation required (35–45 mm).";
  }

  // Scenario 4: Optimal moisture range (35% - 65%)
  return lang === "hi"
    ? "अनुकूल नमी स्तर। तत्काल सिंचाई की आवश्यकता नहीं है।"
    : "Optimal moisture profile. No immediate irrigation needed.";
}

export function fertilityStatus(topScore: number): FertilityStatus {
  if (topScore >= 75) return "optimal";
  if (topScore >= 45) return "moderate";
  return "deficient";
}

export function buildSoilHealthReport(
  sample: TelemetryPayload,
  rainProbability: number = 0,
  lang: Language = "en"
): SoilHealthReport {
  const topCrops = rankCrops(sample, 5);
  const bestCrop = topCrops[0].crop;
  return {
    sample,
    fertilityStatus: fertilityStatus(topCrops[0].score),
    topCrops,
    fertilizer: calculateFertilizer(sample, bestCrop, rainProbability, lang),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
