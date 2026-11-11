/**
 * controls.ts
 *
 * Factories for the themed controls every screen uses:
 *  - {@link createNumberControl}: a NumberControl with a units suffix, a
 *    significant-figure readout, and an optional logarithmic slider (aperture
 *    diameters and line counts span several decades). Adapted from StellarWobble.
 *  - {@link createCheckbox}: a themed checkbox with a text label.
 *  - {@link createEquationNode}: rich text shown only while the "Show
 *    equations" preference is on.
 *  - {@link createReadout}: a rich-text readout that follows a string Property.
 *  - {@link createTextButton}: a flat light push button with a text label.
 *  - {@link createRadioButtons}: a horizontal row of flat light radio buttons.
 */

import { NumberProperty, type PhetioProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { combineOptions } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { type Node, RichText, type RichTextOptions, Text } from "scenerystack/scenery";
import { NumberControl, type NumberControlOptions } from "scenerystack/scenery-phet";
import {
  Checkbox,
  type CheckboxOptions,
  RectangularPushButton,
  RectangularRadioButtonGroup,
  type RectangularRadioButtonGroupItem,
} from "scenerystack/sun";
import DiffractionLabColors from "../../DiffractionLabColors.js";
import { FONTS } from "../../DiffractionLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { diffractionLabPreferences } from "../../preferences/DiffractionLabPreferencesModel.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../DiffractionLabButtonOptions.js";
import {
  DIFFRACTION_LAB_CHECKBOX_OPTIONS,
  DIFFRACTION_LAB_NUMBER_CONTROL_OPTIONS,
} from "../DiffractionLabControlOptions.js";
import { formatSignificant } from "./chartUtils.js";

export type CreateNumberControlOptions = {
  /** Localized unit symbol appended after the value. */
  unitsProperty?: TReadOnlyProperty<string>;
  /** Significant figures of the readout (default 3). */
  significantFigures?: number;
  /** Decimal places instead of significant figures (integers: 0). */
  decimalPlaces?: number;
  /** Arrow-button step; in decades on a logarithmic control (default 1/100 of the range, or 0.02 decade). */
  delta?: number;
  /** Move the slider on a log₁₀ scale. */
  logarithmic?: boolean;
  /** The Property holds integers: a logarithmic slider rounds to whole numbers. */
  integer?: boolean;
  /** Accessible name; defaults to the visible title. */
  accessibleName?: TReadOnlyProperty<string>;
  /** Write the units straight after the value, with no pattern (for "°", "″"). */
  compactUnits?: boolean;
  /** Format the value yourself (overrides the significant figures and the units). */
  formatValue?: (value: number) => string;
  /** Extra NumberControl options merged last. */
  numberControlOptions?: NumberControlOptions;
};

/** Rounds a value to `significantFigures`. */
const roundToFigures = (value: number, significantFigures: number): number =>
  value === 0 ? 0 : Number(value.toPrecision(significantFigures));

/**
 * A log₁₀ proxy of `property` for a logarithmic slider, kept in step both ways.
 * A value the proxy sets is rounded to the readout's figures and kept in range.
 */
function createLogarithmicProxy(
  property: PhetioProperty<number>,
  range: Range,
  figures: number,
  integer: boolean,
): NumberProperty {
  const proxy = new NumberProperty(Math.log10(property.value), {
    range: new Range(Math.log10(range.min), Math.log10(range.max)),
  });
  let updating = false;
  proxy.lazyLink((log) => {
    if (!updating) {
      updating = true;
      const value = roundToFigures(10 ** log, figures);
      property.value = range.constrainValue(integer ? Math.round(value) : value);
      updating = false;
    }
  });
  property.lazyLink((value) => {
    if (!updating) {
      updating = true;
      proxy.value = proxy.range.constrainValue(Math.log10(value));
      updating = false;
    }
  });
  return proxy;
}

export function createNumberControl(
  titleProperty: TReadOnlyProperty<string>,
  numberProperty: PhetioProperty<number>,
  range: Range,
  options: CreateNumberControlOptions = {},
): NumberControl {
  const figures = options.significantFigures ?? 3;
  const logarithmic = options.logarithmic ?? false;
  const units = StringManager.getInstance().getUnits();

  const controlledProperty = logarithmic
    ? createLogarithmicProxy(numberProperty, range, figures, options.integer ?? false)
    : numberProperty;
  const controlledRange = logarithmic ? new Range(Math.log10(range.min), Math.log10(range.max)) : range;
  const delta = options.delta ?? (logarithmic ? 0.02 : (range.max - range.min) / 100);
  const toValue = (controlled: number): number => (logarithmic ? range.constrainValue(10 ** controlled) : controlled);

  const unitsProperty = options.unitsProperty;
  const format = (controlled: number): string => {
    const value = toValue(controlled);
    if (options.formatValue) {
      return options.formatValue(value);
    }
    const text =
      options.decimalPlaces === undefined
        ? formatSignificant(roundToFigures(value, figures), figures)
        : value.toFixed(options.decimalPlaces);
    if (!unitsProperty) {
      return text;
    }
    return options.compactUnits
      ? `${text}${unitsProperty.value}`
      : StringUtils.fillIn(units.valueUnitsPatternStringProperty.value, { value: text, units: unitsProperty.value });
  };

  return new NumberControl(
    titleProperty,
    controlledProperty,
    controlledRange,
    combineOptions<NumberControlOptions>(
      {},
      DIFFRACTION_LAB_NUMBER_CONTROL_OPTIONS,
      {
        delta,
        accessibleName: options.accessibleName ?? titleProperty,
        titleNodeOptions: { fill: DiffractionLabColors.textColorProperty, font: FONTS.LABEL, maxWidth: 140 },
        numberDisplayOptions: {
          useRichText: true,
          textOptions: { fill: DiffractionLabColors.controlSurfaceTextColorProperty, font: FONTS.LABEL },
          backgroundFill: DiffractionLabColors.controlSurfaceColorProperty,
          numberFormatter: format,
          numberFormatterDependencies: unitsProperty
            ? [unitsProperty, units.valueUnitsPatternStringProperty]
            : [units.valueUnitsPatternStringProperty],
          maxWidth: 100,
        },
      },
      options.numberControlOptions,
    ),
  );
}

/** A themed checkbox with a text label. */
export function createCheckbox(
  property: Property<boolean>,
  labelProperty: TReadOnlyProperty<string>,
  options?: CheckboxOptions,
): Checkbox {
  return new Checkbox(
    property,
    new Text(labelProperty, { font: FONTS.LABEL, fill: DiffractionLabColors.textColorProperty, maxWidth: 190 }),
    combineOptions<CheckboxOptions>({ accessibleName: labelProperty }, DIFFRACTION_LAB_CHECKBOX_OPTIONS, options),
  );
}

/** Rich text visible only while the "Show equations" preference is on. */
export function createEquationNode(equationProperty: TReadOnlyProperty<string>, maxWidth = 320): Node {
  return new RichText(equationProperty, {
    font: FONTS.READOUT,
    fill: DiffractionLabColors.accentColorProperty,
    maxWidth,
    visibleProperty: diffractionLabPreferences.showEquationsProperty,
  });
}

/** A rich-text readout that follows `textProperty`. */
export function createReadout(textProperty: TReadOnlyProperty<string>, options?: RichTextOptions): RichText {
  return new RichText(
    textProperty,
    combineOptions<RichTextOptions>(
      { font: FONTS.READOUT, fill: DiffractionLabColors.textColorProperty, maxWidth: 300 },
      options,
    ),
  );
}

/** A flat light push button with a text label. */
export function createTextButton(
  labelProperty: TReadOnlyProperty<string>,
  listener: () => void,
  maxTextWidth = 140,
): RectangularPushButton {
  return new RectangularPushButton({
    ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
    content: new Text(labelProperty, { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: maxTextWidth }),
    listener: listener,
    accessibleName: labelProperty,
    xMargin: 8,
    yMargin: 4,
  });
}

/** One choice of {@link createRadioButtons}. */
export type RadioChoice<T> = {
  readonly value: T;
  readonly labelProperty: TReadOnlyProperty<string>;
  readonly enabledProperty?: TReadOnlyProperty<boolean>;
};

/** A horizontal row of flat light radio buttons, each labelled with text. */
export function createRadioButtons<T>(
  property: Property<T>,
  choices: readonly RadioChoice<T>[],
  accessibleNameProperty: TReadOnlyProperty<string>,
): RectangularRadioButtonGroup<T> {
  const items: RectangularRadioButtonGroupItem<T>[] = choices.map((choice) => ({
    value: choice.value,
    createNode: () =>
      new Text(choice.labelProperty, { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 110 }),
    options: { accessibleName: choice.labelProperty },
  }));
  const group = new RectangularRadioButtonGroup(property, items, {
    orientation: "horizontal",
    spacing: 6,
    accessibleName: accessibleNameProperty,
    radioButtonOptions: {
      baseColor: DiffractionLabColors.controlSurfaceColorProperty,
      xMargin: 8,
      yMargin: 4,
      buttonAppearanceStrategyOptions: {
        selectedStroke: DiffractionLabColors.accentColorProperty,
        selectedLineWidth: 3,
        deselectedButtonOpacity: 0.85,
      },
      contentAppearanceStrategyOptions: {
        deselectedContentOpacity: 1,
      },
    },
  });
  // A button cannot be handed a derived enabledProperty (it must own its own), so follow it instead.
  for (const choice of choices) {
    const button = group.getButtonForValue(choice.value);
    choice.enabledProperty?.link((enabled) => {
      button.enabled = enabled;
    });
  }
  return group;
}
