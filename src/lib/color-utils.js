/**
 * Color utility functions for perceptual paint matching.
 * Uses CIELAB color space and Delta E (CIE76) for distance.
 */

/**
 * Convert hex string to RGB
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
 * Convert RGB to CIELAB
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {{ L: number, a: number, b: number }}
 */
export function rgbToLab({ r, g, b }) {
  // Normalize to 0-1
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;

  // sRGB to linear
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;

  // Linear RGB to XYZ (D65 illuminant)
  let x = (rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375) / 0.95047;
  let y = (rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750) / 1.00000;
  let z = (rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041) / 1.08883;

  // XYZ to LAB
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
 * Convert hex to LAB
 * @param {string} hex
 * @returns {{ L: number, a: number, b: number }}
 */
export function hexToLab(hex) {
  return rgbToLab(hexToRgb(hex));
}

/**
 * Calculate Delta E (CIE76) between two LAB colors.
 * < 3 = very close match, < 7 = decent substitute, > 10 = poor match
 * @param {{ L: number, a: number, b: number }} lab1
 * @param {{ L: number, a: number, b: number }} lab2
 * @returns {number}
 */
export function deltaE(lab1, lab2) {
  return Math.sqrt(
    Math.pow(lab1.L - lab2.L, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
}

/**
 * Calculate Delta E between two hex colors
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number}
 */
export function deltaEHex(hex1, hex2) {
  return deltaE(hexToLab(hex1), hexToLab(hex2));
}

/**
 * Get a contrast-safe text color for a given background hex
 * @param {string} hex
 * @returns {string}
 */
export function getContrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#111111" : "#FFFFFF";
}

/**
 * Classify a Delta E value into a match quality tier
 * @param {number} de
 * @returns {'exact' | 'close' | 'decent' | 'poor'}
 */
export function matchQuality(de) {
  if (de < 1) return "exact";
  if (de < 3) return "close";
  if (de < 7) return "decent";
  return "poor";
}
