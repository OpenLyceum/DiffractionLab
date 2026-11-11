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
  arrayIntensity,
  firstZeroSinTheta,
  maxOrder,
  orderSinTheta,
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
  FONTS,
  ILLUMINATED_LINES_RANGE,
  LINE_SEPARATION_RANGE_NM,
  LINE_WAVELENGTH_RANGE_NM,
  MAX_ORDER_BUTTON,
  RESOLVING_CHART_SAMPLES,
  RULING_RANGE_PER_MM,
  SCREEN_VIEW_MARGIN,
} from "../../DiffractionLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { LINE_PAIRS, type ResolvingPowerModel } from "../model/ResolvingPowerModel.js";
import { ResolvingPowerScreenSummaryContent } from "./ResolvingPowerScreenSummaryContent.js";

export type ResolvingPowerScreenViewOptions = ScreenViewOptions;

const ARCMIN_PER_RADIAN = (180 / Math.PI) * 60;

const STRIP_LEFT = 70;
const STRIP_TOP = 34;
const STRIP_WIDTH = 560;
const STRIP_HEIGHT = 44;

const CHART_LEFT = 70;
const CHART_TOP = 140;
const CHART_WIDTH = 560;
const CHART_HEIGHT = 285;

/** The zoomed chart spans this many line separations, or this many line widths, whichever is wider. */
const WINDOW_SEPARATIONS = 3;
const WINDOW_LINE_WIDTHS = 4;

export class ResolvingPowerScreenView extends ScreenView {
  public constructor(model: ResolvingPowerModel, providedOptions?: ResolvingPowerScreenViewOptions) {
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
    const stripBackground = new Rectangle(STRIP_LEFT, STRIP_TOP, STRIP_WIDTH, STRIP_HEIGHT, {
      fill: DiffractionLabColors.filmColorProperty,
      stroke: DiffractionLabColors.chartAxisColorProperty,
    });
    const stripLines = new Node();
    const stripTitle = new Text(strings.spectrumTitleStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: STRIP_WIDTH,
    });
    stripTitle.boundsProperty.link(() => {
      stripTitle.left = STRIP_LEFT;
      stripTitle.bottom = STRIP_TOP - 4;
    });
    const angleToStripX = (thetaRad: number): number => STRIP_LEFT + STRIP_WIDTH * (0.5 + thetaRad / Math.PI);

    // ── Zoomed chart ────────────────────────────────────────────────────────────
    const chart = new ChartFrameNode({
      viewWidth: CHART_WIDTH,
      viewHeight: CHART_HEIGHT,
      xRange: new Range(-1, 1),
      yRange: new Range(0, 2.1),
      xAxisLabelProperty: strings.zoomAxisStringProperty,
      yAxisLabelProperty: strings.intensityAxisStringProperty,
      nodeOptions: { x: CHART_LEFT, y: CHART_TOP },
    });
    const transform = chart.chartTransform;
    const firstPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.firstLineColorProperty,
      lineWidth: 1.5,
    });
    const secondPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.secondLineColorProperty,
      lineWidth: 1.5,
    });
    const sumPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.intensityCurveColorProperty,
      lineWidth: 2,
    });
    chart.plotLayer.children = [firstPlot, secondPlot, sumPlot];

    const rayleighLine = new Line(0, 0, 0, CHART_HEIGHT, {
      stroke: DiffractionLabColors.markerColorProperty,
      lineDash: [5, 4],
    });
    const rayleighLabel = new Text(strings.rayleighMarkerStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.markerColorProperty,
      maxWidth: 140,
    });
    chart.overlayLayer.children = [rayleighLine, rayleighLabel];

    const unavailableText = new Text("", {
      font: FONTS.LABEL,
      fill: DiffractionLabColors.markerColorProperty,
      maxWidth: CHART_WIDTH - 20,
    });

    const legend = new HBox({
      spacing: 14,
      children: [
        legendEntry(strings.firstLineStringProperty, DiffractionLabColors.firstLineColorProperty),
        legendEntry(strings.secondLineStringProperty, DiffractionLabColors.secondLineColorProperty),
        legendEntry(strings.sumStringProperty, DiffractionLabColors.intensityCurveColorProperty),
      ],
      left: CHART_LEFT + 8,
      top: CHART_TOP + 8,
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
          value: Math.abs(s) <= 1 ? formatSignificant((Math.asin(s) * 180) / Math.PI, 4) : "—",
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
          value: formatSignificant(value, 3),
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
      spacing: 30,
      align: "top",
      children: [
        new VBox({
          spacing: 6,
          align: "left",
          children: [createReadout(powerReadoutProperty), createReadout(requiredReadoutProperty), verdictText],
        }),
        new VBox({
          spacing: 6,
          align: "left",
          children: [
            createReadout(angleReadoutProperty),
            createReadout(dispersionReadoutProperty),
            createEquationNode(strings.equationStringProperty, 200),
          ],
        }),
      ],
      left: CHART_LEFT,
      top: CHART_TOP + CHART_HEIGHT + 52,
    });

    // ── Controls ────────────────────────────────────────────────────────────────
    const presetLabels = {
      sodium: strings.sodiumStringProperty,
      mercury: strings.mercuryStringProperty,
      hydrogen: strings.hydrogenStringProperty,
    } as const;
    const presetButtons = LINE_PAIRS.map((pair) =>
      createTextButton(presetLabels[pair.id], () => model.selectPair(pair), 90),
    );
    const presetsTitle = new Text(strings.presetsStringProperty, {
      font: FONTS.LABEL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: 260,
    });

    const wavelengthControl = createNumberControl(
      strings.lineWavelengthStringProperty,
      model.wavelengthProperty,
      LINE_WAVELENGTH_RANGE_NM,
      { significantFigures: 4, delta: 0.1, unitsProperty: units.nanometresStringProperty },
    );
    const separationControl = createNumberControl(
      strings.lineSeparationStringProperty,
      model.separationProperty,
      LINE_SEPARATION_RANGE_NM,
      { logarithmic: true, significantFigures: 2, unitsProperty: units.nanometresStringProperty },
    );
    const rulingControl = createNumberControl(strings.rulingStringProperty, model.rulingProperty, RULING_RANGE_PER_MM, {
      decimalPlaces: 0,
      delta: 10,
      unitsProperty: units.linesPerMillimetreStringProperty,
    });
    const linesControl = createNumberControl(
      strings.illuminatedLinesStringProperty,
      model.illuminatedLinesProperty,
      ILLUMINATED_LINES_RANGE,
      {
        logarithmic: true,
        integer: true,
        significantFigures: 4,
        delta: 0.01,
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
      spacing: 10,
      children: [
        new Text(strings.orderStringProperty, {
          font: FONTS.LABEL,
          fill: DiffractionLabColors.textColorProperty,
          maxWidth: 80,
        }),
        orderButtons,
      ],
    });
    const justResolveButton = createTextButton(strings.justResolveStringProperty, () => model.justResolve(), 230);

    const controlsPanel = new DiffractionLabPanel(
      new VBox({
        spacing: 10,
        align: "left",
        children: [
          presetsTitle,
          new HBox({ spacing: 6, children: presetButtons }),
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
        for (const lambda of [lambda1, lambda2]) {
          const top = maxOrder(d, lambda);
          for (let m = -top; m <= top; m++) {
            const s = orderSinTheta(m, d, lambda);
            if (Math.abs(s) >= 1) {
              continue;
            }
            const x = angleToStripX(Math.asin(s));
            stripChildren.push(
              new Line(x, STRIP_TOP + 2, x, STRIP_TOP + STRIP_HEIGHT - 2, {
                stroke: m === 0 ? DiffractionLabColors.exposedColorProperty : lightColor(lambda),
                lineWidth: 2,
              }),
            );
            if (lambda === lambda1) {
              stripChildren.push(
                new Text(`${m}`.replace("-", "\u2212"), {
                  font: FONTS.SMALL,
                  fill: DiffractionLabColors.textColorProperty,
                  centerX: x,
                  top: STRIP_TOP + STRIP_HEIGHT + 2,
                }),
              );
            }
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

        const s1 = orderSinTheta(order, d, lambda1);
        const s2 = orderSinTheta(order, d, lambda2);
        const theta1 = Math.asin(s1);
        const theta2 = Math.asin(Math.min(1, s2));
        const centre = (theta1 + theta2) / 2;
        const lineWidth = lambda1 / (n * d * Math.cos(theta1));
        const halfWindow = Math.max((WINDOW_SEPARATIONS * (theta2 - theta1)) / 2, WINDOW_LINE_WIDTHS * lineWidth);

        // Mark the zoomed window on the strip.
        const windowLeft = angleToStripX(centre - halfWindow);
        const windowRight = angleToStripX(centre + halfWindow);
        stripChildren.push(
          new Rectangle(
            Math.min(windowLeft, windowRight - 6),
            STRIP_TOP - 2,
            Math.max(6, windowRight - windowLeft),
            STRIP_HEIGHT + 4,
            { stroke: DiffractionLabColors.cursorColorProperty, lineWidth: 1.5 },
          ),
        );
        stripLines.children = stripChildren;

        const halfArcmin = halfWindow * ARCMIN_PER_RADIAN;
        chart.setRanges(new Range(-halfArcmin, halfArcmin), new Range(0, 2.1));
        const first: Vector2[] = [];
        const second: Vector2[] = [];
        const sum: Vector2[] = [];
        for (let i = 0; i < RESOLVING_CHART_SAMPLES; i++) {
          const offset = -halfWindow + (2 * halfWindow * i) / (RESOLVING_CHART_SAMPLES - 1);
          const s = Math.sin(centre + offset);
          const i1 = arrayIntensity(s, n, d, lambda1);
          const i2 = arrayIntensity(s, n, d, lambda2);
          const x = offset * ARCMIN_PER_RADIAN;
          first.push(new Vector2(x, i1));
          second.push(new Vector2(x, i2));
          sum.push(new Vector2(x, i1 + i2));
        }
        firstPlot.setDataSet(first);
        secondPlot.setDataSet(second);
        sumPlot.setDataSet(sum);

        const zero = firstZeroSinTheta(order, n, d, lambda1);
        const zeroX = transform.modelToViewX((Math.asin(Math.min(1, zero)) - centre) * ARCMIN_PER_RADIAN);
        rayleighLine.x1 = zeroX;
        rayleighLine.x2 = zeroX;
        rayleighLabel.left = zeroX + 4;
        rayleighLabel.top = 4;
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
    spacing: 4,
    children: [
      new Path(new Shape().moveTo(0, 0).lineTo(18, 0), { stroke: color, lineWidth: 2 }),
      new Text(labelProperty, { font: FONTS.SMALL, fill: DiffractionLabColors.textColorProperty, maxWidth: 80 }),
    ],
  });
}
