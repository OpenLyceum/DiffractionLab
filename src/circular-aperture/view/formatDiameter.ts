/**
 * formatDiameter.ts
 *
 * Formats an aperture diameter in the friendliest unit: millimetres below
 * 10 cm, metres above.
 */

import { StringUtils } from "scenerystack/phetcommon";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";

export function formatDiameter(diameterM: number): string {
  const units = StringManager.getInstance().getUnits();
  const useMillimetres = diameterM < 0.1;
  return StringUtils.fillIn(units.valueUnitsPatternStringProperty.value, {
    value: formatSignificant(useMillimetres ? diameterM * 1000 : diameterM, 3),
    units: useMillimetres ? units.millimetresStringProperty.value : units.metresStringProperty.value,
  });
}
