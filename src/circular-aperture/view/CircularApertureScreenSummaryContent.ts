import { roundSymmetric } from "scenerystack/dot";
import { CIRCULAR_APERTURE_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../DiffractionLabConstants.js";
/**
 * CircularApertureScreenSummaryContent.ts
 *
 * Screen summary for the Circular Aperture screen, with a live description of
 * the aperture, the Rayleigh angle and the verdict.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { CircularApertureModel } from "../model/CircularApertureModel.js";
import { formatDiameter } from "./formatDiameter.js";

export class CircularApertureScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: CircularApertureModel) {
    const a11y = StringManager.getInstance().getCircularApertureA11yStrings();
    const strings = StringManager.getInstance().getCircularApertureStrings();
    const units = StringManager.getInstance().getUnits();

    const currentDetailsProperty = DerivedProperty.deriveAny(
      [
        model.diameterProperty,
        model.wavelengthProperty,
        model.separationProperty,
        model.rayleighAngleProperty,
        model.separationRatioProperty,
        model.verdictProperty,
        a11y.currentDetailsPatternStringProperty,
        strings.resolvedStringProperty,
        strings.justResolvedStringProperty,
        strings.unresolvedStringProperty,
        units.valueUnitsPatternStringProperty,
      ],
      () => {
        const verdict = model.verdictProperty.value;
        return StringUtils.fillIn(a11y.currentDetailsPatternStringProperty.value, {
          diameter: formatDiameter(model.diameterProperty.value),
          wavelength: roundSymmetric(model.wavelengthProperty.value),
          rayleigh: toPlainText(
            formatSignificant(
              model.rayleighAngleProperty.value,
              CIRCULAR_APERTURE_SCREEN_SUMMARY_CONTENT_SETTINGS.VALUE_FORMAT_SIGNIFICANT_DIGITS,
            ),
          ),
          separation: toPlainText(
            formatSignificant(
              model.separationProperty.value,
              CIRCULAR_APERTURE_SCREEN_SUMMARY_CONTENT_SETTINGS.VALUE_FORMAT_SIGNIFICANT_DIGITS,
            ),
          ),
          ratio: toPlainText(
            formatSignificant(
              model.separationRatioProperty.value,
              CIRCULAR_APERTURE_SCREEN_SUMMARY_CONTENT_SETTINGS.VALUE_FORMAT_SIGNIFICANT_DIGITS,
            ),
          ),
          verdict:
            verdict === "resolved"
              ? strings.resolvedStringProperty.value
              : verdict === "justResolved"
                ? strings.justResolvedStringProperty.value
                : strings.unresolvedStringProperty.value,
        });
      },
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
