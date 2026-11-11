/**
 * Tests for the N-slit Fraunhofer physics, checked against the worked examples
 * of Modern Physics ch. 5 (Diffraction of Light).
 */
import { describe, expect, it } from "vitest";
import {
  angularDispersion,
  arrayFactor,
  envelopeIntensity,
  fringesInCentralEnvelope,
  gratingIntensity,
  linesToResolve,
  maxOrder,
  maxUsableOrder,
  missingOrders,
  orderSinTheta,
  resolvingPower,
} from "../src/common/model/fraunhofer.js";
import { phasorChain, resultantLength } from "../src/common/model/phasorChain.js";

const LAMBDA = 0.633; // µm

describe("gratingIntensity", () => {
  it("is 1 straight ahead", () => {
    expect(gratingIntensity(0, 7, 10, 2, LAMBDA)).toBeCloseTo(1, 12);
  });

  it("reduces to the single-slit pattern for N = 1", () => {
    for (const s of [0.01, 0.1, 0.27, 0.5]) {
      expect(gratingIntensity(s, 1, 10, 2, LAMBDA)).toBeCloseTo(envelopeIntensity(s, 2, LAMBDA), 12);
    }
  });

  it("reaches the envelope at every principal maximum", () => {
    for (let m = 1; m <= 3; m++) {
      const s = orderSinTheta(m, 10, LAMBDA);
      expect(gratingIntensity(s, 6, 10, 2, LAMBDA)).toBeCloseTo(envelopeIntensity(s, 2, LAMBDA), 9);
    }
  });

  it("vanishes where the phasor chain closes, φ = 2π/N", () => {
    const n = 6;
    const s = LAMBDA / (n * 10);
    expect(gratingIntensity(s, n, 10, 2, LAMBDA)).toBeLessThan(1e-20);
  });

  it("follows the array factor's limit through φ = 2πm", () => {
    expect(Math.abs(arrayFactor(2 * Math.PI, 5))).toBeCloseTo(1, 12);
    expect(Math.abs(arrayFactor(2 * Math.PI + 1e-12, 5))).toBeCloseTo(1, 6);
  });
});

describe("phasor chain", () => {
  it("has a resultant whose square is the intensity", () => {
    for (const s of [0, 0.013, 0.04, 0.2, 0.37]) {
      const chain = phasorChain(s, 8, 10, 2, LAMBDA);
      expect(chain.points).toHaveLength(9);
      expect(resultantLength(chain) ** 2).toBeCloseTo(gratingIntensity(s, 8, 10, 2, LAMBDA), 12);
    }
  });
});

describe("double slit worked example (l.277): a = 0.0200 mm, d = 0.100 mm", () => {
  const a = 20;
  const d = 100;
  it("misses orders ±5, ±10, ±15", () => {
    expect(missingOrders(d, a, 16)).toEqual([5, 10, 15]);
  });
  it("puts nine bright fringes inside the central envelope", () => {
    expect(fringesInCentralEnvelope(d, a)).toBe(9);
  });
  it("misses only multiples of 5 when d/a = 5/2", () => {
    expect(missingOrders(5, 2, 11)).toEqual([5, 10]);
  });
});

describe("grating spectrum worked example (l.354): 5000 lines/cm", () => {
  const d = 2; // µm
  it("puts first order of 500 nm at 14.5°", () => {
    expect((Math.asin(orderSinTheta(1, d, 0.5)) * 180) / Math.PI).toBeCloseTo(14.48, 2);
  });
  it("allows m = 4 mathematically but only m = 3 in practice", () => {
    expect(maxOrder(d, 0.5)).toBe(4);
    expect(maxUsableOrder(d, 0.5)).toBe(3);
    expect(maxUsableOrder(d, 0.486)).toBe(4);
  });
  it("separates 486 nm and 656 nm by 5.08° in first order", () => {
    const theta = (lambda: number) => (Math.asin(orderSinTheta(1, d, lambda)) * 180) / Math.PI;
    expect(theta(0.656) - theta(0.486)).toBeCloseTo(5.08, 1);
  });
  it("has a dispersion m/(d cos θ)", () => {
    expect(angularDispersion(1, d, 0)).toBeCloseTo(0.5, 12);
  });
});

describe("resolving power (l.315, l.336)", () => {
  it("is R = mN", () => {
    expect(resolvingPower(2, 1500)).toBe(3000);
  });
  it("needs 982 lines for the sodium doublet in first order", () => {
    expect(linesToResolve(589.0, 0.6, 1)).toBe(982);
    expect(linesToResolve(589.0, 0.6, 2)).toBe(491);
  });
});
