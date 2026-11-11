/**
 * HolographyModel.ts
 *
 * State of the Holography screen (side view, lengths in wavelengths): up to
 * three point objects, a reference beam at an angle, the laser's coherence
 * length, and whether the scene is being recorded or reconstructed.
 *
 * The film record is cheap (a few thousand samples) and is derived directly.
 * The reconstruction, a Huygens sum over every film sample for every point of
 * the map in front of the film, is spread over several animation frames by
 * {@link step}: each frame computes RECONSTRUCTION_POINTS_PER_FRAME points and
 * bumps {@link reconstructionVersionProperty} so the view repaints. Any change
 * to the setup restarts it. {@link completeReconstruction} runs it to the end
 * at once (tests, focus readout).
 */

import {
  BooleanProperty,
  DerivedProperty,
  Multilink,
  NumberProperty,
  Property,
  StringUnionProperty,
  type TReadOnlyProperty,
  type UnknownMultilink,
} from "scenerystack/axon";
import { Range, Vector2, Vector2Property } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import {
  type FilmRecord,
  focusWidth,
  type HologramObject,
  type HologramSetup,
  reconstructedIntensity,
  reconstructionSource,
  recordHologram,
} from "../../common/model/hologram.js";
import {
  COHERENCE_LENGTH_RANGE,
  FILM_SAMPLES_PER_WAVELENGTH,
  FILM_WIDTH,
  OBJECT_AMPLITUDE,
  OBJECT_DEPTH_RANGE,
  OBJECT_X_RANGE,
  PATH_MATCHED_DEPTH,
  RECONSTRUCTION_CELL,
  RECONSTRUCTION_DEPTH_RANGE,
  RECONSTRUCTION_POINTS_PER_FRAME,
  RECONSTRUCTION_X_RANGE,
  REFERENCE_ANGLE_DEFAULT_DEG,
  REFERENCE_ANGLE_RANGE_DEG,
} from "../../DiffractionLabConstants.js";
import DiffractionLabNamespace from "../../DiffractionLabNamespace.js";

export const HOLOGRAPHY_MODES = ["record", "reconstruct"] as const;
export type HolographyMode = (typeof HOLOGRAPHY_MODES)[number];

/** Default object positions (x along the film, depth in front of it), λ. */
const DEFAULT_OBJECTS = [new Vector2(-25, 160), new Vector2(30, 250), new Vector2(5, 110)] as const;

export class HolographyModel implements TModel {
  public readonly modeProperty = new StringUnionProperty<HolographyMode>("record", {
    validValues: HOLOGRAPHY_MODES,
  });

  /** Object positions: x along the film, y = depth in front of it (λ). */
  public readonly objectPositionProperties: readonly Vector2Property[];

  public readonly objectCountProperty = new NumberProperty(2, { range: new Range(1, 3), numberType: "Integer" });

  public readonly referenceAngleProperty = new NumberProperty(REFERENCE_ANGLE_DEFAULT_DEG, {
    range: REFERENCE_ANGLE_RANGE_DEG,
  });

  /** Coherence length (λ). The top of the range behaves as an ideal laser. */
  public readonly coherenceLengthProperty = new NumberProperty(COHERENCE_LENGTH_RANGE.max, {
    range: COHERENCE_LENGTH_RANGE,
  });

  public readonly halfFilmProperty = new BooleanProperty(false);
  public readonly blockZeroOrderProperty = new BooleanProperty(true);

  /** Allowed region for the objects. */
  public readonly objectBounds = { x: OBJECT_X_RANGE, depth: OBJECT_DEPTH_RANGE };

  public readonly setupProperty: TReadOnlyProperty<HologramSetup>;
  public readonly filmProperty: TReadOnlyProperty<FilmRecord>;

  /** Reconstruction grid: columns along x, rows along depth (row 0 nearest the film). */
  public readonly gridColumns: number;
  public readonly gridRows: number;

  /** |U|² of the reconstruction, row-major (rows = depth, columns = x). Valid up to {@link computedPoints}. */
  public readonly reconstruction: Float32Array;

  /** Incremented whenever more of the reconstruction is ready (or it restarts). */
  public readonly reconstructionVersionProperty = new NumberProperty(0);

  /** Fraction of the reconstruction computed so far, 0–1. */
  public readonly reconstructionProgressProperty = new NumberProperty(0);

  /** Measured FWHM of object 1's image (λ); null until the reconstruction is complete. */
  public readonly focusWidthProperty = new Property<number | null>(null);

  private computedPoints = 0;
  private source: { readonly re: Float64Array; readonly im: Float64Array } | null = null;
  private readonly setupMultilink: UnknownMultilink;

  public constructor() {
    this.objectPositionProperties = DEFAULT_OBJECTS.map((position) => new Vector2Property(position));

    this.setupProperty = DerivedProperty.deriveAny(
      [
        this.objectCountProperty,
        this.referenceAngleProperty,
        this.coherenceLengthProperty,
        ...this.objectPositionProperties,
      ],
      () => this.buildSetup(),
    );
    this.filmProperty = new DerivedProperty([this.setupProperty], (setup) => recordHologram(setup));

    this.gridColumns = Math.round(RECONSTRUCTION_X_RANGE.getLength() / RECONSTRUCTION_CELL);
    this.gridRows = Math.round(RECONSTRUCTION_DEPTH_RANGE.getLength() / RECONSTRUCTION_CELL);
    this.reconstruction = new Float32Array(this.gridColumns * this.gridRows);

    this.setupMultilink = Multilink.multilinkAny(
      [this.filmProperty, this.halfFilmProperty, this.blockZeroOrderProperty],
      () => this.restartReconstruction(),
    );
  }

  /** The objects in use, in model coordinates. */
  public get objects(): HologramObject[] {
    return this.objectPositionProperties
      .slice(0, this.objectCountProperty.value)
      .map((property) => ({ x: property.value.x, depth: property.value.y }));
  }

  private buildSetup(): HologramSetup {
    const coherence = this.coherenceLengthProperty.value;
    return {
      filmWidth: FILM_WIDTH,
      referenceAngle: (this.referenceAngleProperty.value * Math.PI) / 180,
      objects: this.objects,
      coherenceLength: coherence >= COHERENCE_LENGTH_RANGE.max ? Number.POSITIVE_INFINITY : coherence,
      pathMatchedDepth: PATH_MATCHED_DEPTH,
      objectAmplitude: OBJECT_AMPLITUDE,
      samplesPerWavelength: FILM_SAMPLES_PER_WAVELENGTH,
    };
  }

  /** x (λ) at the centre of grid column `column`. */
  public gridX(column: number): number {
    return RECONSTRUCTION_X_RANGE.min + (column + 0.5) * RECONSTRUCTION_CELL;
  }

  /** Depth (λ) at the centre of grid row `row`. */
  public gridDepth(row: number): number {
    return RECONSTRUCTION_DEPTH_RANGE.min + (row + 0.5) * RECONSTRUCTION_CELL;
  }

  /** The film as seen in reconstruction: exposure, less its mean if the zero order is blocked. */
  private reconstructionFilm(): FilmRecord {
    const film = this.filmProperty.value;
    if (!this.blockZeroOrderProperty.value) {
      return film;
    }
    let mean = 0;
    for (const value of film.exposure) {
      mean += value;
    }
    mean /= film.exposure.length;
    return { ...film, exposure: film.exposure.map((value) => value - mean) };
  }

  private restartReconstruction(): void {
    this.computedPoints = 0;
    this.source = null;
    this.reconstruction.fill(0);
    this.reconstructionProgressProperty.value = 0;
    this.focusWidthProperty.value = null;
    this.reconstructionVersionProperty.value++;
  }

  /** Computes up to `points` more grid points. Returns true when the map is complete. */
  private advanceReconstruction(points: number): boolean {
    const total = this.reconstruction.length;
    if (this.computedPoints >= total) {
      return true;
    }
    const film = this.reconstructionFilm();
    if (!this.source) {
      this.source = reconstructionSource(film, this.setupProperty.value, this.halfFilmProperty.value);
    }
    const end = Math.min(total, this.computedPoints + points);
    for (let index = this.computedPoints; index < end; index++) {
      const row = Math.floor(index / this.gridColumns);
      const column = index - row * this.gridColumns;
      this.reconstruction[index] = reconstructedIntensity(this.source, film, this.gridX(column), this.gridDepth(row));
    }
    this.computedPoints = end;
    this.reconstructionProgressProperty.value = end / total;
    if (end === total) {
      const first = this.objects[0];
      this.focusWidthProperty.value = first ? focusWidth(this.source, film, first) : null;
    }
    this.reconstructionVersionProperty.value++;
    return end === total;
  }

  /** Runs the reconstruction to completion now. */
  public completeReconstruction(): void {
    this.advanceReconstruction(Number.POSITIVE_INFINITY);
  }

  public reset(): void {
    this.modeProperty.reset();
    for (const property of this.objectPositionProperties) {
      property.reset();
    }
    this.objectCountProperty.reset();
    this.referenceAngleProperty.reset();
    this.coherenceLengthProperty.reset();
    this.halfFilmProperty.reset();
    this.blockZeroOrderProperty.reset();
  }

  /** Spreads the reconstruction over frames while in Reconstruct mode. */
  public step(_dt: number): void {
    if (this.modeProperty.value === "reconstruct") {
      this.advanceReconstruction(RECONSTRUCTION_POINTS_PER_FRAME);
    }
  }

  public dispose(): void {
    this.setupMultilink.dispose();
  }
}

DiffractionLabNamespace.register("HolographyModel", HolographyModel);
