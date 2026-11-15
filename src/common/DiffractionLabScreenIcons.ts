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
import { CIRCULAR_APERTURE_ICON, HOLOGRAPHY_ICON, ICON_CHART, SCREEN_ICONS } from "../DiffractionLabConstants.js";
import { airyIntensity } from "./model/airy.js";
import { arrayIntensity, gratingIntensity } from "./model/fraunhofer.js";
import { lightColor } from "./view/lightColor.js";

const W = SCREEN_ICONS.WIDTH;
const H = SCREEN_ICONS.HEIGHT;

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
function curve(f: (u: number) => number, samples: number = ICON_CHART.DEFAULT_SAMPLES): Shape {
  const shape = new Shape();
  const left = ICON_CHART.LEFT;
  const width = W - 2 * ICON_CHART.LEFT;
  const bottom = H - ICON_CHART.BOTTOM_INSET;
  const height = H - ICON_CHART.HEIGHT_INSET;
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
  return new Line(
    ICON_CHART.BASELINE_INSET,
    H - ICON_CHART.BOTTOM_INSET,
    W - ICON_CHART.BASELINE_INSET,
    H - ICON_CHART.BOTTOM_INSET,
    {
      stroke: DiffractionLabColors.chartAxisColorProperty,
      lineWidth: ICON_CHART.BASELINE_WIDTH,
    },
  );
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
          lineWidth: ICON_CHART.ENVELOPE_LINE_WIDTH,
          lineDash: [...ICON_CHART.ENVELOPE_DASH],
        }),
        new Path(curve(pattern, ICON_CHART.PATTERN_SAMPLES), {
          stroke: DiffractionLabColors.intensityCurveColorProperty,
          lineWidth: ICON_CHART.PATTERN_LINE_WIDTH,
        }),
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
        new Path(curve(first), {
          stroke: DiffractionLabColors.firstLineColorProperty,
          lineWidth: ICON_CHART.PATTERN_LINE_WIDTH,
        }),
        new Path(curve(second), {
          stroke: DiffractionLabColors.secondLineColorProperty,
          lineWidth: ICON_CHART.PATTERN_LINE_WIDTH,
        }),
        new Path(
          curve((u) => first(u) + second(u)),
          { stroke: DiffractionLabColors.intensityCurveColorProperty, lineWidth: ICON_CHART.SUM_LINE_WIDTH },
        ),
      ],
    }),
  );
}

export function createCircularApertureIcon(): ScreenIcon {
  // Two Airy disks: bright cores and faint rings, drawn as circles whose
  // opacity follows the Airy intensity (with the rings lifted to be seen).
  const children: Node[] = [background()];
  for (const centerX of [
    W / 2 - CIRCULAR_APERTURE_ICON.SOURCE_OFFSET_X,
    W / 2 + CIRCULAR_APERTURE_ICON.SOURCE_OFFSET_X,
  ]) {
    for (let r = CIRCULAR_APERTURE_ICON.MAX_RADIUS; r > 0; r -= CIRCULAR_APERTURE_ICON.RADIUS_STEP) {
      const u = (r / CIRCULAR_APERTURE_ICON.MAX_RADIUS) * CIRCULAR_APERTURE_ICON.RAYLEIGH_UNITS_AT_EDGE;
      const value = Math.sqrt(airyIntensity(u));
      if (value > CIRCULAR_APERTURE_ICON.MIN_OPACITY) {
        children.push(
          new Circle(r, {
            x: centerX,
            y: H / 2,
            stroke: lightColor(CIRCULAR_APERTURE_ICON.WAVELENGTH_NM),
            lineWidth: CIRCULAR_APERTURE_ICON.LINE_WIDTH,
            opacity: Math.min(1, value),
          }),
        );
      }
    }
  }
  return iconFrom(new Node({ children }));
}

export function createHolographyIcon(): ScreenIcon {
  const filmX = W - HOLOGRAPHY_ICON.FILM_INSET_RIGHT;
  const object = { x: HOLOGRAPHY_ICON.OBJECT_X, y: H / 2 - HOLOGRAPHY_ICON.OBJECT_Y_OFFSET };
  const wavefronts = new Shape();
  for (let r = HOLOGRAPHY_ICON.WAVEFRONT_START; r < filmX - object.x; r += HOLOGRAPHY_ICON.WAVEFRONT_STEP) {
    wavefronts.arc(object.x, object.y, r, -Math.PI / 3, Math.PI / 3, false);
    wavefronts.newSubpath();
  }
  const fringes = new Shape();
  for (let y = HOLOGRAPHY_ICON.FRINGE_TOP; y < H - HOLOGRAPHY_ICON.FRINGE_TOP; y += HOLOGRAPHY_ICON.FRINGE_STEP) {
    fringes.rect(filmX, y, HOLOGRAPHY_ICON.FRINGE_WIDTH, HOLOGRAPHY_ICON.FRINGE_HEIGHT);
  }
  const arrows = new Shape();
  for (const yOffset of HOLOGRAPHY_ICON.ARROW_Y_OFFSETS) {
    const y = H - yOffset;
    arrows
      .moveTo(filmX - HOLOGRAPHY_ICON.ARROW_TAIL_X, y + HOLOGRAPHY_ICON.ARROW_TAIL_Y)
      .lineTo(filmX - HOLOGRAPHY_ICON.ARROW_TIP_INSET, y);
  }
  return iconFrom(
    new Node({
      children: [
        background(),
        new Path(wavefronts, {
          stroke: DiffractionLabColors.objectColorProperty,
          lineWidth: HOLOGRAPHY_ICON.WAVEFRONT_LINE_WIDTH,
          opacity: HOLOGRAPHY_ICON.WAVEFRONT_OPACITY,
        }),
        new Path(arrows, {
          stroke: DiffractionLabColors.referenceBeamColorProperty,
          lineWidth: HOLOGRAPHY_ICON.ARROW_LINE_WIDTH,
        }),
        new Rectangle(
          filmX,
          HOLOGRAPHY_ICON.FRINGE_TOP,
          HOLOGRAPHY_ICON.FRINGE_WIDTH,
          H - 2 * HOLOGRAPHY_ICON.FRINGE_TOP,
          {
            fill: DiffractionLabColors.filmColorProperty,
          },
        ),
        new Path(fringes, { fill: DiffractionLabColors.exposedColorProperty }),
        new Circle(HOLOGRAPHY_ICON.OBJECT_RADIUS, {
          x: object.x,
          y: object.y,
          fill: DiffractionLabColors.objectColorProperty,
        }),
      ],
    }),
  );
}
