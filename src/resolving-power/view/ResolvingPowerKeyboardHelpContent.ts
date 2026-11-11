/**
 * ResolvingPowerKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * Every grating and line parameter is a slider; presets, order and
 * "just resolve" are buttons.
 */

import {
  BasicActionsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class ResolvingPowerKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const leftColumn = [new SliderControlsKeyboardHelpSection()];
    const rightColumn = [new BasicActionsKeyboardHelpSection()];
    super(leftColumn, rightColumn);
  }
}
