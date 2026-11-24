import { roundSymmetric } from "scenerystack/dot";
import { HOLOGRAM_SETTINGS } from "../../DiffractionLabConstants.js";
/**
 * hologram.ts
 *
 * A two-dimensional (side-view) model of off-axis holography for the
 * Holography screen. All lengths are in wavelengths (λ = 1), so k = 2π.
 *
 * Geometry. The film lies along x at the film plane. Point objects sit a
 * distance `depth` in front of it. The object-illuminating beam and the
 * reference beam come from the same laser. The reference arrives as a plane
 * wave at angle θ_r from the film normal.
 *
 * Recording. At film position x the reference is R = exp(ik(2·d_m + x sinθ_r))
 * and object k contributes O_k = A·√(d_k/r_k)·exp(ik(d_k + r_k)), where r_k is
 * the distance from the object to x and d_m is the depth at which the two
 * paths are matched. The film records
 *
 *   I = |R|² + Σ|O_k|² + Σ 2Re(R*O_k)·γ(ΔL_k) + Σ 2Re(O_k*O_l)·γ(ΔL_k − ΔL_l)
 *
 * with ΔL_k the path difference between object k's light and the reference.
 * γ(ΔL) = exp(−(ΔL/L_c)²) is the fringe visibility of a source of coherence
 * length L_c: fringes vanish where the paths differ by more than L_c.
 *
 * Reconstruction. Lighting the developed film (amplitude transmittance ∝ I)
 * with the reference alone gives the field U₀ = I·R just after the film. One
 * of its terms, |R|²·O_k, is exactly object k's original wave. Huygens' sum
 * back-propagated in front of the film,
 *
 *   U(x′, z′) = Σ_film U₀(x) exp(−ikρ)/√ρ,  ρ = |(x, 0) − (x′, z′)|,
 *
 * shows where that wave appears to come from: it focuses at the object (the
 * virtual image). The zero order and the twin image stay unfocused. Cutting
 * the film in half removes half of the sum, so the focus is wider: the
 * Rayleigh criterion again, for a smaller aperture.
 */

import { HOLOGRAM_WAVE_NUMBER } from "../../DiffractionLabConstants.js";

export type HologramObject = {
  /** Position along the film (λ). */
  readonly x: number;
  /** Distance in front of the film (λ, positive). */
  readonly depth: number;
};

export type HologramSetup = {
  /** Full width of the film (λ). */
  readonly filmWidth: number;
  /** Reference-beam angle from the film normal (radians). */
  readonly referenceAngle: number;
  readonly objects: readonly HologramObject[];
  /** Coherence length of the laser (λ); Infinity for perfectly coherent light. */
  readonly coherenceLength: number;
  /** Depth at which object and reference paths are equal (λ). */
  readonly pathMatchedDepth: number;
  /** Object-wave amplitude relative to the reference (which is 1). */
  readonly objectAmplitude: number;
  /** Film samples per wavelength. */
  readonly samplesPerWavelength: number;
};

/** The recorded film: sample positions and exposure. */
export type FilmRecord = {
  readonly positions: Float64Array;
  readonly exposure: Float64Array;
  readonly spacing: number;
};

const K = HOLOGRAM_WAVE_NUMBER;

/**
 * Fringe visibility γ(ΔL) = exp(−(ΔL/L_c)²).
 * @internal Exported for unit tests; not part of the application API.
 */
export function coherenceFactor(pathDifference: number, coherenceLength: number): number {
  if (!Number.isFinite(coherenceLength)) {
    return 1;
  }
  const ratio = pathDifference / coherenceLength;
  return Math.exp(-ratio * ratio);
}

/** Positions of the film samples, at sample centres across the full width. */
function filmPositions(setup: HologramSetup): Float64Array {
  const count = Math.max(2, roundSymmetric(setup.filmWidth * setup.samplesPerWavelength));
  const spacing = setup.filmWidth / count;
  const positions = new Float64Array(count);
  for (let j = 0; j < count; j++) {
    positions[j] = -setup.filmWidth / 2 + (j + 0.5) * spacing;
  }
  return positions;
}

/** Records the hologram: exposure at each film sample. */
export function recordHologram(setup: HologramSetup): FilmRecord {
  const positions = filmPositions(setup);
  const count = positions.length;
  const exposure = new Float64Array(count);
  const sinRef = Math.sin(setup.referenceAngle);
  const objectCount = setup.objects.length;
  const objRe = new Float64Array(objectCount);
  const objIm = new Float64Array(objectCount);
  const objPath = new Float64Array(objectCount);

  for (let j = 0; j < count; j++) {
    const x = positions[j] ?? 0;
    const refPath = 2 * setup.pathMatchedDepth + x * sinRef;
    const refRe = Math.cos(K * refPath);
    const refIm = Math.sin(K * refPath);

    let total = 1; // |R|²
    for (let o = 0; o < objectCount; o++) {
      const object = setup.objects[o];
      if (!object) {
        continue;
      }
      const r = Math.hypot(x - object.x, object.depth);
      const amplitude = setup.objectAmplitude * Math.sqrt(object.depth / r);
      const path = object.depth + r;
      objRe[o] = amplitude * Math.cos(K * path);
      objIm[o] = amplitude * Math.sin(K * path);
      objPath[o] = path - refPath;
      total += amplitude * amplitude;
      // 2 Re(R* O) = 2 (Rre·Ore + Rim·Oim)
      total +=
        2 *
        (refRe * (objRe[o] ?? 0) + refIm * (objIm[o] ?? 0)) *
        coherenceFactor(path - refPath, setup.coherenceLength);
    }
    for (let o = 0; o < objectCount; o++) {
      for (let p = o + 1; p < objectCount; p++) {
        const cross = (objRe[o] ?? 0) * (objRe[p] ?? 0) + (objIm[o] ?? 0) * (objIm[p] ?? 0);
        total += 2 * cross * coherenceFactor((objPath[o] ?? 0) - (objPath[p] ?? 0), setup.coherenceLength);
      }
    }
    exposure[j] = total;
  }
  return { positions, exposure, spacing: setup.filmWidth / count };
}

/**
 * The field just after the developed film when it is lit by the reference
 * beam alone, as separate real and imaginary arrays. With `halfFilm` the
 * x > 0 half has been cut away.
 */
export function reconstructionSource(
  film: FilmRecord,
  setup: HologramSetup,
  halfFilm: boolean,
): { readonly re: Float64Array; readonly im: Float64Array } {
  const count = film.positions.length;
  const re = new Float64Array(count);
  const im = new Float64Array(count);
  const sinRef = Math.sin(setup.referenceAngle);
  for (let j = 0; j < count; j++) {
    const x = film.positions[j] ?? 0;
    if (halfFilm && x > 0) {
      continue;
    }
    const t = film.exposure[j] ?? 0;
    const refPath = 2 * setup.pathMatchedDepth + x * sinRef;
    re[j] = t * Math.cos(K * refPath);
    im[j] = t * Math.sin(K * refPath);
  }
  return { re, im };
}

/**
 * Back-propagated intensity |U|² at a point (x′, depth) in front of the film.
 */
export function reconstructedIntensity(
  source: { readonly re: Float64Array; readonly im: Float64Array },
  film: FilmRecord,
  x: number,
  depth: number,
): number {
  let sumRe = 0;
  let sumIm = 0;
  const count = film.positions.length;
  const depth2 = depth * depth;
  for (let j = 0; j < count; j++) {
    const sr = source.re[j] ?? 0;
    const si = source.im[j] ?? 0;
    if (sr === 0 && si === 0) {
      continue;
    }
    const dx = (film.positions[j] ?? 0) - x;
    const rho = Math.sqrt(dx * dx + depth2);
    const weight = 1 / Math.sqrt(rho);
    const c = Math.cos(K * rho) * weight;
    const s = -Math.sin(K * rho) * weight;
    sumRe += sr * c - si * s;
    sumIm += sr * s + si * c;
  }
  const scale = film.spacing;
  return (sumRe * sumRe + sumIm * sumIm) * scale * scale;
}

/**
 * Full width at half maximum (λ) of the reconstructed focus of an object,
 * measured along x at the object's depth. The peak is searched for within
 * ±window of the object.
 */
export function focusWidth(
  source: { readonly re: Float64Array; readonly im: Float64Array },
  film: FilmRecord,
  object: HologramObject,
  window: number = HOLOGRAM_SETTINGS.DEFAULT_WINDOW,
  step: number = HOLOGRAM_SETTINGS.DEFAULT_STEP,
): number {
  const count = roundSymmetric((2 * window) / step) + 1;
  const values = new Float64Array(count);
  let peakIndex = 0;
  for (let i = 0; i < count; i++) {
    const value = reconstructedIntensity(source, film, object.x - window + i * step, object.depth);
    values[i] = value;
    if (value > (values[peakIndex] ?? 0)) {
      peakIndex = i;
    }
  }
  const half = (values[peakIndex] ?? 0) / 2;
  const crossing = (direction: 1 | -1): number => {
    let i = peakIndex;
    while (i + direction >= 0 && i + direction < count && (values[i + direction] ?? 0) > half) {
      i += direction;
    }
    const next = i + direction;
    if (next < 0 || next >= count) {
      return i * step;
    }
    const inside = values[i] ?? 0;
    const outside = values[next] ?? 0;
    const fraction = inside === outside ? 0 : (inside - half) / (inside - outside);
    return (i + direction * fraction) * step;
  };
  return Math.abs(crossing(1) - crossing(-1));
}

/**
 * Expected focus width for a film aperture of width W at distance z:
 * the slit-diffraction FWHM 0.886 λ/(sin θ) with sin θ the aperture's
 * half-angle sine, used only for the "about" readout.
 */
export function expectedFocusWidth(apertureWidth: number, depth: number): number {
  const halfAngleSine = apertureWidth / 2 / Math.hypot(apertureWidth / 2, depth);
  return 0.886 / (2 * halfAngleSine);
}

/**
 * Copies film exposure into a view strip with x reversed (largest x at the
 * top of the side-view film). Returns the peak exposure for gain.
 */
export function sampleFilmStripReversed(exposure: Float64Array, out: Float32Array): number {
  let max = 0;
  for (const value of exposure) {
    max = Math.max(max, value);
  }
  for (let i = 0; i < exposure.length; i++) {
    out[i] = exposure[exposure.length - 1 - i] ?? 0;
  }
  return max;
}

/**
 * Linearly interpolates the central `closeUpWidth` of the film into `out`.
 * `filmWidth` is the full film width used to map sample centres. Returns the
 * peak value in the close-up for gain.
 */
export function sampleFilmCloseUp(
  film: FilmRecord,
  filmWidth: number,
  closeUpWidth: number,
  out: Float32Array,
): number {
  const exposure = film.exposure;
  const count = out.length;
  let closeMax = 0;
  for (let i = 0; i < count; i++) {
    const x = -closeUpWidth / 2 + ((i + 0.5) / count) * closeUpWidth;
    const position = (x + filmWidth / 2) / film.spacing - 0.5;
    const j = Math.max(0, Math.min(exposure.length - 2, Math.floor(position)));
    const t = Math.min(1, Math.max(0, position - j));
    const value = (1 - t) * (exposure[j] ?? 0) + t * (exposure[j + 1] ?? 0);
    out[i] = value;
    closeMax = Math.max(closeMax, value);
  }
  return closeMax;
}
