import type { SoilZoneClassification } from "../types";

/**
 * Coarse, rule-based regional soil macro-classification derived from GPS
 * bounding boxes, loosely aligned with ICAR / NBSS&LUP agro-climatic soil
 * zone descriptions. This is an indicative desk classification for the
 * ground-station UI, not a substitute for an official ICAR soil survey.
 */
interface ZoneRule {
  id: string;
  labelEn: string;
  labelHi: string;
  region: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

const ZONE_RULES: ZoneRule[] = [
  {
    id: "rajasthan-arid-sandy-loam",
    labelEn: "Arid / Sandy Loam Soil — Eastern Rajasthan",
    labelHi: "शुष्क / बलुई दोमट मिट्टी — पूर्वी राजस्थान",
    region: "Eastern Rajasthan (Jaipur–Ajmer belt)",
    latMin: 25.5,
    latMax: 28.2,
    lngMin: 74.5,
    lngMax: 77.0,
  },
  {
    id: "rajasthan-western-desert",
    labelEn: "Desert / Loamy Sand Soil — Western Rajasthan",
    labelHi: "मरुस्थलीय / रेतीली दोमट मिट्टी — पश्चिमी राजस्थान",
    region: "Western Rajasthan (Thar Desert belt)",
    latMin: 24.5,
    latMax: 29.5,
    lngMin: 69.5,
    lngMax: 74.5,
  },
  {
    id: "punjab-alluvial",
    labelEn: "Indo-Gangetic Alluvial Soil — Punjab Plains",
    labelHi: "सिंधु-गंगा जलोढ़ मिट्टी — पंजाब मैदान",
    region: "Punjab / Sutlej-Beas plains",
    latMin: 29.5,
    latMax: 32.5,
    lngMin: 73.5,
    lngMax: 76.8,
  },
  {
    id: "gangetic-plains",
    labelEn: "Indo-Gangetic Alluvial Soil — Central Plains",
    labelHi: "सिंधु-गंगा जलोढ़ मिट्टी — मध्य मैदान",
    region: "Indo-Gangetic Plains",
    latMin: 24.0,
    latMax: 29.5,
    lngMin: 77.0,
    lngMax: 88.0,
  },
  {
    id: "deccan-black",
    labelEn: "Black Cotton (Regur) Soil — Deccan Plateau",
    labelHi: "काली कपास (रेगुर) मिट्टी — दक्कन का पठार",
    region: "Deccan Plateau",
    latMin: 15.0,
    latMax: 24.0,
    lngMin: 73.0,
    lngMax: 80.0,
  },
];

const DEFAULT_ZONE: SoilZoneClassification = {
  id: "generic-mixed",
  labelEn: "Mixed Agro-Climatic Soil Zone",
  labelHi: "मिश्रित कृषि-जलवायु मृदा क्षेत्र",
  region: "Unclassified region",
};

export function classifySoilZone(lat: number, lng: number): SoilZoneClassification {
  const match = ZONE_RULES.find(
    (z) => lat >= z.latMin && lat <= z.latMax && lng >= z.lngMin && lng <= z.lngMax
  );
  if (!match) return DEFAULT_ZONE;
  const { id, labelEn, labelHi, region } = match;
  return { id, labelEn, labelHi, region };
}
