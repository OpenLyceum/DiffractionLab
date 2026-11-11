# Implementation Notes - Diffraction Lab

Architecture and decisions, for developers. The physics is in [model.md](./model.md).

## Layout

```
src/
  common/
    model/        fraunhofer.ts, phasorChain.ts, airy.ts, hologram.ts  (pure functions, no axon)
    view/         ChartFrameNode, chartUtils, controls, IntensityImageNode, lightColor, spectralColor
    DiffractionLabScreenIcons.ts, DiffractionLabPanel.ts, *Options.ts, TimeModel.ts
  gratings/            GratingsModel (+ TimeModel for the sweep), GratingsScreenView, PhasorDiagramNode
  resolving-power/     ResolvingPowerModel (LINE_PAIRS presets), ResolvingPowerScreenView
  circular-aperture/   CircularApertureModel (APERTURE_PRESETS), CircularApertureScreenView, formatDiameter
  holography/          HolographyModel (incremental reconstruction), HolographyScreenView
  preferences/         Show equations (default on, ?showEquations=false)
```

Each screen model holds Properties and derived quantities only; every equation is a pure function
in `common/model/`, which the views and the screen summaries also call. The tests exercise those
functions directly against the book's worked examples (`tests/fraunhofer.test.ts`,
`tests/airy.test.ts`, `tests/hologram.test.ts`) and the models through their Properties
(`tests/models.test.ts`).

## Decisions

### One CPU image node for every intensity picture

`IntensityImageNode` is a `CanvasNode` that takes a `Float32Array` of linear intensities, a colour
and a gain (plus an optional display exponent). It writes an `ImageData` at sample resolution, puts it
on an offscreen canvas and draws that scaled up with `drawImage`. It is the same pattern as
InterferometryLab's `FringePatternNode`, generalized: the Gratings screen strip (800 × 1), the Airy
image (161²), the film (1 × 480), the film close-up and the reconstruction map (187 × 133) all use it.
Colours come from `spectralColor.ts` (copied from InterferometryLab: CIE colour-matching fits, so the
colour of a wavelength is physical) via `lightColor.ts`, which normalizes each colour to its brightest
channel. Pixel colours are therefore computed, not themed (see AGENTS.md carve-outs).

### Charts

`ChartFrameNode` and `chartUtils.ts` are copied from StellarWobble (originally RelativisticDynamics):
a bamboo frame whose ranges can change after construction. Curves are `LinePlot`s rebuilt in a
`Multilink` over the inputs. The Gratings chart samples 1600 points (enough for 40 slits across
±2.5 envelope zeros). The Resolving Power chart samples 600 points over a window of max(3
separations, 4 line widths), so the two peaks are always visible at any N. The Circular Aperture
chart adds 60 extra samples around each source, so a sharp Airy peak inside a wide field is never
missed.

### The Airy image never loses a source

When the sources are many Rayleigh angles apart, each Airy disk can be smaller than a pixel. Each
pixel shows the PSF evaluated half a pixel diagonal closer to the source, i.e. the brightest point
inside the pixel, so a source always lights at least one pixel. Once the disk spans several pixels
the shift is negligible.

### Holography reconstruction is spread over frames

The reconstruction is a Huygens sum over 480 film samples for each of 24 871 map points, about
12 M complex terms, or ~0.4 s. `HolographyModel.step` computes 1600 points per frame while in
Reconstruct mode and bumps `reconstructionVersionProperty`; the view re-transposes and repaints the
map (normalizing to the brightest point so far), and a progress readout shows until it is done. Any
change of setup (objects, angle, coherence, cut, zero order) restarts it. Recording is cheap and is a
`DerivedProperty` of the setup. While reconstructing, the objects and recording controls are
disabled: moving an object after the film is made would describe a hologram that does not exist.

The model maps (x along the film, depth) to the view by a reflection that swaps axes. `ModelViewTransform2`
asserts that its matrix is axis-aligned, so the view uses a plain `Transform3`, which `DragListener`
and `KeyboardDragListener` accept as `transform`.

### Slit width never exceeds the spacing

The width control's slider has an `enabledRangeProperty` that follows d (in log₁₀ units, because the
slider drives a log proxy). The model clamps a only when d shrinks, inside d's listener. An earlier
version also clamped a inside its own listener; the keyboard fuzz caught that as an axon reentry.

### Logarithmic sliders

`createNumberControl({ logarithmic: true })` drives a log₁₀ proxy Property kept in step both ways,
rounding to the readout's significant figures, and to integers with `integer: true` (illuminated
lines N is an integer Property). Adapted from StellarWobble.

### Radio buttons with a derived enabled state

A `RectangularRadioButton` must own its `enabledProperty`, so `createRadioButtons` links a derived
Property to `getButtonForValue(value).enabled` instead (orders that do not exist; object count while
reconstructing).

## Testing

- `npm test`: physics against the book (missing orders and the nine fringes for d = 5a; the 5000
  lines/cm angles, m_max and grazing order; 982 lines for sodium; J₁ zeros and table values; the
  26.5 % dip; Hubble's and the eye's θ_R; hologram fringe contrast, coherence wash-out, focus at the
  object and a wider focus from half the film), the screen models, and the memory-leak suite
  (`TimeModel`, `HolographyModel`).
- `npm run test:fuzz`: pointer and keyboard fuzz with assertions on.

## PWA

After `npm run build`, the sim is installable and works offline via Workbox
(`dist/manifest.webmanifest`).
