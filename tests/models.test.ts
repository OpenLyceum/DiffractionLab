/**
 * Tests for the screen models: derived quantities, presets and the
 * frame-by-frame hologram reconstruction.
 */
import { describe, expect, it } from "vitest";
import { APERTURE_PRESETS, CircularApertureModel } from "../src/circular-aperture/model/CircularApertureModel.js";
import { GratingsModel } from "../src/gratings/model/GratingsModel.js";
import { HolographyModel } from "../src/holography/model/HolographyModel.js";
import { LINE_PAIRS, ResolvingPowerModel } from "../src/resolving-power/model/ResolvingPowerModel.js";

describe("GratingsModel", () => {
  it("never lets the slit be wider than the spacing", () => {
    const model = new GratingsModel();
    model.slitWidthProperty.value = 8;
    model.slitSpacingProperty.value = 5;
    expect(model.slitWidthProperty.value).toBe(5);
  });

  it("sweeps the cursor forward and keeps it on the chart", () => {
    const model = new GratingsModel();
    const start = model.cursorSinThetaProperty.value;
    model.timer.isPlayingProperty.value = true;
    model.step(1);
    expect(model.cursorSinThetaProperty.value).toBeGreaterThan(start);
    for (let i = 0; i < 400; i++) {
      model.step(0.1);
      expect(model.axisRangeProperty.value.contains(model.cursorSinThetaProperty.value)).toBe(true);
    }
  });
});

describe("ResolvingPowerModel", () => {
  it("starts with the sodium doublet unresolved and resolves it with 982 lines", () => {
    const model = new ResolvingPowerModel();
    expect(model.verdictProperty.value).toBe("unresolved");
    model.justResolve();
    expect(model.illuminatedLinesProperty.value).toBe(982);
    expect(model.verdictProperty.value).toBe("justResolved");
    model.illuminatedLinesProperty.value = 3000;
    expect(model.verdictProperty.value).toBe("resolved");
  });

  it("drops to an order that exists when the ruling gets finer", () => {
    const model = new ResolvingPowerModel();
    model.orderProperty.value = 2;
    model.rulingProperty.value = 1500; // d = 667 nm: only first order
    expect(model.maxOrderProperty.value).toBe(1);
    expect(model.orderProperty.value).toBe(1);
  });

  it("sets λ and Δλ from a preset", () => {
    const model = new ResolvingPowerModel();
    const hydrogen = LINE_PAIRS.find((pair) => pair.id === "hydrogen");
    if (hydrogen) {
      model.selectPair(hydrogen);
    }
    expect(model.separationProperty.value).toBeCloseTo(0.18, 12);
  });
});

describe("CircularApertureModel", () => {
  it("gives the eye a 34.6″ Rayleigh angle", () => {
    const model = new CircularApertureModel();
    expect(model.rayleighAngleProperty.value).toBeCloseTo(34.6, 1);
  });

  it("resolves Hubble's pair but not the same pair through seeing", () => {
    const model = new CircularApertureModel();
    const [, hubble, ground] = APERTURE_PRESETS;
    if (!(hubble && ground)) {
      throw new Error("missing presets");
    }
    model.applyPreset(hubble);
    expect(model.verdictProperty.value).toBe("resolved");
    model.applyPreset(ground);
    expect(model.verdictProperty.value).toBe("unresolved");
  });

  it("reads 'just resolved' at the Rayleigh separation", () => {
    const model = new CircularApertureModel();
    model.separationProperty.value = model.rayleighAngleProperty.value;
    expect(model.verdictProperty.value).toBe("justResolved");
    expect(model.dipProperty.value).toBeCloseTo(0.265, 2);
  });
});

describe("HolographyModel", () => {
  it("reconstructs over several frames and then measures the focus", () => {
    const model = new HolographyModel();
    model.modeProperty.value = "reconstruct";
    model.step(1 / 60);
    expect(model.reconstructionProgressProperty.value).toBeGreaterThan(0);
    expect(model.reconstructionProgressProperty.value).toBeLessThan(1);
    expect(model.focusWidthProperty.value).toBeNull();
    model.completeReconstruction();
    expect(model.reconstructionProgressProperty.value).toBe(1);
    expect(model.focusWidthProperty.value).toBeGreaterThan(0.5);
    expect(model.focusWidthProperty.value).toBeLessThan(3);
    model.dispose();
  });

  it("restarts the reconstruction when the film is cut", () => {
    const model = new HolographyModel();
    model.completeReconstruction();
    const whole = model.focusWidthProperty.value ?? 0;
    model.halfFilmProperty.value = true;
    expect(model.reconstructionProgressProperty.value).toBe(0);
    model.completeReconstruction();
    expect(model.focusWidthProperty.value ?? 0).toBeGreaterThan(1.5 * whole);
    model.dispose();
  });
});
