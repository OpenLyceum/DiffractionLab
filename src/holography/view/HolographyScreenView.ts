import { HOLOGRAPHY_SCREEN_VIEW_SETTINGS } from "../../DiffractionLabConstants.js";
import type { DiffractionLabPreferencesModel } from "../../preferences/DiffractionLabPreferencesModel.js";
/**
 * HolographyScreenView.ts
 *
 * The Holography screen, a side view with lengths in wavelengths. The film is
 * a vertical strip on the right; the objects sit to its left, at a depth in
 * front of it; the reference beam arrives at an angle from the upper left.
 *
 *  - Record: the objects (draggable), their spreading wavefronts, the
 *    reference beam and the exposed film.
 *  - Reconstruct: only the reference beam lights the developed film. The map
 *    in front of the film is the diffracted light traced back (see
 *    hologram.ts); the bright spots are the virtual images, drawn where the
 *    objects were, which are now shown as dashed outlines.
 *
 * Model (x along the film, depth) maps to view by a Transform3 (a reflection
 * that swaps the axes, which ModelViewTransform2 does not allow):
 *   viewX = FILM_X − depth · SCALE,   viewY = CENTER_Y − x · SCALE.
 */

import { DerivedProperty, Multilink, Property, StringProperty } from "scenerystack/axon";
import { Bounds2, Matrix3, roundSymmetric, Transform3, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import {
  Circle,
  DragListener,
  HBox,
  KeyboardDragListener,
  Node,
  Path,
  Rectangle,
  RichText,
  Text,
  VBox,
} from "scenerystack/scenery";
import { ArrowNode, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/DiffractionLabButtonOptions.js";
import { DiffractionLabPanel } from "../../common/DiffractionLabPanel.js";
import { expectedFocusWidth, sampleFilmCloseUp, sampleFilmStripReversed } from "../../common/model/hologram.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import {
  createCheckbox,
  createEquationNode,
  createNumberControl,
  createRadioButtons,
  createReadout,
} from "../../common/view/controls.js";
import { IntensityImageNode } from "../../common/view/IntensityImageNode.js";
import { lightRgb } from "../../common/view/lightColor.js";
import DiffractionLabColors from "../../DiffractionLabColors.js";
import {
  COHERENCE_LENGTH_RANGE,
  FILM_CLOSE_UP_WIDTH,
  FILM_WIDTH,
  FONTS,
  HOLOGRAPHY_LAYOUT,
  RECONSTRUCTION_DEPTH_RANGE,
  RECONSTRUCTION_X_RANGE,
  REFERENCE_ANGLE_RANGE_DEG,
  SCREEN_VIEW_MARGIN,
} from "../../DiffractionLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { HolographyMode, HolographyModel } from "../model/HolographyModel.js";
import { HolographyScreenSummaryContent } from "./HolographyScreenSummaryContent.js";

export type HolographyScreenViewOptions = ScreenViewOptions;

export class HolographyScreenView extends ScreenView {
  public constructor(
    model: HolographyModel,
    preferences: DiffractionLabPreferencesModel,
    providedOptions?: HolographyScreenViewOptions,
  ) {
    const options = optionize<HolographyScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new HolographyScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getHolographyStrings();
    const units = StringManager.getInstance().getUnits();
    const a11y = StringManager.getInstance().getHolographyA11yStrings();

    const transform = new Transform3(
      Matrix3.rowMajor(
        0,
        -HOLOGRAPHY_LAYOUT.SCALE,
        HOLOGRAPHY_LAYOUT.FILM_X,
        -HOLOGRAPHY_LAYOUT.SCALE,
        0,
        HOLOGRAPHY_LAYOUT.CENTER_Y,
        0,
        0,
        1,
      ),
    );
    const toView = (x: number, depth: number): Vector2 => transform.transformPosition2(new Vector2(x, depth));

    const isRecordingProperty = new DerivedProperty([model.modeProperty], (mode) => mode === "record");
    const isReconstructingProperty = new DerivedProperty([model.modeProperty], (mode) => mode === "reconstruct");

    // ── Reconstruction map ──────────────────────────────────────────────────────
    const mapTopLeft = toView(RECONSTRUCTION_X_RANGE.max, RECONSTRUCTION_DEPTH_RANGE.max);
    const mapBottomRight = toView(RECONSTRUCTION_X_RANGE.min, RECONSTRUCTION_DEPTH_RANGE.min);
    const map = new IntensityImageNode({
      width: mapBottomRight.x - mapTopLeft.x,
      height: mapBottomRight.y - mapTopLeft.y,
      // View columns run along depth, view rows along x: the model grid transposed.
      columns: model.gridRows,
      rows: model.gridColumns,
      x: mapTopLeft.x,
      y: mapTopLeft.y,
      visibleProperty: isReconstructingProperty,
    });
    const mapFrame = new Rectangle(Bounds2.point(mapTopLeft).addPoint(mapBottomRight), {
      stroke: DiffractionLabColors.chartGridColorProperty,
      visibleProperty: isReconstructingProperty,
    });
    model.reconstructionVersionProperty.link(() => {
      const columns = model.gridColumns;
      const rows = model.gridRows;
      let peak = 0;
      for (const value of model.reconstruction) {
        peak = Math.max(peak, value);
      }
      for (let viewRow = 0; viewRow < columns; viewRow++) {
        const gridColumn = columns - 1 - viewRow; // top of the view = largest x
        for (let viewColumn = 0; viewColumn < rows; viewColumn++) {
          const gridRow = rows - 1 - viewColumn; // left of the view = deepest
          map.intensities[viewRow * rows + viewColumn] = model.reconstruction[gridRow * columns + gridColumn] ?? 0;
        }
      }
      map.update(lightRgb(HOLOGRAPHY_LAYOUT.LASER_NM), peak > 0 ? 1 / peak : 1, HOLOGRAPHY_LAYOUT.MAP_EXPONENT);
    });

    const progressText = createReadout(
      DerivedProperty.deriveAny([model.reconstructionProgressProperty, strings.computingStringProperty], () =>
        StringUtils.fillIn(strings.computingStringProperty.value, {
          value: roundSymmetric(100 * model.reconstructionProgressProperty.value),
        }),
      ),
      { font: FONTS.SMALL },
    );
    Multilink.multilink([model.reconstructionProgressProperty, model.modeProperty], (progress, mode) => {
      progressText.visible = mode === "reconstruct" && progress < 1;
    });
    progressText.left = mapTopLeft.x + HOLOGRAPHY_LAYOUT.MAP_PROGRESS_INSET;
    progressText.top = mapTopLeft.y + HOLOGRAPHY_LAYOUT.MAP_LABEL_INSET;

    const virtualImageLabel = new Text(strings.virtualImageStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: HOLOGRAPHY_LAYOUT.VIRTUAL_IMAGE_MAX_WIDTH,
      visibleProperty: isReconstructingProperty,
    });
    virtualImageLabel.boundsProperty.link(() => {
      virtualImageLabel.left = mapTopLeft.x + HOLOGRAPHY_LAYOUT.MAP_PROGRESS_INSET;
      virtualImageLabel.bottom = mapBottomRight.y - HOLOGRAPHY_LAYOUT.MAP_LABEL_INSET;
    });

    // ── Film ────────────────────────────────────────────────────────────────────
    const filmTop = toView(FILM_WIDTH / 2, 0).y;
    const filmHeight = FILM_WIDTH * HOLOGRAPHY_LAYOUT.SCALE;
    const filmImage = new IntensityImageNode({
      width: HOLOGRAPHY_LAYOUT.FILM_THICKNESS,
      height: filmHeight,
      columns: 1,
      rows: model.filmProperty.value.exposure.length,
      x: HOLOGRAPHY_LAYOUT.FILM_X,
      y: filmTop,
    });
    const filmFrame = new Rectangle(HOLOGRAPHY_LAYOUT.FILM_X, filmTop, HOLOGRAPHY_LAYOUT.FILM_THICKNESS, filmHeight, {
      stroke: DiffractionLabColors.filmBorderColorProperty,
    });
    // The cut-away half (x > 0, the upper half) is drawn as an empty dashed outline.
    const cutAway = new Rectangle(
      HOLOGRAPHY_LAYOUT.FILM_X - 1,
      filmTop - 1,
      HOLOGRAPHY_LAYOUT.FILM_THICKNESS + 2,
      filmHeight / 2 + 1,
      {
        fill: DiffractionLabColors.backgroundColorProperty,
        stroke: DiffractionLabColors.filmBorderColorProperty,
        lineDash: [...HOLOGRAPHY_LAYOUT.CUT_AWAY_DASH],
      },
    );
    const filmLabel = new Text(strings.filmStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: HOLOGRAPHY_LAYOUT.FILM_LABEL_MAX_WIDTH,
    });
    filmLabel.boundsProperty.link(() => {
      filmLabel.centerX = HOLOGRAPHY_LAYOUT.FILM_X + HOLOGRAPHY_LAYOUT.FILM_THICKNESS / 2;
      filmLabel.top = filmTop + filmHeight + HOLOGRAPHY_LAYOUT.FILM_LABEL_GAP;
    });

    const isCutProperty = new DerivedProperty(
      [model.halfFilmProperty, model.modeProperty],
      (half, mode) => half && mode === "reconstruct",
    );
    isCutProperty.linkAttribute(cutAway, "visible");

    // ── Viewer (reconstruct only) ───────────────────────────────────────────────
    const eye = new Node({
      children: [
        new Path(
          new Shape()
            .moveTo(-HOLOGRAPHY_LAYOUT.EYE_HALF_WIDTH, 0)
            .quadraticCurveTo(0, -HOLOGRAPHY_LAYOUT.EYE_HALF_HEIGHT, HOLOGRAPHY_LAYOUT.EYE_HALF_WIDTH, 0)
            .quadraticCurveTo(0, HOLOGRAPHY_LAYOUT.EYE_HALF_HEIGHT, -HOLOGRAPHY_LAYOUT.EYE_HALF_WIDTH, 0),
          {
            stroke: DiffractionLabColors.textColorProperty,
            lineWidth: HOLOGRAPHY_LAYOUT.EYE_LINE_WIDTH,
          },
        ),
        new Circle(HOLOGRAPHY_LAYOUT.EYE_PUPIL_RADIUS, {
          x: HOLOGRAPHY_LAYOUT.EYE_PUPIL_OFFSET_X,
          fill: DiffractionLabColors.textColorProperty,
        }),
      ],
    });
    const viewer = new VBox({
      spacing: HOLOGRAPHY_LAYOUT.VIEWER_SPACING,
      children: [
        eye,
        new Text(strings.viewerStringProperty, {
          font: FONTS.SMALL,
          fill: DiffractionLabColors.textColorProperty,
          maxWidth: HOLOGRAPHY_LAYOUT.VIEWER_LABEL_MAX_WIDTH,
        }),
      ],
      centerX: HOLOGRAPHY_LAYOUT.FILM_X + HOLOGRAPHY_LAYOUT.VIEWER_OFFSET_X,
      centerY: HOLOGRAPHY_LAYOUT.CENTER_Y,
      visibleProperty: isReconstructingProperty,
    });

    // ── Reference beam ──────────────────────────────────────────────────────────
    const referenceBeam = new Node();
    const referenceLabel = new Text(strings.referenceBeamStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.referenceBeamColorProperty,
      maxWidth: HOLOGRAPHY_LAYOUT.REFERENCE_LABEL_MAX_WIDTH,
    });
    model.referenceAngleProperty.link((angleDeg) => {
      const angle = (angleDeg * Math.PI) / 180;
      // Travels toward the film (+view x) and toward larger film x (−view y).
      const direction = new Vector2(Math.cos(angle), -Math.sin(angle));
      const length = HOLOGRAPHY_LAYOUT.REFERENCE_LENGTH;
      referenceBeam.children = [...HOLOGRAPHY_LAYOUT.REFERENCE_FRACTIONS].map((fraction) => {
        const tip = new Vector2(
          HOLOGRAPHY_LAYOUT.FILM_X - HOLOGRAPHY_LAYOUT.REFERENCE_TIP_INSET,
          HOLOGRAPHY_LAYOUT.CENTER_Y - fraction * filmHeight,
        );
        const tail = tip.minus(direction.timesScalar(length));
        return new ArrowNode(tail.x, tail.y, tip.x, tip.y, {
          fill: DiffractionLabColors.referenceBeamColorProperty,
          stroke: null,
          headHeight: HOLOGRAPHY_LAYOUT.REFERENCE_HEAD_HEIGHT,
          headWidth: HOLOGRAPHY_LAYOUT.REFERENCE_HEAD_WIDTH,
          tailWidth: HOLOGRAPHY_LAYOUT.REFERENCE_TAIL_WIDTH,
        });
      });
      const lowestTail = new Vector2(
        HOLOGRAPHY_LAYOUT.FILM_X - HOLOGRAPHY_LAYOUT.REFERENCE_TIP_INSET,
        HOLOGRAPHY_LAYOUT.CENTER_Y + HOLOGRAPHY_LAYOUT.REFERENCE_FRACTIONS[2] * filmHeight,
      ).minus(direction.timesScalar(length));
      referenceLabel.centerX = lowestTail.x;
      referenceLabel.top = lowestTail.y + HOLOGRAPHY_LAYOUT.REFERENCE_LABEL_GAP;
    });

    // ── Objects ─────────────────────────────────────────────────────────────────
    const wavefronts = new Path(null, {
      stroke: DiffractionLabColors.objectColorProperty,
      lineWidth: HOLOGRAPHY_LAYOUT.WAVEFRONT_LINE_WIDTH,
      opacity: HOLOGRAPHY_LAYOUT.WAVEFRONT_OPACITY,
      visibleProperty: isRecordingProperty,
      clipArea: Shape.rect(
        0,
        HOLOGRAPHY_LAYOUT.CENTER_Y - HOLOGRAPHY_LAYOUT.WAVEFRONT_CLIP_HALF_HEIGHT,
        HOLOGRAPHY_LAYOUT.FILM_X,
        2 * HOLOGRAPHY_LAYOUT.WAVEFRONT_CLIP_HALF_HEIGHT,
      ),
    });
    const objectNodes: Node[] = [];
    const dragBoundsProperty = new Property(
      new Bounds2(
        model.objectBounds.x.min,
        model.objectBounds.depth.min,
        model.objectBounds.x.max,
        model.objectBounds.depth.max,
      ),
    );
    model.objectPositionProperties.forEach((positionProperty, index) => {
      const number = index + 1;
      const visibleProperty = new DerivedProperty([model.objectCountProperty], (count) => index < count);
      const accessibleNameProperty = new DerivedProperty([a11y.controls.objectStringProperty], (pattern) =>
        StringUtils.fillIn(pattern, { number }),
      );
      const labelProperty = new DerivedProperty([strings.objectLabelStringProperty], (pattern) =>
        StringUtils.fillIn(pattern, { number }),
      );
      const dot = new Circle(HOLOGRAPHY_LAYOUT.OBJECT_DOT_RADIUS, {
        fill: DiffractionLabColors.objectColorProperty,
        visibleProperty: isRecordingProperty,
      });
      const ghost = new Circle(HOLOGRAPHY_LAYOUT.OBJECT_GHOST_RADIUS, {
        stroke: DiffractionLabColors.objectColorProperty,
        lineDash: [...HOLOGRAPHY_LAYOUT.OBJECT_GHOST_DASH],
        lineWidth: HOLOGRAPHY_LAYOUT.OBJECT_GHOST_LINE_WIDTH,
        visibleProperty: isReconstructingProperty,
      });
      const label = new Text(labelProperty, {
        font: FONTS.SMALL,
        fill: DiffractionLabColors.textColorProperty,
        maxWidth: HOLOGRAPHY_LAYOUT.OBJECT_LABEL_MAX_WIDTH,
        centerX: 0,
        bottom: HOLOGRAPHY_LAYOUT.OBJECT_LABEL_GAP,
      });
      const objectNode = new Node({
        children: [new Circle(HOLOGRAPHY_LAYOUT.OBJECT_HIT_RADIUS, { fill: "transparent" }), ghost, dot, label],
        cursor: "pointer",
        visibleProperty: visibleProperty,
        tagName: "div",
        focusable: true,
        accessibleName: accessibleNameProperty,
        accessibleHelpText: a11y.controls.objectHelpStringProperty,
      });
      // Objects move only while recording: moving them afterwards would change a hologram already made.
      isRecordingProperty.link((recording) => {
        objectNode.pickable = recording;
        objectNode.inputEnabled = recording;
      });
      objectNode.addInputListener(
        new DragListener({ positionProperty, transform, dragBoundsProperty, useParentOffset: true }),
      );
      objectNode.addInputListener(
        new KeyboardDragListener({
          positionProperty,
          transform,
          dragBoundsProperty,
          dragSpeed: HOLOGRAPHY_LAYOUT.DRAG_SPEED,
          shiftDragSpeed: HOLOGRAPHY_LAYOUT.SHIFT_DRAG_SPEED,
        }),
      );
      positionProperty.link((position) => {
        objectNode.translation = transform.transformPosition2(position);
      });
      objectNodes.push(objectNode);
    });

    Multilink.multilinkAny([model.objectCountProperty, ...model.objectPositionProperties], () => {
      const shape = new Shape();
      for (const object of model.objects) {
        const centre = toView(object.x, object.depth);
        for (
          let radius = HOLOGRAPHY_LAYOUT.WAVEFRONT_SPACING;
          radius < object.depth;
          radius += HOLOGRAPHY_LAYOUT.WAVEFRONT_SPACING
        ) {
          // Only the part of each circle heading toward the film (to the right).
          const half = Math.acos(Math.min(1, radius / object.depth)) > 0 ? HOLOGRAPHY_LAYOUT.WAVEFRONT_HALF_ANGLE : 0;
          shape.arc(centre.x, centre.y, radius * HOLOGRAPHY_LAYOUT.SCALE, -half, half, false);
          shape.newSubpath();
        }
      }
      wavefronts.shape = shape;
    });

    // ── Film exposure and close-up ──────────────────────────────────────────────
    const closeUp = new IntensityImageNode({
      width: HOLOGRAPHY_LAYOUT.CLOSE_UP_WIDTH,
      height: HOLOGRAPHY_LAYOUT.CLOSE_UP_HEIGHT,
      columns: roundSymmetric(FILM_CLOSE_UP_WIDTH * HOLOGRAPHY_LAYOUT.CLOSE_UP_SAMPLES_PER_WAVELENGTH),
      rows: 1,
    });
    const closeUpFrame = new Rectangle(0, 0, HOLOGRAPHY_LAYOUT.CLOSE_UP_WIDTH, HOLOGRAPHY_LAYOUT.CLOSE_UP_HEIGHT, {
      stroke: DiffractionLabColors.filmBorderColorProperty,
    });
    model.filmProperty.link((film) => {
      // The film strip: top of the view is the largest x, so reverse the samples.
      const max = sampleFilmStripReversed(film.exposure, filmImage.intensities);
      filmImage.update([1, 1, 1], max > 0 ? 1 / max : 1);

      // The close-up: the central FILM_CLOSE_UP_WIDTH, interpolated linearly between samples.
      const closeMax = sampleFilmCloseUp(film, FILM_WIDTH, FILM_CLOSE_UP_WIDTH, closeUp.intensities);
      closeUp.update([1, 1, 1], closeMax > 0 ? 1 / closeMax : 1);
    });

    // ── Controls ────────────────────────────────────────────────────────────────
    const modeButtons = createRadioButtons<HolographyMode>(
      model.modeProperty,
      [
        { value: "record", labelProperty: strings.recordStringProperty },
        { value: "reconstruct", labelProperty: strings.reconstructStringProperty },
      ],
      a11y.controls.modeStringProperty,
    );
    const countButtons = createRadioButtons(
      model.objectCountProperty,
      [1, 2, 3].map((count) => ({
        value: count,
        labelProperty: new StringProperty(String(count)),
        enabledProperty: isRecordingProperty,
      })),
      strings.objectCountStringProperty,
    );
    const countRow = new HBox({
      spacing: HOLOGRAPHY_LAYOUT.COUNT_ROW_SPACING,
      children: [
        new Text(strings.objectCountStringProperty, {
          font: FONTS.LABEL,
          fill: DiffractionLabColors.textColorProperty,
          maxWidth: HOLOGRAPHY_LAYOUT.COUNT_LABEL_MAX_WIDTH,
        }),
        countButtons,
      ],
    });
    const angleControl = createNumberControl(
      strings.referenceAngleStringProperty,
      model.referenceAngleProperty,
      REFERENCE_ANGLE_RANGE_DEG,
      {
        decimalPlaces: 0,
        delta: 1,
        unitsProperty: units.degreesStringProperty,
        compactUnits: true,
        numberControlOptions: { enabledProperty: isRecordingProperty },
      },
    );
    const coherenceControl = createNumberControl(
      strings.coherenceLengthStringProperty,
      model.coherenceLengthProperty,
      COHERENCE_LENGTH_RANGE,
      {
        logarithmic: true,
        significantFigures: HOLOGRAPHY_SCREEN_VIEW_SETTINGS.COHERENCE_CONTROL_SIGNIFICANT_FIGURES,
        formatValue: (value) =>
          value >= COHERENCE_LENGTH_RANGE.max
            ? "∞"
            : `${formatSignificant(value, HOLOGRAPHY_SCREEN_VIEW_SETTINGS.COHERENCE_CONTROL_DIGITS)} λ`,
        numberControlOptions: { enabledProperty: isRecordingProperty },
      },
    );
    const cutCheckbox = createCheckbox(model.halfFilmProperty, strings.cutFilmStringProperty, {
      enabledProperty: isReconstructingProperty,
    });
    const zeroOrderCheckbox = createCheckbox(model.blockZeroOrderProperty, strings.blockZeroOrderStringProperty, {
      enabledProperty: isReconstructingProperty,
    });

    const closeUpTitle = createReadout(
      DerivedProperty.deriveAny([strings.closeUpStringProperty], () =>
        StringUtils.fillIn(strings.closeUpStringProperty.value, { value: FILM_CLOSE_UP_WIDTH }),
      ),
      { font: FONTS.SMALL },
    );

    const fringeReadout = createReadout(
      DerivedProperty.deriveAny([model.referenceAngleProperty, strings.fringeSpacingReadoutStringProperty], () =>
        StringUtils.fillIn(strings.fringeSpacingReadoutStringProperty.value, {
          value: formatSignificant(
            1 / Math.sin((model.referenceAngleProperty.value * Math.PI) / 180),
            HOLOGRAPHY_SCREEN_VIEW_SETTINGS.FRINGE_READOUT_DIGITS,
          ),
        }),
      ),
      { font: FONTS.SMALL, maxWidth: HOLOGRAPHY_LAYOUT.CLOSE_UP_READOUT_MAX_WIDTH },
    );
    const focusReadout = createReadout(
      DerivedProperty.deriveAny([model.focusWidthProperty, strings.focusReadoutStringProperty], () =>
        StringUtils.fillIn(strings.focusReadoutStringProperty.value, {
          value:
            model.focusWidthProperty.value === null
              ? "…"
              : formatSignificant(model.focusWidthProperty.value, HOLOGRAPHY_SCREEN_VIEW_SETTINGS.FOCUS_READOUT_DIGITS),
        }),
      ),
      {
        font: FONTS.SMALL,
        maxWidth: HOLOGRAPHY_LAYOUT.CLOSE_UP_READOUT_MAX_WIDTH,
        visibleProperty: isReconstructingProperty,
      },
    );
    const expectedReadout = createReadout(
      DerivedProperty.deriveAny(
        [
          model.halfFilmProperty,
          model.objectCountProperty,
          ...model.objectPositionProperties,
          strings.expectedReadoutStringProperty,
        ],
        () => {
          const first = model.objects[0];
          const aperture = model.halfFilmProperty.value ? FILM_WIDTH / 2 : FILM_WIDTH;
          return StringUtils.fillIn(strings.expectedReadoutStringProperty.value, {
            value: first
              ? formatSignificant(
                  expectedFocusWidth(aperture, first.depth),
                  HOLOGRAPHY_SCREEN_VIEW_SETTINGS.EXPECTED_READOUT_DIGITS,
                )
              : "—",
          });
        },
      ),
      {
        font: FONTS.SMALL,
        maxWidth: HOLOGRAPHY_LAYOUT.CLOSE_UP_READOUT_MAX_WIDTH,
        visibleProperty: isReconstructingProperty,
      },
    );

    const controlsPanel = new DiffractionLabPanel(
      new VBox({
        spacing: HOLOGRAPHY_LAYOUT.CONTROLS_SPACING,
        align: "left",
        children: [
          modeButtons,
          countRow,
          angleControl,
          coherenceControl,
          cutCheckbox,
          zeroOrderCheckbox,
          closeUpTitle,
          new Node({ children: [closeUp, closeUpFrame] }),
          fringeReadout,
          focusReadout,
          expectedReadout,
        ],
      }),
      { right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN, top: HOLOGRAPHY_LAYOUT.CONTROLS_TOP },
    );

    const notToScale = new RichText(strings.notToScaleStringProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: HOLOGRAPHY_LAYOUT.NOT_TO_SCALE_MAX_WIDTH,
      left: HOLOGRAPHY_LAYOUT.NOT_TO_SCALE_LEFT,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    const equation = createEquationNode(
      preferences.showEquationsProperty,
      strings.equationStringProperty,
      HOLOGRAPHY_LAYOUT.EQUATION_MAX_WIDTH,
    );
    equation.left = HOLOGRAPHY_LAYOUT.NOT_TO_SCALE_LEFT;
    equation.bottom = notToScale.top - HOLOGRAPHY_LAYOUT.EQUATION_GAP;

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

    const scene = new Node({
      children: [
        map,
        mapFrame,
        wavefronts,
        referenceBeam,
        referenceLabel,
        filmImage,
        filmFrame,
        cutAway,
        filmLabel,
        viewer,
        virtualImageLabel,
        progressText,
        ...objectNodes,
      ],
    });

    this.children = [scene, controlsPanel, notToScale, equation, resetAllButton];

    this.addChild(
      new Node({
        pdomOrder: [
          modeButtons,
          ...objectNodes,
          countButtons,
          angleControl,
          coherenceControl,
          cutCheckbox,
          zeroOrderCheckbox,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-only state.
  }
}
