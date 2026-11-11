/**
 * HolographyScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createHolographyIcon() in src/common/DiffractionLabScreenIcons.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createHolographyIcon } from "../common/DiffractionLabScreenIcons.js";
import DiffractionLabColors from "../DiffractionLabColors.js";
import { HolographyModel } from "./model/HolographyModel.js";
import { HolographyKeyboardHelpContent } from "./view/HolographyKeyboardHelpContent.js";
import { HolographyScreenView } from "./view/HolographyScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type HolographyScreenOptions = ScreenOptions & { tandem: Tandem };

export class HolographyScreen extends Screen<HolographyModel, HolographyScreenView> {
  public constructor(options: HolographyScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new HolographyModel(),
      // View factory — receives the model instance
      (model) =>
        new HolographyScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<HolographyScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: DiffractionLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new HolographyKeyboardHelpContent(),
          homeScreenIcon: createHolographyIcon(),
          navigationBarIcon: createHolographyIcon(),
        },
        options,
      ),
    );
  }
}
