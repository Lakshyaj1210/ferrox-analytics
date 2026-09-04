import type { GPSWaypoint } from "../types";

const EARTH_RADIUS_M = 6378137; // WGS-84 equatorial radius, meters

/**
 * Converts a GPS boundary log to a local equirectangular cartesian plane
 * (meters), anchored at the boundary's centroid latitude, as specified in
 * the prototype build plan (Section 6 — Area Calculation).
 */
export function toLocalXY(points: GPSWaypoint[]): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const refLat = (points.reduce((s, p) => s + p.lat, 0) / points.length) * (Math.PI / 180);
  return points.map((p) => {
    const x = EARTH_RADIUS_M * (p.lng * (Math.PI / 180)) * Math.cos(refLat);
    const y = EARTH_RADIUS_M * (p.lat * (Math.PI / 180));
    return { x, y };
  });
}

/**
 * Shoelace formula: Area = 0.5 * |sum(x_i * y_i+1 - x_i+1 * y_i)|
 * Returns area in square meters given a closed (or open — auto-closed) ring.
 */
export function shoelaceAreaSqMeters(points: GPSWaypoint[]): number {
  if (points.length < 3) return 0;
  const xy = toLocalXY(points);
  let sum = 0;
  const n = xy.length;
  for (let i = 0; i < n; i++) {
    const { x: xi, y: yi } = xy[i];
    const { x: xj, y: yj } = xy[(i + 1) % n];
    sum += xi * yj - xj * yi;
  }
  return Math.abs(sum) / 2;
}

export const sqMetersToAcres = (sqm: number) => sqm / 4046.8564224;
export const sqMetersToHectares = (sqm: number) => sqm / 10000;
/** 1 Acre ≈ 1.61 Pucca Bigha (Rajasthan standard unit). */
export const ACRE_TO_PUCCA_BIGHA = 1.61;
export const sqMetersToBigha = (sqm: number) => sqMetersToAcres(sqm) * ACRE_TO_PUCCA_BIGHA;

export function computeFieldArea(boundary: GPSWaypoint[]) {
  const sqm = shoelaceAreaSqMeters(boundary);
  return {
    areaAcres: Math.round(sqMetersToAcres(sqm) * 100) / 100,
    areaHectares: Math.round(sqMetersToHectares(sqm) * 1000) / 1000,
    areaBigha: Math.round(sqMetersToBigha(sqm) * 100) / 100,
  };
}

/** Bounding box centroid — used to center the map and query weather. */
export function centroid(points: { lat: number; lng: number }[]) {
  if (points.length === 0) return { lat: 26.9124, lng: 75.7873 }; // Jaipur, Rajasthan fallback
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

/**
 * Simple Inverse-Distance-Weighting (IDW) interpolator used to build the
 * fertility heatmap grid from sparse sample points.
 */
export function idwInterpolate(
  targetLat: number,
  targetLng: number,
  samples: { lat: number; lng: number; value: number }[],
  power = 2
): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const s of samples) {
    const d = Math.hypot(s.lat - targetLat, s.lng - targetLng) || 1e-9;
    const w = 1 / Math.pow(d, power);
    weightedSum += w * s.value;
    weightTotal += w;
  }
  return weightTotal === 0 ? 0 : weightedSum / weightTotal;
}
