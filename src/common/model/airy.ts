import { AIRY_SETTINGS } from "../../DiffractionLabConstants.js";
/**
 * airy.ts
 *
 * The circular aperture: Bessel J₁, the Airy pattern, and the Rayleigh
 * criterion (Circular Aperture screen; the book's dropdown "Where the factor
 * 1.22 comes from").
 *
 *   E(θ) ∝ 2J₁(u)/u,  u = kR sinθ = π D sinθ / λ
 *
 * First dark ring at u = 3.8317…, i.e. sin θ = 1.2197 λ/D.
 */

import {
  AIRY_GAUSSIAN_SIGMA_OVER_LAMBDA_OVER_D,
  GAUSSIAN_FWHM_PER_SIGMA,
  NEAR_ZERO_AIRY,
  NEAR_ZERO_SINC,
} from "../../DiffractionLabConstants.js";

/**
 * First zero of J₁.
 * @internal Exported for unit tests; not part of the application API.
 */
export const J1_FIRST_ZERO: number = AIRY_SETTINGS.J1_FIRST_ZERO;

/**
 * Second zero of J₁ (second dark ring).
 * @internal Exported for unit tests; not part of the application API.
 */
export const J1_SECOND_ZERO: number = AIRY_SETTINGS.J1_SECOND_ZERO;

/** The Rayleigh factor 3.8317/π ≈ 1.22. */
export const RAYLEIGH_FACTOR = J1_FIRST_ZERO / Math.PI;

/**
 * Bessel function of the first kind, order one. Rational approximation for
 * |x| < 8 and the asymptotic form beyond (Numerical Recipes in C, 2nd ed.,
 * §6.5, `bessj1`); absolute error below about 1e-8.
 * @internal Exported for unit tests; not part of the application API.
 */
export function besselJ1(x: number): number {
  const ax = Math.abs(x);
  if (ax < 8) {
    const y = x * x;
    const numerator =
      x *
      (72362614232.0 +
        y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.4826 + y * -30.16036606)))));
    const denominator =
      144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))));
    return numerator / denominator;
  }
  const z = 8 / ax;
  const y = z * z;
  const xx = ax - 2.356194491;
  const p = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * -0.240337019e-6)));
  const q = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
  const result = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * p - z * Math.sin(xx) * q);
  return x < 0 ? -result : result;
}

/** Airy amplitude 2J₁(u)/u, equal to 1 at u = 0. */
function airyAmplitude(u: number): number {
  if (Math.abs(u) < NEAR_ZERO_AIRY) {
    return 1 - (u * u) / 8;
  }
  return (2 * besselJ1(u)) / u;
}

/** Airy intensity (2J₁(u)/u)², normalized to 1 at the centre. */
export function airyIntensity(u: number): number {
  const amplitude = airyAmplitude(u);
  return amplitude * amplitude;
}

/** Angle (radians) of the first dark ring: asin(1.22 λ/D). Same units for λ and D. */
export function rayleighAngle(wavelength: number, diameter: number): number {
  return Math.asin(Math.min(1, (RAYLEIGH_FACTOR * wavelength) / diameter));
}

/**
 * Airy intensity at an angular distance expressed in units of the Rayleigh
 * angle (small angles): 1 at the centre, the first dark ring at r = 1.
 */
function airyIntensityInRayleighUnits(r: number): number {
  return airyIntensity(J1_FIRST_ZERO * r);
}

/** Single-slit intensity sinc²(π a sinθ/λ) with r in units of λ/a (first zero at r = 1). */
export function slitIntensityInSlitUnits(r: number): number {
  const x = Math.PI * r;
  if (Math.abs(x) < NEAR_ZERO_SINC) {
    return 1;
  }
  const s = Math.sin(x) / x;
  return s * s;
}

/** Ratio of the Gaussian σ to the Rayleigh angle for the best-fit Gaussian to the Airy core. */
const AIRY_GAUSSIAN_SIGMA_IN_RAYLEIGH = AIRY_GAUSSIAN_SIGMA_OVER_LAMBDA_OVER_D / RAYLEIGH_FACTOR;

/**
 * A point-spread function of angular radius r, in units of the Rayleigh angle.
 *
 * Without seeing it is the exact Airy pattern. With seeing it is the
 * long-exposure seeing disk: a Gaussian whose width combines in quadrature the
 * seeing FWHM and the Gaussian equivalent of the Airy core (σ ≈ 0.42 λ/D).
 * Normalized to 1 at the centre. See doc/model.md for this approximation.
 */
export function pointSpreadFunction(r: number, seeingFwhmInRayleigh: number): number {
  if (seeingFwhmInRayleigh <= 0) {
    return airyIntensityInRayleighUnits(r);
  }
  const sigmaSeeing = seeingFwhmInRayleigh / GAUSSIAN_FWHM_PER_SIGMA;
  const sigma2 = sigmaSeeing * sigmaSeeing + AIRY_GAUSSIAN_SIGMA_IN_RAYLEIGH * AIRY_GAUSSIAN_SIGMA_IN_RAYLEIGH;
  return Math.exp((-r * r) / (2 * sigma2));
}

/**
 * Image of two equal, incoherent point sources a distance `separation` apart
 * along x (both in Rayleigh units), so their intensities add. Each source has
 * peak intensity 1.
 * @internal Exported for unit tests; not part of the application API.
 */
export function twoSourceIntensity(x: number, y: number, separation: number, seeingFwhmInRayleigh = 0): number {
  const half = separation / 2;
  const r1 = Math.hypot(x - half, y);
  const r2 = Math.hypot(x + half, y);
  return pointSpreadFunction(r1, seeingFwhmInRayleigh) + pointSpreadFunction(r2, seeingFwhmInRayleigh);
}

/**
 * Depth of the dip midway between the two images, as a fraction of the
 * brightest point on the line joining them: 0 when there is no dip (a single
 * blob), about 0.265 at the Rayleigh separation (the book's "about 26%").
 */
export function centralDipFraction(separation: number, seeingFwhmInRayleigh = 0): number {
  if (separation <= 0) {
    return 0;
  }
  const centre = twoSourceIntensity(0, 0, separation, seeingFwhmInRayleigh);
  let peak = centre;
  const samples: number = AIRY_SETTINGS.DIP_SAMPLES;
  for (let i = 1; i <= samples; i++) {
    const x = (i / samples) * separation;
    peak = Math.max(peak, twoSourceIntensity(x, 0, separation, seeingFwhmInRayleigh));
  }
  return peak > 0 ? Math.max(0, 1 - centre / peak) : 0;
}

/** A chart sample: model x and intensity y. Views map these to Vector2 for LinePlot. */
export type AirySample = {
  readonly x: number;
  readonly y: number;
};

/**
 * Two-source image on a square grid in Rayleigh units. Each pixel stores the
 * PSF at the brightest point inside it (half a pixel diagonal closer to each
 * source). Writes row-major into `out` and returns the peak value.
 */
export function sampleTwoSourceImage(
  halfField: number,
  separation: number,
  seeingFwhmInRayleigh: number,
  samples: number,
  out: Float32Array,
): number {
  const pixel = (2 * halfField) / samples;
  const halfDiagonal = pixel * Math.SQRT1_2;
  const half = separation / 2;
  let peak = 0;
  for (let row = 0; row < samples; row++) {
    const y = halfField - (row + 0.5) * pixel;
    for (let column = 0; column < samples; column++) {
      const x = -halfField + (column + 0.5) * pixel;
      const r1 = Math.max(0, Math.hypot(x - half, y) - halfDiagonal);
      const r2 = Math.max(0, Math.hypot(x + half, y) - halfDiagonal);
      const value = pointSpreadFunction(r1, seeingFwhmInRayleigh) + pointSpreadFunction(r2, seeingFwhmInRayleigh);
      out[row * samples + column] = value;
      peak = Math.max(peak, value);
    }
  }
  return peak;
}

/**
 * Cross-section through both sources: uniform samples across ±halfField plus
 * denser samples around each peak. x is in the same units as halfField times
 * `xScale` (arcseconds when xScale is the Rayleigh angle in arcsec). Also
 * returns the equivalent pair through a slit of width D (first zero at λ/D).
 */
export function sampleTwoSourceCrossSection(
  halfField: number,
  separation: number,
  seeingFwhmInRayleigh: number,
  chartSamples: number,
  peakHalfWidth: number,
  peakSamples: number,
  xScale: number,
): {
  readonly first: AirySample[];
  readonly second: AirySample[];
  readonly sum: AirySample[];
  readonly slit: AirySample[];
  readonly top: number;
} {
  const half = separation / 2;
  const xs: number[] = [];
  for (let i = 0; i < chartSamples; i++) {
    xs.push(-halfField + (2 * halfField * i) / (chartSamples - 1));
  }
  for (const centre of [-half, half]) {
    for (let i = 0; i < peakSamples; i++) {
      xs.push(centre - peakHalfWidth + (2 * peakHalfWidth * i) / (peakSamples - 1));
    }
  }
  xs.sort((a, b) => a - b);

  const first: AirySample[] = [];
  const second: AirySample[] = [];
  const slit: AirySample[] = [];
  const sum: AirySample[] = [];
  let top = 1;
  for (const x of xs) {
    if (x < -halfField || x > halfField) {
      continue;
    }
    const i1 = pointSpreadFunction(Math.abs(x - half), seeingFwhmInRayleigh);
    const i2 = pointSpreadFunction(Math.abs(x + half), seeingFwhmInRayleigh);
    const scaledX = x * xScale;
    first.push({ x: scaledX, y: i1 });
    second.push({ x: scaledX, y: i2 });
    sum.push({ x: scaledX, y: i1 + i2 });
    // A slit of width D has its first zero at λ/D = θ_R / 1.22.
    slit.push({
      x: scaledX,
      y:
        slitIntensityInSlitUnits((x - half) * RAYLEIGH_FACTOR) + slitIntensityInSlitUnits((x + half) * RAYLEIGH_FACTOR),
    });
    top = Math.max(top, i1 + i2);
  }
  return { first: first, second: second, sum: sum, slit: slit, top: top };
}
