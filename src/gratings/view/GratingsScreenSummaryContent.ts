import { GRATINGS_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../DiffractionLabConstants.js";
/**
 * GratingsScreenSummaryContent.ts
 *
 * Screen summary for the Gratings screen, with a live description of the
 * grating and of the direction under the cursor.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { gratingIntensity, maxOrder, missingOrders, phaseStep } from "../../common/model/fraunhofer.js";
import { formatIntensity, formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { GratingsModel } from "../model/GratingsModel.js";

/** Text describing the missing orders, shared with the on-screen readout. */
export function missingOrdersText(d: number, a: number, lambdaUm: number): string {
  const strings = StringManager.getInstance().getGratingsStrings();
  const orders = missingOrders(d, a, Math.min(30, maxOrder(d, lambdaUm)));
  if (orders.length === 0) {
    return strings.noMissingOrdersStringProperty.value;
  }
  return StringUtils.fillIn(strings.missingOrdersStringProperty.value, { orders: orders.join(", ±") });
}

export class GratingsScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: GratingsModel) {
    const a11y = StringManager.getInstance().getGratingsA11yStrings();
    const strings = StringManager.getInstance().getGratingsStrings();

    const currentDetailsProperty = DerivedProperty.deriveAny(
      [
        model.slitCountProperty,
        model.slitSpacingProperty,
        model.slitWidthProperty,
        model.wavelengthProperty,
        model.cursorSinThetaProperty,
        a11y.currentDetailsPatternStringProperty,
        strings.missingOrdersStringProperty,
        strings.noMissingOrdersStringProperty,
      ],
      () => {
        const n = model.slitCountProperty.value;
        const d = model.slitSpacingProperty.value;
        const a = model.slitWidthProperty.value;
        const lambda = model.wavelengthUm;
        const s = model.cursorSinThetaProperty.value;
        const turns = phaseStep(s, d, lambda) / (2 * Math.PI);
        return StringUtils.fillIn(a11y.currentDetailsPatternStringProperty.value, {
          count: n,
          spacing: formatSignificant(d, GRATINGS_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_PROPERTY_SPACING),
          width: formatSignificant(a, GRATINGS_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_PROPERTY_WIDTH),
          wavelength: Math.round(model.wavelengthProperty.value),
          missing: `${missingOrdersText(d, a, lambda)}.`,
          sinTheta: toPlainText(
            formatSignificant(s, GRATINGS_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_PROPERTY_DIGITS),
          ),
          phi: toPlainText(
            formatSignificant(turns, GRATINGS_SCREEN_SUMMARY_CONTENT_SETTINGS.CURRENT_DETAILS_PROPERTY_DIGITS),
          ),
          intensity: toPlainText(formatIntensity(gratingIntensity(s, n, d, a, lambda))),
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
