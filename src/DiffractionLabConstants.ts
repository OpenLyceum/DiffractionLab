/**
 * DiffractionLabConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation: layout, fonts, and the physical defaults and ranges of each
 * screen.
 *
 * Units
 * ─────
 *  - Gratings: d, a and λ in micrometres (λ entered in nm and divided by 1000).
 *  - Resolving Power: λ and Δλ in nanometres; ruling in lines per millimetre.
 *  - Circular Aperture: D in metres, λ in nanometres, angles in arcseconds.
 *  - Holography: every length in wavelengths (λ = 1); angles in degrees.
 *  - Layout values are screen pixels. Colours live in DiffractionLabColors.ts.
 */

import { Range } from "scenerystack/dot";
import { PhetFont } from "scenerystack/scenery-phet";
import DiffractionLabNamespace from "./DiffractionLabNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Fonts shared by every screen. */
export const FONTS = {
  TITLE: new PhetFont({ size: 14, weight: "bold" }),
  LABEL: new PhetFont(13),
  SMALL: new PhetFont(11),
  READOUT: new PhetFont(13),
  AXIS_LABEL: new PhetFont(13),
  TICK_LABEL: new PhetFont(11),
} as const;

// ── Light ─────────────────────────────────────────────────────────────────────

/** Visible wavelength range offered by every wavelength control (nm). */
export const WAVELENGTH_RANGE_NM = new Range(380, 750);

/** Arcseconds per radian. */
export const ARCSEC_PER_RADIAN = (180 / Math.PI) * 3600;

// ── Gratings screen ───────────────────────────────────────────────────────────

/** Number of slits N. Kept small enough that every phasor stays visible. */
export const SLIT_COUNT_RANGE = new Range(1, 40);
export const SLIT_COUNT_DEFAULT = 4;

/** Slit spacing d (µm). */
export const SLIT_SPACING_RANGE_UM = new Range(1, 100);
export const SLIT_SPACING_DEFAULT_UM = 10;

/** Slit width a (µm); always clamped to at most d. */
export const SLIT_WIDTH_RANGE_UM = new Range(0.2, 100);
export const SLIT_WIDTH_DEFAULT_UM = 2;

/** Default wavelength of the Gratings screen (nm): a helium–neon laser. */
export const GRATINGS_WAVELENGTH_DEFAULT_NM = 633;

/** The intensity chart spans this many single-slit zeros on each side (λ/a units), up to |sin θ| = 1. */
export const GRATINGS_AXIS_ENVELOPE_ZEROS = 2.5;

/** Seconds for the sweep to advance φ by 2π (one order). */
export const PHASE_SWEEP_PERIOD = 8;

/** Samples across the Gratings chart and screen strip. */
export const GRATINGS_CHART_SAMPLES = 1600;

// ── Resolving Power screen ────────────────────────────────────────────────────

/** Shorter wavelength λ of the pair (nm). */
export const LINE_WAVELENGTH_RANGE_NM = new Range(400, 700);

/** Separation Δλ of the pair (nm), on a logarithmic slider. */
export const LINE_SEPARATION_RANGE_NM = new Range(0.01, 5);

/** Grating ruling (lines per mm). */
export const RULING_RANGE_PER_MM = new Range(100, 1800);
export const RULING_DEFAULT_PER_MM = 600;

/** Number of illuminated lines N, on a logarithmic slider. */
export const ILLUMINATED_LINES_RANGE = new Range(10, 10000);
export const ILLUMINATED_LINES_DEFAULT = 300;

/** Highest order offered by the order buttons. */
export const MAX_ORDER_BUTTON = 4;

/** R/(λ/Δλ) within this fraction of 1 reads as "just resolved". */
export const JUST_RESOLVED_TOLERANCE = 0.05;

/** Samples across the zoomed line-profile chart. */
export const RESOLVING_CHART_SAMPLES = 600;

// ── Circular Aperture screen ──────────────────────────────────────────────────

/** Aperture diameter D (m), on a logarithmic slider: a pinhole to a 10 m mirror. */
export const APERTURE_DIAMETER_RANGE_M = new Range(1e-4, 10);
export const APERTURE_DIAMETER_DEFAULT_M = 4e-3;

/** Default wavelength (nm): the middle of the visible band, as in the book's examples. */
export const APERTURE_WAVELENGTH_DEFAULT_NM = 550;

/** Angular separation of the two sources (arcsec), on a logarithmic slider. */
export const SOURCE_SEPARATION_RANGE_ARCSEC = new Range(0.001, 3000);
export const SOURCE_SEPARATION_DEFAULT_ARCSEC = 60;

/** FWHM of typical atmospheric seeing (arcsec), the book's l.441 example. */
export const SEEING_FWHM_ARCSEC = 1;

/** Pixels per side of the computed Airy image. */
export const AIRY_IMAGE_SAMPLES = 161;

/** Samples across the cross-section chart. */
export const AIRY_CHART_SAMPLES = 500;

/** A separation within this fraction of θ_R reads as "at the Rayleigh limit". */
export const RAYLEIGH_TOLERANCE = 0.05;

// ── Holography screen (lengths in wavelengths) ────────────────────────────────

/** Width of the film (λ). */
export const FILM_WIDTH = 120;

/** Film samples per wavelength (enough for the finest fringes, ~1.3 per λ). */
export const FILM_SAMPLES_PER_WAVELENGTH = 4;

/** Object-wave amplitude relative to the reference beam. */
export const OBJECT_AMPLITUDE = 0.3;

/** Depth at which the object and reference paths are equal (λ). */
export const PATH_MATCHED_DEPTH = 160;

/** Where objects may be dragged: along the film (x) and in front of it (depth), λ. */
export const OBJECT_X_RANGE = new Range(-80, 80);
export const OBJECT_DEPTH_RANGE = new Range(70, 290);

/** Reference-beam angle (degrees). */
export const REFERENCE_ANGLE_RANGE_DEG = new Range(10, 40);
export const REFERENCE_ANGLE_DEFAULT_DEG = 25;

/** Coherence length (λ), on a logarithmic slider; the maximum acts as a laser. */
export const COHERENCE_LENGTH_RANGE = new Range(10, 10000);

/** Reconstruction grid: the region in front of the film it covers (λ) and its cell size. */
export const RECONSTRUCTION_X_RANGE = new Range(-100, 100);
export const RECONSTRUCTION_DEPTH_RANGE = new Range(20, 300);
export const RECONSTRUCTION_CELL = 1.5;

/** Reconstruction-grid points computed per animation frame, so the UI stays responsive. */
export const RECONSTRUCTION_POINTS_PER_FRAME = 1600;

/** Width of the film close-up (λ). */
export const FILM_CLOSE_UP_WIDTH = 24;

DiffractionLabNamespace.register("DiffractionLabConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  FONTS,
  WAVELENGTH_RANGE_NM,
  ARCSEC_PER_RADIAN,
  SLIT_COUNT_RANGE,
  SLIT_SPACING_RANGE_UM,
  SLIT_WIDTH_RANGE_UM,
  PHASE_SWEEP_PERIOD,
  ILLUMINATED_LINES_RANGE,
  APERTURE_DIAMETER_RANGE_M,
  SOURCE_SEPARATION_RANGE_ARCSEC,
  SEEING_FWHM_ARCSEC,
  FILM_WIDTH,
  PATH_MATCHED_DEPTH,
  COHERENCE_LENGTH_RANGE,
});
