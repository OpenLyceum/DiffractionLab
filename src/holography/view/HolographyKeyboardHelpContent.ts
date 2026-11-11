/**
 * HolographyKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * The objects are draggable items (arrow keys, Shift for fine steps) while
 * recording; reference angle and coherence length are sliders.
 */

import {
  BasicActionsKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class HolographyKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const leftColumn = [new MoveDraggableItemsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()];
    const rightColumn = [new BasicActionsKeyboardHelpSection()];
    super(leftColumn, rightColumn);
  }
}
