/**
 * CircularApertureModel.ts
 *
 * State of the Circular Aperture screen: an aperture of diameter D (m), light
 * of wavelength λ (nm), and two equal, mutually incoherent point sources an
 * angle apart (arcsec). Derived: the Rayleigh angle θ_R = 1.22 λ/D, the
 * separation in units of θ_R, the dip between the two image peaks, and the
 * verdict. With atmospheric seeing on, the point-spread function is the
 * 1″ seeing disk (see airy.ts).
 */

import { BooleanProperty, DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { centralDipFraction, rayleighAngle } from "../../common/model/airy.js";
import {
  APERTURE_DIAMETER_DEFAULT_M,
  APERTURE_DIAMETER_RANGE_M,
  APERTURE_PRESET_VALUES,
  APERTURE_WAVELENGTH_DEFAULT_NM,
  ARCSEC_PER_RADIAN,
  RAYLEIGH_TOLERANCE,
  SEEING_DIP_RESOLVED,
  SEEING_FWHM_ARCSEC,
  SOURCE_SEPARATION_DEFAULT_ARCSEC,
  SOURCE_SEPARATION_RANGE_ARCSEC,
  WAVELENGTH_RANGE_NM,
} from "../../DiffractionLabConstants.js";
import DiffractionLabNamespace from "../../DiffractionLabNamespace.js";

export type AperturePreset = {
  readonly id: "eye" | "hubble" | "ground";
  readonly diameterM: number;
  readonly wavelengthNm: number;
  readonly separationArcsec: number;
  readonly seeing: boolean;
};

/**
 * The book's worked examples (l.423, l.441): a 4 mm pupil, Hubble's 2.4 m
 * mirror, and the same mirror on the ground under 1″ seeing. Each preset puts
 * the sources a little beyond its diffraction limit.
 */
export const APERTURE_PRESETS: readonly AperturePreset[] = [
  {
    id: "eye",
    diameterM: APERTURE_PRESET_VALUES.EYE_DIAMETER_M,
    wavelengthNm: APERTURE_PRESET_VALUES.WAVELENGTH_NM,
    separationArcsec: APERTURE_PRESET_VALUES.EYE_SEPARATION_ARCSEC,
    seeing: false,
  },
  {
    id: "hubble",
    diameterM: APERTURE_PRESET_VALUES.HUBBLE_DIAMETER_M,
    wavelengthNm: APERTURE_PRESET_VALUES.WAVELENGTH_NM,
    separationArcsec: APERTURE_PRESET_VALUES.HUBBLE_SEPARATION_ARCSEC,
    seeing: false,
  },
  {
    id: "ground",
    diameterM: APERTURE_PRESET_VALUES.HUBBLE_DIAMETER_M,
    wavelengthNm: APERTURE_PRESET_VALUES.WAVELENGTH_NM,
    separationArcsec: APERTURE_PRESET_VALUES.HUBBLE_SEPARATION_ARCSEC,
    seeing: true,
  },
];

export type ApertureVerdict = "resolved" | "justResolved" | "unresolved";

export class CircularApertureModel implements TModel {
  public readonly diameterProperty = new NumberProperty(APERTURE_DIAMETER_DEFAULT_M, {
    range: APERTURE_DIAMETER_RANGE_M,
  });
  public readonly wavelengthProperty = new NumberProperty(APERTURE_WAVELENGTH_DEFAULT_NM, {
    range: WAVELENGTH_RANGE_NM,
  });
  public readonly separationProperty = new NumberProperty(SOURCE_SEPARATION_DEFAULT_ARCSEC, {
    range: SOURCE_SEPARATION_RANGE_ARCSEC,
  });
  public readonly seeingProperty = new BooleanProperty(false);
  public readonly compareSlitProperty = new BooleanProperty(false);
  public readonly boostRingsProperty = new BooleanProperty(true);

  /** θ_R in arcseconds. */
  public readonly rayleighAngleProperty: TReadOnlyProperty<number>;

  /** Source separation in units of θ_R. */
  public readonly separationRatioProperty: TReadOnlyProperty<number>;

  /** Seeing FWHM in units of θ_R (0 when seeing is off). */
  public readonly seeingInRayleighProperty: TReadOnlyProperty<number>;

  /** Dip between the peaks as a fraction of the peak (0 = one blob). */
  public readonly dipProperty: TReadOnlyProperty<number>;

  public readonly verdictProperty: TReadOnlyProperty<ApertureVerdict>;

  public constructor() {
    this.rayleighAngleProperty = new DerivedProperty(
      [this.wavelengthProperty, this.diameterProperty],
      (lambdaNm, diameter) => rayleighAngle(lambdaNm * 1e-9, diameter) * ARCSEC_PER_RADIAN,
    );
    this.separationRatioProperty = new DerivedProperty(
      [this.separationProperty, this.rayleighAngleProperty],
      (separation, rayleigh) => separation / rayleigh,
    );
    this.seeingInRayleighProperty = new DerivedProperty(
      [this.seeingProperty, this.rayleighAngleProperty],
      (seeing, rayleigh) => (seeing ? SEEING_FWHM_ARCSEC / rayleigh : 0),
    );
    this.dipProperty = new DerivedProperty(
      [this.separationRatioProperty, this.seeingInRayleighProperty],
      (ratio, seeing) => centralDipFraction(ratio, seeing),
    );
    this.verdictProperty = new DerivedProperty(
      [this.separationRatioProperty, this.dipProperty, this.seeingProperty],
      (ratio, dip, seeing): ApertureVerdict => {
        if (seeing) {
          // Under seeing there is no Airy ring to land on: judge by the dip alone.
          return dip > SEEING_DIP_RESOLVED ? "resolved" : "unresolved";
        }
        if (Math.abs(ratio - 1) <= RAYLEIGH_TOLERANCE) {
          return "justResolved";
        }
        return ratio > 1 ? "resolved" : "unresolved";
      },
    );
  }

  public applyPreset(preset: AperturePreset): void {
    this.diameterProperty.value = preset.diameterM;
    this.wavelengthProperty.value = preset.wavelengthNm;
    this.separationProperty.value = preset.separationArcsec;
    this.seeingProperty.value = preset.seeing;
  }

  public reset(): void {
    this.diameterProperty.reset();
    this.wavelengthProperty.reset();
    this.separationProperty.reset();
    this.seeingProperty.reset();
    this.compareSlitProperty.reset();
    this.boostRingsProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on this screen.
  }
}

DiffractionLabNamespace.register("CircularApertureModel", CircularApertureModel);
