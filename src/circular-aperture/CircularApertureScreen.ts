/**
 * CircularApertureScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createCircularApertureIcon() in src/common/DiffractionLabScreenIcons.ts.
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createCircularApertureIcon } from "../common/DiffractionLabScreenIcons.js";
import DiffractionLabColors from "../DiffractionLabColors.js";
import type { DiffractionLabPreferencesModel } from "../preferences/DiffractionLabPreferencesModel.js";
import { CircularApertureModel } from "./model/CircularApertureModel.js";
import { CircularApertureKeyboardHelpContent } from "./view/CircularApertureKeyboardHelpContent.js";
import { CircularApertureScreenView } from "./view/CircularApertureScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type CircularApertureScreenOptions = ScreenOptions & { tandem: Tandem; preferences: DiffractionLabPreferencesModel };

export class CircularApertureScreen extends Screen<CircularApertureModel, CircularApertureScreenView> {
  public constructor(options: CircularApertureScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new CircularApertureModel(),
      // View factory — receives the model instance
      (model) =>
        new CircularApertureScreenView(model, options.preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<CircularApertureScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: DiffractionLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new CircularApertureKeyboardHelpContent(),
          homeScreenIcon: createCircularApertureIcon(),
          navigationBarIcon: createCircularApertureIcon(),
        },
        options,
      ),
    );
  }
}
