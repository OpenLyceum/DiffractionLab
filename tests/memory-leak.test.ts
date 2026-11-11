import { TimeModel } from "../src/common/TimeModel.js";
import { HolographyModel } from "../src/holography/model/HolographyModel.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

describeDisposalLeaks([
  { name: "TimeModel", create: () => new TimeModel(), idempotentDispose: true },
  { name: "HolographyModel", create: () => new HolographyModel() },
]);
