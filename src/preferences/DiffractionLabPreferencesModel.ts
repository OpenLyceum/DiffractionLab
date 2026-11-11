/**
 * DiffractionLabPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in diffractionLabQueryParameters.
 *
 * A single instance is shared by every screen (see {@link diffractionLabPreferences}).
 */

import { BooleanProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
import DiffractionLabNamespace from "../DiffractionLabNamespace.js";
import diffractionLabQueryParameters from "./diffractionLabQueryParameters.js";

export class DiffractionLabPreferencesModel {
  /** Show the equations beside the readouts (I = …, R = mN, θ = 1.22 λ/D, I = |R + O|²). */
  public readonly showEquationsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showEquationsProperty = new BooleanProperty(
      diffractionLabQueryParameters.showEquations,
      tandem ? { tandem: tandem.createTandem("showEquationsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showEquationsProperty.reset();
  }
}

/** The sim-wide preferences, shared by main.ts (the Preferences dialog) and the screen views. */
export const diffractionLabPreferences = new DiffractionLabPreferencesModel(Tandem.ROOT.createTandem("preferences"));

DiffractionLabNamespace.register("DiffractionLabPreferencesModel", DiffractionLabPreferencesModel);
