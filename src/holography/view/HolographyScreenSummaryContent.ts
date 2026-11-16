import { HOLOGRAPHY_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../DiffractionLabConstants.js";
/**
 * HolographyScreenSummaryContent.ts
 *
 * Screen summary for the Holography screen, with a live description of the
 * mode, the setup and (once reconstructed) the width of object 1's image.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { HolographyModel } from "../model/HolographyModel.js";

export class HolographyScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: HolographyModel) {
    const a11y = StringManager.getInstance().getHolographyA11yStrings();
    const strings = StringManager.getInstance().getHolographyStrings();

    const currentDetailsProperty = DerivedProperty.deriveAny(
      [
        model.modeProperty,
        model.objectCountProperty,
        model.referenceAngleProperty,
        model.coherenceLengthProperty,
        model.focusWidthProperty,
        a11y.currentDetailsPatternStringProperty,
        a11y.focusPatternStringProperty,
        strings.recordStringProperty,
        strings.reconstructStringProperty,
      ],
      () => {
        const width = model.focusWidthProperty.value;
        const reconstructing = model.modeProperty.value === "reconstruct";
        return StringUtils.fillIn(a11y.currentDetailsPatternStringProperty.value, {
          mode: reconstructing ? strings.reconstructStringProperty.value : strings.recordStringProperty.value,
          count: model.objectCountProperty.value,
          angle: Math.round(model.referenceAngleProperty.value),
          coherence: formatSignificant(
            model.coherenceLengthProperty.value,
            HOLOGRAPHY_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_PROPERTY_DIGITS,
          ),
          focus:
            reconstructing && width !== null
              ? StringUtils.fillIn(a11y.focusPatternStringProperty.value, {
                  width: formatSignificant(
                    width,
                    HOLOGRAPHY_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_PROPERTY_DIGITS,
                  ),
                })
              : "",
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
