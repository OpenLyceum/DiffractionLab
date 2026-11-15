/**
 * formatDiameter.ts
 *
 * Formats an aperture diameter in the friendliest unit: millimetres below
 * 10 cm, metres above.
 */

import { StringUtils } from "scenerystack/phetcommon";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { CONTROLS, DIAMETER_MILLIMETRE_THRESHOLD_M } from "../../DiffractionLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";

export function formatDiameter(diameterM: number): string {
  const units = StringManager.getInstance().getUnits();
  const useMillimetres = diameterM < DIAMETER_MILLIMETRE_THRESHOLD_M;
  return StringUtils.fillIn(units.valueUnitsPatternStringProperty.value, {
    value: formatSignificant(useMillimetres ? diameterM * 1000 : diameterM, CONTROLS.DEFAULT_SIGNIFICANT_FIGURES),
    units: useMillimetres ? units.millimetresStringProperty.value : units.metresStringProperty.value,
  });
}
