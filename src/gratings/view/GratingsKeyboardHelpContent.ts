/**
 * GratingsKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * The angle cursor on the intensity chart is a draggable item (arrow keys,
 * Shift for fine steps); the grating parameters are sliders.
 */

import {
  BasicActionsKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class GratingsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const leftColumn = [new MoveDraggableItemsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()];
    const rightColumn = [new BasicActionsKeyboardHelpSection()];
    super(leftColumn, rightColumn);
  }
}
