/**
 * PhasorDiagramNode.ts
 *
 * The phasor chain for the direction under the cursor: one arrow per slit,
 * added tip to tail, each turned by φ from the last, and their resultant.
 * The dashed circle is the length of a straight chain (θ = 0), so the
 * resultant's length against it is the amplitude relative to the maximum.
 *
 * The chain is rebuilt on every change; with at most 40 phasors that is two
 * Shapes and one ArrowNode per update.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import type { PhasorChain } from "../../common/model/phasorChain.js";
import DiffractionLabColors from "../../DiffractionLabColors.js";
import { FONTS } from "../../DiffractionLabConstants.js";

export type PhasorDiagramNodeOptions = {
  size: number;
  titleProperty: TReadOnlyProperty<string>;
  captionProperty: TReadOnlyProperty<string>;
};

/** Fraction of the half-size used by a straight chain. */
const CHAIN_SCALE = 0.86;

export class PhasorDiagramNode extends Node {
  private readonly shafts: Path;
  private readonly heads: Path;
  private readonly resultant: ArrowNode;
  private readonly unitLength: number;
  private readonly originX: number;
  private readonly originY: number;

  public constructor(chainProperty: TReadOnlyProperty<PhasorChain>, options: PhasorDiagramNodeOptions) {
    super();
    const size = options.size;
    this.unitLength = (CHAIN_SCALE * size) / 2;
    this.originX = size / 2;
    this.originY = size / 2;

    const background = new Rectangle(0, 0, size, size, {
      fill: DiffractionLabColors.chartBackgroundColorProperty,
      stroke: DiffractionLabColors.chartAxisColorProperty,
    });
    const axis = new Path(new Shape().moveTo(0, this.originY).lineTo(size, this.originY), {
      stroke: DiffractionLabColors.chartGridColorProperty,
    });
    const referenceCircle = new Circle(this.unitLength, {
      x: this.originX,
      y: this.originY,
      stroke: DiffractionLabColors.chartAxisColorProperty,
      lineDash: [4, 4],
    });
    this.shafts = new Path(null, { stroke: DiffractionLabColors.phasorColorProperty, lineWidth: 1.5 });
    this.heads = new Path(null, { fill: DiffractionLabColors.phasorColorProperty });
    this.resultant = new ArrowNode(0, 0, 1, 0, {
      fill: DiffractionLabColors.resultantColorProperty,
      stroke: null,
      headHeight: 12,
      headWidth: 12,
      tailWidth: 3,
    });

    const drawing = new Node({
      children: [background, axis, referenceCircle, this.shafts, this.heads, this.resultant],
      clipArea: Shape.rect(0, 0, size, size),
    });

    const title = new Text(options.titleProperty, {
      font: FONTS.TITLE,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: size,
    });
    const caption = new RichText(options.captionProperty, {
      font: FONTS.SMALL,
      fill: DiffractionLabColors.textColorProperty,
      maxWidth: size,
    });

    this.addChild(new VBox({ spacing: 4, align: "left", children: [title, drawing, caption] }));

    chainProperty.link((chain) => this.update(chain));
  }

  private update(chain: PhasorChain): void {
    const shafts = new Shape();
    const heads = new Shape();
    const points = chain.points.map((p) => ({
      x: this.originX + this.unitLength * p.x,
      y: this.originY - this.unitLength * p.y,
    }));
    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1];
      const to = points[i];
      if (!(from && to)) {
        continue;
      }
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy);
      if (length < 0.5) {
        continue;
      }
      const ux = dx / length;
      const uy = dy / length;
      const headLength = Math.min(8, 0.4 * length);
      const headHalfWidth = headLength * 0.45;
      const baseX = to.x - ux * headLength;
      const baseY = to.y - uy * headLength;
      shafts.moveTo(from.x, from.y).lineTo(baseX, baseY);
      heads
        .moveTo(to.x, to.y)
        .lineTo(baseX - uy * headHalfWidth, baseY + ux * headHalfWidth)
        .lineTo(baseX + uy * headHalfWidth, baseY - ux * headHalfWidth)
        .close();
    }
    this.shafts.shape = shafts;
    this.heads.shape = heads;

    const last = points[points.length - 1] ?? { x: this.originX, y: this.originY };
    const resultantLength = Math.hypot(last.x - this.originX, last.y - this.originY);
    this.resultant.visible = resultantLength > 2;
    if (this.resultant.visible) {
      this.resultant.setTailAndTip(this.originX, this.originY, last.x, last.y);
    }
  }
}
