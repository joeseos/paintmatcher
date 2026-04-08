/**
 * Color utility functions for perceptual paint matching.
 * Uses CIELAB color space and Delta E (CIE76) for distance.
 */

/**
 * @param {string} hex - e.g. "FF0000" or "#FF0000"
 * @returns {{ r: number, g: number, b: number }}
 */
export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {{ L: number, a: number, b: number }}
 */
export function rgbToLab({ r, g, b }) {
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;

  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;

  let x = (rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375) / 0.95047;
  let y = (rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750) / 1.00000;
  let z = (rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041) / 1.08883;

  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x);
  y = f(y);
  z = f(z);

  return {
    L: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

/**
 * @param {string} hex
 * @returns {{ L: number, a: number, b: number }}
 */
export function hexToLab(hex) {
  return rgbToLab(hexToRgb(hex));
}

/**
 * CIEDE2000 color difference between two LAB colors.
 * More perceptually accurate than CIE76, especially for blues and low-chroma colors.
 * Based on public domain implementation by Michel Leonard.
 * @param {{ L: number, a: number, b: number }} lab1
 * @param {{ L: number, a: number, b: number }} lab2
 * @returns {number}
 */
export function deltaE(lab1, lab2) {
  const k_l = 1.0, k_c = 1.0, k_h = 1.0;
  let n = (Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b) + Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b)) * 0.5;
  n = n * n * n * n * n * n * n;
  n = 1.0 + 0.5 * (1.0 - Math.sqrt(n / (n + 6103515625.0)));
  const c_1 = Math.sqrt(lab1.a * lab1.a * n * n + lab1.b * lab1.b);
  const c_2 = Math.sqrt(lab2.a * lab2.a * n * n + lab2.b * lab2.b);
  let h_1 = Math.atan2(lab1.b, lab1.a * n), h_2 = Math.atan2(lab2.b, lab2.a * n);
  h_1 += 2.0 * Math.PI * (h_1 < 0.0);
  h_2 += 2.0 * Math.PI * (h_2 < 0.0);
  n = Math.abs(h_2 - h_1);
  if (Math.PI - 1E-14 < n && n < Math.PI + 1E-14) n = Math.PI;
  let h_m = (h_1 + h_2) * 0.5, h_d = (h_2 - h_1) * 0.5;
  if (Math.PI < n) {
    h_d += Math.PI;
    h_m += Math.PI;
  }
  const p = 36.0 * h_m - 55.0 * Math.PI;
  n = (c_1 + c_2) * 0.5;
  n = n * n * n * n * n * n * n;
  const r_t = -2.0 * Math.sqrt(n / (n + 6103515625.0))
    * Math.sin(Math.PI / 3.0 * Math.exp(p * p / (-25.0 * Math.PI * Math.PI)));
  n = (lab1.L + lab2.L) * 0.5;
  n = (n - 50.0) * (n - 50.0);
  const l = (lab2.L - lab1.L) / (k_l * (1.0 + 0.015 * n / Math.sqrt(20.0 + n)));
  const t = 1.0 + 0.24 * Math.sin(2.0 * h_m + Math.PI * 0.5)
    + 0.32 * Math.sin(3.0 * h_m + 8.0 * Math.PI / 15.0)
    - 0.17 * Math.sin(h_m + Math.PI / 3.0)
    - 0.20 * Math.sin(4.0 * h_m + 3.0 * Math.PI / 20.0);
  n = c_1 + c_2;
  const h = 2.0 * Math.sqrt(c_1 * c_2) * Math.sin(h_d) / (k_h * (1.0 + 0.0075 * n * t));
  const c = (c_2 - c_1) / (k_c * (1.0 + 0.0225 * n));
  return Math.sqrt(l * l + h * h + c * c + c * h * r_t);
}

/**
 * Get contrast-safe text color for a background hex.
 * @param {string} hex
 * @returns {string}
 */
export function getContrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#111111" : "#FFFFFF";
}

/**
 * @typedef {'match' | 'near' | 'poor'} MatchQuality
 */

/**
 * Classify a Delta E value.
 * @param {number} de
 * @returns {MatchQuality}
 */
export function matchQuality(de) {
  if (de < 3) return "match";
  if (de < 10) return "near";
  return "poor";
}

/**
 * @typedef {import('$lib/paint-data.js').Paint} Paint
 */

/**
 * @typedef {{ paint: Paint, deltaE: number, quality: MatchQuality }} PaintMatch
 */

/**
 * Precompute LAB values for all paints (call once on load).
 * @param {Paint[]} paints
 * @returns {Map<Paint, {L: number, a: number, b: number}>}
 */
export function buildLabCache(paints) {
  const cache = new Map();
  for (const paint of paints) {
    cache.set(paint, hexToLab(paint.hex));
  }
  return cache;
}

/**
 * Find matching paints sorted by Delta E.
 * @param {Paint} target - The paint to match against
 * @param {Paint[]} allPaints - Full paint list
 * @param {Map<Paint, {L: number, a: number, b: number}>} labCache - Precomputed LAB values
 * @param {{ maxDeltaE?: number, excludeSameRange?: boolean }} [opts]
 * @returns {PaintMatch[]}
 */
export function findMatches(target, allPaints, labCache, opts = {}) {
  const { maxDeltaE = 10, excludeSameRange = false } = opts;

  const targetLab = labCache.get(target) ?? hexToLab(target.hex);
  const results = [];

  for (const paint of allPaints) {
    if (paint === target) continue;
    if (excludeSameRange && paint.range === target.range) continue;

    const paintLab = labCache.get(paint) ?? hexToLab(paint.hex);
    const de = deltaE(targetLab, paintLab);

    if (de <= maxDeltaE) {
      results.push({
        paint,
        deltaE: de,
        quality: matchQuality(de),
      });
    }
  }

  results.sort((a, b) => a.deltaE - b.deltaE);
  return results;
}
