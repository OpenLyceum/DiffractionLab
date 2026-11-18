/**
 * GratingsKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * The angle cursor on the intensity chart moves along one axis only: its
 * KeyboardDragListener uses keyboardDragDirection "leftRight" (Left/Right
 * arrows or A/D, Shift for fine steps), so it gets a one-dimensional section
 * rather than the 2D MoveDraggableItemsKeyboardHelpSection. The grating
 * parameters are sliders.
 */

import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class GratingsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getGratingsStrings().keyboardHelp;
    const a11y = StringManager.getInstance().getGratingsA11yStrings().keyboardHelp;

    const cursorSection = new KeyboardHelpSection(strings.headingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        strings.moveCursorStringProperty,
        KeyboardHelpIconFactory.leftRightOrADKeysRowIcon(),
        { labelInnerContent: a11y.moveCursorStringProperty },
      ),
      KeyboardHelpSectionRow.labelWithIconList(
        strings.moveCursorSlowerStringProperty,
        [
          KeyboardHelpIconFactory.shiftPlusIcon(KeyboardHelpIconFactory.leftRightArrowKeysRowIcon()),
          KeyboardHelpIconFactory.shiftPlusIcon(KeyboardHelpIconFactory.aDKeysRowIcon()),
        ],
        { labelInnerContent: a11y.moveCursorSlowerStringProperty },
      ),
    ]);

    const leftColumn = [cursorSection, new SliderControlsKeyboardHelpSection()];
    const rightColumn = [new BasicActionsKeyboardHelpSection()];
    super(leftColumn, rightColumn);
  }
}
