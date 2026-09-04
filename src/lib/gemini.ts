import type { AdvisoryResult, Language, SoilHealthReport, WeatherForecastDay } from "../types";
import { cropName, irrigationAdviceText, translateWeatherCode } from "./i18n";

const GEMINI_MODEL = "gemini-1.5-flash";

function endpoint(apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

function buildPrompt(report: SoilHealthReport, weather: WeatherForecastDay[] | null, lang: Language): string {
  const { sample, topCrops, fertilizer, fertilityStatus } = report;
  const best = topCrops[0];
  const nextDayRain = weather?.[0]?.precipitationProbability ?? 0;
  const weatherLine = weather
    ? `7-day outlook: ${weather
        .slice(0, 3)
        .map((d) => `${d.date.slice(5)} ${translateWeatherCode(d.weatherCode, "en")} ${d.tempMinC}-${d.tempMaxC}°C, ${d.precipitationProbability}% rain`)
        .join("; ")}`
    : "Weather forecast unavailable.";

  const languageInstruction =
    lang === "hi"
      ? "Write the ENTIRE response in natural, simple Hindi using Devanagari script. Do not mix in English words except standard fertilizer names (Urea, DAP, MOP) and units."
      : "Write the response in plain simple English (avoid jargon).";

  return `You are an agricultural extension officer writing a short, warm, practical advisory
for a smallholder farmer in Rajasthan, India. ${languageInstruction}
Base it ONLY on this structured sensor data — do not invent numbers.

Sample point #${sample.sampleIndex} at (${sample.lat}, ${sample.lng}):
- Moisture: ${sample.moisture}%
- Soil temperature: ${sample.temperature}°C
- pH: ${sample.ph}
- Nitrogen: ${sample.nitrogen} kg/acre, Phosphorus: ${sample.phosphorus} kg/acre, Potassium: ${sample.potassium} kg/acre
- Overall fertility status: ${fertilityStatus}

Best-fit crop: ${cropName(best.crop, "en")} (suitability score ${best.score}/100)
Fertilizer plan: Urea ${fertilizer.adjustedUreaKgPerAcre} kg/acre, DAP ${fertilizer.dapKgPerAcre} kg/acre, MOP ${fertilizer.mopKgPerAcre} kg/acre
Irrigation advice: ${irrigationAdviceText(sample.moisture, "en", nextDayRain)}
${weatherLine}

Write 4-6 short sentences: (1) how the soil looks right now, (2) the recommended crop and why,
(3) exactly what fertilizer to apply, (4) irrigation guidance factoring in the weather outlook.
No headings, no markdown, just a friendly paragraph.`;
}

/** Deterministic offline template — used whenever Gemini is unreachable or no API key is set. */
export function offlineAdvisoryTemplate(
  report: SoilHealthReport,
  weather: WeatherForecastDay[] | null,
  lang: Language = "en"
): string {
  const { sample, topCrops, fertilizer, fertilityStatus } = report;
  const best = topCrops[0];
  const nextDayRain = weather?.[0]?.precipitationProbability ?? 0;
  const irrigation = irrigationAdviceText(sample.moisture, lang, nextDayRain);
  const rainAlreadyMentioned = sample.moisture < 35 && nextDayRain >= 60;
  const statusHi: Record<string, string> = { optimal: "उपजाऊ", moderate: "उपयोगी", deficient: "अवक्षीण" };

  if (lang === "hi") {
    const rainNote = (weather?.[0] && !rainAlreadyMentioned)
      ? ` अगले एक दिन में ${weather[0].precipitationProbability}% बारिश की संभावना है, कृपया उसी अनुसार सिंचाई का समय तय करें।`
      : "";
    return (
      `नमूना #${sample.sampleIndex}: यहाँ मृदा की उर्वरता स्थिति "${statusHi[fertilityStatus] ?? fertilityStatus}" है, ` +
      `नमी ${sample.moisture}%, pH ${sample.ph}, तथा NPK स्तर ${sample.nitrogen}/${sample.phosphorus}/${sample.potassium} किग्रा/एकड़ है। ` +
      `इन रीडिंग्स के आधार पर, ${cropName(best.crop, "hi")} इस स्थान के लिए सर्वश्रेष्ठ उपयुक्त फसल है (मिलान स्कोर ${best.score}/100)। ` +
      `पोषक तत्वों की कमी को पूरा करने हेतु लगभग ${fertilizer.adjustedUreaKgPerAcre} किग्रा/एकड़ यूरिया, ${fertilizer.dapKgPerAcre} किग्रा/एकड़ DAP, ` +
      `और ${fertilizer.mopKgPerAcre} किग्रा/एकड़ MOP डालें। ${irrigation}${rainNote}`
    );
  }

  const rainNote = (weather?.[0] && !rainAlreadyMentioned)
    ? ` The forecast shows a ${weather[0].precipitationProbability}% chance of rain in the next day, so time your irrigation accordingly.`
    : "";
  return (
    `Sample #${sample.sampleIndex}: soil fertility here reads as ${fertilityStatus}, with ${sample.moisture}% moisture, ` +
    `pH ${sample.ph}, and NPK levels of ${sample.nitrogen}/${sample.phosphorus}/${sample.potassium} kg/acre. ` +
    `Based on these readings, ${cropName(best.crop, "en")} is the best-fit crop for this spot (match score ${best.score}/100). ` +
    `Apply approximately ${fertilizer.adjustedUreaKgPerAcre} kg/acre of Urea, ${fertilizer.dapKgPerAcre} kg/acre of DAP, ` +
    `and ${fertilizer.mopKgPerAcre} kg/acre of MOP to close the nutrient gap. ${irrigation}${rainNote}`
  );
}

/**
 * Generates a farmer-friendly advisory using the Gemini free-tier API when
 * a key is available, otherwise returns the deterministic offline template.
 * Never throws — always resolves to a usable AdvisoryResult so the demo
 * cannot be broken by a missing key or a network blip. Respects the
 * selected UI language for both the Gemini prompt and the offline fallback.
 */
export async function generateAdvisory(
  report: SoilHealthReport,
  weather: WeatherForecastDay[] | null,
  lang: Language = "en",
  apiKey?: string
): Promise<AdvisoryResult> {
  if (!apiKey) {
    return {
      text: offlineAdvisoryTemplate(report, weather, lang),
      source: "offline-template",
      generatedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(endpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(report, weather, lang) }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 350 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini responded ${res.status}`);
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no text candidate");
    return { text: text.trim(), source: "gemini", generatedAt: new Date().toISOString() };
  } catch (e) {
    console.warn("generateAdvisory: Gemini call failed, using offline fallback:", e);
    return {
      text: offlineAdvisoryTemplate(report, weather, lang),
      source: "offline-template",
      generatedAt: new Date().toISOString(),
    };
  }
}
