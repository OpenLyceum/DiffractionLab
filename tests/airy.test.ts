/**
 * Tests for Bessel J₁, the Airy pattern and the Rayleigh criterion
 * (Modern Physics ch. 5, l.368 onward).
 */
import { describe, expect, it } from "vitest";
import {
  airyIntensity,
  besselJ1,
  centralDipFraction,
  J1_FIRST_ZERO,
  J1_SECOND_ZERO,
  pointSpreadFunction,
  RAYLEIGH_FACTOR,
  rayleighAngle,
  twoSourceIntensity,
} from "../src/common/model/airy.js";

describe("besselJ1", () => {
  it("matches tabulated values", () => {
    // Abramowitz & Stegun, Table 9.1.
    expect(besselJ1(0)).toBe(0);
    expect(besselJ1(1)).toBeCloseTo(0.4400505857, 7);
    expect(besselJ1(2)).toBeCloseTo(0.5767248078, 7);
    expect(besselJ1(5)).toBeCloseTo(-0.3275791376, 7);
    expect(besselJ1(10)).toBeCloseTo(0.0434727462, 7);
    expect(besselJ1(-2)).toBeCloseTo(-0.5767248078, 7);
  });
  it("vanishes at its first two zeros", () => {
    expect(Math.abs(besselJ1(J1_FIRST_ZERO))).toBeLessThan(1e-7);
    expect(Math.abs(besselJ1(J1_SECOND_ZERO))).toBeLessThan(1e-7);
  });
});

describe("Airy pattern", () => {
  it("is 1 at the centre and 0 on the first dark ring", () => {
    expect(airyIntensity(0)).toBe(1);
    expect(airyIntensity(J1_FIRST_ZERO)).toBeLessThan(1e-14);
  });
  it("has a first bright ring of about 1.75 %", () => {
    expect(airyIntensity(5.1356)).toBeCloseTo(0.0175, 3);
  });
  it("gives the factor 1.22", () => {
    expect(RAYLEIGH_FACTOR).toBeCloseTo(1.2197, 4);
  });
});

describe("Rayleigh criterion", () => {
  it("gives Hubble 2.80e-7 rad at 550 nm (l.423)", () => {
    expect(rayleighAngle(550e-9, 2.4)).toBeCloseTo(2.8e-7, 8);
  });
  it("gives the eye 1.68e-4 rad with a 4 mm pupil (l.441)", () => {
    expect(rayleighAngle(550e-9, 4e-3)).toBeCloseTo(1.68e-4, 6);
  });
  it("leaves a dip of about 26 % at the Rayleigh separation", () => {
    const dip = centralDipFraction(1);
    expect(dip).toBeGreaterThan(0.25);
    expect(dip).toBeLessThan(0.28);
  });
  it("has no dip at half the Rayleigh separation", () => {
    expect(centralDipFraction(0.5)).toBe(0);
  });
  it("adds the two images incoherently", () => {
    expect(twoSourceIntensity(0.5, 0, 1)).toBeCloseTo(1 + airyIntensity(J1_FIRST_ZERO), 12);
  });
  it("blurs the pair together under seeing many times the diffraction limit", () => {
    expect(pointSpreadFunction(0, 17)).toBe(1);
    expect(centralDipFraction(1, 17)).toBe(0);
  });
});
