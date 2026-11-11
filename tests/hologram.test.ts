/**
 * Tests for the side-view holography model.
 */
import { describe, expect, it } from "vitest";
import {
  coherenceFactor,
  focusWidth,
  type HologramSetup,
  reconstructedIntensity,
  reconstructionSource,
  recordHologram,
} from "../src/common/model/hologram.js";

const SETUP: HologramSetup = {
  filmWidth: 120,
  referenceAngle: (25 * Math.PI) / 180,
  objects: [{ x: -10, depth: 200 }],
  coherenceLength: Number.POSITIVE_INFINITY,
  pathMatchedDepth: 200,
  objectAmplitude: 0.3,
  samplesPerWavelength: 4,
};

/** Contrast (max − min)/(max + min) of the recorded fringes. */
function fringeContrast(exposure: Float64Array): number {
  let max = Number.NEGATIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY;
  for (const value of exposure) {
    max = Math.max(max, value);
    min = Math.min(min, value);
  }
  return (max - min) / (max + min);
}

describe("recording", () => {
  it("records fringes of the expected contrast", () => {
    // Two-beam contrast 2A/(1 + A²) with A up to 0.3 at the foot of the object.
    const film = recordHologram(SETUP);
    expect(fringeContrast(film.exposure)).toBeCloseTo((2 * 0.3) / (1 + 0.09), 2);
  });

  it("loses the fringes when the coherence length is much shorter than the path difference", () => {
    const film = recordHologram({ ...SETUP, objects: [{ x: -10, depth: 400 }], coherenceLength: 20 });
    expect(fringeContrast(film.exposure)).toBeLessThan(0.01);
  });

  it("uses a Gaussian visibility", () => {
    expect(coherenceFactor(0, 10)).toBe(1);
    expect(coherenceFactor(10, 10)).toBeCloseTo(Math.exp(-1), 12);
    expect(coherenceFactor(1e6, Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("reconstruction", () => {
  const film = recordHologram(SETUP);
  const source = reconstructionSource(film, SETUP, false);

  it("focuses at the object position", () => {
    const atObject = reconstructedIntensity(source, film, -10, 200);
    for (const offset of [-15, -8, 8, 15]) {
      expect(reconstructedIntensity(source, film, -10 + offset, 200)).toBeLessThan(atObject / 3);
    }
  });

  it("widens the focus when the film is cut in half", () => {
    const object = SETUP.objects[0] ?? { x: 0, depth: 200 };
    const whole = focusWidth(source, film, object);
    const half = focusWidth(reconstructionSource(film, SETUP, true), film, object);
    expect(half).toBeGreaterThan(1.6 * whole);
  });
});
