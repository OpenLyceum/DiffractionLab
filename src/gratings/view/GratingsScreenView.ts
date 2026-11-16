import { GRATINGS_SCREEN_VIEW_SETTINGS } from "../../DiffractionLabConstants.js";
/**
 * GratingsScreenView.ts
 *
 * The Gratings screen: the N-slit intensity I(sin θ) with its single-slit
 * envelope and missing-order marks, the same pattern as a coloured strip on a
 * screen, a draggable cursor, and the phasor chain for the cursor's direction.
 * Below: the grating controls; on the right: readouts and the sweep button.
 */

import { DerivedProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { DragListener, HBox, KeyboardDragListener, Node, Path, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PlayPauseButton, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/DiffractionLabButtonOptions.js";
import { DiffractionLabPanel } from "../../common/DiffractionLabPanel.js";
import {
  envelopeIntensity,
  fringesInCentralEnvelope,
  gratingIntensity,
  maxOrder,
  missingOrders,
  orderSinTheta,
} from "../../common/model/fraunhofer.js";
import { type PhasorChain, phasorChain } from "../../common/model/phasorChain.js";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { formatIntensity, formatSignificant } from "../../common/view/chartUtils.js";
import { createCheckbox, createEquationNode, createNumberControl, createReadout } from "../../common/view/controls.js";
import { IntensityImageNode } from "../../common/view/IntensityImageNode.js";
import { lightRgb } from "../../common/view/lightColor.js";
import DiffractionLabColors from "../../DiffractionLabColors.js";
import {
  FONTS,
  GRATINGS_CHART_SAMPLES,
  GRATINGS_LAYOUT,
  GRATINGS_MISSING_ORDER_CAP,
  SCREEN_VIEW_MARGIN,
  SLIT_COUNT_RANGE,
  SLIT_SPACING_RANGE_UM,
  SLIT_WIDTH_RANGE_UM,
  WAVELENGTH_RANGE_NM,
} from "../../DiffractionLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { GratingsModel } from "../model/GratingsModel.js";
import { GratingsScreenSummaryContent, missingOrdersText } from "./GratingsScreenSummaryContent.js";
import { PhasorDiagramNode } from "./PhasorDiagramNode.js";

export type GratingsScreenViewOptions = ScreenViewOptions;

export class GratingsScreenView extends ScreenView {
  public constructor(model: GratingsModel, providedOptions?: GratingsScreenViewOptions) {
    const options = optionize<GratingsScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new GratingsScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getGratingsStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const units = StringManager.getInstance().getUnits();
    const a11y = StringManager.getInstance().getGratingsA11yStrings();

    // ── Intensity chart ─────────────────────────────────────────────────────────
    const yAxisLabelProperty = new DerivedProperty(
      [model.scaleByNSquaredProperty, strings.intensityAxisStringProperty, strings.intensityN2AxisStringProperty],
      (scaled, normalized, n2) => (scaled ? n2 : normalized),
    );
    const chart = new ChartFrameNode({
      viewWidth: GRATINGS_LAYOUT.CHART_WIDTH,
      viewHeight: GRATINGS_LAYOUT.CHART_HEIGHT,
      xRange: model.axisRangeProperty.value,
      yRange: new Range(0, GRATINGS_LAYOUT.Y_MAX_FACTOR),
      xAxisLabelProperty: strings.sinThetaAxisStringProperty,
      yAxisLabelProperty: yAxisLabelProperty,
      nodeOptions: { x: GRATINGS_LAYOUT.CHART_LEFT, y: GRATINGS_LAYOUT.CHART_TOP },
    });
    const transform = chart.chartTransform;
    const intensityPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.intensityCurveColorProperty,
      lineWidth: GRATINGS_LAYOUT.INTENSITY_LINE_WIDTH,
    });
    const envelopePlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.envelopeCurveColorProperty,
      lineWidth: GRATINGS_LAYOUT.ENVELOPE_LINE_WIDTH,
      lineDash: [...GRATINGS_LAYOUT.ENVELOPE_DASH],
      visibleProperty: model.showEnvelopeProperty,
    });
    chart.plotLayer.addChild(envelopePlot);
    chart.plotLayer.addChild(intensityPlot);

    const missingMarks = new Path(null, {
      stroke: DiffractionLabColors.markerColorProperty,
      lineWidth: GRATINGS_LAYOUT.MISSING_MARK_LINE_WIDTH,
    });
    chart.overlayLayer.addChild(missingMarks);

    // ── Screen strip ────────────────────────────────────────────────────────────
    const strip = new IntensityImageNode({
      width: GRATINGS_LAYOUT.CHART_WIDTH,
      height: GRATINGS_LAYOUT.STRIP_HEIGHT,
      columns: GRATINGS_LAYOUT.STRIP_COLUMNS,
      rows: 1,
      x: GRATINGS_LAYOUT.CHART_LEFT,
      y: GRATINGS_LAYOUT.CHART_TOP + GRATINGS_LAYOUT.CHART_HEIGHT + GRATINGS_LAYOUT.STRIP_GAP,
    });
    const stripFrame = new Rectangle(strip.x, strip.y, GRATINGS_LAYOUT.CHART_WIDTH, GRATINGS_LAYOUT.STRIP_HEIGHT, {
      stroke: DiffractionLabColors.chartAxisColorProperty,
    });
    const stripLabel = new Text(strings.screenStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: GRATINGS_LAYOUT.CHART_LEFT - GRATINGS_LAYOUT.STRIP_LABEL_MAX_INSET,
    });
    stripLabel.boundsProperty.link(() => {
      stripLabel.right = GRATINGS_LAYOUT.CHART_LEFT - GRATINGS_LAYOUT.STRIP_LABEL_GAP;
      stripLabel.centerY = strip.y + GRATINGS_LAYOUT.STRIP_HEIGHT / 2;
    });

    // ── Cursor ──────────────────────────────────────────────────────────────────
    const cursorLine = new Path(new Shape().moveTo(0, 0).lineTo(0, GRATINGS_LAYOUT.CHART_HEIGHT), {
      stroke: DiffractionLabColors.cursorColorProperty,
      lineWidth: GRATINGS_LAYOUT.CURSOR_LINE_WIDTH,
    });
    const cursorHandle = new Path(
      new Shape()
        .moveTo(-GRATINGS_LAYOUT.CURSOR_HANDLE.HALF_WIDTH, GRATINGS_LAYOUT.CURSOR_HANDLE.TOP)
        .lineTo(GRATINGS_LAYOUT.CURSOR_HANDLE.HALF_WIDTH, GRATINGS_LAYOUT.CURSOR_HANDLE.TOP)
        .lineTo(0, GRATINGS_LAYOUT.CURSOR_HANDLE.TIP)
        .close(),
      {
        fill: DiffractionLabColors.cursorColorProperty,
      },
    );
    const cursorHitArea = new Rectangle(
      -GRATINGS_LAYOUT.CURSOR_HIT.HALF_WIDTH,
      GRATINGS_LAYOUT.CURSOR_HIT.TOP,
      2 * GRATINGS_LAYOUT.CURSOR_HIT.HALF_WIDTH,
      GRATINGS_LAYOUT.CHART_HEIGHT + GRATINGS_LAYOUT.CURSOR_HIT.EXTRA_HEIGHT,
      { fill: "transparent" },
    );
    const cursor = new Node({
      children: [cursorHitArea, cursorLine, cursorHandle],
      cursor: "ew-resize",
      tagName: "div",
      focusable: true,
      accessibleName: a11y.controls.cursorStringProperty,
      accessibleHelpText: a11y.controls.cursorHelpStringProperty,
    });
    chart.overlayLayer.addChild(cursor);

    const setCursorFromViewX = (viewX: number): void => {
      model.cursorSinThetaProperty.value = model.axisRangeProperty.value.constrainValue(transform.viewToModelX(viewX));
    };
    cursor.addInputListener(
      new DragListener({
        drag: (event) => setCursorFromViewX(chart.globalToLocalPoint(event.pointer.point).x),
      }),
    );
    cursor.addInputListener(
      new KeyboardDragListener({
        keyboardDragDirection: "leftRight",
        dragSpeed: GRATINGS_LAYOUT.DRAG_SPEED,
        shiftDragSpeed: GRATINGS_LAYOUT.SHIFT_DRAG_SPEED,
        drag: (_event, listener) => setCursorFromViewX(cursor.x + listener.modelDelta.x),
      }),
    );
    // Clicking anywhere on the plot moves the cursor there.
    const plotHitArea = new Rectangle(0, 0, GRATINGS_LAYOUT.CHART_WIDTH, GRATINGS_LAYOUT.CHART_HEIGHT, {
      fill: "transparent",
      cursor: "pointer",
    });
    plotHitArea.addInputListener(
      new DragListener({
        press: (event) => setCursorFromViewX(chart.globalToLocalPoint(event.pointer.point).x),
        drag: (event) => setCursorFromViewX(chart.globalToLocalPoint(event.pointer.point).x),
      }),
    );
    chart.overlayLayer.insertChild(0, plotHitArea);

    // ── Phasors ─────────────────────────────────────────────────────────────────
    const chainProperty: TReadOnlyProperty<PhasorChain> = DerivedProperty.deriveAny(
      [
        model.cursorSinThetaProperty,
        model.slitCountProperty,
        model.slitSpacingProperty,
        model.slitWidthProperty,
        model.wavelengthProperty,
      ],
      () =>
        phasorChain(
          model.cursorSinThetaProperty.value,
          model.slitCountProperty.value,
          model.slitSpacingProperty.value,
          model.slitWidthProperty.value,
          model.wavelengthUm,
        ),
    );
    const phasorDiagram = new PhasorDiagramNode(chainProperty, {
      size: GRATINGS_LAYOUT.PHASOR_SIZE,
      titleProperty: strings.phasorTitleStringProperty,
      captionProperty: strings.phasorCaptionStringProperty,
    });

    const phiReadoutProperty = DerivedProperty.deriveAny([chainProperty, strings.phiReadoutStringProperty], () =>
      StringUtils.fillIn(strings.phiReadoutStringProperty.value, {
        value: formatSignificant(
          chainProperty.value.phi / (2 * Math.PI),
          GRATINGS_SCREEN_VIEW_SETTINGS.PHI_READOUT_PROPERTY_DIGITS,
        ),
      }),
    );
    const intensityReadoutProperty = DerivedProperty.deriveAny(
      [chainProperty, strings.intensityReadoutStringProperty],
      () => {
        const last = chainProperty.value.points[chainProperty.value.points.length - 1] ?? { x: 0, y: 0 };
        return StringUtils.fillIn(strings.intensityReadoutStringProperty.value, {
          value: formatIntensity(last.x * last.x + last.y * last.y),
        });
      },
    );
    const missingReadoutProperty = DerivedProperty.deriveAny(
      [
        model.slitSpacingProperty,
        model.slitWidthProperty,
        model.wavelengthProperty,
        strings.missingOrdersStringProperty,
        strings.noMissingOrdersStringProperty,
      ],
      () => missingOrdersText(model.slitSpacingProperty.value, model.slitWidthProperty.value, model.wavelengthUm),
    );
    const fringesReadoutProperty = DerivedProperty.deriveAny(
      [model.slitSpacingProperty, model.slitWidthProperty, strings.fringesInEnvelopeStringProperty],
      () =>
        StringUtils.fillIn(strings.fringesInEnvelopeStringProperty.value, {
          count: fringesInCentralEnvelope(model.slitSpacingProperty.value, model.slitWidthProperty.value),
        }),
    );

    const sweepButton = new PlayPauseButton(model.timer.isPlayingProperty, {
      radius: GRATINGS_LAYOUT.SWEEP_BUTTON_RADIUS,
      accessibleName: a11y.controls.sweepStringProperty,
    });
    const sweepRow = new HBox({
      spacing: GRATINGS_LAYOUT.RIGHT_COLUMN_SPACING,
      children: [
        sweepButton,
        new Text(strings.sweepStringProperty, { font: FONTS.LABEL, fill: DiffractionLabColors.textColorProperty }),
      ],
    });

    const rightColumn = new VBox({
      align: "left",
      spacing: GRATINGS_LAYOUT.RIGHT_COLUMN_SPACING,
      children: [phasorDiagram, createReadout(phiReadoutProperty), createReadout(intensityReadoutProperty), sweepRow],
      left: GRATINGS_LAYOUT.CHART_LEFT + GRATINGS_LAYOUT.CHART_WIDTH + GRATINGS_LAYOUT.RIGHT_COLUMN_GAP,
      top: GRATINGS_LAYOUT.CHART_TOP - GRATINGS_LAYOUT.RIGHT_COLUMN_TOP_INSET,
    });

    // ── Controls ────────────────────────────────────────────────────────────────
    const slitCountControl = createNumberControl(
      strings.slitCountStringProperty,
      model.slitCountProperty,
      SLIT_COUNT_RANGE,
      {
        decimalPlaces: 0,
        delta: 1,
      },
    );
    const wavelengthControl = createNumberControl(
      common.wavelengthStringProperty,
      model.wavelengthProperty,
      WAVELENGTH_RANGE_NM,
      { decimalPlaces: 0, delta: 1, unitsProperty: units.nanometresStringProperty },
    );
    const spacingControl = createNumberControl(
      strings.slitSpacingStringProperty,
      model.slitSpacingProperty,
      SLIT_SPACING_RANGE_UM,
      { logarithmic: true, unitsProperty: units.micrometresStringProperty },
    );
    const widthControl = createNumberControl(
      strings.slitWidthStringProperty,
      model.slitWidthProperty,
      SLIT_WIDTH_RANGE_UM,
      {
        logarithmic: true,
        unitsProperty: units.micrometresStringProperty,
        // The slider moves in log₁₀ units, so its enabled range does too.
        numberControlOptions: {
          enabledRangeProperty: new DerivedProperty(
            [model.slitWidthRangeProperty],
            (range) => new Range(Math.log10(range.min), Math.log10(range.max)),
          ),
        },
      },
    );
    const envelopeCheckbox = createCheckbox(model.showEnvelopeProperty, strings.showEnvelopeStringProperty);
    const scaleCheckbox = createCheckbox(model.scaleByNSquaredProperty, strings.scaleByNSquaredStringProperty);

    const controlsPanel = new DiffractionLabPanel(
      new HBox({
        spacing: GRATINGS_LAYOUT.CONTROLS_COLUMN_SPACING,
        align: "top",
        children: [
          new VBox({ spacing: GRATINGS_LAYOUT.CONTROLS_ROW_SPACING, children: [slitCountControl, wavelengthControl] }),
          new VBox({ spacing: GRATINGS_LAYOUT.CONTROLS_ROW_SPACING, children: [spacingControl, widthControl] }),
          new VBox({
            spacing: GRATINGS_LAYOUT.CONTROLS_ROW_SPACING,
            align: "left",
            children: [
              envelopeCheckbox,
              scaleCheckbox,
              createReadout(missingReadoutProperty, { maxWidth: GRATINGS_LAYOUT.READOUT_MAX_WIDTH, font: FONTS.SMALL }),
              createReadout(fringesReadoutProperty, { maxWidth: GRATINGS_LAYOUT.READOUT_MAX_WIDTH, font: FONTS.SMALL }),
            ],
          }),
        ],
      }),
      { left: SCREEN_VIEW_MARGIN, bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN },
    );

    const equation = createEquationNode(strings.equationStringProperty, GRATINGS_LAYOUT.EQUATION_MAX_WIDTH);
    equation.boundsProperty.link(() => {
      equation.left = rightColumn.left;
      equation.top = rightColumn.bottom + GRATINGS_LAYOUT.EQUATION_GAP;
    });

    // ── Updates ─────────────────────────────────────────────────────────────────
    const curve: Vector2[] = [];
    const envelope: Vector2[] = [];
    Multilink.multilinkAny(
      [
        model.slitCountProperty,
        model.slitSpacingProperty,
        model.slitWidthProperty,
        model.wavelengthProperty,
        model.scaleByNSquaredProperty,
        model.axisRangeProperty,
      ],
      () => {
        const n = model.slitCountProperty.value;
        const d = model.slitSpacingProperty.value;
        const a = model.slitWidthProperty.value;
        const lambda = model.wavelengthUm;
        const range = model.axisRangeProperty.value;
        const scale = model.scaleByNSquaredProperty.value ? n * n : 1;
        chart.setRanges(range, new Range(0, GRATINGS_LAYOUT.Y_MAX_FACTOR * scale));

        curve.length = 0;
        envelope.length = 0;
        for (let i = 0; i < GRATINGS_CHART_SAMPLES; i++) {
          const s = range.min + (i / (GRATINGS_CHART_SAMPLES - 1)) * range.getLength();
          curve.push(new Vector2(s, scale * gratingIntensity(s, n, d, a, lambda)));
          envelope.push(new Vector2(s, scale * envelopeIntensity(s, a, lambda)));
        }
        intensityPlot.setDataSet(curve);
        envelopePlot.setDataSet(envelope);

        // The strip is drawn as light on a screen: the true intensity, not the N² scale.
        for (let i = 0; i < GRATINGS_LAYOUT.STRIP_COLUMNS; i++) {
          const s = range.min + ((i + 0.5) / GRATINGS_LAYOUT.STRIP_COLUMNS) * range.getLength();
          strip.intensities[i] = gratingIntensity(s, n, d, a, lambda);
        }
        strip.update(lightRgb(model.wavelengthProperty.value));

        // A red tick under each missing order inside the chart.
        const marks = new Shape();
        for (const m of missingOrders(d, a, Math.min(GRATINGS_MISSING_ORDER_CAP, maxOrder(d, lambda)))) {
          for (const sign of [-1, 1]) {
            const s = sign * orderSinTheta(m, d, lambda);
            if (range.contains(s)) {
              const x = transform.modelToViewX(s);
              marks
                .moveTo(
                  x - GRATINGS_LAYOUT.MISSING_MARK_HALF,
                  GRATINGS_LAYOUT.CHART_HEIGHT - GRATINGS_LAYOUT.MISSING_MARK_RISE,
                )
                .lineTo(x + GRATINGS_LAYOUT.MISSING_MARK_HALF, GRATINGS_LAYOUT.CHART_HEIGHT);
              marks
                .moveTo(x - GRATINGS_LAYOUT.MISSING_MARK_HALF, GRATINGS_LAYOUT.CHART_HEIGHT)
                .lineTo(
                  x + GRATINGS_LAYOUT.MISSING_MARK_HALF,
                  GRATINGS_LAYOUT.CHART_HEIGHT - GRATINGS_LAYOUT.MISSING_MARK_RISE,
                );
            }
          }
        }
        missingMarks.shape = marks;
        cursor.x = transform.modelToViewX(model.cursorSinThetaProperty.value);
      },
    );
    model.cursorSinThetaProperty.link((s) => {
      cursor.x = transform.modelToViewX(s);
    });

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

    this.children = [chart, strip, stripFrame, stripLabel, rightColumn, equation, controlsPanel, resetAllButton];

    this.addChild(
      new Node({
        pdomOrder: [
          cursor,
          sweepButton,
          slitCountControl,
          wavelengthControl,
          spacingControl,
          widthControl,
          envelopeCheckbox,
          scaleCheckbox,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-only state.
  }
}
