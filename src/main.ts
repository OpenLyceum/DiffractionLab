/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { CircularApertureScreen } from "./circular-aperture/CircularApertureScreen.js";
import DiffractionLabColors from "./DiffractionLabColors.js";
import { GratingsScreen } from "./gratings/GratingsScreen.js";
import { HolographyScreen } from "./holography/HolographyScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { DiffractionLabPreferencesModel } from "./preferences/DiffractionLabPreferencesModel.js";
import { DiffractionLabPreferencesNode } from "./preferences/DiffractionLabPreferencesNode.js";
import { ResolvingPowerScreen } from "./resolving-power/ResolvingPowerScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  const simPreferences = new DiffractionLabPreferencesModel(Tandem.ROOT.createTandem("preferences"));
  const screens = [
    new GratingsScreen({
      preferences: simPreferences,
      name: stringManager.getScreenNames().gratingsStringProperty,
      tandem: Tandem.ROOT.createTandem("gratingsScreen"),
      backgroundColorProperty: DiffractionLabColors.backgroundColorProperty,
    }),
    new ResolvingPowerScreen({
      preferences: simPreferences,
      name: stringManager.getScreenNames().resolvingPowerStringProperty,
      tandem: Tandem.ROOT.createTandem("resolvingPowerScreen"),
      backgroundColorProperty: DiffractionLabColors.backgroundColorProperty,
    }),
    new CircularApertureScreen({
      preferences: simPreferences,
      name: stringManager.getScreenNames().circularApertureStringProperty,
      tandem: Tandem.ROOT.createTandem("circularApertureScreen"),
      backgroundColorProperty: DiffractionLabColors.backgroundColorProperty,
    }),
    new HolographyScreen({
      preferences: simPreferences,
      name: stringManager.getScreenNames().holographyStringProperty,
      tandem: Tandem.ROOT.createTandem("holographyScreen"),
      backgroundColorProperty: DiffractionLabColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new DiffractionLabPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
