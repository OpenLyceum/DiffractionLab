/**
 * ResolvingPowerScreenSummaryContent.ts
 *
 * Screen summary for the Resolving Power screen, with a live description of
 * the line pair, the grating and the verdict.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ResolvingPowerModel } from "../model/ResolvingPowerModel.js";

export class ResolvingPowerScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ResolvingPowerModel) {
    const a11y = StringManager.getInstance().getResolvingPowerA11yStrings();
    const strings = StringManager.getInstance().getResolvingPowerStrings();

    const currentDetailsProperty = DerivedProperty.deriveAny(
      [
        model.wavelengthProperty,
        model.separationProperty,
        model.orderProperty,
        model.illuminatedLinesProperty,
        model.resolvingPowerProperty,
        model.requiredPowerProperty,
        model.verdictProperty,
        a11y.currentDetailsPatternStringProperty,
        strings.resolvedStringProperty,
        strings.justResolvedStringProperty,
        strings.unresolvedStringProperty,
      ],
      () => {
        const lambda = model.wavelengthProperty.value;
        const verdict = model.verdictProperty.value;
        return StringUtils.fillIn(a11y.currentDetailsPatternStringProperty.value, {
          wavelength: formatSignificant(lambda, 4),
          wavelength2: formatSignificant(lambda + model.separationProperty.value, 5),
          order: model.orderProperty.value,
          lines: model.illuminatedLinesProperty.value,
          power: model.resolvingPowerProperty.value,
          needed: Math.round(model.requiredPowerProperty.value),
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
