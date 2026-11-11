# Model - Diffraction Lab

This document describes the physics behind the simulation, for an educator. It is the companion to
[implementation-notes.md](./implementation-notes.md), which targets developers. Section references
are to Chapter 5, *Diffraction of Light*, of the QuadriviumPress **Modern Physics** text, with the
phasor method from Chapter 4.

## Overview

All four screens are Fraunhofer (far-field) diffraction: the pattern at angle θ is the sum of
Huygens wavelets from every point of the aperture, with their phases set by the path difference
toward θ. The screens apply that one idea to four apertures:

- **Gratings:** N identical slits. The pattern is a single-slit envelope times an N-slit
  interference factor, and the phasor diagram shows how that factor arises.
- **Resolving Power:** the same grating used as a spectrometer. Two wavelengths are separated when
  their principal maxima are farther apart than a line's own width, which gives R = λ/Δλ = mN.
- **Circular Aperture:** a disk instead of a slit. The pattern is the Airy disk, and two point
  sources are "just resolved" at θ = 1.22 λ/D (the Rayleigh criterion).
- **Holography:** the film records the interference of an object wave with a reference beam, and
  that recorded fringe pattern then acts as a diffraction grating that rebuilds the object wave.

## Quantities and units

| Screen | Quantity | Symbol | Units | Range |
|---|---|---|---|---|
| Gratings | number of slits | N | – | 1 – 40 |
| | slit spacing | d | µm | 1 – 100 (log) |
| | slit width | a | µm | 0.2 – d (log) |
| | wavelength | λ | nm | 380 – 750 |
| Resolving Power | shorter wavelength of the pair | λ | nm | 400 – 700 |
| | separation of the pair | Δλ | nm | 0.01 – 5 (log) |
| | grating ruling | 1/d | lines/mm | 100 – 1800 |
| | illuminated lines | N | – | 10 – 10 000 (log) |
| | order | m | – | 1 – 4, limited to orders that exist |
| Circular Aperture | aperture diameter | D | m | 10⁻⁴ – 10 (log) |
| | wavelength | λ | nm | 380 – 750 |
| | angular separation of the sources | | arcsec | 0.001 – 3000 (log) |
| Holography | reference-beam angle | θ_r | degrees | 10 – 40 |
| | coherence length | L_c | λ | 10 – 10 000 (log; the top acts as an ideal laser) |
| | object positions | x, z | λ | x: −80 – 80, depth: 70 – 290 |

The Holography screen works in wavelengths, with a film 120 λ wide. A real hologram is about
10⁵ λ across; the screen says so. Everything scales with λ, so the geometry and the results are
the same, only smaller.

## Governing equations

### N slits (Gratings; §Double-Slit Diffraction, §Diffraction Gratings)

With s = sin θ, the phase across one slit and the phase step between neighbouring slits are

  β = 2π a s / λ,  φ = 2π d s / λ.

The intensity, normalized to 1 straight ahead, is

  I / I_max = sinc²(β/2) · [ sin(Nφ/2) / (N sin(φ/2)) ]².

The first factor is the single-slit envelope (dashed). The second is the interference of N
slits. At φ = 2πm it equals 1 (the grating equation d sin θ = mλ). With **Peak height ∝ N²**
the chart plots I/I₁ instead, where I₁ is one slit's central intensity, so each principal maximum is
N² times taller.

**Phasors.** Each slit contributes a phasor of length sinc(β/2)/N, each turned by φ from the one
before. Added tip to tail, they give the resultant, and its squared length is I/I_max exactly. At
φ = 0 the chain is straight (length 1). At φ = 2π/N it closes into a regular polygon, the first zero,
only 1/N of the way to the next principal maximum, which is why the maxima narrow as 1/N
(Fig. ch04-phasors). Beyond the first envelope zero sinc(β/2) is negative, so every phasor
reverses. The **sweep** moves the cursor at one order (φ advancing by 2π) every 8 s.

**Missing orders** are the orders m ≠ 0 where m·a/d is an integer: they fall on an envelope zero.
For d = 5a (the book's worked example) orders ±5, ±10, … are missing, and 2q − 1 = 9 bright
fringes lie inside the central envelope. Both are shown.

### Resolving power (§Resolving Power)

On this screen the profile of each line is the interference factor alone. Over the fraction of a
degree the zoomed chart covers, the single-slit envelope is flat. The two lines come from
different atoms, so they are incoherent and their intensities add (the white curve).

The first zero next to the order-m maximum of λ lies at sin θ = (m + 1/N) λ/d (the red dashed
line). Setting the separation of the two maxima equal to that half-width gives the Rayleigh
criterion for a grating,

  R ≡ λ/Δλ = mN.

The verdict compares mN with λ/Δλ: within 5 % reads **just resolved**, above it **resolved**,
below it **not resolved**. **Set N to just resolve** sets N = ⌈λ/(mΔλ)⌉, which is 982 for the sodium
doublet (589.0/589.6 nm) in first order, as in the book.

Only orders with |mλ/d| < 1 exist. When d/λ is an exact integer the last order emerges at grazing
incidence and is not usable, so it is excluded (the book's 5000 lines/cm example). The angle θ_m and
the angular dispersion dθ/dλ = m/(d cos θ) are read out.

Presets: sodium D (589.0, Δλ = 0.6 nm, R ≈ 982), mercury yellow (577.0, Δλ = 2.1 nm, R ≈ 275),
and the hydrogen/deuterium Balmer-α isotope shift (656.1, Δλ = 0.18 nm, R ≈ 3650).

### Circular aperture (§Circular Apertures and the Limits of Resolution)

The far-field amplitude of a circular aperture is

  E(θ) ∝ 2J₁(u)/u,  u = π D sin θ / λ,

where J₁ is the Bessel function of order one. The first dark ring is at u = 3.8317, i.e.
sin θ = 1.2197 λ/D, and the first bright ring is 1.75 % of the centre. Two equal, incoherent point
sources add in intensity. They are **just resolved** (Rayleigh) when the centre of one falls on
the first dark ring of the other, at θ_R = 1.22 λ/D, and the dip midway between the two peaks is
then 26.5 % (the book says "about 26 %"). The verdict uses the separation within ±5 % of θ_R.

**Compare: slit of width D** draws the same pair through a slit of width D, whose first zero is at
λ/D. The only difference is the factor 1.22.

**Atmospheric seeing (1″)** replaces the Airy pattern with the long-exposure seeing disk: a
Gaussian whose width combines, in quadrature, a 1″ FWHM and the Gaussian equivalent of the Airy
core (σ ≈ 0.42 λ/D). For a 2.4 m telescope the seeing disk is about 17 times wider than the
diffraction limit (the book's ground-telescope example), so a pair Hubble resolves becomes one blob.
With seeing on, the verdict is "resolved" when there is a dip of more than 5 %.

Presets: the eye (D = 4 mm, θ_R = 34.6″ at 550 nm), Hubble (2.4 m, θ_R = 0.058″), and the same
mirror on the ground with seeing.

### Holography (§Holography)

The film lies along x. A point object at (x_k, depth z_k) sends a cylindrical wave
O_k = A √(z_k/r_k) e^{ik(z_k + r_k)} to film point x, at distance r_k. The reference is a plane wave
at angle θ_r, R = e^{ik(2z_m + x sin θ_r)}, with z_m the depth at which the two paths are equal.
A = 0.3 relative to the reference.

**Recording.** The film's exposure is

  I(x) = |R|² + Σ|O_k|² + Σ 2Re(R*O_k) γ(ΔL_k) + Σ_{k<l} 2Re(O_k*O_l) γ(ΔL_k − ΔL_l),

where ΔL_k is the path difference between object k's light and the reference at x, and
γ(ΔL) = exp(−(ΔL/L_c)²) is the fringe visibility of light of coherence length L_c. When an object
is deeper than the coherence length allows, its fringes, and so its stored phase, disappear: "a
source with a coherence length longer than the depth of the scene". The finest fringes are spaced
about λ / sin θ_r (read out).

**Reconstruction.** The developed film transmits in proportion to its exposure. Lit by R alone,
the field just after it is U₀ = I·R. One of its terms, |R|²·O_k, is object k's original wave. The
screen traces the light back in front of the film with Huygens' sum

  U(x′, z′) = Σ_film U₀(x) e^{−ikρ}/√ρ,  ρ = |(x, 0) − (x′, z′)|,

and plots |U|². That wave focuses where object k was: the virtual image a viewer sees through the
film. The other terms (the undiffracted zero order, the |O|² halo, the twin image) do not focus
there. **Block zero order** (on by default) subtracts the film's mean exposure first, which removes
the undiffracted beam, as a spatial filter would.

**Cut film in half** removes the x > 0 half. Every part of the film received light from every
object, so all the images remain, but the aperture is half as wide and each focus is about twice
as wide. The readouts give the measured width of object 1's image (FWHM along x) and the aperture
estimate 0.886 λz/W, the slit-diffraction width for an aperture W at distance z.

## Simplifications and assumptions

- **Fraunhofer throughout.** Gratings, Resolving Power and Circular Aperture use far-field
  formulas; there are no near-field (Fresnel) effects. The Holography reconstruction is an exact
  scalar Huygens sum in two dimensions, without the paraxial approximation.
- **Scalar waves; ideal apertures.** Slits are identical, uniformly lit and infinitely long. The
  grating is uniformly illuminated over N lines. Polarization and obliquity factors are ignored.
- **Incoherent sources.** The two spectral lines and the two point sources add in intensity, which is
  right for independent atoms and stars.
- **Resolving Power ignores the envelope.** Over the zoomed window it is constant. Blazing is not
  modelled.
- **Seeing is a Gaussian**, not a turbulence simulation: it reproduces the size of the seeing disk,
  not speckle.
- **Holography is two-dimensional** (cylindrical waves from line objects, a one-dimensional film), in
  units of λ, with linear recording (transmittance ∝ exposure) and a Gaussian coherence function.
  Only the virtual image is shown; the real (twin) image forms on the far side of the film.

## References

- QuadriviumPress, *Modern Physics*, Ch. 4 (phasor addition, N slits) and Ch. 5 (single and double
  slit, gratings and resolving power, circular apertures and the Rayleigh criterion, holography),
  including the worked examples reproduced by the tests.
- W. H. Press et al., *Numerical Recipes in C*, 2nd ed., §6.5 (`bessj1`), for J₁.
- M. Abramowitz and I. Stegun, *Handbook of Mathematical Functions*, Table 9.1, for test values of J₁.
- E. Hecht, *Optics*, 5th ed., §10.2 (Fraunhofer diffraction) and §13.3 (holography).
