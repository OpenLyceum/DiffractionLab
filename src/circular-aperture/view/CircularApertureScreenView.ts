/**
 * CircularApertureScreenView.ts
 *
 * The Circular Aperture screen: the image of two equal, incoherent point
 * sources through a circular aperture (each an Airy disk), the intensity
 * along the line through both, and the Rayleigh readouts. Optional overlays:
 * the same pair through a slit of width D, and atmospheric seeing.
 *
 * Both the image and the chart cover the same field of view, chosen to show
 * both sources and a couple of Airy rings (or the seeing disk) around them.
 *
 * Image pixels show the brightest point inside each pixel (the point-spread
 * function evaluated half a pixel closer to the source), so a source never
 * vanishes between samples when the Airy disk is much smaller than a pixel.
 */

import { DerivedProperty, Multilink } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Line, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/DiffractionLabButtonOptions.js";
import { DiffractionLabPanel } from "../../common/DiffractionLabPanel.js";
import { pointSpreadFunction, RAYLEIGH_FACTOR, slitIntensityInSlitUnits } from "../../common/model/airy.js";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import {
  createCheckbox,
  createEquationNode,
  createNumberControl,
  createReadout,
  createTextButton,
} from "../../common/view/controls.js";
import { IntensityImageNode } from "../../common/view/IntensityImageNode.js";
import { lightRgb } from "../../common/view/lightColor.js";
import DiffractionLabColors from "../../DiffractionLabColors.js";
import {
  AIRY_CHART_SAMPLES,
  AIRY_IMAGE_SAMPLES,
  APERTURE_DIAMETER_RANGE_M,
  FONTS,
  SCREEN_VIEW_MARGIN,
  SEEING_FWHM_ARCSEC,
  SOURCE_SEPARATION_RANGE_ARCSEC,
  WAVELENGTH_RANGE_NM,
} from "../../DiffractionLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { APERTURE_PRESETS, type CircularApertureModel } from "../model/CircularApertureModel.js";
import { CircularApertureScreenSummaryContent } from "./CircularApertureScreenSummaryContent.js";
import { formatDiameter } from "./formatDiameter.js";

export type CircularApertureScreenViewOptions = ScreenViewOptions;

const IMAGE_LEFT = 40;
const IMAGE_TOP = 40;
const IMAGE_SIZE = 250;

const CHART_LEFT = 70;
const CHART_TOP = 350;
const CHART_WIDTH = 610;
const CHART_HEIGHT = 175;

/** Display exponent for "Boost faint rings": lifts the 1.75 % first ring to about 13 % brightness. */
const BOOST_EXPONENT = 0.5;

/** Extra chart samples packed around each source so a sharp Airy peak is never missed. */
const PEAK_SAMPLES = 60;

export class CircularApertureScreenView extends ScreenView {
  public constructor(model: CircularApertureModel, providedOptions?: CircularApertureScreenViewOptions) {
    const options = optionize<CircularApertureScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new CircularApertureScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getCircularApertureStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const units = StringManager.getInstance().getUnits();

    // ── Field of view (arcsec, half-width) ─────────────────────────────────────
    const halfFieldProperty = DerivedProperty.deriveAny(
      [model.rayleighAngleProperty, model.separationProperty, model.seeingProperty],
      () => {
        const rayleigh = model.rayleighAngleProperty.value;
        const half = model.separationProperty.value / 2;
        let field = Math.max(2.5 * rayleigh, half + 2 * rayleigh);
        if (model.seeingProperty.value) {
          field = Math.max(field, half + 2.5 * SEEING_FWHM_ARCSEC);
        }
        return field;
      },
    );

    // ── Image ───────────────────────────────────────────────────────────────────
    const image = new IntensityImageNode({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      columns: AIRY_IMAGE_SAMPLES,
      rows: AIRY_IMAGE_SAMPLES,
      x: IMAGE_LEFT,
      y: IMAGE_TOP,
    });
    const imageFrame = new Rectangle(IMAGE_LEFT, IMAGE_TOP, IMAGE_SIZE, IMAGE_SIZE, {
      stroke: DiffractionLabColors.chartAxisColorProperty,
    });
    const imageTitle = new Text(strings.imageTitleStringProperty, {
      font: FONTS.LABEL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: IMAGE_SIZE,
      left: IMAGE_LEFT,
      bottom: IMAGE_TOP - 6,
    });
    const fieldText = createReadout(
      DerivedProperty.deriveAny([halfFieldProperty, strings.fieldOfViewStringProperty], () =>
        StringUtils.fillIn(strings.fieldOfViewStringProperty.value, {
          value: formatSignificant(2 * halfFieldProperty.value, 3),
        }),
      ),
      { font: FONTS.SMALL, maxWidth: IMAGE_SIZE },
    );
    fieldText.boundsProperty.link(() => {
      fieldText.centerX = IMAGE_LEFT + IMAGE_SIZE / 2;
      fieldText.top = IMAGE_TOP + IMAGE_SIZE + 4;
    });

    // ── Chart ───────────────────────────────────────────────────────────────────
    const chart = new ChartFrameNode({
      viewWidth: CHART_WIDTH,
      viewHeight: CHART_HEIGHT,
      xRange: new Range(-1, 1),
      yRange: new Range(0, 1.1),
      xAxisLabelProperty: strings.angleAxisStringProperty,
      yAxisLabelProperty: strings.intensityAxisStringProperty,
      nodeOptions: { x: CHART_LEFT, y: CHART_TOP },
    });
    const transform = chart.chartTransform;
    const firstPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.firstLineColorProperty,
      lineWidth: 1.2,
      lineDash: [5, 4],
    });
    const secondPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.secondLineColorProperty,
      lineWidth: 1.2,
      lineDash: [5, 4],
    });
    const slitPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.envelopeCurveColorProperty,
      lineWidth: 1.5,
      visibleProperty: model.compareSlitProperty,
    });
    const sumPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.intensityCurveColorProperty,
      lineWidth: 2,
    });
    chart.plotLayer.children = [firstPlot, secondPlot, slitPlot, sumPlot];

    const slitLegend = new Text(strings.slitCurveStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.envelopeCurveColorProperty,
      maxWidth: 220,
      visibleProperty: model.compareSlitProperty,
      right: CHART_WIDTH - 6,
      top: 4,
    });
    chart.overlayLayer.addChild(slitLegend);

    // ── Readouts ────────────────────────────────────────────────────────────────
    const rayleighReadoutProperty = DerivedProperty.deriveAny(
      [model.rayleighAngleProperty, strings.rayleighReadoutStringProperty],
      () =>
        StringUtils.fillIn(strings.rayleighReadoutStringProperty.value, {
          value: formatSignificant(model.rayleighAngleProperty.value, 3),
        }),
    );
    const ratioReadoutProperty = DerivedProperty.deriveAny(
      [model.separationRatioProperty, strings.ratioReadoutStringProperty],
      () =>
        StringUtils.fillIn(strings.ratioReadoutStringProperty.value, {
          value: formatSignificant(model.separationRatioProperty.value, 3),
        }),
    );
    const dipReadoutProperty = DerivedProperty.deriveAny(
      [model.dipProperty, strings.dipReadoutStringProperty, strings.noDipStringProperty],
      () =>
        model.dipProperty.value <= 0
          ? strings.noDipStringProperty.value
          : StringUtils.fillIn(strings.dipReadoutStringProperty.value, {
              value: formatSignificant(100 * model.dipProperty.value, 2),
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
    const verdictText = createReadout(verdictProperty, { font: FONTS.TITLE });
    model.verdictProperty.link((verdict) => {
      verdictText.fill =
        verdict === "resolved"
          ? DiffractionLabColors.accentColorProperty
          : verdict === "justResolved"
            ? DiffractionLabColors.cursorColorProperty
            : DiffractionLabColors.markerColorProperty;
    });
    const readouts = new VBox({
      spacing: 10,
      align: "left",
      children: [
        createReadout(rayleighReadoutProperty),
        createReadout(ratioReadoutProperty),
        createReadout(dipReadoutProperty),
        verdictText,
        createEquationNode(strings.equationStringProperty, 300),
      ],
      left: IMAGE_LEFT + IMAGE_SIZE + 36,
      top: IMAGE_TOP + 20,
    });

    // ── Controls ────────────────────────────────────────────────────────────────
    const presetLabels = {
      eye: strings.eyeStringProperty,
      hubble: strings.hubbleStringProperty,
      ground: strings.groundStringProperty,
    } as const;
    const presetButtons = APERTURE_PRESETS.map((preset) =>
      createTextButton(presetLabels[preset.id], () => model.applyPreset(preset), 110),
    );
    const diameterControl = createNumberControl(
      strings.diameterStringProperty,
      model.diameterProperty,
      APERTURE_DIAMETER_RANGE_M,
      { logarithmic: true, formatValue: (value) => formatDiameter(value) },
    );
    const wavelengthControl = createNumberControl(
      common.wavelengthStringProperty,
      model.wavelengthProperty,
      WAVELENGTH_RANGE_NM,
      { decimalPlaces: 0, delta: 1, unitsProperty: units.nanometresStringProperty },
    );
    const separationControl = createNumberControl(
      strings.separationStringProperty,
      model.separationProperty,
      SOURCE_SEPARATION_RANGE_ARCSEC,
      { logarithmic: true, unitsProperty: units.arcsecondsStringProperty, compactUnits: true },
    );
    const seeingCheckbox = createCheckbox(model.seeingProperty, strings.seeingStringProperty);
    const slitCheckbox = createCheckbox(model.compareSlitProperty, strings.compareSlitStringProperty);
    const boostCheckbox = createCheckbox(model.boostRingsProperty, strings.boostRingsStringProperty);

    const controlsPanel = new DiffractionLabPanel(
      new VBox({
        spacing: 10,
        align: "left",
        children: [
          new Text(strings.presetsStringProperty, {
            font: FONTS.LABEL,
            fill: DiffractionLabColors.textColorProperty,
            maxWidth: 240,
          }),
          new VBox({
            spacing: 6,
            align: "left",
            children: [new HBox({ spacing: 6, children: presetButtons.slice(0, 2) }), presetButtons[2] ?? new Node()],
          }),
          diameterControl,
          wavelengthControl,
          separationControl,
          seeingCheckbox,
          slitCheckbox,
          boostCheckbox,
        ],
      }),
      { right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN, top: SCREEN_VIEW_MARGIN },
    );

    // ── Updates ─────────────────────────────────────────────────────────────────
    Multilink.multilinkAny(
      [
        halfFieldProperty,
        model.rayleighAngleProperty,
        model.separationRatioProperty,
        model.seeingInRayleighProperty,
        model.wavelengthProperty,
        model.boostRingsProperty,
      ],
      () => {
        const rayleigh = model.rayleighAngleProperty.value;
        const field = halfFieldProperty.value / rayleigh; // half-width in θ_R units
        const separation = model.separationRatioProperty.value;
        const seeing = model.seeingInRayleighProperty.value;
        const half = separation / 2;

        // Image, brightest point per pixel.
        const n = AIRY_IMAGE_SAMPLES;
        const pixel = (2 * field) / n;
        const halfDiagonal = pixel * Math.SQRT1_2;
        let peak = 0;
        for (let row = 0; row < n; row++) {
          const y = field - (row + 0.5) * pixel;
          for (let column = 0; column < n; column++) {
            const x = -field + (column + 0.5) * pixel;
            const r1 = Math.max(0, Math.hypot(x - half, y) - halfDiagonal);
            const r2 = Math.max(0, Math.hypot(x + half, y) - halfDiagonal);
            const value = pointSpreadFunction(r1, seeing) + pointSpreadFunction(r2, seeing);
            image.intensities[row * n + column] = value;
            peak = Math.max(peak, value);
          }
        }
        image.update(
          lightRgb(model.wavelengthProperty.value),
          peak > 0 ? 1 / peak : 1,
          model.boostRingsProperty.value ? BOOST_EXPONENT : 1,
        );

        // Chart, in arcseconds, with extra samples around each source.
        const xs: number[] = [];
        for (let i = 0; i < AIRY_CHART_SAMPLES; i++) {
          xs.push(-field + (2 * field * i) / (AIRY_CHART_SAMPLES - 1));
        }
        for (const centre of [-half, half]) {
          for (let i = 0; i < PEAK_SAMPLES; i++) {
            xs.push(centre - 2 + (4 * i) / (PEAK_SAMPLES - 1));
          }
        }
        xs.sort((a, b) => a - b);
        const first: Vector2[] = [];
        const second: Vector2[] = [];
        const slit: Vector2[] = [];
        const sum: Vector2[] = [];
        let top = 1;
        for (const x of xs) {
          if (x < -field || x > field) {
            continue;
          }
          const i1 = pointSpreadFunction(Math.abs(x - half), seeing);
          const i2 = pointSpreadFunction(Math.abs(x + half), seeing);
          const arcsec = x * rayleigh;
          first.push(new Vector2(arcsec, i1));
          second.push(new Vector2(arcsec, i2));
          sum.push(new Vector2(arcsec, i1 + i2));
          // A slit of width D has its first zero at λ/D = θ_R / 1.22.
          slit.push(
            new Vector2(
              arcsec,
              slitIntensityInSlitUnits((x - half) * RAYLEIGH_FACTOR) +
                slitIntensityInSlitUnits((x + half) * RAYLEIGH_FACTOR),
            ),
          );
          top = Math.max(top, i1 + i2);
        }
        chart.setRanges(new Range(-halfFieldProperty.value, halfFieldProperty.value), new Range(0, 1.1 * top));
        firstPlot.setDataSet(first);
        secondPlot.setDataSet(second);
        slitPlot.setDataSet(slit);
        sumPlot.setDataSet(sum);
      },
    );

    // A thin tick on the chart's axis under each source.
    const sourceTicks = new Node();
    chart.overlayLayer.addChild(sourceTicks);
    Multilink.multilink([model.separationProperty, halfFieldProperty], (separation) => {
      sourceTicks.children = [-separation / 2, separation / 2].map((x) => {
        const viewX = transform.modelToViewX(x);
        return new Line(viewX, CHART_HEIGHT - 8, viewX, CHART_HEIGHT, {
          stroke: DiffractionLabColors.cursorColorProperty,
          lineWidth: 2,
        });
      });
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

    this.children = [imageTitle, image, imageFrame, fieldText, readouts, chart, controlsPanel, resetAllButton];

    this.addChild(
      new Node({
        pdomOrder: [
          ...presetButtons,
          diameterControl,
          wavelengthControl,
          separationControl,
          seeingCheckbox,
          slitCheckbox,
          boostCheckbox,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-only state.
  }
}
