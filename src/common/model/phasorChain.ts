/**
 * phasorChain.ts
 *
 * The N phasors drawn tip to tail on the Gratings screen. Each phasor is the
 * wave from one slit: its length is that slit's single-slit amplitude
 * sinc(β/2), divided by N so that a straight chain (θ = 0) has length 1; each
 * one is rotated by φ from the one before it. The resultant, from the first
 * tail to the last tip, is the total field, and its squared length is the
 * normalized intensity returned by gratingIntensity().
 */

import { phaseStep, singleSlitAmplitude } from "./fraunhofer.js";

type PhasorPoint = { readonly x: number; readonly y: number };

export type PhasorChain = {
  /** N + 1 points: the tail of the first phasor, then each tip in turn. */
  readonly points: readonly PhasorPoint[];
  /** The phase step φ between neighbouring phasors (radians). */
  readonly phi: number;
  /** Signed length of each phasor (negative beyond the first envelope zero). */
  readonly phasorLength: number;
};

/** Builds the chain for direction `sinTheta`. */
export function phasorChain(
  sinTheta: number,
  slitCount: number,
  d: number,
  a: number,
  wavelength: number,
): PhasorChain {
  const phi = phaseStep(sinTheta, d, wavelength);
  const phasorLength = singleSlitAmplitude(sinTheta, a, wavelength) / slitCount;

  // Centre the phases on zero so the chain stays symmetric about the x axis.
  // That only rotates the whole diagram rigidly, which changes nothing physical.
  const firstPhase = (-(slitCount - 1) * phi) / 2;
  const points: PhasorPoint[] = [{ x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  for (let n = 0; n < slitCount; n++) {
    const angle = firstPhase + n * phi;
    x += phasorLength * Math.cos(angle);
    y += phasorLength * Math.sin(angle);
    points.push({ x, y });
  }
  return { points, phi, phasorLength };
}

/**
 * Length of the resultant of a chain.
 * @internal Exported for unit tests; not part of the application API.
 */
export function resultantLength(chain: PhasorChain): number {
  const last = chain.points[chain.points.length - 1] ?? { x: 0, y: 0 };
  return Math.hypot(last.x, last.y);
}
