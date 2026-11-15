# Diffraction Lab

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Fraunhofer diffraction for a modern physics course: from the phasor picture of N slits to the limits
of resolution and the hologram. Add up one phasor per slit and watch a grating's maxima sharpen. Ask
how many illuminated lines it takes to split the sodium doublet. Image two stars through a circular
aperture and find the Rayleigh criterion. Then record and reconstruct a hologram. Written to
accompany Chapter 5 (Diffraction of Light) of the QuadriviumPress *Modern Physics* text. Built with
[SceneryStack](https://scenerystack.org/); runs offline as a Progressive Web App.

## Features

- **Gratings.** N identical slits (1 to 40) of width a and spacing d, lit by any visible wavelength.
  The intensity I(sin θ) is drawn with its single-slit envelope, missing orders are marked, and the
  same pattern appears as light on a screen. Drag the cursor across the chart, or press play to
  sweep it, and the **phasor diagram** adds one arrow per slit for that direction: the chain closes
  into a polygon at the first zero (φ = 2π/N) and straightens at every principal maximum. Show peak
  heights growing as N².
- **Resolving Power.** A pair of close spectral lines (the sodium doublet, the mercury yellow pair,
  or the hydrogen/deuterium α isotope shift) on a grating with a chosen ruling, number of
  illuminated lines N and order m. A strip shows both lines in every order from −90° to +90°, and a
  zoomed chart shows the two profiles and their sum, with the first zero of the shorter line marked.
  Readouts compare R = mN with the λ/Δλ the pair needs, and one button sets N to just resolve it
  (982 lines for sodium in first order).
- **Circular Aperture.** Two equal point sources imaged through an aperture of diameter D: two Airy
  disks with faint rings, and the intensity along the line through both. Readouts give the Rayleigh
  angle 1.22 λ/D, the separation in Rayleigh angles and the depth of the dip between the peaks
  (about 26 % at the criterion). Presets reproduce the book's examples: the eye's pupil, Hubble, and
  the same mirror on the ground under 1″ atmospheric seeing. Compare with a slit of the same width.
- **Holography.** A side view of an off-axis transmission hologram, with lengths in wavelengths.
  Record: drag up to three point objects, set the reference-beam angle and the laser's coherence
  length, and see the fringes on the film (with a close-up). Reconstruct: only the reference beam
  lights the film, and the diffracted light, traced back, focuses where the objects were. Cut the
  film in half and the images are still all there, but wider: the Rayleigh criterion again.
- **Accessible:**
  - Every control works from the keyboard, including the chart cursor and the objects.
  - Each screen has a live screen summary and a keyboard-help dialog.
  - English, French and Spanish, default and projector color profiles, and an optional display of
    each screen's governing equation.

## Quick Start

```bash
npm install
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run check:unused` / `npm run knip` | Report unused files, exports, and dependencies (manual check) |
| `npm run check:architecture` | dependency-cruiser layer and cycle rules on `src/` (manual check) |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
