/**
 * ResolvingPowerScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createResolvingPowerIcon() in src/common/DiffractionLabScreenIcons.ts.
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createResolvingPowerIcon } from "../common/DiffractionLabScreenIcons.js";
import DiffractionLabColors from "../DiffractionLabColors.js";
import type { DiffractionLabPreferencesModel } from "../preferences/DiffractionLabPreferencesModel.js";
import { ResolvingPowerModel } from "./model/ResolvingPowerModel.js";
import { ResolvingPowerKeyboardHelpContent } from "./view/ResolvingPowerKeyboardHelpContent.js";
import { ResolvingPowerScreenView } from "./view/ResolvingPowerScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ResolvingPowerScreenOptions = ScreenOptions & { tandem: Tandem; preferences: DiffractionLabPreferencesModel };

export class ResolvingPowerScreen extends Screen<ResolvingPowerModel, ResolvingPowerScreenView> {
  public constructor(options: ResolvingPowerScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ResolvingPowerModel(),
      // View factory — receives the model instance
      (model) =>
        new ResolvingPowerScreenView(model, options.preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ResolvingPowerScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: DiffractionLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ResolvingPowerKeyboardHelpContent(),
          homeScreenIcon: createResolvingPowerIcon(),
          navigationBarIcon: createResolvingPowerIcon(),
        },
        options,
      ),
    );
  }
}
