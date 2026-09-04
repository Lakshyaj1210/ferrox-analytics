import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AdvisoryResult, AreaUnit, FieldSurveySession, Language, SoilHealthReport, WeatherForecastDay } from "../types";
import { cropName, irrigationAdviceText, translateSeason } from "./i18n";
import { classifySoilZone } from "./soilClassification";
import { centroid } from "./geo";
import { renderTextBlockToPNG } from "./canvasText";

const PAGE_WIDTH_PT = 595;
const PAGE_HEIGHT_PT = 842;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH_PT - MARGIN * 2;

function moistureNote(m: number) {
  if (m < 35) return "Low — irrigate";
  if (m > 65) return "High — waterlogged risk";
  return "Optimal";
}
function phNote(ph: number) {
  if (ph < 5.5) return "Acidic";
  if (ph > 8) return "Alkaline";
  return "Neutral range";
}
function moistureNoteHi(m: number) {
  if (m < 35) return "कम — सिंचाई करें";
  if (m > 65) return "अधिक — जलभराव जोखिम";
  return "उपयुक्त";
}
function phNoteHi(ph: number) {
  if (ph < 5.5) return "अम्लीय";
  if (ph > 8) return "क्षारीय";
  return "सामान्य सीमा";
}

function formatArea(session: FieldSurveySession, unit: AreaUnit): string {
  if (unit === "hectare") return session.areaHectares !== undefined ? `${session.areaHectares} ha` : "—";
  if (unit === "bigha") return session.areaBigha !== undefined ? `${session.areaBigha} bigha` : "—";
  return session.areaAcres !== undefined ? `${session.areaAcres} acres` : "—";
}

/* ------------------------------------------------------------------ */
/* English layout — clean vector text + autoTable grids               */
/* ------------------------------------------------------------------ */

function buildEnglishPdf(
  session: FieldSurveySession,
  report: SoilHealthReport,
  advisory: AdvisoryResult | null,
  areaUnit: AreaUnit,
  rainProbability: number = 0
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Soil Health Card", MARGIN, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Team FERROX — Autonomous Agricultural Survey Drone (SIH 2026)", MARGIN, y + 16);
  y += 40;

  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_WIDTH_PT - MARGIN, y);
  y += 20;

  const c = centroid(session.boundary.length > 0 ? session.boundary : [report.sample]);
  const zone = classifySoilZone(c.lat, c.lng);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Field: ${session.fieldName}`, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Session: ${session.sessionId}`, 320, y);
  y += 16;
  doc.text(`Field area: ${formatArea(session, areaUnit)}`, MARGIN, y);
  doc.text(`Sample point #${report.sample.sampleIndex}`, 320, y);
  y += 16;
  doc.text(`GPS: ${report.sample.lat.toFixed(6)}, ${report.sample.lng.toFixed(6)}`, MARGIN, y);
  doc.text(`Captured: ${new Date(report.sample.timestamp).toLocaleString()}`, 320, y);
  y += 16;
  const zoneLines = doc.splitTextToSize(`ICAR Soil Classification: ${zone.labelEn}`, CONTENT_WIDTH);
  doc.text(zoneLines, MARGIN, y);
  y += zoneLines.length * 12 + 10;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Reading", "Status"]],
    body: [
      ["Moisture", `${report.sample.moisture}%`, moistureNote(report.sample.moisture)],
      ["Soil temperature", `${report.sample.temperature}°C`, ""],
      ["pH", `${report.sample.ph}`, phNote(report.sample.ph)],
      ["Nitrogen (N)", `${report.sample.nitrogen} kg/acre`, ""],
      ["Phosphorus (P)", `${report.sample.phosphorus} kg/acre`, ""],
      ["Potassium (K)", `${report.sample.potassium} kg/acre`, ""],
      ["Overall fertility", report.fertilityStatus, ""],
    ],
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [46, 37, 25] },
  });
  // @ts-expect-error - jspdf-autotable augments doc with lastAutoTable at runtime
  y = doc.lastAutoTable.finalY + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Recommended Crops", MARGIN, y);
  autoTable(doc, {
    startY: y + 10,
    head: [["Rank", "Crop", "Season", "Suitability"]],
    body: report.topCrops.map((c2, i) => [String(i + 1), c2.crop.name, c2.crop.season, `${c2.score}/100`]),
    theme: "striped",
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [46, 37, 25] },
  });
  // @ts-expect-error - runtime augmentation
  y = doc.lastAutoTable.finalY + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Fertilizer Prescription (per acre)", MARGIN, y);
  autoTable(doc, {
    startY: y + 10,
    head: [["Product", "Dosage (kg/acre)", "Deficit Closed"]],
    body: [
      ["Urea", `${report.fertilizer.adjustedUreaKgPerAcre}`, `N: ${report.fertilizer.nitrogenDeficit} kg/ac`],
      ["DAP", `${report.fertilizer.dapKgPerAcre}`, `P: ${report.fertilizer.phosphorusDeficit} kg/ac`],
      ["MOP", `${report.fertilizer.mopKgPerAcre}`, `K: ${report.fertilizer.potassiumDeficit} kg/ac`],
    ],
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [46, 37, 25] },
  });
  // @ts-expect-error - runtime augmentation
  y = doc.lastAutoTable.finalY + 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const irrigationLines = doc.splitTextToSize(
    `Irrigation advice: ${irrigationAdviceText(report.sample.moisture, "en", rainProbability)}`,
    CONTENT_WIDTH
  );
  doc.text(irrigationLines, MARGIN, y);
  y += irrigationLines.length * 12 + 10;

  if (advisory) {
    if (y > PAGE_HEIGHT_PT - 140) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`Advisory (${advisory.source === "gemini" ? "AI-generated" : "offline template"})`, MARGIN, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    const advisoryLines = doc.splitTextToSize(advisory.text, CONTENT_WIDTH);
    doc.text(advisoryLines, MARGIN, y);
    y += advisoryLines.length * 12;
  }

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    "Generated by the FERROX Ground Analytics Station. Indicative agronomic guidance — confirm with local KVK / soil-testing lab before large-scale input decisions.",
    MARGIN,
    PAGE_HEIGHT_PT - 30
  );

  return doc;
}

/* ------------------------------------------------------------------ */
/* Hindi layout — canvas-rasterized text blocks (correct shaping)      */
/* ------------------------------------------------------------------ */

async function addBlock(
  doc: jsPDF,
  y: number,
  entries: Parameters<typeof renderTextBlockToPNG>[0]
): Promise<number> {
  const { dataUrl, widthPx, heightPx } = await renderTextBlockToPNG(entries, CONTENT_WIDTH);
  if (y + heightPx > PAGE_HEIGHT_PT - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }
  doc.addImage(dataUrl, "PNG", MARGIN, y, widthPx, heightPx);
  return y + heightPx + 6;
}

async function buildHindiPdf(
  session: FieldSurveySession,
  report: SoilHealthReport,
  advisory: AdvisoryResult | null,
  areaUnit: AreaUnit,
  rainProbability: number = 0
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  const c = centroid(session.boundary.length > 0 ? session.boundary : [report.sample]);
  const zone = classifySoilZone(c.lat, c.lng);

  y = await addBlock(doc, y, [
    { text: "मृदा स्वास्थ्य कार्ड", fontSizePx: 22, bold: true, color: "#2E2519" },
    { text: "टीम फेरॉक्स — स्वचालित कृषि सर्वेक्षण ड्रोन (SIH 2026)", fontSizePx: 11, color: "#5A4735" },
  ]);

  y = await addBlock(doc, y, [
    { text: `खेत: ${session.fieldName}    |    सत्र: ${session.sessionId}`, fontSizePx: 11, bold: true },
    { text: `क्षेत्रफल: ${formatArea(session, areaUnit)}    |    नमूना बिंदु #${report.sample.sampleIndex}`, fontSizePx: 10 },
    { text: `GPS: ${report.sample.lat.toFixed(6)}, ${report.sample.lng.toFixed(6)}`, fontSizePx: 10 },
    { text: `ICAR मृदा वर्गीकरण: ${zone.labelHi}`, fontSizePx: 10 },
  ]);

  y = await addBlock(doc, y, [
    { text: "मृदा सेंसर रीडिंग", fontSizePx: 13, bold: true, color: "#33B0A5" },
    { text: `नमी: ${report.sample.moisture}% (${moistureNoteHi(report.sample.moisture)})`, fontSizePx: 10 },
    { text: `मृदा तापमान: ${report.sample.temperature}°C`, fontSizePx: 10 },
    { text: `pH: ${report.sample.ph} (${phNoteHi(report.sample.ph)})`, fontSizePx: 10 },
    { text: `नाइट्रोजन (N): ${report.sample.nitrogen} किग्रा/एकड़`, fontSizePx: 10 },
    { text: `फॉस्फोरस (P): ${report.sample.phosphorus} किग्रा/एकड़`, fontSizePx: 10 },
    { text: `पोटैशियम (K): ${report.sample.potassium} किग्रा/एकड़`, fontSizePx: 10 },
  ]);

  y = await addBlock(doc, y, [
    { text: "अनुशंसित फसलें", fontSizePx: 13, bold: true, color: "#33B0A5" },
    ...report.topCrops.map((c2, i) => ({
      text: `${i + 1}. ${cropName(c2.crop, "hi")} (${translateSeason(c2.crop.season, "hi")}) — उपयुक्तता: ${c2.score}/100`,
      fontSizePx: 10,
    })),
  ]);

  y = await addBlock(doc, y, [
    { text: "उर्वरक नुस्खा (प्रति एकड़)", fontSizePx: 13, bold: true, color: "#33B0A5" },
    { text: `यूरिया: ${report.fertilizer.adjustedUreaKgPerAcre} किग्रा/एकड़ (N की कमी: ${report.fertilizer.nitrogenDeficit} किग्रा/एकड़)`, fontSizePx: 10 },
    { text: `DAP: ${report.fertilizer.dapKgPerAcre} किग्रा/एकड़ (P की कमी: ${report.fertilizer.phosphorusDeficit} किग्रा/एकड़)`, fontSizePx: 10 },
    { text: `MOP: ${report.fertilizer.mopKgPerAcre} किग्रा/एकड़ (K की कमी: ${report.fertilizer.potassiumDeficit} किग्रा/एकड़)`, fontSizePx: 10 },
    { text: `सिंचाई सलाह: ${irrigationAdviceText(report.sample.moisture, "hi", rainProbability)}`, fontSizePx: 10 },
  ]);

  if (advisory) {
    y = await addBlock(doc, y, [
      {
        text: `किसान सलाह (${advisory.source === "gemini" ? "AI-जनित" : "ऑफ़लाइन टेम्पलेट"})`,
        fontSizePx: 12,
        bold: true,
        color: "#33B0A5",
      },
      { text: advisory.text, fontSizePx: 10.5 },
    ]);
  }

  await addBlock(doc, PAGE_HEIGHT_PT - MARGIN - 40, [
    {
      text: "फेरॉक्स ग्राउंड एनालिटिक्स स्टेशन द्वारा निर्मित। संकेतात्मक कृषि सलाह — बड़े स्तर पर निर्णय से पहले स्थानीय KVK / मृदा परीक्षण प्रयोगशाला से पुष्टि करें।",
      fontSizePx: 8,
      color: "#8A8070",
    },
  ]);

  return doc;
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                  */
/* ------------------------------------------------------------------ */

/**
 * Generates a one-page (typically) printable "Soil Health Card" for a
 * single sample point and triggers a browser download. Pure client-side —
 * no server round-trip, so it works during offline field demos.
 *
 * English uses fast vector text via jsPDF-autotable. Hindi is rendered by
 * rasterizing each text block on an offscreen canvas first (see
 * `canvasText.ts`) because jsPDF's built-in renderer does not perform the
 * OpenType shaping Devanagari needs for correct conjuncts/matras.
 */
export async function generateSoilHealthCardPDF(
  session: FieldSurveySession,
  report: SoilHealthReport,
  advisory: AdvisoryResult | null,
  lang: Language = "en",
  areaUnit: AreaUnit = "acre",
  weather?: WeatherForecastDay[] | null
): Promise<void> {
  const rainProbability = weather?.[0]?.precipitationProbability ?? 0;
  const doc =
    lang === "hi"
      ? await buildHindiPdf(session, report, advisory, areaUnit, rainProbability)
      : buildEnglishPdf(session, report, advisory, areaUnit, rainProbability);

  const suffix = lang === "hi" ? "मृदा-स्वास्थ्य-कार्ड" : "soil-health-card";
  doc.save(`${suffix}_${session.fieldName.replace(/\s+/g, "-")}_sample-${report.sample.sampleIndex}.pdf`);
}
