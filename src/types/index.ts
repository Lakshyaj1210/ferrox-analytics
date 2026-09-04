// ============================================================================
// FERROX Ground Station — Core Type Definitions
// ============================================================================

export type DataSourceMode = "mock" | "serial" | "file";

export type FertilityStatus = "optimal" | "moderate" | "deficient";

export type Language = "en" | "hi";

export type AreaUnit = "acre" | "hectare" | "bigha";

/** Raw packet as emitted by the ESP32 sensor hub (JSON over Serial/WiFi). */
export interface TelemetryPayload {
  /** Monotonic packet id assigned by the ESP32 */
  packetId: string;
  /** Sample point index within the survey grid (1-based) */
  sampleIndex: number;
  /** ISO 8601 timestamp of the reading */
  timestamp: string;
  /** GPS fix at the moment the probe was deployed */
  lat: number;
  lng: number;
  /** Volumetric soil moisture, percent (0-100) */
  moisture: number;
  /** Soil temperature, degrees Celsius (DS18B20) */
  temperature: number;
  /** Soil pH (0-14) */
  ph: number;
  /** Nitrogen, kg/acre equivalent as reported by RS485 NPK probe */
  nitrogen: number;
  /** Phosphorus, kg/acre equivalent */
  phosphorus: number;
  /** Potassium, kg/acre equivalent */
  potassium: number;
  /** MPU6050 landing stability score, 0-100 (100 = perfectly level) */
  landingStability: number;
  /** Battery remaining on the drone at time of capture, percent */
  batteryPercent?: number;
  /** True if this packet was recovered from SD card after a WiFi dropout */
  recoveredFromSD?: boolean;
}

/** A single GPS point logged during perimeter flight, in flight order. */
export interface GPSWaypoint {
  seq: number;
  lat: number;
  lng: number;
  altitude?: number;
  timestamp: string;
}

/** Agronomic reference envelope for a single crop. */
export interface CropBenchmark {
  id: string;
  name: string;
  /** Hindi (Devanagari) display name */
  nameHi: string;
  season: "Kharif" | "Rabi" | "Zaid" | "Perennial";
  phRange: [number, number];
  moistureRange: [number, number];
  tempRange: [number, number];
  /** Target nutrient uptake, kg/acre */
  targetN: [number, number];
  targetP: [number, number];
  targetK: [number, number];
  notes?: string;
}

/** Result of scoring one sample point's soil metrics against one crop benchmark. */
export interface CropMatchScore {
  crop: CropBenchmark;
  /** Composite suitability score, 0-100 */
  score: number;
  breakdown: {
    ph: number;
    moisture: number;
    temperature: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
}

/** Commercial fertilizer dosage recommendation derived from nutrient deficits. */
export interface FertilizerPrescription {
  nitrogenDeficit: number; // kg/acre
  phosphorusDeficit: number; // kg/acre
  potassiumDeficit: number; // kg/acre
  ureaKgPerAcre: number;
  dapKgPerAcre: number;
  mopKgPerAcre: number;
  /** Residual nitrogen adjustment after DAP contributes N, kg/acre */
  adjustedUreaKgPerAcre: number;
  irrigationAdvice: string;
}

/** Fully processed report for one sample point (one probe landing). */
export interface SoilHealthReport {
  sample: TelemetryPayload;
  fertilityStatus: FertilityStatus;
  topCrops: CropMatchScore[];
  fertilizer: FertilizerPrescription;
}

/** The full state of one field survey — perimeter + all sample points. */
export interface FieldSurveySession {
  sessionId: string;
  fieldName: string;
  createdAt: string;
  dataSource: DataSourceMode;
  boundary: GPSWaypoint[];
  samples: TelemetryPayload[];
  /** Computed once boundary has >= 3 points */
  areaAcres?: number;
  areaHectares?: number;
  areaBigha?: number;
}

/** Regional ICAR-style soil macro-classification, resolved from GPS bounds. */
export interface SoilZoneClassification {
  id: string;
  labelEn: string;
  labelHi: string;
  region: string;
}

export interface WeatherForecastDay {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface AdvisoryResult {
  text: string;
  source: "gemini" | "offline-template";
  generatedAt: string;
}

export interface ConnectionState {
  serialSupported: boolean;
  serialConnected: boolean;
  serialError?: string;
}
