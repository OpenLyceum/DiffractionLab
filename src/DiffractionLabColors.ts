/**
 * DiffractionLabColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import DiffractionLabColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import DiffractionLabColors from "../../DiffractionLabColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: DiffractionLabColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the DiffractionLabColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import DiffractionLabNamespace from "./DiffractionLabNamespace.js";

const DiffractionLabColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),
  // ── Charts ───────────────────────────────────────────────────────────────────

  chartBackgroundColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "chartBackground", {
    default: "#0d1426",
    projector: "#ffffff",
  }),

  chartAxisColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "chartAxis", {
    default: "#8a93a8",
    projector: "#444444",
  }),

  chartGridColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "chartGrid", {
    default: "#24304d",
    projector: "#dddddd",
  }),

  /** The main curve: total intensity. */
  intensityCurveColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "intensityCurve", {
    default: "#f5f5f5",
    projector: "#111111",
  }),

  /** Single-slit envelope and other reference curves. */
  envelopeCurveColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "envelopeCurve", {
    default: "#ffb74d",
    projector: "#d35400",
  }),

  /** First spectral line (λ) / first source. */
  firstLineColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "firstLine", {
    default: "#4fc3f7",
    projector: "#0d47a1",
  }),

  /** Second spectral line (λ + Δλ) / second source. */
  secondLineColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "secondLine", {
    default: "#f06292",
    projector: "#ad1457",
  }),

  /** Markers: missing orders, Rayleigh zero, cursor. */
  markerColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "marker", {
    default: "#ef5350",
    projector: "#c62828",
  }),

  cursorColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "cursor", {
    default: "#ffee58",
    projector: "#6a1b9a",
  }),

  // ── Phasors ──────────────────────────────────────────────────────────────────

  phasorColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "phasor", {
    default: "#81d4fa",
    projector: "#1565c0",
  }),

  resultantColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "resultant", {
    default: "#ffee58",
    projector: "#e65100",
  }),

  // ── Holography ───────────────────────────────────────────────────────────────

  /** Exposed (white-light) marks: film fringes, the zero order of a spectrum. */
  exposedColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "exposed", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** The film and the dark parts of every image. */
  filmColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "film", {
    default: "#000000",
    projector: "#000000",
  }),

  filmBorderColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "filmBorder", {
    default: "#b0bec5",
    projector: "#37474f",
  }),

  /** Point objects and their wavefronts. */
  objectColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "object", {
    default: "#ff8a65",
    projector: "#d84315",
  }),

  /** Reference-beam arrows. */
  referenceBeamColorProperty: new ProfileColorProperty(DiffractionLabNamespace, "referenceBeam", {
    default: "#ef5350",
    projector: "#c62828",
  }),
};

export default DiffractionLabColors;
