import { FRAUNHOFER_NUMERICS } from "../../DiffractionLabConstants.js";
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
 * @internal Exported for unit tests; not part of the application API.
 */
export function arrayFactor(phi: number, slitCount: number): number {
  const denominator = Math.sin(phi / 2);
  if (Math.abs(denominator) < FRAUNHOFER_NUMERICS.DENOMINATOR_EPSILON) {
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
  return Math.abs(ratio - Math.round(ratio)) < FRAUNHOFER_NUMERICS.ORDER_EPSILON * Math.max(1, ratio) ? top - 1 : top;
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
    if (nearest >= 1 && Math.abs(envelopeOrder - nearest) < FRAUNHOFER_NUMERICS.MISSING_ORDER_EPSILON) {
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
    if (Math.abs(m) < ratio - FRAUNHOFER_NUMERICS.ORDER_EPSILON) {
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
  return Math.ceil(wavelength / (order * deltaWavelength) - FRAUNHOFER_NUMERICS.ORDER_EPSILON);
}

/**
 * sin θ of the first zero next to the order-m principal maximum, on the
 * long-wavelength side: Nφ/2 = mNπ + π, i.e. sinθ = (m + 1/N) λ / d.
 */
export function firstZeroSinTheta(order: number, slitCount: number, d: number, wavelength: number): number {
  return ((order + 1 / slitCount) * wavelength) / d;
}

/** A chart sample: model x and intensity y. Views map these to Vector2 for LinePlot. */
export type IntensitySample = {
  readonly x: number;
  readonly y: number;
};

/**
 * Evenly spaced samples of N-slit intensity and the single-slit envelope over
 * [sinThetaMin, sinThetaMax], plus mid-bin strip intensities (always unscaled).
 * `scale` multiplies only the chart series (N² when the axis is drawn that way).
 */
export function sampleGratingIntensity(
  sinThetaMin: number,
  sinThetaMax: number,
  chartSamples: number,
  stripColumns: number,
  slitCount: number,
  d: number,
  a: number,
  wavelength: number,
  scale: number,
  stripOut: Float32Array,
): { readonly intensity: IntensitySample[]; readonly envelope: IntensitySample[] } {
  const span = sinThetaMax - sinThetaMin;
  const intensity: IntensitySample[] = [];
  const envelope: IntensitySample[] = [];
  for (let i = 0; i < chartSamples; i++) {
    const s = sinThetaMin + (i / (chartSamples - 1)) * span;
    intensity.push({ x: s, y: scale * gratingIntensity(s, slitCount, d, a, wavelength) });
    envelope.push({ x: s, y: scale * envelopeIntensity(s, a, wavelength) });
  }
  for (let i = 0; i < stripColumns; i++) {
    const s = sinThetaMin + ((i + 0.5) / stripColumns) * span;
    stripOut[i] = gratingIntensity(s, slitCount, d, a, wavelength);
  }
  return { intensity, envelope };
}

/** One spectral mark on the Resolving Power strip: order m of one wavelength. */
export type ResolvingPowerOrderMark = {
  readonly order: number;
  readonly sinTheta: number;
  readonly wavelength: number;
  /** Draw the order label under this mark (shorter wavelength only). */
  readonly labelled: boolean;
};

/**
 * Every emerging order of both lines for the Resolving Power strip:
 * |sin θ| = |m|λ/d < 1, labelled on the shorter wavelength.
 */
export function resolvingPowerOrderMarks(d: number, lambda1: number, lambda2: number): ResolvingPowerOrderMark[] {
  const marks: ResolvingPowerOrderMark[] = [];
  for (const wavelength of [lambda1, lambda2]) {
    const top = maxOrder(d, wavelength);
    for (let m = -top; m <= top; m++) {
      const s = orderSinTheta(m, d, wavelength);
      if (Math.abs(s) >= 1) {
        continue;
      }
      marks.push({
        order: m,
        sinTheta: s,
        wavelength: wavelength,
        labelled: wavelength === lambda1,
      });
    }
  }
  return marks;
}

/**
 * Zoomed window around order m of two close lines, and the array-factor
 * profiles (first, second, sum) sampled across it. x is offset from the
 * window centre times `xScale` (arcmin when xScale is ARCMIN_PER_RADIAN).
 */
export function sampleResolvingPowerProfiles(
  order: number,
  illuminatedLines: number,
  d: number,
  lambda1: number,
  lambda2: number,
  sampleCount: number,
  windowSeparations: number,
  windowLineWidths: number,
  xScale: number,
): {
  readonly centreRadians: number;
  readonly halfWindowRadians: number;
  readonly first: IntensitySample[];
  readonly second: IntensitySample[];
  readonly sum: IntensitySample[];
  readonly zeroSinTheta: number;
} {
  const s1 = orderSinTheta(order, d, lambda1);
  const s2 = orderSinTheta(order, d, lambda2);
  const theta1 = Math.asin(s1);
  const theta2 = Math.asin(Math.min(1, s2));
  const centreRadians = (theta1 + theta2) / 2;
  const lineWidth = lambda1 / (illuminatedLines * d * Math.cos(theta1));
  const halfWindowRadians = Math.max((windowSeparations * (theta2 - theta1)) / 2, windowLineWidths * lineWidth);
  const first: IntensitySample[] = [];
  const second: IntensitySample[] = [];
  const sum: IntensitySample[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const offset = -halfWindowRadians + (2 * halfWindowRadians * i) / (sampleCount - 1);
    const s = Math.sin(centreRadians + offset);
    const i1 = arrayIntensity(s, illuminatedLines, d, lambda1);
    const i2 = arrayIntensity(s, illuminatedLines, d, lambda2);
    const x = offset * xScale;
    first.push({ x: x, y: i1 });
    second.push({ x: x, y: i2 });
    sum.push({ x: x, y: i1 + i2 });
  }
  return {
    centreRadians: centreRadians,
    halfWindowRadians: halfWindowRadians,
    first: first,
    second: second,
    sum: sum,
    zeroSinTheta: firstZeroSinTheta(order, illuminatedLines, d, lambda1),
  };
}
