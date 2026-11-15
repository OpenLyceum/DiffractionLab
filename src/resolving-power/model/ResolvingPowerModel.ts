/**
 * ResolvingPowerModel.ts
 *
 * State of the Resolving Power screen: a pair of spectral lines λ and λ + Δλ,
 * a grating of given ruling with N illuminated lines, and the order m being
 * examined. Wavelengths are in nanometres; the line spacing d = 1/ruling is
 * converted to nanometres for the physics.
 *
 * The verdict compares the resolving power R = mN with the λ/Δλ the pair
 * needs (the Rayleigh criterion, book l.315).
 */

import { DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { linesToResolve, maxUsableOrder, resolvingPower } from "../../common/model/fraunhofer.js";
import {
  ILLUMINATED_LINES_DEFAULT,
  ILLUMINATED_LINES_RANGE,
  JUST_RESOLVED_TOLERANCE,
  LINE_PAIR_PRESETS,
  LINE_SEPARATION_RANGE_NM,
  LINE_WAVELENGTH_RANGE_NM,
  MAX_ORDER_BUTTON,
  NM_PER_MM,
  RULING_DEFAULT_PER_MM,
  RULING_RANGE_PER_MM,
} from "../../DiffractionLabConstants.js";
import DiffractionLabNamespace from "../../DiffractionLabNamespace.js";

/** A named pair of close spectral lines. */
export type LinePair = {
  readonly id: "sodium" | "mercury" | "hydrogen";
  readonly wavelengthNm: number;
  readonly separationNm: number;
};

/**
 * Line pairs offered as presets. Sodium D2/D1 (the book's l.336 example), the
 * mercury yellow pair, and the hydrogen/deuterium Balmer-α isotope shift.
 */
export const LINE_PAIRS: readonly LinePair[] = [
  {
    id: "sodium",
    wavelengthNm: LINE_PAIR_PRESETS.SODIUM_WAVELENGTH_NM,
    separationNm: LINE_PAIR_PRESETS.SODIUM_SEPARATION_NM,
  },
  {
    id: "mercury",
    wavelengthNm: LINE_PAIR_PRESETS.MERCURY_WAVELENGTH_NM,
    separationNm: LINE_PAIR_PRESETS.MERCURY_SEPARATION_NM,
  },
  {
    id: "hydrogen",
    wavelengthNm: LINE_PAIR_PRESETS.HYDROGEN_WAVELENGTH_NM,
    separationNm: LINE_PAIR_PRESETS.HYDROGEN_SEPARATION_NM,
  },
];

export type ResolutionVerdict = "resolved" | "justResolved" | "unresolved";

export class ResolvingPowerModel implements TModel {
  public readonly wavelengthProperty = new NumberProperty(LINE_PAIR_PRESETS.SODIUM_WAVELENGTH_NM, {
    range: LINE_WAVELENGTH_RANGE_NM,
  });
  public readonly separationProperty = new NumberProperty(LINE_PAIR_PRESETS.SODIUM_SEPARATION_NM, {
    range: LINE_SEPARATION_RANGE_NM,
  });
  public readonly rulingProperty = new NumberProperty(RULING_DEFAULT_PER_MM, {
    range: RULING_RANGE_PER_MM,
    numberType: "Integer",
  });
  public readonly illuminatedLinesProperty = new NumberProperty(ILLUMINATED_LINES_DEFAULT, {
    range: ILLUMINATED_LINES_RANGE,
    numberType: "Integer",
  });
  public readonly orderProperty = new NumberProperty(1, {
    range: new Range(1, MAX_ORDER_BUTTON),
    numberType: "Integer",
  });

  /** Line spacing d (nm). */
  public readonly spacingProperty: TReadOnlyProperty<number>;

  /** Highest order in which both lines emerge (0 when not even first order does). */
  public readonly maxOrderProperty: TReadOnlyProperty<number>;

  /** R = mN. */
  public readonly resolvingPowerProperty: TReadOnlyProperty<number>;

  /** The λ/Δλ the pair needs. */
  public readonly requiredPowerProperty: TReadOnlyProperty<number>;

  public readonly verdictProperty: TReadOnlyProperty<ResolutionVerdict>;

  public constructor() {
    this.spacingProperty = new DerivedProperty([this.rulingProperty], (ruling) => NM_PER_MM / ruling);
    this.maxOrderProperty = new DerivedProperty(
      [this.spacingProperty, this.wavelengthProperty, this.separationProperty],
      (d, lambda, delta) => Math.min(MAX_ORDER_BUTTON, maxUsableOrder(d, lambda + delta)),
    );
    this.maxOrderProperty.link((max) => {
      if (max >= 1 && this.orderProperty.value > max) {
        this.orderProperty.value = max;
      }
    });
    this.resolvingPowerProperty = new DerivedProperty(
      [this.orderProperty, this.illuminatedLinesProperty],
      (order, lines) => resolvingPower(order, lines),
    );
    this.requiredPowerProperty = new DerivedProperty(
      [this.wavelengthProperty, this.separationProperty],
      (lambda, delta) => lambda / delta,
    );
    this.verdictProperty = new DerivedProperty(
      [this.resolvingPowerProperty, this.requiredPowerProperty],
      (power, required): ResolutionVerdict => {
        const ratio = power / required;
        if (ratio > 1 + JUST_RESOLVED_TOLERANCE) {
          return "resolved";
        }
        return ratio >= 1 - JUST_RESOLVED_TOLERANCE ? "justResolved" : "unresolved";
      },
    );
  }

  /** Sets λ and Δλ from a preset pair. */
  public selectPair(pair: LinePair): void {
    this.wavelengthProperty.value = pair.wavelengthNm;
    this.separationProperty.value = pair.separationNm;
  }

  /** Sets N to the fewest lines that resolve the pair in the current order. */
  public justResolve(): void {
    const lines = linesToResolve(
      this.wavelengthProperty.value,
      this.separationProperty.value,
      this.orderProperty.value,
    );
    this.illuminatedLinesProperty.value = ILLUMINATED_LINES_RANGE.constrainValue(lines);
  }

  public reset(): void {
    this.wavelengthProperty.reset();
    this.separationProperty.reset();
    this.rulingProperty.reset();
    this.illuminatedLinesProperty.reset();
    this.orderProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on this screen.
  }
}

DiffractionLabNamespace.register("ResolvingPowerModel", ResolvingPowerModel);
