/**
 * jsPDF's built-in text renderer does not perform OpenType shaping
 * (conjunct formation / matra reordering), so simply embedding a
 * Devanagari TTF produces broken Hindi glyphs. The browser's own text
 * engine (Canvas 2D `fillText`) *does* perform correct complex-script
 * shaping, so we rasterize Hindi text blocks to a PNG on an offscreen
 * canvas and place that image into the PDF instead of vector text.
 */

let fontLoadPromise: Promise<void> | null = null;

/** Loads the bundled Noto Sans Devanagari webfont into the document font set. */
function ensureDevanagariFontLoaded(): Promise<void> {
  if (fontLoadPromise) return fontLoadPromise;
  fontLoadPromise = (async () => {
    if (typeof document === "undefined") return;
    try {
      const face = new FontFace(
        "Noto Sans Devanagari PDF",
        "url(/fonts/NotoSansDevanagari-Regular.woff2)"
      );
      const loaded = await face.load();
      document.fonts.add(loaded);
    } catch (e) {
      console.warn("Could not load Devanagari webfont for PDF rasterization:", e);
    }
  })();
  return fontLoadPromise;
}

export interface TextLineSpec {
  text: string;
  fontSizePx: number;
  color?: string; // CSS color
  bold?: boolean;
  gapAfterPx?: number; // extra vertical space after this line
}

/** Greedy word-wraps `text` to fit within `maxWidthPx` using the given canvas context font. */
function wrapLine(ctx: CanvasRenderingContext2D, text: string, maxWidthPx: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidthPx && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

/**
 * Renders a stack of text lines (each with its own size/weight/color) to a
 * PNG data URL, word-wrapping each entry to `widthPx`. Returns the image
 * plus its final pixel dimensions so the caller can size the PDF `addImage`
 * call proportionally.
 */
export async function renderTextBlockToPNG(
  entries: TextLineSpec[],
  widthPx: number,
  paddingPx = 12
): Promise<{ dataUrl: string; widthPx: number; heightPx: number }> {
  await ensureDevanagariFontLoaded();

  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d")!;

  const wrapped: { text: string; fontSizePx: number; color: string; bold: boolean; gapAfterPx: number }[] = [];
  for (const entry of entries) {
    mctx.font = `${entry.bold ? "700" : "400"} ${entry.fontSizePx}px "Noto Sans Devanagari PDF", sans-serif`;
    const lines = wrapLine(mctx, entry.text, widthPx - paddingPx * 2);
    lines.forEach((line, i) => {
      wrapped.push({
        text: line,
        fontSizePx: entry.fontSizePx,
        color: entry.color ?? "#1C1712",
        bold: !!entry.bold,
        gapAfterPx: i === lines.length - 1 ? entry.gapAfterPx ?? entry.fontSizePx * 0.5 : entry.fontSizePx * 0.15,
      });
    });
  }

  const lineHeightFactor = 1.35;
  let totalHeight = paddingPx * 2;
  for (const w of wrapped) totalHeight += w.fontSizePx * lineHeightFactor + w.gapAfterPx;

  const canvas = document.createElement("canvas");
  const scale = 2; // render at 2x for crisp PDF embedding
  canvas.width = widthPx * scale;
  canvas.height = Math.ceil(totalHeight) * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, totalHeight);
  ctx.textBaseline = "top";

  let y = paddingPx;
  for (const w of wrapped) {
    ctx.font = `${w.bold ? "700" : "400"} ${w.fontSizePx}px "Noto Sans Devanagari PDF", sans-serif`;
    ctx.fillStyle = w.color;
    ctx.fillText(w.text, paddingPx, y);
    y += w.fontSizePx * lineHeightFactor + w.gapAfterPx;
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    widthPx,
    heightPx: Math.ceil(totalHeight),
  };
}
