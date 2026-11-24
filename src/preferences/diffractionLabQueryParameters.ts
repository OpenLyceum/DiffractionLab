/**
 * diffractionLabQueryParameters.ts
 *
 * Public query parameters of the simulation.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import DiffractionLabNamespace from "../DiffractionLabNamespace.js";

const diffractionLabQueryParameters = QueryStringMachine.getAll({
  /**
   * Shows the governing equation on each screen (the N-slit intensity, R = mN,
   * θ = 1.22 λ/D, I = |R + O|²). On by default: the sim accompanies a modern
   * physics text. Hide them with ?showEquations=false.
   */
  showEquations: {
    type: "custom",
    defaultValue: true,
    parse: (value: string | null): boolean => value !== "false",
    public: true,
  },
});

DiffractionLabNamespace.register("diffractionLabQueryParameters", diffractionLabQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default diffractionLabQueryParameters;
