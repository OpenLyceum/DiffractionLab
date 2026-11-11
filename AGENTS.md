# AGENTS.md — Diffraction Lab

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Fraunhofer diffraction for a modern physics course. Original work, forked from
`SceneryStackTemplate` on 10 Nov 2026. It accompanies Chapter 5, *Diffraction of Light*, of the
QuadriviumPress **Modern Physics** text (`QuadriviumPress/modernPhysics/chapters/ch-05-diffraction-of-light.md`):
§Diffraction Gratings (resolving power), §Circular Apertures and the Limits of Resolution, and
§Holography, with the phasor method of Chapter 4 underneath. OpticsLab is the fleet's ray-optics
sim and InterferometryLab its path-difference interferometers; neither does Fraunhofer patterns.
Four screens:

| Screen | Folder | Content |
|---|---|---|
| Gratings | `src/gratings/` | N slits (1–40), d, a, λ; I(sin θ) with envelope and missing-order marks; coloured screen strip; draggable cursor; phasor chain for the cursor's direction; φ sweep; N² peak scaling |
| Resolving Power | `src/resolving-power/` | Two close lines (Na, Hg, H/D α presets); ruling, illuminated N (log), order m; strip of every order; zoomed profiles + sum + first-zero marker; R = mN vs λ/Δλ verdict; "just resolve" |
| Circular Aperture | `src/circular-aperture/` | D (log), λ, angular separation (log); 2-D Airy image of two incoherent sources; cross-section; θ_R, separation/θ_R, dip %, verdict; eye / Hubble / ground-with-seeing presets; slit comparison |
| Holography | `src/holography/` | Side view in units of λ; Record (drag ≤ 3 point objects, reference angle, coherence length, film + close-up) and Reconstruct (back-propagated Huygens sum, cut-in-half, block zero order, measured vs estimated image width) |

Physics and its mapping to the book: [`doc/model.md`](doc/model.md). Architecture and decisions:
[`doc/implementation-notes.md`](doc/implementation-notes.md).

### Things to know first

- **Units differ by screen, on purpose.** Gratings: µm for d, a and λ (λ entered in nm). Resolving
  Power: nm, ruling in lines/mm. Circular Aperture: D in m, λ in nm, angles in arcsec. Holography:
  everything in wavelengths (λ = 1). See the header of `DiffractionLabConstants.ts`.
- **Physics lives in pure functions** under `src/common/model/` (`fraunhofer.ts`, `phasorChain.ts`,
  `airy.ts`, `hologram.ts`), tested against the book's worked examples. Views call the same
  functions; there is no second copy of an equation in a renderer.
- **Holography is two-dimensional and scaled.** Cylindrical waves, a 120 λ film, objects 70–290 λ
  away. It is labelled "not to scale" on screen. The reconstruction is spread over animation frames
  (`HolographyModel.step`); `completeReconstruction()` runs it at once for tests.
- **"Block zero order" (default on) subtracts the film's mean exposure** before reconstruction. Without
  it the undiffracted reference beam floods the map; with it the foci stand out. Both are physical
  (a spatial filter does the same in the lab).
- **The Airy image shows the brightest point in each pixel** (PSF evaluated half a pixel closer), so a
  diffraction-limited source never falls between samples. "Boost faint rings" (default on) uses a
  display exponent of 0.5.
- **Seeing is approximate:** a Gaussian of 1″ FWHM combined in quadrature with the Airy core's
  Gaussian equivalent. Fine for the book's "17 times worse" point; not a turbulence model.
- **Node >=26** is required. Run `source ~/.nvm/nvm.sh && nvm use 26` before npm or a git commit
  (the pre-commit hook runs npm).

## Key files

| File | Purpose |
|---|---|
| `src/common/model/fraunhofer.ts` | sinc, slit and array factors, N-slit intensity, orders, missing orders, dispersion, R = mN, lines to resolve |
| `src/common/model/phasorChain.ts` | The N tip-to-tail phasors and their resultant |
| `src/common/model/airy.ts` | Bessel J₁ (Numerical Recipes rational fit), Airy pattern, Rayleigh angle, PSF with seeing, two-source image, dip |
| `src/common/model/hologram.ts` | Film exposure with partial coherence, reconstruction source, back-propagated intensity, focus width |
| `src/common/view/IntensityImageNode.ts` | CPU `CanvasNode` that draws an intensity grid in a colour (strip, Airy image, film, reconstruction map) |
| `src/common/view/spectralColor.ts` | Wavelength → linear sRGB via CIE XYZ, copied from InterferometryLab |
| `src/common/view/ChartFrameNode.ts`, `chartUtils.ts` | Bamboo chart frame and formatting, copied from StellarWobble |
| `src/common/view/controls.ts` | Number controls (log option, integer rounding), checkboxes, text buttons, radio rows, readouts, equation node |
| `src/gratings/view/PhasorDiagramNode.ts` | The phasor diagram |
| `src/holography/model/HolographyModel.ts` | Setup → film (derived) → incremental reconstruction |
| `src/preferences/DiffractionLabPreferencesModel.ts` | `diffractionLabPreferences` singleton: Show equations (`?showEquations`, default on) |

## Accessibility

Standard fleet pattern:

- Per-screen a11y strings live under `a11y.<screenKey>` in each locale JSON, reached via
  `StringManager.get<Screen>A11yStrings()`. Visible strings are reached via
  `get<Screen>Strings()`, `getCommonStrings()` and `getUnits()`.
- Every screen has a live `*ScreenSummaryContent`, a wrapper `Node` with `pdomOrder` (Reset All
  last), and a `*KeyboardHelpContent` wired through the Screen.
- The Gratings cursor and the Holography objects are focusable and move with the arrow keys
  (`KeyboardDragListener`); their screens list the draggable-items keyboard-help section.
- Numbers in descriptions go through `toPlainText` (no rich-text markup).

## Compliance carve-outs

- **Hardcoded colors (computed colours of light).** `lightColor.ts`, `spectralColor.ts` and
  `IntensityImageNode.paintCanvas` build pixel and stroke colours from a wavelength (CIE XYZ →
  sRGB) scaled by intensity. These are physical colours of light, not theme colours, so they do not
  belong in `DiffractionLabColors.ts`. InterferometryLab and StellarWobble do the same.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

For screenshots, run the dev server with `npx vite --port <free port>`. Screen models are reachable
from the console as `phet.joist.sim.screens[i].model` (with `?screens=n`, at index 0).
