import { RESOLVING_POWER_SCREEN_VIEW_SETTINGS } from "../../DiffractionLabConstants.js";
import type { DiffractionLabPreferencesModel } from "../../preferences/DiffractionLabPreferencesModel.js";
/**
 * ResolvingPowerScreenView.ts
 *
 * The Resolving Power screen: a strip showing where the two lines fall in
 * every order across −90° to +90°, a zoomed chart of the two line profiles and
 * their sum around the chosen order, and the readouts that compare R = mN with
 * the λ/Δλ the pair needs. Controls on the right.
 *
 * The line profiles are the N-line interference factor alone: over the
 * fraction of a degree the chart covers, the single-slit envelope is flat.
 * The two lines come from different atoms, so they are incoherent and their
 * intensities add.
 */

import { DerivedProperty, Multilink, StringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Line, Node, Path, type ProfileColorProperty, Rectangle, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/DiffractionLabButtonOptions.js";
import { DiffractionLabPanel } from "../../common/DiffractionLabPanel.js";
import {
  angularDispersion,
  orderSinTheta,
  resolvingPowerOrderMarks,
  sampleResolvingPowerProfiles,
} from "../../common/model/fraunhofer.js";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { formatGrouped, formatSignificant } from "../../common/view/chartUtils.js";
import {
  createEquationNode,
  createNumberControl,
  createRadioButtons,
  createReadout,
  createTextButton,
} from "../../common/view/controls.js";
import { lightColor } from "../../common/view/lightColor.js";
import DiffractionLabColors from "../../DiffractionLabColors.js";
import {
  ARCMIN_PER_RADIAN,
  DEGREES_PER_RADIAN,
  FONTS,
  ILLUMINATED_LINES_RANGE,
  LINE_SEPARATION_RANGE_NM,
  LINE_WAVELENGTH_RANGE_NM,
  MAX_ORDER_BUTTON,
  RESOLVING_CHART_SAMPLES,
  RESOLVING_LAYOUT,
  RULING_RANGE_PER_MM,
  SCREEN_VIEW_MARGIN,
} from "../../DiffractionLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { LINE_PAIRS, type ResolvingPowerModel } from "../model/ResolvingPowerModel.js";
import { ResolvingPowerScreenSummaryContent } from "./ResolvingPowerScreenSummaryContent.js";

export type ResolvingPowerScreenViewOptions = ScreenViewOptions;

export class ResolvingPowerScreenView extends ScreenView {
  public constructor(
    model: ResolvingPowerModel,
    preferences: DiffractionLabPreferencesModel,
    providedOptions?: ResolvingPowerScreenViewOptions,
  ) {
    const options = optionize<ResolvingPowerScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new ResolvingPowerScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getResolvingPowerStrings();
    const units = StringManager.getInstance().getUnits();
    const a11y = StringManager.getInstance().getResolvingPowerA11yStrings();

    // ── Spectrum strip: every order of both lines, −90° to +90° ────────────────
    const stripBackground = new Rectangle(
      RESOLVING_LAYOUT.STRIP_LEFT,
      RESOLVING_LAYOUT.STRIP_TOP,
      RESOLVING_LAYOUT.STRIP_WIDTH,
      RESOLVING_LAYOUT.STRIP_HEIGHT,
      {
        fill: DiffractionLabColors.filmColorProperty,
        stroke: DiffractionLabColors.chartAxisColorProperty,
      },
    );
    const stripLines = new Node();
    const stripTitle = new Text(strings.spectrumTitleStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: RESOLVING_LAYOUT.STRIP_WIDTH,
    });
    stripTitle.boundsProperty.link(() => {
      stripTitle.left = RESOLVING_LAYOUT.STRIP_LEFT;
      stripTitle.bottom = RESOLVING_LAYOUT.STRIP_TOP - RESOLVING_LAYOUT.STRIP_TITLE_GAP;
    });
    const angleToStripX = (thetaRad: number): number =>
      RESOLVING_LAYOUT.STRIP_LEFT + RESOLVING_LAYOUT.STRIP_WIDTH * (0.5 + thetaRad / Math.PI);

    // ── Zoomed chart ────────────────────────────────────────────────────────────
    const chart = new ChartFrameNode({
      viewWidth: RESOLVING_LAYOUT.CHART_WIDTH,
      viewHeight: RESOLVING_LAYOUT.CHART_HEIGHT,
      xRange: new Range(-1, 1),
      yRange: new Range(0, RESOLVING_LAYOUT.Y_MAX),
      xAxisLabelProperty: strings.zoomAxisStringProperty,
      yAxisLabelProperty: strings.intensityAxisStringProperty,
      nodeOptions: { x: RESOLVING_LAYOUT.CHART_LEFT, y: RESOLVING_LAYOUT.CHART_TOP },
    });
    const transform = chart.chartTransform;
    const firstPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.firstLineColorProperty,
      lineWidth: RESOLVING_LAYOUT.LINE_WIDTH,
    });
    const secondPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.secondLineColorProperty,
      lineWidth: RESOLVING_LAYOUT.LINE_WIDTH,
    });
    const sumPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.intensityCurveColorProperty,
      lineWidth: RESOLVING_LAYOUT.SUM_LINE_WIDTH,
    });
    chart.plotLayer.children = [firstPlot, secondPlot, sumPlot];

    const rayleighLine = new Line(0, 0, 0, RESOLVING_LAYOUT.CHART_HEIGHT, {
      stroke: DiffractionLabColors.markerColorProperty,
      lineDash: [...RESOLVING_LAYOUT.RAYLEIGH_DASH],
    });
    const rayleighLabel = new Text(strings.rayleighMarkerStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.markerColorProperty,
      maxWidth: RESOLVING_LAYOUT.RAYLEIGH_LABEL_MAX_WIDTH,
    });
    chart.overlayLayer.children = [rayleighLine, rayleighLabel];

    const unavailableText = new Text("", {
      font: FONTS.LABEL,
      fill: DiffractionLabColors.markerColorProperty,
      maxWidth: RESOLVING_LAYOUT.CHART_WIDTH - 2 * RESOLVING_LAYOUT.LEGEND_INSET,
    });

    const legend = new HBox({
      spacing: RESOLVING_LAYOUT.LEGEND_SPACING,
      children: [
        legendEntry(strings.firstLineStringProperty, DiffractionLabColors.firstLineColorProperty),
        legendEntry(strings.secondLineStringProperty, DiffractionLabColors.secondLineColorProperty),
        legendEntry(strings.sumStringProperty, DiffractionLabColors.intensityCurveColorProperty),
      ],
      left: RESOLVING_LAYOUT.CHART_LEFT + RESOLVING_LAYOUT.LEGEND_INSET,
      top: RESOLVING_LAYOUT.CHART_TOP + RESOLVING_LAYOUT.LEGEND_INSET,
    });

    // ── Readouts ────────────────────────────────────────────────────────────────
    const powerReadoutProperty = DerivedProperty.deriveAny(
      [model.resolvingPowerProperty, strings.resolvingPowerReadoutStringProperty],
      () =>
        StringUtils.fillIn(strings.resolvingPowerReadoutStringProperty.value, {
          value: formatGrouped(model.resolvingPowerProperty.value),
        }),
    );
    const requiredReadoutProperty = DerivedProperty.deriveAny(
      [model.requiredPowerProperty, strings.requiredReadoutStringProperty],
      () =>
        StringUtils.fillIn(strings.requiredReadoutStringProperty.value, {
          value: formatGrouped(model.requiredPowerProperty.value),
        }),
    );
    const verdictProperty = DerivedProperty.deriveAny(
      [
        model.verdictProperty,
        strings.resolvedStringProperty,
        strings.justResolvedStringProperty,
        strings.unresolvedStringProperty,
      ],
      () => {
        const verdict = model.verdictProperty.value;
        return verdict === "resolved"
          ? strings.resolvedStringProperty.value
          : verdict === "justResolved"
            ? strings.justResolvedStringProperty.value
            : strings.unresolvedStringProperty.value;
      },
    );
    const angleReadoutProperty = DerivedProperty.deriveAny(
      [model.orderProperty, model.spacingProperty, model.wavelengthProperty, strings.angleReadoutStringProperty],
      () => {
        const s = orderSinTheta(model.orderProperty.value, model.spacingProperty.value, model.wavelengthProperty.value);
        return StringUtils.fillIn(strings.angleReadoutStringProperty.value, {
          value:
            Math.abs(s) <= 1
              ? formatSignificant(
                  Math.asin(s) * DEGREES_PER_RADIAN,
                  RESOLVING_POWER_SCREEN_VIEW_SETTINGS.ANGLE_READOUT_PROPERTY_DIGITS,
                )
              : "—",
        });
      },
    );
    const dispersionReadoutProperty = DerivedProperty.deriveAny(
      [model.orderProperty, model.spacingProperty, model.wavelengthProperty, strings.dispersionReadoutStringProperty],
      () => {
        const d = model.spacingProperty.value;
        const s = orderSinTheta(model.orderProperty.value, d, model.wavelengthProperty.value);
        const value =
          Math.abs(s) < 1 ? angularDispersion(model.orderProperty.value, d, s) * ARCMIN_PER_RADIAN : Number.NaN;
        return StringUtils.fillIn(strings.dispersionReadoutStringProperty.value, {
          value: formatSignificant(value, RESOLVING_POWER_SCREEN_VIEW_SETTINGS.DISPERSION_READOUT_PROPERTY_DIGITS),
        });
      },
    );
    const verdictText = createReadout(verdictProperty, { font: FONTS.TITLE });
    model.verdictProperty.link((verdict) => {
      verdictText.fill =
        verdict === "resolved"
          ? DiffractionLabColors.accentColorProperty
          : verdict === "justResolved"
            ? DiffractionLabColors.cursorColorProperty
            : DiffractionLabColors.markerColorProperty;
    });

    const readouts = new HBox({
      spacing: RESOLVING_LAYOUT.READOUTS_SPACING,
      align: "top",
      children: [
        new VBox({
          spacing: RESOLVING_LAYOUT.READOUTS_COLUMN_SPACING,
          align: "left",
          children: [createReadout(powerReadoutProperty), createReadout(requiredReadoutProperty), verdictText],
        }),
        new VBox({
          spacing: RESOLVING_LAYOUT.READOUTS_COLUMN_SPACING,
          align: "left",
          children: [
            createReadout(angleReadoutProperty),
            createReadout(dispersionReadoutProperty),
            createEquationNode(
              preferences.showEquationsProperty,
              strings.equationStringProperty,
              RESOLVING_LAYOUT.EQUATION_MAX_WIDTH,
            ),
          ],
        }),
      ],
      left: RESOLVING_LAYOUT.CHART_LEFT,
      top: RESOLVING_LAYOUT.CHART_TOP + RESOLVING_LAYOUT.CHART_HEIGHT + RESOLVING_LAYOUT.READOUTS_GAP,
    });

    // ── Controls ────────────────────────────────────────────────────────────────
    const presetLabels = {
      sodium: strings.sodiumStringProperty,
      mercury: strings.mercuryStringProperty,
      hydrogen: strings.hydrogenStringProperty,
    } as const;
    const presetButtons = LINE_PAIRS.map((pair) =>
      createTextButton(presetLabels[pair.id], () => model.selectPair(pair), RESOLVING_LAYOUT.PRESET_BUTTON_WIDTH),
    );
    const presetsTitle = new Text(strings.presetsStringProperty, {
      font: FONTS.LABEL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: RESOLVING_LAYOUT.PRESETS_TITLE_MAX_WIDTH,
    });

    const wavelengthControl = createNumberControl(
      strings.lineWavelengthStringProperty,
      model.wavelengthProperty,
      LINE_WAVELENGTH_RANGE_NM,
      {
        significantFigures: RESOLVING_POWER_SCREEN_VIEW_SETTINGS.WAVELENGTH_CONTROL_SIGNIFICANT_FIGURES,
        delta: RESOLVING_LAYOUT.WAVELENGTH_DELTA,
        unitsProperty: units.nanometresStringProperty,
      },
    );
    const separationControl = createNumberControl(
      strings.lineSeparationStringProperty,
      model.separationProperty,
      LINE_SEPARATION_RANGE_NM,
      {
        logarithmic: true,
        significantFigures: RESOLVING_POWER_SCREEN_VIEW_SETTINGS.SEPARATION_CONTROL_SIGNIFICANT_FIGURES,
        unitsProperty: units.nanometresStringProperty,
      },
    );
    const rulingControl = createNumberControl(strings.rulingStringProperty, model.rulingProperty, RULING_RANGE_PER_MM, {
      decimalPlaces: 0,
      delta: RESOLVING_LAYOUT.RULING_DELTA,
      unitsProperty: units.linesPerMillimetreStringProperty,
    });
    const linesControl = createNumberControl(
      strings.illuminatedLinesStringProperty,
      model.illuminatedLinesProperty,
      ILLUMINATED_LINES_RANGE,
      {
        logarithmic: true,
        integer: true,
        significantFigures: RESOLVING_POWER_SCREEN_VIEW_SETTINGS.LINES_CONTROL_SIGNIFICANT_FIGURES,
        delta: RESOLVING_LAYOUT.LINES_LOG_DELTA,
        formatValue: (value) => formatGrouped(value),
      },
    );

    const orderChoices = Array.from({ length: MAX_ORDER_BUTTON }, (_, i) => {
      const order = i + 1;
      return {
        value: order,
        labelProperty: new StringProperty(String(order)),
        enabledProperty: new DerivedProperty([model.maxOrderProperty], (max) => order <= max),
      };
    });
    const orderButtons = createRadioButtons(model.orderProperty, orderChoices, a11y.controls.orderStringProperty);
    const orderRow = new HBox({
      spacing: RESOLVING_LAYOUT.ORDER_ROW_SPACING,
      children: [
        new Text(strings.orderStringProperty, {
          font: FONTS.LABEL,
          fill: DiffractionLabColors.textColorProperty,
          maxWidth: RESOLVING_LAYOUT.ORDER_LABEL_MAX_WIDTH,
        }),
        orderButtons,
      ],
    });
    const justResolveButton = createTextButton(
      strings.justResolveStringProperty,
      () => model.justResolve(),
      RESOLVING_LAYOUT.JUST_RESOLVE_BUTTON_WIDTH,
    );

    const controlsPanel = new DiffractionLabPanel(
      new VBox({
        spacing: RESOLVING_LAYOUT.CONTROLS_SPACING,
        align: "left",
        children: [
          presetsTitle,
          new HBox({ spacing: RESOLVING_LAYOUT.PRESET_ROW_SPACING, children: presetButtons }),
          wavelengthControl,
          separationControl,
          rulingControl,
          linesControl,
          orderRow,
          justResolveButton,
        ],
      }),
      { right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN, top: SCREEN_VIEW_MARGIN },
    );

    // ── Updates ─────────────────────────────────────────────────────────────────
    Multilink.multilinkAny(
      [
        model.wavelengthProperty,
        model.separationProperty,
        model.spacingProperty,
        model.illuminatedLinesProperty,
        model.orderProperty,
        model.maxOrderProperty,
        strings.orderUnavailableStringProperty,
      ],
      () => {
        const lambda1 = model.wavelengthProperty.value;
        const lambda2 = lambda1 + model.separationProperty.value;
        const d = model.spacingProperty.value;
        const n = model.illuminatedLinesProperty.value;
        const order = model.orderProperty.value;

        // Strip: one vertical line per order and wavelength.
        const stripChildren: Node[] = [];
        for (const mark of resolvingPowerOrderMarks(d, lambda1, lambda2)) {
          const x = angleToStripX(Math.asin(mark.sinTheta));
          stripChildren.push(
            new Line(
              x,
              RESOLVING_LAYOUT.STRIP_TOP + RESOLVING_LAYOUT.STRIP_LINE_INSET,
              x,
              RESOLVING_LAYOUT.STRIP_TOP + RESOLVING_LAYOUT.STRIP_HEIGHT - RESOLVING_LAYOUT.STRIP_LINE_INSET,
              {
                stroke: mark.order === 0 ? DiffractionLabColors.exposedColorProperty : lightColor(mark.wavelength),
                lineWidth: RESOLVING_LAYOUT.STRIP_LINE_WIDTH,
              },
            ),
          );
          if (mark.labelled) {
            stripChildren.push(
              new Text(`${mark.order}`.replace("-", "\u2212"), {
                font: FONTS.SMALL,
                fill: DiffractionLabColors.textColorProperty,
                centerX: x,
                top: RESOLVING_LAYOUT.STRIP_TOP + RESOLVING_LAYOUT.STRIP_HEIGHT + RESOLVING_LAYOUT.ORDER_LABEL_GAP,
              }),
            );
          }
        }

        const available = order <= model.maxOrderProperty.value;
        unavailableText.visible = !available;
        firstPlot.visible = available;
        secondPlot.visible = available;
        sumPlot.visible = available;
        rayleighLine.visible = available;
        rayleighLabel.visible = available;
        if (!available) {
          unavailableText.string = StringUtils.fillIn(strings.orderUnavailableStringProperty.value, { order: order });
          unavailableText.center = chart.center;
          stripLines.children = stripChildren;
          return;
        }

        const profiles = sampleResolvingPowerProfiles(
          order,
          n,
          d,
          lambda1,
          lambda2,
          RESOLVING_CHART_SAMPLES,
          RESOLVING_LAYOUT.WINDOW_SEPARATIONS,
          RESOLVING_LAYOUT.WINDOW_LINE_WIDTHS,
          ARCMIN_PER_RADIAN,
        );
        const { centreRadians: centre, halfWindowRadians: halfWindow } = profiles;

        // Mark the zoomed window on the strip.
        const windowLeft = angleToStripX(centre - halfWindow);
        const windowRight = angleToStripX(centre + halfWindow);
        stripChildren.push(
          new Rectangle(
            Math.min(windowLeft, windowRight - RESOLVING_LAYOUT.WINDOW_MIN_WIDTH),
            RESOLVING_LAYOUT.STRIP_TOP - RESOLVING_LAYOUT.WINDOW_OUTSET,
            Math.max(RESOLVING_LAYOUT.WINDOW_MIN_WIDTH, windowRight - windowLeft),
            RESOLVING_LAYOUT.STRIP_HEIGHT + 2 * RESOLVING_LAYOUT.WINDOW_OUTSET,
            { stroke: DiffractionLabColors.cursorColorProperty, lineWidth: RESOLVING_LAYOUT.WINDOW_LINE_WIDTH },
          ),
        );
        stripLines.children = stripChildren;

        const halfArcmin = halfWindow * ARCMIN_PER_RADIAN;
        chart.setRanges(new Range(-halfArcmin, halfArcmin), new Range(0, RESOLVING_LAYOUT.Y_MAX));
        const toVectors = (samples: readonly { readonly x: number; readonly y: number }[]): Vector2[] =>
          samples.map((point) => new Vector2(point.x, point.y));
        firstPlot.setDataSet(toVectors(profiles.first));
        secondPlot.setDataSet(toVectors(profiles.second));
        sumPlot.setDataSet(toVectors(profiles.sum));

        const zeroX = transform.modelToViewX(
          (Math.asin(Math.min(1, profiles.zeroSinTheta)) - centre) * ARCMIN_PER_RADIAN,
        );
        rayleighLine.x1 = zeroX;
        rayleighLine.x2 = zeroX;
        rayleighLabel.left = zeroX + RESOLVING_LAYOUT.RAYLEIGH_LABEL_GAP;
        rayleighLabel.top = RESOLVING_LAYOUT.RAYLEIGH_LABEL_GAP;
      },
    );

    // ── Reset All ───────────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [
      stripTitle,
      stripBackground,
      stripLines,
      chart,
      legend,
      unavailableText,
      readouts,
      controlsPanel,
      resetAllButton,
    ];

    this.addChild(
      new Node({
        pdomOrder: [
          ...presetButtons,
          wavelengthControl,
          separationControl,
          rulingControl,
          linesControl,
          orderButtons,
          justResolveButton,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-only state.
  }
}

/** A short coloured line followed by a label. */
function legendEntry(labelProperty: TReadOnlyProperty<string>, color: ProfileColorProperty): Node {
  return new HBox({
    spacing: RESOLVING_LAYOUT.LEGEND_ENTRY_SPACING,
    children: [
      new Path(new Shape().moveTo(0, 0).lineTo(RESOLVING_LAYOUT.LEGEND_SWATCH_LENGTH, 0), {
        stroke: color,
        lineWidth: RESOLVING_LAYOUT.STRIP_LINE_WIDTH,
      }),
      new Text(labelProperty, {
        font: FONTS.SMALL,
        fill: DiffractionLabColors.textColorProperty,
        maxWidth: RESOLVING_LAYOUT.LEGEND_LABEL_MAX_WIDTH,
      }),
    ],
  });
}
