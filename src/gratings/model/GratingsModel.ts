/**
 * GratingsModel.ts
 *
 * State of the Gratings screen: N identical slits of width a and spacing d lit
 * by wavelength λ, and the direction (sin θ) under the cursor whose phasor
 * chain is drawn. Lengths are in micrometres; λ is held in nanometres for
 * the control and converted with {@link wavelengthUm}.
 *
 * The "sweep" plays the cursor forward at one order (φ advancing by 2π) per
 * PHASE_SWEEP_PERIOD seconds, through the composed TimeModel.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { TimeModel } from "../../common/TimeModel.js";
import {
  GRATINGS_AXIS_ENVELOPE_ZEROS,
  GRATINGS_CURSOR_ORDER_FRACTION,
  GRATINGS_WAVELENGTH_DEFAULT_NM,
  PHASE_SWEEP_PERIOD,
  SLIT_COUNT_DEFAULT,
  SLIT_COUNT_RANGE,
  SLIT_SPACING_DEFAULT_UM,
  SLIT_SPACING_RANGE_UM,
  SLIT_WIDTH_DEFAULT_UM,
  SLIT_WIDTH_RANGE_UM,
  WAVELENGTH_RANGE_NM,
} from "../../DiffractionLabConstants.js";
import DiffractionLabNamespace from "../../DiffractionLabNamespace.js";

export class GratingsModel implements TModel {
  public readonly slitCountProperty = new NumberProperty(SLIT_COUNT_DEFAULT, {
    range: SLIT_COUNT_RANGE,
    numberType: "Integer",
  });
  public readonly slitSpacingProperty = new NumberProperty(SLIT_SPACING_DEFAULT_UM, { range: SLIT_SPACING_RANGE_UM });
  public readonly slitWidthProperty = new NumberProperty(SLIT_WIDTH_DEFAULT_UM, { range: SLIT_WIDTH_RANGE_UM });
  public readonly wavelengthProperty = new NumberProperty(GRATINGS_WAVELENGTH_DEFAULT_NM, {
    range: WAVELENGTH_RANGE_NM,
  });

  /** The widths a slit may have: up to the spacing d. */
  public readonly slitWidthRangeProperty: TReadOnlyProperty<Range>;

  /** Direction under the cursor, as sin θ. Kept inside {@link axisRangeProperty}. */
  public readonly cursorSinThetaProperty: NumberProperty;

  public readonly showEnvelopeProperty = new BooleanProperty(true);

  /** Plot I/I₁ (peaks of height N²) instead of I/I_max. */
  public readonly scaleByNSquaredProperty = new BooleanProperty(false);

  /** Play/pause of the cursor sweep. */
  public readonly timer = new TimeModel();

  /**
   * The sin θ range of the chart: GRATINGS_AXIS_ENVELOPE_ZEROS single-slit zeros
   * on each side, but never beyond |sin θ| = 1.
   */
  public readonly axisRangeProperty: TReadOnlyProperty<Range>;

  public constructor() {
    this.axisRangeProperty = new DerivedProperty(
      [this.slitWidthProperty, this.wavelengthProperty],
      (a, lambdaNm) => {
        const half = Math.min(1, (GRATINGS_AXIS_ENVELOPE_ZEROS * (lambdaNm / 1000)) / a);
        return new Range(-half, half);
      },
      { valueComparisonStrategy: "equalsFunction" },
    );

    this.cursorSinThetaProperty = new NumberProperty(this.initialCursor(), { range: new Range(-1, 1) });
    this.axisRangeProperty.link((range) => {
      this.cursorSinThetaProperty.value = range.constrainValue(this.cursorSinThetaProperty.value);
    });

    // A slit can be no wider than the spacing between slits. The width control's enabled
    // range follows the spacing; shrinking the spacing narrows a slit that no longer fits.
    this.slitWidthRangeProperty = new DerivedProperty(
      [this.slitSpacingProperty],
      (d) => new Range(SLIT_WIDTH_RANGE_UM.min, Math.min(SLIT_WIDTH_RANGE_UM.max, d)),
      { valueComparisonStrategy: "equalsFunction" },
    );
    this.slitSpacingProperty.link((d) => {
      if (this.slitWidthProperty.value > d) {
        this.slitWidthProperty.value = d;
      }
    });
  }

  /** The wavelength in the same unit as d and a (µm). */
  public get wavelengthUm(): number {
    return this.wavelengthProperty.value / 1000;
  }

  /** The default cursor: a fraction of the way to the first order, where the chain is partly curled. */
  private initialCursor(): number {
    return (GRATINGS_CURSOR_ORDER_FRACTION * GRATINGS_WAVELENGTH_DEFAULT_NM) / 1000 / SLIT_SPACING_DEFAULT_UM;
  }

  public reset(): void {
    this.timer.reset();
    this.slitCountProperty.reset();
    this.slitSpacingProperty.reset();
    this.slitWidthProperty.reset();
    this.wavelengthProperty.reset();
    this.showEnvelopeProperty.reset();
    this.scaleByNSquaredProperty.reset();
    this.cursorSinThetaProperty.reset();
  }

  /** Advances the sweep: φ grows by 2π every PHASE_SWEEP_PERIOD seconds, wrapping across the chart. */
  public step(dt: number): void {
    this.timer.step(dt);
    if (!this.timer.isPlayingProperty.value) {
      return;
    }
    const range = this.axisRangeProperty.value;
    const orderSpacing = this.wavelengthUm / this.slitSpacingProperty.value;
    let next = this.cursorSinThetaProperty.value + (orderSpacing * dt) / PHASE_SWEEP_PERIOD;
    if (next > range.max) {
      next = range.min;
    }
    this.cursorSinThetaProperty.value = next;
  }
}

DiffractionLabNamespace.register("GratingsModel", GratingsModel);
