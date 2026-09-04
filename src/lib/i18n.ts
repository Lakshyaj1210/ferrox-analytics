import type { Language } from "../types";

type Dict = Record<string, { en: string; hi: string }>;

/**
 * Flat translation dictionary. Keys are stable identifiers used throughout
 * the UI; values hold the English and Hindi (Devanagari) strings side by
 * side so translators can review both at a glance.
 */
export const STRINGS: Dict = {
  // Header
  teamTag: { en: "Team Ferrox · SIH 2026", hi: "टीम फेरॉक्स · SIH 2026" },
  appTitle: { en: "Ground Analytics Station", hi: "ग्राउंड एनालिटिक्स स्टेशन" },
  session: { en: "Session", hi: "सत्र" },
  fieldArea: { en: "Field Area", hi: "खेत का क्षेत्रफल" },
  fieldNameLabel: { en: "Field name", hi: "खेत का नाम" },

  // Data source panel
  telemetrySource: { en: "Telemetry Source", hi: "टेलीमेट्री स्रोत" },
  dataIngestion: { en: "Data Ingestion", hi: "डेटा संग्रहण" },
  mockSimulator: { en: "Mock Simulator", hi: "मॉक सिम्युलेटर" },
  usbSerial: { en: "USB Serial (ESP32)", hi: "USB सीरियल (ESP32)" },
  importLog: { en: "Import Log", hi: "लॉग आयात करें" },
  generateFullSurvey: { en: "Generate Full Survey", hi: "पूर्ण सर्वेक्षण बनाएं" },
  liveDemo: { en: "Live Demo", hi: "लाइव डेमो" },
  stop: { en: "Stop", hi: "रोकें" },
  streamingPackets: { en: "Streaming packets…", hi: "पैकेट प्रवाहित हो रहे हैं…" },
  received: { en: "received", hi: "प्राप्त" },
  mockDescription: {
    en: "Generates a reproducible, spatially-varying demo survey (moisture & nutrient gradients) for zero-hardware testing.",
    hi: "बिना हार्डवेयर के परीक्षण हेतु एक दोहराने-योग्य, स्थान के अनुसार बदलता डेमो सर्वेक्षण (नमी और पोषक तत्व प्रवणता) उत्पन्न करता है।",
  },
  webSerialUnsupported: {
    en: "Web Serial isn't supported in this browser. Use Chrome/Edge over HTTPS, or switch to Mock / Import Log.",
    hi: "इस ब्राउज़र में Web Serial समर्थित नहीं है। HTTPS पर Chrome/Edge का उपयोग करें, या मॉक / लॉग आयात पर स्विच करें।",
  },
  connectEsp32: { en: "Connect ESP32 (115200 baud)", hi: "ESP32 कनेक्ट करें (115200 baud)" },
  disconnect: { en: "Disconnect", hi: "डिस्कनेक्ट करें" },
  live: { en: "Live", hi: "लाइव" },
  serialDescription: {
    en: "Streams newline-delimited JSON packets from the ESP32 sensor hub over USB. Malformed lines are skipped, not fatal — safe for flaky field connections.",
    hi: "USB के माध्यम से ESP32 सेंसर हब से JSON पैकेट प्रवाहित करता है। गलत लाइनें छोड़ दी जाती हैं, त्रुटि नहीं — कमजोर फील्ड कनेक्शन के लिए सुरक्षित।",
  },
  chooseFile: { en: "Choose CSV / JSON flight log", hi: "CSV / JSON फ्लाइट लॉग चुनें" },

  // Sample list
  samplePoints: { en: "Sample Points", hi: "नमूना बिंदु" },
  landings: { en: "landings", hi: "लैंडिंग" },
  noLandingPoints: {
    en: "No landing points yet. Choose a data source above to begin ingesting telemetry.",
    hi: "अभी तक कोई लैंडिंग बिंदु नहीं। टेलीमेट्री शुरू करने हेतु ऊपर एक डेटा स्रोत चुनें।",
  },

  // Map
  spatialMappingEngine: { en: "Spatial Mapping Engine", hi: "स्थानिक मानचित्रण इंजन" },
  fieldBoundaryHeatmap: { en: "Field Boundary & Fertility Heatmap", hi: "खेत की सीमा और उर्वरता हीटमैप" },
  metricMoisture: { en: "Moisture", hi: "नमी" },
  metricNitrogen: { en: "Nitrogen", hi: "नाइट्रोजन" },
  metricPhosphorus: { en: "Phosphorus", hi: "फॉस्फोरस" },
  metricPotassium: { en: "Potassium", hi: "पोटैशियम" },
  bestFit: { en: "Best fit", hi: "सर्वश्रेष्ठ उपयुक्त" },

  // Core sample strip
  probeReadout: { en: "Probe Readout", hi: "प्रोब रीडआउट" },
  soilCoreSample: { en: "Soil Core Sample", hi: "मृदा कोर नमूना" },
  coreSample: { en: "Core Sample", hi: "कोर नमूना" },
  statusFertile: { en: "Fertile", hi: "उपजाऊ" },
  statusWorkable: { en: "Workable", hi: "उपयोगी" },
  statusDepleted: { en: "Depleted", hi: "अवक्षीण" },

  // Telemetry gauges
  sensorHub: { en: "Sensor Hub", hi: "सेंसर हब" },
  liveTelemetry: { en: "Live Telemetry", hi: "लाइव टेलीमेट्री" },
  noSampleSelected: {
    en: "No sample selected. Pick a landing point on the map, or ingest telemetry to begin.",
    hi: "कोई नमूना चयनित नहीं है। मानचित्र पर एक लैंडिंग बिंदु चुनें, या टेलीमेट्री शुरू करें।",
  },
  gaugeMoisture: { en: "Moisture", hi: "नमी" },
  gaugeSoilTemp: { en: "Soil Temp", hi: "मृदा तापमान" },
  gaugePh: { en: "pH", hi: "pH" },
  gaugeNitrogen: { en: "Nitrogen", hi: "नाइट्रोजन" },
  gaugePhosphorus: { en: "Phosphorus", hi: "फॉस्फोरस" },
  gaugePotassium: { en: "Potassium", hi: "पोटैशियम" },
  gaugeLandingStability: { en: "Landing Stability", hi: "लैंडिंग स्थिरता" },
  gaugeBattery: { en: "Drone Battery", hi: "ड्रोन बैटरी" },
  kgPerAcre: { en: "kg/acre", hi: "किग्रा/एकड़" },

  // Radar / deficiency
  hybridAgronomicEngine: { en: "Hybrid Agronomic Engine", hi: "हाइब्रिड कृषि विज्ञान इंजन" },
  deficiencyProfile: { en: "Deficiency Profile", hi: "कमी प्रोफ़ाइल" },
  selectSampleForProfile: {
    en: "Select a sample to view its deficiency profile.",
    hi: "कमी प्रोफ़ाइल देखने के लिए एक नमूना चुनें।",
  },
  factorPh: { en: "pH", hi: "pH" },
  factorMoisture: { en: "Moisture", hi: "नमी" },
  factorTemp: { en: "Temp", hi: "तापमान" },
  factorNitrogen: { en: "Nitrogen", hi: "नाइट्रोजन" },
  factorPhosphorus: { en: "Phosphorus", hi: "फॉस्फोरस" },
  factorPotassium: { en: "Potassium", hi: "पोटैशियम" },

  // Crop ranking
  offlineMatching: { en: "Offline Deterministic Matching", hi: "ऑफ़लाइन निर्धारक मिलान" },
  cropRanking: { en: "Crop Ranking", hi: "फसल रैंकिंग" },
  noCropRanking: { en: "No crop ranking yet — select a sample.", hi: "अभी तक कोई फसल रैंकिंग नहीं — एक नमूना चुनें।" },

  // Fertilizer plan
  commercialDosage: { en: "Commercial Dosage", hi: "व्यावसायिक खुराक" },
  fertilizerPrescription: { en: "Fertilizer Prescription", hi: "उर्वरक नुस्खा" },
  noSampleSelectedShort: { en: "No sample selected.", hi: "कोई नमूना चयनित नहीं है।" },
  nDeficit: { en: "N deficit", hi: "N की कमी" },
  pDeficit: { en: "P deficit", hi: "P की कमी" },
  kDeficit: { en: "K deficit", hi: "K की कमी" },
  zeroDosageNote: {
    en: "Nutrients already at or above target midpoint are shown as 0 kg/acre — no correction needed.",
    hi: "जो पोषक तत्व पहले से ही लक्ष्य स्तर पर या उससे अधिक हैं, उन्हें 0 किग्रा/एकड़ दिखाया गया है — किसी सुधार की आवश्यकता नहीं।",
  },
  irrigationLow: {
    en: "Immediate irrigation required (35–45 mm).",
    hi: "तत्काल सिंचाई आवश्यक है (35–45 मिमी)।",
  },
  irrigationOptimal: {
    en: "Optimal moisture profile. No immediate irrigation needed.",
    hi: "इष्टतम नमी स्तर है। तत्काल सिंचाई की आवश्यकता नहीं है।",
  },
  irrigationHigh: {
    en: "High moisture / waterlogged. Hold irrigation, ensure drainage.",
    hi: "अधिक नमी / जलभराव। सिंचाई रोकें, जल निकासी सुनिश्चित करें।",
  },

  // Weather
  openMeteo: { en: "Open-Meteo", hi: "Open-Meteo" },
  sevenDayForecast: { en: "7-Day Forecast", hi: "7-दिन का पूर्वानुमान" },
  fetchingForecast: { en: "Fetching 7-day forecast…", hi: "7-दिन का पूर्वानुमान प्राप्त हो रहा है…" },
  weatherUnavailable: {
    en: "Weather unavailable offline — irrigation advice uses soil data only.",
    hi: "ऑफ़लाइन मौसम अनुपलब्ध — सिंचाई सलाह केवल मृदा डेटा पर आधारित है।",
  },
  rain: { en: "rain", hi: "बारिश" },

  // Advisory
  geminiFreeTier: { en: "Gemini Free Tier", hi: "Gemini फ्री टियर" },
  farmerAdvisory: { en: "Farmer Advisory", hi: "किसान सलाह" },
  generateAdvisory: { en: "Generate Advisory", hi: "सलाह बनाएं" },
  geminiKey: { en: "Gemini Key", hi: "Gemini कुंजी" },
  geminiKeyPlaceholder: {
    en: "Paste Gemini free-tier API key (optional)",
    hi: "Gemini फ्री-टियर API कुंजी पेस्ट करें (वैकल्पिक)",
  },
  geminiKeyNote: {
    en: "Left empty, the offline deterministic template is used — the demo never breaks without WiFi.",
    hi: "खाली छोड़ने पर ऑफ़लाइन टेम्पलेट उपयोग होता है — बिना WiFi के भी डेमो कभी नहीं टूटता।",
  },
  gemini: { en: "Gemini", hi: "Gemini" },
  offlineTemplate: { en: "Offline template", hi: "ऑफ़लाइन टेम्पलेट" },

  // Export
  exportPdf: { en: "Export Soil Health Card (PDF)", hi: "मृदा स्वास्थ्य कार्ड निर्यात करें (PDF)" },
  soilHealthCard: { en: "Soil Health Card", hi: "मृदा स्वास्थ्य कार्ड" },

  // Soil classification & units
  icarClassification: { en: "ICAR Soil Classification", hi: "ICAR मृदा वर्गीकरण" },
  areaUnit: { en: "Area Unit", hi: "क्षेत्रफल इकाई" },
  unitAcre: { en: "Acres", hi: "एकड़" },
  unitHectare: { en: "Hectares", hi: "हेक्टेयर" },
  unitBigha: { en: "Bigha", hi: "बीघा" },

  // Footer
  disclaimer: {
    en: "FERROX Ground Analytics Station · Indicative agronomic guidance only — confirm with local KVK / soil-testing lab before large-scale input decisions.",
    hi: "फेरॉक्स ग्राउंड एनालिटिक्स स्टेशन · केवल संकेतात्मक कृषि सलाह — बड़े स्तर पर निर्णय लेने से पहले स्थानीय KVK / मृदा परीक्षण प्रयोगशाला से पुष्टि करें।",
  },
  pdfFooterNote: {
    en: "Generated by the FERROX Ground Analytics Station. Indicative agronomic guidance — confirm with local KVK / soil-testing lab before large-scale input decisions.",
    hi: "फेरॉक्स ग्राउंड एनालिटिक्स स्टेशन द्वारा निर्मित। संकेतात्मक कृषि सलाह — बड़े स्तर पर निर्णय से पहले स्थानीय KVK / मृदा परीक्षण प्रयोगशाला से पुष्टि करें।",
  },
};

export function t(key: keyof typeof STRINGS, lang: Language): string {
  const entry = STRINGS[key];
  if (!entry) return String(key);
  return entry[lang];
}

/** Season names in both languages. */
const SEASON_HI: Record<string, string> = {
  Kharif: "खरीफ",
  Rabi: "रबी",
  Zaid: "जायद",
  Perennial: "बारहमासी",
};
export function translateSeason(season: string, lang: Language): string {
  return lang === "hi" ? SEASON_HI[season] ?? season : season;
}

/** Weather-code label, bilingual. */
const WEATHER_CODE_HI: Record<number, string> = {
  0: "साफ़",
  1: "मुख्यतः साफ़",
  2: "आंशिक बादल",
  3: "घने बादल",
  45: "कोहरा",
  48: "कोहरा",
  51: "हल्की बूंदाबांदी",
  53: "बूंदाबांदी",
  55: "घनी बूंदाबांदी",
  61: "हल्की बारिश",
  63: "बारिश",
  65: "भारी बारिश",
  71: "हल्की बर्फ़बारी",
  80: "बारिश की बौछारें",
  81: "बारिश की बौछारें",
  82: "तेज़ बौछारें",
  95: "आंधी-तूफान",
};
const WEATHER_CODE_EN: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent showers",
  95: "Thunderstorm",
};
export function translateWeatherCode(code: number, lang: Language): string {
  const map = lang === "hi" ? WEATHER_CODE_HI : WEATHER_CODE_EN;
  return map[code] ?? "—";
}

/** Irrigation advice, bilingual, matching the deterministic threshold rules. */
export function irrigationAdviceText(moisture: number, lang: Language): string {
  if (moisture < 35) return t("irrigationLow", lang);
  if (moisture <= 65) return t("irrigationOptimal", lang);
  return t("irrigationHigh", lang);
}

/** Crop name in the requested language, falling back to English. */
export function cropName(crop: { name: string; nameHi: string }, lang: Language): string {
  return lang === "hi" ? crop.nameHi || crop.name : crop.name;
}
