/**
 * IntensityImageNode.ts
 *
 * Draws a grid of intensities as an image: the screen strip of the Gratings
 * screen, the Airy image, the film and the reconstruction map of the
 * Holography screen.
 *
 * The caller fills a Float32Array of linear intensities (row-major, `columns`
 * × `rows`) and a linear-RGB colour; the node maps each cell to colour ×
 * intensity × gain, encodes it as sRGB, and draws the grid scaled up to the
 * node's size with smoothing on. The same CPU pattern as InterferometryLab's
 * FringePatternNode: the pixels are written once to an offscreen canvas with
 * putImageData, then drawn with drawImage so Scenery's transforms apply.
 */

import { Bounds2 } from "scenerystack/dot";
import { CanvasNode, type CanvasNodeOptions } from "scenerystack/scenery";
import { encodeSrgb } from "./spectralColor.js";

export type IntensityImageNodeOptions = CanvasNodeOptions & {
  /** Size of the drawn image (view pixels). */
  width: number;
  height: number;
  /** Size of the sample grid. */
  columns: number;
  rows: number;
  /** Draw with smoothing (default true). A strip of sharp lines looks better without. */
  smoothing?: boolean;
};

export class IntensityImageNode extends CanvasNode {
  /** Linear intensities, row-major. Write into it, then call {@link update}. */
  public readonly intensities: Float32Array;

  private readonly columns: number;
  private readonly rows: number;
  private readonly drawWidth: number;
  private readonly drawHeight: number;
  private readonly smoothing: boolean;
  private red = 1;
  private green = 1;
  private blue = 1;
  private gain = 1;
  private exponent = 1;
  private sampleCanvas: HTMLCanvasElement | null = null;
  private sampleContext: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private dirty = true;

  public constructor(options: IntensityImageNodeOptions) {
    const { width, height, columns, rows, smoothing, ...canvasOptions } = options;
    super({ ...canvasOptions, canvasBounds: new Bounds2(0, 0, width, height) });
    this.columns = columns;
    this.rows = rows;
    this.drawWidth = width;
    this.drawHeight = height;
    this.smoothing = smoothing ?? true;
    this.intensities = new Float32Array(columns * rows);
  }

  /**
   * Sets the colour (linear RGB, brightest channel near 1), the gain applied to
   * every intensity, and an optional display exponent (0.5 brightens faint
   * features such as Airy rings; 1 is linear), then repaints.
   */
  public update(rgb: readonly [number, number, number], gain = 1, exponent = 1): void {
    const peak = Math.max(rgb[0], rgb[1], rgb[2], 1e-6);
    this.red = rgb[0] / peak;
    this.green = rgb[1] / peak;
    this.blue = rgb[2] / peak;
    this.gain = gain;
    this.exponent = exponent;
    this.dirty = true;
    this.invalidatePaint();
  }

  private ensureBuffers(): boolean {
    if (this.imageData) {
      return true;
    }
    const canvas = document.createElement("canvas");
    canvas.width = this.columns;
    canvas.height = this.rows;
    const context = canvas.getContext("2d");
    if (!context) {
      return false;
    }
    this.sampleCanvas = canvas;
    this.sampleContext = context;
    this.imageData = context.createImageData(this.columns, this.rows);
    return true;
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    if (!(this.ensureBuffers() && this.imageData && this.sampleCanvas && this.sampleContext)) {
      return;
    }
    if (this.dirty) {
      const pixels = this.imageData.data;
      const values = this.intensities;
      const linearExponent = this.exponent === 1;
      for (let i = 0, p = 0; i < values.length; i++, p += 4) {
        const raw = Math.max(0, (values[i] ?? 0) * this.gain);
        const value = linearExponent ? raw : raw ** this.exponent;
        pixels[p] = encodeSrgb(value * this.red);
        pixels[p + 1] = encodeSrgb(value * this.green);
        pixels[p + 2] = encodeSrgb(value * this.blue);
        pixels[p + 3] = 255;
      }
      this.sampleContext.putImageData(this.imageData, 0, 0);
      this.dirty = false;
    }
    context.imageSmoothingEnabled = this.smoothing;
    context.drawImage(this.sampleCanvas, 0, 0, this.drawWidth, this.drawHeight);
  }
}
