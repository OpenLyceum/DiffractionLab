/**
 * fraunhofer.ts
 *
 * Far-field (Fraunhofer) diffraction by N identical, equally spaced slits:
 * the physics of the Gratings and Resolving Power screens.
 *
 * Every function takes the direction as s = sin θ and lengths in one consistent
 * unit (the screens use micrometres for d and a, and the same unit for λ).
 *
 *   β = 2π a s / λ        phase across one slit (the book's β)
 *   φ = 2π d s / λ        phase step between neighbouring slits
 *
 *   E / (N E₁) = sinc(β/2) · sin(Nφ/2) / (N sin(φ/2))
 *   I / I_max  = sinc²(β/2) · [sin(Nφ/2) / (N sin(φ/2))]²
 *
 * so the peak of a principal maximum is N² times one slit's central intensity,
 * and the normalized intensity is 1 at θ = 0. See doc/model.md.
 */

import { INTEGER_TOLERANCE, NEAR_ZERO_SINC } from "../../DiffractionLabConstants.js";

/** sin(x)/x, with its Taylor series near zero. */
function sinc(x: number): number {
  if (Math.abs(x) < NEAR_ZERO_SINC) {
    return 1 - (x * x) / 6;
  }
  return Math.sin(x) / x;
}

/** Phase across one slit of width `a`: β = 2π a sinθ / λ. */
function slitPhase(sinTheta: number, a: number, wavelength: number): number {
  return (2 * Math.PI * a * sinTheta) / wavelength;
}

/** Phase step between adjacent slits of spacing `d`: φ = 2π d sinθ / λ. */
export function phaseStep(sinTheta: number, d: number, wavelength: number): number {
  return (2 * Math.PI * d * sinTheta) / wavelength;
}

/**
 * Single-slit amplitude relative to the straight-ahead amplitude: sinc(β/2).
 * Signed: it changes sign in each successive side lobe, which reverses the
 * phasors in the phasor diagram.
 */
export function singleSlitAmplitude(sinTheta: number, a: number, wavelength: number): number {
  return sinc(slitPhase(sinTheta, a, wavelength) / 2);
}

/**
 * Normalized array factor sin(Nφ/2) / (N sin(φ/2)), signed, equal to ±1 at the
 * principal maxima. At φ = 2πm the 0/0 is resolved by L'Hôpital's rule,
 * which gives cos(Nφ/2)/cos(φ/2).
 */
export function arrayFactor(phi: number, slitCount: number): number {
  const denominator = Math.sin(phi / 2);
  if (Math.abs(denominator) < 1e-9) {
    return Math.cos((slitCount * phi) / 2) / Math.cos(phi / 2);
  }
  return Math.sin((slitCount * phi) / 2) / (slitCount * denominator);
}

/** Intensity of N slits, normalized to 1 straight ahead. */
export function gratingIntensity(
  sinTheta: number,
  slitCount: number,
  d: number,
  a: number,
  wavelength: number,
): number {
  const envelope = singleSlitAmplitude(sinTheta, a, wavelength);
  const array = arrayFactor(phaseStep(sinTheta, d, wavelength), slitCount);
  return envelope * envelope * array * array;
}

/** Single-slit envelope sinc²(β/2), normalized to 1 straight ahead. */
export function envelopeIntensity(sinTheta: number, a: number, wavelength: number): number {
  const amplitude = singleSlitAmplitude(sinTheta, a, wavelength);
  return amplitude * amplitude;
}

/** Interference factor alone, [sin(Nφ/2)/(N sin(φ/2))]², for infinitely narrow slits. */
export function arrayIntensity(sinTheta: number, slitCount: number, d: number, wavelength: number): number {
  const array = arrayFactor(phaseStep(sinTheta, d, wavelength), slitCount);
  return array * array;
}

/** Largest order allowed by |sin θ| ≤ 1: ⌊d/λ⌋. */
export function maxOrder(d: number, wavelength: number): number {
  return Math.floor(d / wavelength + INTEGER_TOLERANCE);
}

/**
 * Largest order that actually emerges from the grating. When d/λ is an
 * integer the limiting order leaves at grazing incidence (θ = 90°) and is not
 * observable, so it is excluded (the book's 5000 lines/cm example, l.354).
 */
export function maxUsableOrder(d: number, wavelength: number): number {
  const ratio = d / wavelength;
  const top = maxOrder(d, wavelength);
  return Math.abs(ratio - Math.round(ratio)) < 1e-9 * Math.max(1, ratio) ? top - 1 : top;
}

/** sin θ of the order-m principal maximum: mλ/d. */
export function orderSinTheta(order: number, d: number, wavelength: number): number {
  return (order * wavelength) / d;
}

/**
 * Orders missing because they fall on a zero of the single-slit envelope:
 * every m ≠ 0 with |m| ≤ mMax for which m·a/d is a nonzero integer.
 * Returned as positive orders; the negative ones mirror them.
 */
export function missingOrders(d: number, a: number, mMax: number): number[] {
  const result: number[] = [];
  for (let m = 1; m <= mMax; m++) {
    const envelopeOrder = (m * a) / d;
    const nearest = Math.round(envelopeOrder);
    if (nearest >= 1 && Math.abs(envelopeOrder - nearest) < 1e-6) {
      result.push(m);
    }
  }
  return result;
}

/**
 * Number of bright fringes strictly inside the central envelope,
 * |sin θ| < λ/a, i.e. the orders with |m| < d/a that are not missing
 * (2q − 1 when d/a = q is an integer; the book's l.277 example gives 9).
 */
export function fringesInCentralEnvelope(d: number, a: number): number {
  const ratio = d / a;
  let count = 0;
  const limit = Math.ceil(ratio);
  for (let m = -limit; m <= limit; m++) {
    if (Math.abs(m) < ratio - 1e-9) {
      count++;
    }
  }
  return count;
}

/** Angular dispersion dθ/dλ = m / (d cos θ), in radians per unit of λ. */
export function angularDispersion(order: number, d: number, sinTheta: number): number {
  return order / (d * Math.sqrt(Math.max(0, 1 - sinTheta * sinTheta)));
}

/** Resolving power of N illuminated lines in order m: R = mN. */
export function resolvingPower(order: number, illuminatedLines: number): number {
  return order * illuminatedLines;
}

/**
 * Fewest illuminated lines that resolve λ and λ + Δλ in order m by the
 * Rayleigh criterion: N = ⌈λ/(mΔλ)⌉, with λ the shorter wavelength
 * (the book's sodium example gives 982).
 */
export function linesToResolve(wavelength: number, deltaWavelength: number, order: number): number {
  return Math.ceil(wavelength / (order * deltaWavelength) - 1e-9);
}

/**
 * sin θ of the first zero next to the order-m principal maximum, on the
 * long-wavelength side: Nφ/2 = mNπ + π, i.e. sinθ = (m + 1/N) λ / d.
 */
export function firstZeroSinTheta(order: number, slitCount: number, d: number, wavelength: number): number {
  return ((order + 1 / slitCount) * wavelength) / d;
}
