/**
 * DiffractionLabScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen, drawn on
 * the standard PhET 548 × 373 canvas using DiffractionLabColors and the same
 * physics functions as the screens themselves.
 */
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import DiffractionLabColors from "../DiffractionLabColors.js";
import { airyIntensity } from "./model/airy.js";
import { arrayIntensity, gratingIntensity } from "./model/fraunhofer.js";
import { lightColor } from "./view/lightColor.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: DiffractionLabColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: DiffractionLabColors.backgroundColorProperty,
  });
}

/** A curve y = f(u) for u in [−1, 1], drawn into the icon's plotting box. */
function curve(f: (u: number) => number, samples = 600): Shape {
  const shape = new Shape();
  const left = 40;
  const width = W - 80;
  const bottom = H - 50;
  const height = H - 100;
  for (let i = 0; i < samples; i++) {
    const u = -1 + (2 * i) / (samples - 1);
    const x = left + ((u + 1) / 2) * width;
    const y = bottom - height * f(u);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  return shape;
}

function baseline(): Line {
  return new Line(30, H - 50, W - 30, H - 50, { stroke: DiffractionLabColors.chartAxisColorProperty, lineWidth: 3 });
}

export function createGratingsIcon(): ScreenIcon {
  // Five slits with d = 3a: sharp principal maxima under the single-slit envelope.
  const pattern = (u: number) => gratingIntensity(u * 0.8, 5, 3, 1, 0.5);
  const envelope = (u: number) => gratingIntensity(u * 0.8, 1, 3, 1, 0.5);
  return iconFrom(
    new Node({
      children: [
        background(),
        baseline(),
        new Path(curve(envelope), {
          stroke: DiffractionLabColors.envelopeCurveColorProperty,
          lineWidth: 4,
          lineDash: [12, 8],
        }),
        new Path(curve(pattern, 1200), { stroke: DiffractionLabColors.intensityCurveColorProperty, lineWidth: 5 }),
      ],
    }),
  );
}

export function createResolvingPowerIcon(): ScreenIcon {
  // Two lines just resolved: the peak of one on the first zero of the other.
  const n = 8;
  const line = (shift: number) => (u: number) => 0.5 * arrayIntensity(u * 0.35 - shift, n, 1, 1);
  const first = line(-1 / (2 * n));
  const second = line(1 / (2 * n));
  return iconFrom(
    new Node({
      children: [
        background(),
        baseline(),
        new Path(curve(first), { stroke: DiffractionLabColors.firstLineColorProperty, lineWidth: 5 }),
        new Path(curve(second), { stroke: DiffractionLabColors.secondLineColorProperty, lineWidth: 5 }),
        new Path(
          curve((u) => first(u) + second(u)),
          { stroke: DiffractionLabColors.intensityCurveColorProperty, lineWidth: 6 },
        ),
      ],
    }),
  );
}

export function createCircularApertureIcon(): ScreenIcon {
  // Two Airy disks: bright cores and faint rings, drawn as circles whose
  // opacity follows the Airy intensity (with the rings lifted to be seen).
  const children: Node[] = [background()];
  for (const centerX of [W / 2 - 85, W / 2 + 85]) {
    for (let r = 150; r > 0; r -= 3) {
      const u = (r / 150) * 13;
      const value = Math.sqrt(airyIntensity(u));
      if (value > 0.02) {
        children.push(
          new Circle(r, {
            x: centerX,
            y: H / 2,
            stroke: lightColor(530),
            lineWidth: 3,
            opacity: Math.min(1, value),
          }),
        );
      }
    }
  }
  return iconFrom(new Node({ children }));
}

export function createHolographyIcon(): ScreenIcon {
  const filmX = W - 110;
  const object = { x: 120, y: H / 2 - 30 };
  const wavefronts = new Shape();
  for (let r = 40; r < filmX - object.x; r += 40) {
    wavefronts.arc(object.x, object.y, r, -Math.PI / 3, Math.PI / 3, false);
    wavefronts.newSubpath();
  }
  const fringes = new Shape();
  for (let y = 40; y < H - 40; y += 9) {
    fringes.rect(filmX, y, 26, 4);
  }
  const arrows = new Shape();
  for (const y of [H - 80, H - 150]) {
    arrows.moveTo(filmX - 170, y + 70).lineTo(filmX - 6, y);
  }
  return iconFrom(
    new Node({
      children: [
        background(),
        new Path(wavefronts, { stroke: DiffractionLabColors.objectColorProperty, lineWidth: 4, opacity: 0.7 }),
        new Path(arrows, { stroke: DiffractionLabColors.referenceBeamColorProperty, lineWidth: 6 }),
        new Rectangle(filmX, 40, 26, H - 80, { fill: DiffractionLabColors.filmColorProperty }),
        new Path(fringes, { fill: DiffractionLabColors.exposedColorProperty }),
        new Circle(16, { x: object.x, y: object.y, fill: DiffractionLabColors.objectColorProperty }),
      ],
    }),
  );
}
