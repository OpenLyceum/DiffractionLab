/**
 * DiffractionLabPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to DiffractionLabPreferencesModel Properties (whose initial values come from
 * diffractionLabQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import DiffractionLabColors from "../DiffractionLabColors.js";
import DiffractionLabNamespace from "../DiffractionLabNamespace.js";
import { StringManager } from "../i18n/StringManager.js";
import type { DiffractionLabPreferencesModel } from "./DiffractionLabPreferencesModel.js";

export class DiffractionLabPreferencesNode extends VBox {
  public constructor(preferencesModel: DiffractionLabPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: DiffractionLabColors.controlSurfaceTextColorProperty,
    });

    const showEquationsCheckbox = new Checkbox(
      preferencesModel.showEquationsProperty,
      new Text(prefStrings.showEquationsStringProperty, {
        font: new PhetFont(14),
        fill: DiffractionLabColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: DiffractionLabColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: DiffractionLabColors.controlSurfaceColorProperty,
        spacing: 8,
        accessibleHelpText: prefStrings.showEquationsHelpStringProperty,
        ...(tandem && { tandem: tandem.createTandem("showEquationsCheckbox") }),
      },
    );

    const description = new Text(prefStrings.showEquationsHelpStringProperty, {
      font: new PhetFont(12),
      fill: DiffractionLabColors.controlSurfaceTextColorProperty,
      maxWidth: 420,
    });

    super({
      align: "left",
      spacing: 12,
      children: [header, showEquationsCheckbox, description],
    });
  }
}

DiffractionLabNamespace.register("DiffractionLabPreferencesNode", DiffractionLabPreferencesNode);
