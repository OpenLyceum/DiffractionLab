/**
 * DiffractionLabConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation: layout, fonts, drawing, and the physical defaults and ranges of
 * each screen.
 *
 * Units
 * ─────
 *  - Gratings: d, a and λ in micrometres (λ entered in nm and divided by 1000).
 *  - Resolving Power: λ and Δλ in nanometres; ruling in lines per millimetre.
 *  - Circular Aperture: D in metres, λ in nanometres, angles in arcseconds.
 *  - Holography: every length in wavelengths (λ = 1); angles in degrees.
 *  - Layout values are screen pixels. Colours live in DiffractionLabColors.ts.
 */

import { Dimension2, Range, Vector2 } from "scenerystack/dot";
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
  PREFERENCES_TITLE: new PhetFont({ size: 18, weight: "bold" }),
  PREFERENCES_LABEL: new PhetFont(14),
  PREFERENCES_DESCRIPTION: new PhetFont(12),
} as const;

/** Panel margins (px). */
export const PANEL = {
  X_MARGIN: 12,
  Y_MARGIN: 10,
} as const;

/** Shared control dimensions and spacing (px); arrow-button scale is dimensionless. */
export const CONTROLS = {
  THUMB_SIZE: new Dimension2(12, 22),
  STANDALONE_TRACK_SIZE: new Dimension2(150, 3),
  NUMBER_CONTROL_TRACK_SIZE: new Dimension2(110, 3),
  CHECKBOX_BOX_WIDTH: 16,
  CHECKBOX_SPACING: 4,
  SLIDER_PADDING: 4,
  ARROW_BUTTON_SPACING: 3,
  VERTICAL_SPACING: 4,
  ARROW_BUTTON_SCALE: 0.75,
  TITLE_MAX_WIDTH: 140,
  DISPLAY_MAX_WIDTH: 100,
  CHECKBOX_LABEL_MAX_WIDTH: 190,
  EQUATION_MAX_WIDTH: 320,
  READOUT_MAX_WIDTH: 300,
  BUTTON_TEXT_MAX_WIDTH: 140,
  BUTTON_X_MARGIN: 8,
  BUTTON_Y_MARGIN: 4,
  RADIO_TEXT_MAX_WIDTH: 110,
  RADIO_SPACING: 6,
  RADIO_SELECTED_LINE_WIDTH: 3,
  RADIO_DESELECTED_OPACITY: 0.85,
  /** Default significant figures for number-control readouts. */
  DEFAULT_SIGNIFICANT_FIGURES: 3,
  /** Log-slider arrow step in decades when none is supplied. */
  LOG_DELTA_DEFAULT: 0.02,
  /** Linear-slider arrow step as a fraction of the range when none is supplied. */
  LINEAR_DELTA_FRACTION: 100,
} as const;

/** Chart frame dimensions (px) and default tick-division count. */
export const CHART_FRAME = {
  TARGET_DIVISIONS: 5,
  LINE_WIDTH: 1,
  TICK_EXTENT: 5,
  LABEL_EXTENT: 6,
  X_LABEL_GAP: 20,
  Y_LABEL_GAP: 32,
} as const;

/** Tick-spacing choices and rounding thresholds (dimensionless). */
export const CHART_TICKS = {
  DEFAULT_DIVISIONS: 5,
  UNIT_THRESHOLD: 1.5,
  TWO_THRESHOLD: 3,
  FIVE_THRESHOLD: 7,
  MAX_DECIMAL_PLACES: 4,
  /** Magnitudes below this use scientific notation in formatSignificant. */
  SCIENTIFIC_THRESHOLD: 1e-4,
} as const;

/** Preferences spacing and description width (px). */
export const PREFERENCES_LAYOUT = {
  CONTROL_SPACING: 8,
  DESCRIPTION_WIDTH: 420,
  SECTION_SPACING: 12,
} as const;

/** Home-screen icon drawing frame (px). */
export const SCREEN_ICONS = {
  WIDTH: 548,
  HEIGHT: 373,
} as const;

/** Shared icon plotting box and stroke widths (px); sample counts are dimensionless. */
export const ICON_CHART = {
  LEFT: 40,
  BOTTOM_INSET: 50,
  HEIGHT_INSET: 100,
  BASELINE_INSET: 30,
  BASELINE_WIDTH: 3,
  DEFAULT_SAMPLES: 600,
  ENVELOPE_LINE_WIDTH: 4,
  ENVELOPE_DASH: [12, 8] as const,
  PATTERN_SAMPLES: 1200,
  PATTERN_LINE_WIDTH: 5,
  SUM_LINE_WIDTH: 6,
} as const;

/** Circular-aperture icon geometry (px) and Airy display factors (dimensionless). */
export const CIRCULAR_APERTURE_ICON = {
  SOURCE_OFFSET_X: 85,
  MAX_RADIUS: 150,
  RADIUS_STEP: 3,
  RAYLEIGH_UNITS_AT_EDGE: 13,
  WAVELENGTH_NM: 530,
  LINE_WIDTH: 3,
  MIN_OPACITY: 0.02,
} as const;

/** Holography icon geometry (px). */
export const HOLOGRAPHY_ICON = {
  FILM_INSET_RIGHT: 110,
  OBJECT_X: 120,
  OBJECT_Y_OFFSET: 30,
  WAVEFRONT_START: 40,
  WAVEFRONT_STEP: 40,
  FRINGE_TOP: 40,
  FRINGE_STEP: 9,
  FRINGE_WIDTH: 26,
  FRINGE_HEIGHT: 4,
  ARROW_Y_OFFSETS: [80, 150] as const,
  ARROW_TAIL_X: 170,
  ARROW_TAIL_Y: 70,
  ARROW_TIP_INSET: 6,
  OBJECT_RADIUS: 16,
  WAVEFRONT_LINE_WIDTH: 4,
  WAVEFRONT_OPACITY: 0.7,
  ARROW_LINE_WIDTH: 6,
} as const;

// ── Light ─────────────────────────────────────────────────────────────────────

/** Visible wavelength range offered by every wavelength control (nm). */
export const WAVELENGTH_RANGE_NM = new Range(380, 750);

/** Arcseconds per radian. */
export const ARCSEC_PER_RADIAN = (180 / Math.PI) * 3600;

/** Arcminutes per radian. */
export const ARCMIN_PER_RADIAN = (180 / Math.PI) * 60;

/** Degrees per radian. */
export const DEGREES_PER_RADIAN = 180 / Math.PI;

// ── Shared physics tolerances ─────────────────────────────────────────────────

/** Tolerance used to decide that a ratio is an integer (missing orders, grazing orders). */
export const INTEGER_TOLERANCE = 1e-9;

/** |x| below which sinc / Airy Taylor expansions are used. */
export const NEAR_ZERO_SINC = 1e-6;
export const NEAR_ZERO_AIRY = 1e-4;

/** Wave number in holography units where λ = 1 (rad / λ). */
export const HOLOGRAM_WAVE_NUMBER = 2 * Math.PI;

/** Aperture diameter (m) below which the readout switches to millimetres. */
export const DIAMETER_MILLIMETRE_THRESHOLD_M = 0.1;

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

/** Default cursor as a fraction of the way to the first order. */
export const GRATINGS_CURSOR_ORDER_FRACTION = 0.15;

/** Cap on missing-order marks drawn (orders beyond this are off-chart). */
export const GRATINGS_MISSING_ORDER_CAP = 60;

/** Gratings screen layout and drawing (px); y-scale and dash are dimensionless. */
export const GRATINGS_LAYOUT = {
  CHART_LEFT: 70,
  CHART_TOP: 24,
  CHART_WIDTH: 580,
  CHART_HEIGHT: 290,
  STRIP_HEIGHT: 34,
  STRIP_COLUMNS: 800,
  STRIP_GAP: 46,
  PHASOR_SIZE: 250,
  Y_MAX_FACTOR: 1.1,
  INTENSITY_LINE_WIDTH: 1.5,
  ENVELOPE_LINE_WIDTH: 1.2,
  ENVELOPE_DASH: [5, 4] as const,
  MISSING_MARK_LINE_WIDTH: 2,
  MISSING_MARK_HALF: 4,
  MISSING_MARK_RISE: 8,
  STRIP_LABEL_GAP: 6,
  STRIP_LABEL_MAX_INSET: 10,
  CURSOR_LINE_WIDTH: 1.5,
  CURSOR_HANDLE: { HALF_WIDTH: 8, TOP: -14, TIP: -2 } as const,
  CURSOR_HIT: { HALF_WIDTH: 10, TOP: -16, EXTRA_HEIGHT: 16 } as const,
  DRAG_SPEED: 120,
  SHIFT_DRAG_SPEED: 20,
  SWEEP_BUTTON_RADIUS: 16,
  RIGHT_COLUMN_GAP: 40,
  RIGHT_COLUMN_TOP_INSET: 6,
  RIGHT_COLUMN_SPACING: 8,
  CONTROLS_COLUMN_SPACING: 22,
  CONTROLS_ROW_SPACING: 10,
  READOUT_MAX_WIDTH: 200,
  EQUATION_MAX_WIDTH: 300,
  EQUATION_GAP: 12,
} as const;

/** Phasor diagram proportions and arrow sizes (px); scale factors are dimensionless. */
export const PHASOR_DIAGRAM = {
  CHAIN_SCALE: 0.86,
  REFERENCE_DASH: [4, 4] as const,
  SHAFT_LINE_WIDTH: 1.5,
  RESULTANT_HEAD_HEIGHT: 12,
  RESULTANT_HEAD_WIDTH: 12,
  RESULTANT_TAIL_WIDTH: 3,
  TITLE_SPACING: 4,
  MIN_SEGMENT_LENGTH: 0.5,
  HEAD_LENGTH_CAP: 8,
  HEAD_LENGTH_FRACTION: 0.4,
  HEAD_HALF_WIDTH_FRACTION: 0.45,
  MIN_RESULTANT_LENGTH: 2,
} as const;

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

/**
 * Named spectral-line presets (nm): Sodium D2/D1, mercury yellow, H/D α.
 * Used by ResolvingPowerModel.LINE_PAIRS.
 */
export const LINE_PAIR_PRESETS = {
  SODIUM_WAVELENGTH_NM: 589.0,
  SODIUM_SEPARATION_NM: 0.6,
  MERCURY_WAVELENGTH_NM: 577.0,
  MERCURY_SEPARATION_NM: 2.1,
  HYDROGEN_WAVELENGTH_NM: 656.1,
  HYDROGEN_SEPARATION_NM: 0.18,
} as const;

/** Nanometres per millimetre (ruling → spacing conversion). */
export const NM_PER_MM = 1e6;

/** Resolving Power screen layout and drawing (px); window factors are dimensionless. */
export const RESOLVING_LAYOUT = {
  STRIP_LEFT: 70,
  STRIP_TOP: 34,
  STRIP_WIDTH: 560,
  STRIP_HEIGHT: 44,
  STRIP_TITLE_GAP: 4,
  CHART_LEFT: 70,
  CHART_TOP: 140,
  CHART_WIDTH: 560,
  CHART_HEIGHT: 285,
  Y_MAX: 2.1,
  /** Zoomed chart spans this many line separations, or this many line widths. */
  WINDOW_SEPARATIONS: 3,
  WINDOW_LINE_WIDTHS: 4,
  LINE_WIDTH: 1.5,
  SUM_LINE_WIDTH: 2,
  RAYLEIGH_DASH: [5, 4] as const,
  RAYLEIGH_LABEL_MAX_WIDTH: 140,
  RAYLEIGH_LABEL_GAP: 4,
  LEGEND_SPACING: 14,
  LEGEND_INSET: 8,
  LEGEND_SWATCH_LENGTH: 18,
  LEGEND_ENTRY_SPACING: 4,
  LEGEND_LABEL_MAX_WIDTH: 80,
  READOUTS_SPACING: 30,
  READOUTS_COLUMN_SPACING: 6,
  READOUTS_GAP: 52,
  EQUATION_MAX_WIDTH: 200,
  PRESET_BUTTON_WIDTH: 90,
  PRESETS_TITLE_MAX_WIDTH: 260,
  WAVELENGTH_DELTA: 0.1,
  RULING_DELTA: 10,
  LINES_LOG_DELTA: 0.01,
  ORDER_ROW_SPACING: 10,
  ORDER_LABEL_MAX_WIDTH: 80,
  JUST_RESOLVE_BUTTON_WIDTH: 230,
  CONTROLS_SPACING: 10,
  PRESET_ROW_SPACING: 6,
  STRIP_LINE_INSET: 2,
  STRIP_LINE_WIDTH: 2,
  ORDER_LABEL_GAP: 2,
  WINDOW_MIN_WIDTH: 6,
  WINDOW_OUTSET: 2,
  WINDOW_LINE_WIDTH: 1.5,
} as const;

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

/** Dip fraction above which seeing-limited sources read as resolved. */
export const SEEING_DIP_RESOLVED = 0.05;

/**
 * Best-fit Gaussian σ to the Airy core, as a fraction of λ/D (see airy.ts).
 * Combined with RAYLEIGH_FACTOR there as σ / θ_R.
 */
export const AIRY_GAUSSIAN_SIGMA_OVER_LAMBDA_OVER_D = 0.42;

/** FWHM / σ for a Gaussian. */
export const GAUSSIAN_FWHM_PER_SIGMA = 2 * Math.sqrt(2 * Math.LN2);

/** Book presets for the Circular Aperture screen. */
export const APERTURE_PRESET_VALUES = {
  EYE_DIAMETER_M: 4e-3,
  EYE_SEPARATION_ARCSEC: 60,
  HUBBLE_DIAMETER_M: 2.4,
  HUBBLE_SEPARATION_ARCSEC: 0.1,
  WAVELENGTH_NM: 550,
} as const;

/** Circular Aperture screen layout and drawing (px); field factors are dimensionless. */
export const APERTURE_LAYOUT = {
  IMAGE_LEFT: 40,
  IMAGE_TOP: 40,
  IMAGE_SIZE: 250,
  IMAGE_TITLE_GAP: 6,
  FIELD_TEXT_GAP: 4,
  CHART_LEFT: 70,
  CHART_TOP: 350,
  CHART_WIDTH: 610,
  CHART_HEIGHT: 175,
  Y_MAX_FACTOR: 1.1,
  /** Display exponent for "Boost faint rings". */
  BOOST_EXPONENT: 0.5,
  /** Extra chart samples packed around each source. */
  PEAK_SAMPLES: 60,
  /** Peak sampling half-width in θ_R units. */
  PEAK_HALF_WIDTH: 2,
  /** Field of view: at least this many θ_R, or half-separation + this many θ_R. */
  FIELD_RAYLEIGH_FACTOR: 2.5,
  FIELD_MARGIN_RAYLEIGH: 2,
  FIELD_SEEING_MARGIN: 2.5,
  PROFILE_LINE_WIDTH: 1.2,
  PROFILE_DASH: [5, 4] as const,
  SLIT_LINE_WIDTH: 1.5,
  SUM_LINE_WIDTH: 2,
  SLIT_LEGEND_MAX_WIDTH: 220,
  SLIT_LEGEND_INSET: 6,
  READOUTS_GAP: 36,
  READOUTS_TOP_INSET: 20,
  READOUTS_SPACING: 10,
  EQUATION_MAX_WIDTH: 300,
  PRESET_BUTTON_WIDTH: 110,
  PRESETS_TITLE_MAX_WIDTH: 240,
  CONTROLS_SPACING: 10,
  PRESET_ROW_SPACING: 6,
  SOURCE_TICK_HEIGHT: 8,
  SOURCE_TICK_LINE_WIDTH: 2,
} as const;

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

/** Default object positions (x along the film, depth in front of it), λ. */
export const HOLOGRAPHY_DEFAULT_OBJECTS = [new Vector2(-25, 160), new Vector2(30, 250), new Vector2(5, 110)] as const;

/** Default number of objects on the Holography screen. */
export const HOLOGRAPHY_OBJECT_COUNT_DEFAULT = 2;
export const HOLOGRAPHY_OBJECT_COUNT_RANGE = new Range(1, 3);

/** Holography screen layout and drawing (px); SCALE is view px per λ. */
export const HOLOGRAPHY_LAYOUT = {
  SCALE: 2,
  FILM_X: 620,
  CENTER_Y: 250,
  FILM_THICKNESS: 10,
  /** Display wavelength of the laser (nm): helium–neon, for colour only. */
  LASER_NM: 633,
  /** Spacing of drawn object wavefronts (λ). */
  WAVEFRONT_SPACING: 16,
  /** Display exponent of the reconstruction map. */
  MAP_EXPONENT: 0.6,
  CLOSE_UP_WIDTH: 270,
  CLOSE_UP_HEIGHT: 30,
  /** Close-up sample density (samples per λ). */
  CLOSE_UP_SAMPLES_PER_WAVELENGTH: 12,
  CUT_AWAY_DASH: [3, 3] as const,
  FILM_LABEL_MAX_WIDTH: 70,
  FILM_LABEL_GAP: 6,
  VIEWER_OFFSET_X: 45,
  VIEWER_SPACING: 4,
  VIEWER_LABEL_MAX_WIDTH: 60,
  EYE_HALF_WIDTH: 14,
  EYE_HALF_HEIGHT: 11,
  EYE_PUPIL_RADIUS: 4,
  EYE_PUPIL_OFFSET_X: -5,
  EYE_LINE_WIDTH: 1.5,
  REFERENCE_LENGTH: 90,
  REFERENCE_FRACTIONS: [-0.35, 0, 0.35] as const,
  REFERENCE_TIP_INSET: 2,
  REFERENCE_HEAD_HEIGHT: 10,
  REFERENCE_HEAD_WIDTH: 10,
  REFERENCE_TAIL_WIDTH: 2.5,
  REFERENCE_LABEL_GAP: 8,
  REFERENCE_LABEL_MAX_WIDTH: 140,
  WAVEFRONT_LINE_WIDTH: 1,
  WAVEFRONT_OPACITY: 0.45,
  WAVEFRONT_CLIP_HALF_HEIGHT: 220,
  /** Half-angle of drawn wavefront arcs toward the film (rad). */
  WAVEFRONT_HALF_ANGLE: Math.PI / 3,
  OBJECT_DOT_RADIUS: 6,
  OBJECT_GHOST_RADIUS: 8,
  OBJECT_GHOST_DASH: [3, 3] as const,
  OBJECT_GHOST_LINE_WIDTH: 1.5,
  OBJECT_HIT_RADIUS: 14,
  OBJECT_LABEL_MAX_WIDTH: 80,
  OBJECT_LABEL_GAP: -10,
  DRAG_SPEED: 150,
  SHIFT_DRAG_SPEED: 40,
  COUNT_ROW_SPACING: 10,
  COUNT_LABEL_MAX_WIDTH: 100,
  CONTROLS_SPACING: 9,
  CONTROLS_TOP: 12,
  CLOSE_UP_READOUT_MAX_WIDTH: 270,
  NOT_TO_SCALE_MAX_WIDTH: 560,
  NOT_TO_SCALE_LEFT: 40,
  EQUATION_MAX_WIDTH: 200,
  EQUATION_GAP: 8,
  MAP_PROGRESS_INSET: 6,
  MAP_LABEL_INSET: 4,
  VIRTUAL_IMAGE_MAX_WIDTH: 200,
} as const;

/** Settings for common/model/airy.ts. */
export const AIRY_SETTINGS = {
  /** Samples used to locate the two-source intensity dip (count). */
  DIP_SAMPLES: 400,
  /** First zero of J₁.  @internal Exported for unit tests; not part of the application API. */
  J1_FIRST_ZERO: 3.831705970207512,
  /** Second zero of J₁ (second dark ring).  @internal Exported for unit tests; not part of the application API. */
  J1_SECOND_ZERO: 7.015586669815619,
} as const;

/** Settings for common/model/hologram.ts. */
export const HOLOGRAM_SETTINGS = {
  /** Default window (wavelengths). */
  DEFAULT_WINDOW: 30,
  /** Default step (wavelengths). */
  DEFAULT_STEP: 0.25,
} as const;

/** Settings for common/view/spectralColor.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SPECTRAL_COLOR_SETTINGS = {
  /** Resolution of the linear-to-sRGB encoding table. */
  GAMMA_TABLE_SIZE: 1024,
} as const;

/** Settings for holography/view/HolographyScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const HOLOGRAPHY_SCREEN_VIEW_SETTINGS = {
  COHERENCE_CONTROL_DIGITS: 2, // digits
  FRINGE_READOUT_DIGITS: 3, // digits
  FOCUS_READOUT_DIGITS: 2, // digits
  EXPECTED_READOUT_DIGITS: 2, // digits

  /** Coherence control significant figures (dimensionless). */
  COHERENCE_CONTROL_SIGNIFICANT_FIGURES: 2,
} as const;

/** Settings for resolving-power/view/ResolvingPowerScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const RESOLVING_POWER_SCREEN_VIEW_SETTINGS = {
  ANGLE_READOUT_PROPERTY_DIGITS: 4, // digits
  DISPERSION_READOUT_PROPERTY_DIGITS: 3, // digits

  /** Wavelength control significant figures (dimensionless). */
  WAVELENGTH_CONTROL_SIGNIFICANT_FIGURES: 4,
  /** Separation control significant figures (dimensionless). */
  SEPARATION_CONTROL_SIGNIFICANT_FIGURES: 2,
  /** Lines control significant figures (dimensionless). */
  LINES_CONTROL_SIGNIFICANT_FIGURES: 4,
} as const;

/** Numerical thresholds for the corresponding model. */
export const FRAUNHOFER_NUMERICS = {
  /** Tolerance for rounding diffraction orders (dimensionless). */
  ORDER_EPSILON: 1e-9,
  /** Envelope zero coincidence tolerance in order units. */
  MISSING_ORDER_EPSILON: 1e-6,
  /** Near-zero array-factor denominator threshold (dimensionless). */
  DENOMINATOR_EPSILON: 1e-9,
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const GRATINGS_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  CURRENT_DETAILS_PROPERTY_DIGITS: 3, // digits

  SPACING_DIGITS: 3, // digits
  WIDTH_DIGITS: 3, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const RESOLVING_POWER_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  CURRENT_DETAILS_PROPERTY_DIGITS: 4, // digits
  CURRENT_DETAILS_PROPERTY_DIGITS_SEGMENT_2: 5, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const HOLOGRAPHY_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  CURRENT_DETAILS_PROPERTY_DIGITS: 2, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const GRATINGS_SCREEN_VIEW_SETTINGS = {
  PHI_READOUT_PROPERTY_DIGITS: 3, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const CIRCULAR_APERTURE_SCREEN_VIEW_SETTINGS = {
  FIELD_TEXT_DIGITS: 3, // digits
  VALUE_FORMAT_SIGNIFICANT_DIGITS: 3, // digits
  DIP_READOUT_PROPERTY_DIGITS: 2, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const CIRCULAR_APERTURE_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  VALUE_FORMAT_SIGNIFICANT_DIGITS: 3, // digits
} as const;

DiffractionLabNamespace.register("DiffractionLabConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  FONTS,
  PANEL,
  CONTROLS,
  CHART_FRAME,
  CHART_TICKS,
  PREFERENCES_LAYOUT,
  SCREEN_ICONS,
  ICON_CHART,
  CIRCULAR_APERTURE_ICON,
  HOLOGRAPHY_ICON,
  WAVELENGTH_RANGE_NM,
  ARCSEC_PER_RADIAN,
  SLIT_COUNT_RANGE,
  SLIT_SPACING_RANGE_UM,
  SLIT_WIDTH_RANGE_UM,
  PHASE_SWEEP_PERIOD,
  GRATINGS_LAYOUT,
  PHASOR_DIAGRAM,
  ILLUMINATED_LINES_RANGE,
  LINE_PAIR_PRESETS,
  RESOLVING_LAYOUT,
  APERTURE_DIAMETER_RANGE_M,
  SOURCE_SEPARATION_RANGE_ARCSEC,
  SEEING_FWHM_ARCSEC,
  APERTURE_LAYOUT,
  FILM_WIDTH,
  PATH_MATCHED_DEPTH,
  COHERENCE_LENGTH_RANGE,
  HOLOGRAPHY_DEFAULT_OBJECTS,
  HOLOGRAPHY_LAYOUT,
});
