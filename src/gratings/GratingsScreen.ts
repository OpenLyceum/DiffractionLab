/**
 * GratingsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createGratingsIcon() in src/common/DiffractionLabScreenIcons.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createGratingsIcon } from "../common/DiffractionLabScreenIcons.js";
import DiffractionLabColors from "../DiffractionLabColors.js";
import { GratingsModel } from "./model/GratingsModel.js";
import { GratingsKeyboardHelpContent } from "./view/GratingsKeyboardHelpContent.js";
import { GratingsScreenView } from "./view/GratingsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type GratingsScreenOptions = ScreenOptions & { tandem: Tandem };

export class GratingsScreen extends Screen<GratingsModel, GratingsScreenView> {
  public constructor(options: GratingsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new GratingsModel(),
      // View factory — receives the model instance
      (model) =>
        new GratingsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<GratingsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: DiffractionLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new GratingsKeyboardHelpContent(),
          homeScreenIcon: createGratingsIcon(),
          navigationBarIcon: createGratingsIcon(),
        },
        options,
      ),
    );
  }
}
