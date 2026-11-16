import { CIRCULAR_APERTURE_SCREEN_VIEW_SETTINGS } from "../../DiffractionLabConstants.js";
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
import { sampleTwoSourceCrossSection, sampleTwoSourceImage } from "../../common/model/airy.js";
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
  APERTURE_LAYOUT,
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
        let field = Math.max(
          APERTURE_LAYOUT.FIELD_RAYLEIGH_FACTOR * rayleigh,
          half + APERTURE_LAYOUT.FIELD_MARGIN_RAYLEIGH * rayleigh,
        );
        if (model.seeingProperty.value) {
          field = Math.max(field, half + APERTURE_LAYOUT.FIELD_SEEING_MARGIN * SEEING_FWHM_ARCSEC);
        }
        return field;
      },
    );

    // ── Image ───────────────────────────────────────────────────────────────────
    const image = new IntensityImageNode({
      width: APERTURE_LAYOUT.IMAGE_SIZE,
      height: APERTURE_LAYOUT.IMAGE_SIZE,
      columns: AIRY_IMAGE_SAMPLES,
      rows: AIRY_IMAGE_SAMPLES,
      x: APERTURE_LAYOUT.IMAGE_LEFT,
      y: APERTURE_LAYOUT.IMAGE_TOP,
    });
    const imageFrame = new Rectangle(
      APERTURE_LAYOUT.IMAGE_LEFT,
      APERTURE_LAYOUT.IMAGE_TOP,
      APERTURE_LAYOUT.IMAGE_SIZE,
      APERTURE_LAYOUT.IMAGE_SIZE,
      {
        stroke: DiffractionLabColors.chartAxisColorProperty,
      },
    );
    const imageTitle = new Text(strings.imageTitleStringProperty, {
      font: FONTS.LABEL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: APERTURE_LAYOUT.IMAGE_SIZE,
      left: APERTURE_LAYOUT.IMAGE_LEFT,
      bottom: APERTURE_LAYOUT.IMAGE_TOP - APERTURE_LAYOUT.IMAGE_TITLE_GAP,
    });
    const fieldText = createReadout(
      DerivedProperty.deriveAny([halfFieldProperty, strings.fieldOfViewStringProperty], () =>
        StringUtils.fillIn(strings.fieldOfViewStringProperty.value, {
          value: formatSignificant(
            2 * halfFieldProperty.value,
            CIRCULAR_APERTURE_SCREEN_VIEW_SETTINGS.FIELD_TEXT_DIGITS,
          ),
        }),
      ),
      { font: FONTS.SMALL, maxWidth: APERTURE_LAYOUT.IMAGE_SIZE },
    );
    fieldText.boundsProperty.link(() => {
      fieldText.centerX = APERTURE_LAYOUT.IMAGE_LEFT + APERTURE_LAYOUT.IMAGE_SIZE / 2;
      fieldText.top = APERTURE_LAYOUT.IMAGE_TOP + APERTURE_LAYOUT.IMAGE_SIZE + APERTURE_LAYOUT.FIELD_TEXT_GAP;
    });

    // ── Chart ───────────────────────────────────────────────────────────────────
    const chart = new ChartFrameNode({
      viewWidth: APERTURE_LAYOUT.CHART_WIDTH,
      viewHeight: APERTURE_LAYOUT.CHART_HEIGHT,
      xRange: new Range(-1, 1),
      yRange: new Range(0, APERTURE_LAYOUT.Y_MAX_FACTOR),
      xAxisLabelProperty: strings.angleAxisStringProperty,
      yAxisLabelProperty: strings.intensityAxisStringProperty,
      nodeOptions: { x: APERTURE_LAYOUT.CHART_LEFT, y: APERTURE_LAYOUT.CHART_TOP },
    });
    const transform = chart.chartTransform;
    const firstPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.firstLineColorProperty,
      lineWidth: APERTURE_LAYOUT.PROFILE_LINE_WIDTH,
      lineDash: [...APERTURE_LAYOUT.PROFILE_DASH],
    });
    const secondPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.secondLineColorProperty,
      lineWidth: APERTURE_LAYOUT.PROFILE_LINE_WIDTH,
      lineDash: [...APERTURE_LAYOUT.PROFILE_DASH],
    });
    const slitPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.envelopeCurveColorProperty,
      lineWidth: APERTURE_LAYOUT.SLIT_LINE_WIDTH,
      visibleProperty: model.compareSlitProperty,
    });
    const sumPlot = new LinePlot(transform, [], {
      stroke: DiffractionLabColors.intensityCurveColorProperty,
      lineWidth: APERTURE_LAYOUT.SUM_LINE_WIDTH,
    });
    chart.plotLayer.children = [firstPlot, secondPlot, slitPlot, sumPlot];

    const slitLegend = new Text(strings.slitCurveStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.envelopeCurveColorProperty,
      maxWidth: APERTURE_LAYOUT.SLIT_LEGEND_MAX_WIDTH,
      visibleProperty: model.compareSlitProperty,
      right: APERTURE_LAYOUT.CHART_WIDTH - APERTURE_LAYOUT.SLIT_LEGEND_INSET,
      top: APERTURE_LAYOUT.SLIT_LEGEND_INSET,
    });
    chart.overlayLayer.addChild(slitLegend);

    // ── Readouts ────────────────────────────────────────────────────────────────
    const rayleighReadoutProperty = DerivedProperty.deriveAny(
      [model.rayleighAngleProperty, strings.rayleighReadoutStringProperty],
      () =>
        StringUtils.fillIn(strings.rayleighReadoutStringProperty.value, {
          value: formatSignificant(
            model.rayleighAngleProperty.value,
            CIRCULAR_APERTURE_SCREEN_VIEW_SETTINGS.VALUE_FORMAT_SIGNIFICANT_DIGITS,
          ),
        }),
    );
    const ratioReadoutProperty = DerivedProperty.deriveAny(
      [model.separationRatioProperty, strings.ratioReadoutStringProperty],
      () =>
        StringUtils.fillIn(strings.ratioReadoutStringProperty.value, {
          value: formatSignificant(
            model.separationRatioProperty.value,
            CIRCULAR_APERTURE_SCREEN_VIEW_SETTINGS.VALUE_FORMAT_SIGNIFICANT_DIGITS,
          ),
        }),
    );
    const dipReadoutProperty = DerivedProperty.deriveAny(
      [model.dipProperty, strings.dipReadoutStringProperty, strings.noDipStringProperty],
      () =>
        model.dipProperty.value <= 0
          ? strings.noDipStringProperty.value
          : StringUtils.fillIn(strings.dipReadoutStringProperty.value, {
              value: formatSignificant(
                100 * model.dipProperty.value,
                CIRCULAR_APERTURE_SCREEN_VIEW_SETTINGS.DIP_READOUT_PROPERTY_DIGITS,
              ),
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
      spacing: APERTURE_LAYOUT.READOUTS_SPACING,
      align: "left",
      children: [
        createReadout(rayleighReadoutProperty),
        createReadout(ratioReadoutProperty),
        createReadout(dipReadoutProperty),
        verdictText,
        createEquationNode(strings.equationStringProperty, APERTURE_LAYOUT.EQUATION_MAX_WIDTH),
      ],
      left: APERTURE_LAYOUT.IMAGE_LEFT + APERTURE_LAYOUT.IMAGE_SIZE + APERTURE_LAYOUT.READOUTS_GAP,
      top: APERTURE_LAYOUT.IMAGE_TOP + APERTURE_LAYOUT.READOUTS_TOP_INSET,
    });

    // ── Controls ────────────────────────────────────────────────────────────────
    const presetLabels = {
      eye: strings.eyeStringProperty,
      hubble: strings.hubbleStringProperty,
      ground: strings.groundStringProperty,
    } as const;
    const presetButtons = APERTURE_PRESETS.map((preset) =>
      createTextButton(presetLabels[preset.id], () => model.applyPreset(preset), APERTURE_LAYOUT.PRESET_BUTTON_WIDTH),
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
        spacing: APERTURE_LAYOUT.CONTROLS_SPACING,
        align: "left",
        children: [
          new Text(strings.presetsStringProperty, {
            font: FONTS.LABEL,
            fill: DiffractionLabColors.textColorProperty,
            maxWidth: APERTURE_LAYOUT.PRESETS_TITLE_MAX_WIDTH,
          }),
          new VBox({
            spacing: APERTURE_LAYOUT.PRESET_ROW_SPACING,
            align: "left",
            children: [
              new HBox({ spacing: APERTURE_LAYOUT.PRESET_ROW_SPACING, children: presetButtons.slice(0, 2) }),
              presetButtons[2] ?? new Node(),
            ],
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

        // Image, brightest point per pixel.
        const peak = sampleTwoSourceImage(field, separation, seeing, AIRY_IMAGE_SAMPLES, image.intensities);
        image.update(
          lightRgb(model.wavelengthProperty.value),
          peak > 0 ? 1 / peak : 1,
          model.boostRingsProperty.value ? APERTURE_LAYOUT.BOOST_EXPONENT : 1,
        );

        // Chart, in arcseconds, with extra samples around each source.
        const cross = sampleTwoSourceCrossSection(
          field,
          separation,
          seeing,
          AIRY_CHART_SAMPLES,
          APERTURE_LAYOUT.PEAK_HALF_WIDTH,
          APERTURE_LAYOUT.PEAK_SAMPLES,
          rayleigh,
        );
        const toVectors = (samples: readonly { readonly x: number; readonly y: number }[]): Vector2[] =>
          samples.map((point) => new Vector2(point.x, point.y));
        chart.setRanges(
          new Range(-halfFieldProperty.value, halfFieldProperty.value),
          new Range(0, APERTURE_LAYOUT.Y_MAX_FACTOR * cross.top),
        );
        firstPlot.setDataSet(toVectors(cross.first));
        secondPlot.setDataSet(toVectors(cross.second));
        slitPlot.setDataSet(toVectors(cross.slit));
        sumPlot.setDataSet(toVectors(cross.sum));
      },
    );

    // A thin tick on the chart's axis under each source.
    const sourceTicks = new Node();
    chart.overlayLayer.addChild(sourceTicks);
    Multilink.multilink([model.separationProperty, halfFieldProperty], (separation) => {
      sourceTicks.children = [-separation / 2, separation / 2].map((x) => {
        const viewX = transform.modelToViewX(x);
        return new Line(
          viewX,
          APERTURE_LAYOUT.CHART_HEIGHT - APERTURE_LAYOUT.SOURCE_TICK_HEIGHT,
          viewX,
          APERTURE_LAYOUT.CHART_HEIGHT,
          {
            stroke: DiffractionLabColors.cursorColorProperty,
            lineWidth: APERTURE_LAYOUT.SOURCE_TICK_LINE_WIDTH,
          },
        );
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
