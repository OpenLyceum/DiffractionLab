/**
 * lightColor.ts
 *
 * Colours of light for the views: a wavelength's linear RGB (memoized to the
 * nanometre) and the same colour as a CSS string for strokes and fills.
 */

import { Color } from "scenerystack/scenery";
import { encodeSrgb, wavelengthToLinearRgb } from "./spectralColor.js";

const cache = new Map<number, readonly [number, number, number]>();

/** Linear sRGB of a wavelength, scaled so its brightest channel is 1. */
export function lightRgb(wavelengthNm: number): readonly [number, number, number] {
  const key = Math.round(wavelengthNm);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  const [r, g, b] = wavelengthToLinearRgb(key);
  const peak = Math.max(r, g, b, 1e-6);
  const rgb = [r / peak, g / peak, b / peak] as const;
  cache.set(key, rgb);
  return rgb;
}

/** The colour of a wavelength as a scenery Color, at full brightness. */
export function lightColor(wavelengthNm: number): Color {
  const [r, g, b] = lightRgb(wavelengthNm);
  return new Color(encodeSrgb(r), encodeSrgb(g), encodeSrgb(b));
}
