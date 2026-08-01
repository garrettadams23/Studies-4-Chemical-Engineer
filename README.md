# Chemical Engineering Reference — 2026 Edition

A comprehensive, interactive web-based reference for chemical-engineering
students, EIT/PE candidates, and practicing engineers. Organized by concept
domain with a dark/light theme engine, collapsible accordions, monospaced
formula/diagram blocks, and reference tables.

## Live Demo

Open `index.html` in any modern web browser — no server or build step required.

## Features

- **Interactive Filtering** — Sticky chip nav bar filters by domain instantly.
- **Full-text Search** — Debounced search highlights matches and auto-expands hits.
- **Theme Engine** — Dark / Light mode with `localStorage` persistence.
- **Collapsible Accordions** — Domain and topic-level expand / collapse, fully
  keyboard-operable (`Tab` to a header, `Enter` / `Space` to toggle).
- **Expand All / Collapse All** — Header button for bulk toggle.
- **Per-topic Permalinks** — Copy a `#slug` link to any topic; opening such a
  URL expands and scrolls straight to it.
- **Study Progress** — Mark topics as reviewed (saved in `localStorage`); each
  domain header shows a live `n/m` counter.
- **Notepad** — Slide-out scratchpad backed by `localStorage`, synced live
  across your open tabs. No dependencies.
- **Interactive Periodic Table** — All 118 elements with IUPAC atomic weights,
  electron configurations, electronegativity, oxidation states and phase data.
  Click an element for its properties card, or recolor the whole table by
  category, electronegativity, melting point or state to see the trends. Open it
  from the Chemistry domain or the study menu; arrow keys walk the grid.
- **Molecular Structure Diagrams** — Skeletal (line-angle) formulas drawn as
  theme-aware inline SVG by `molsvg.py`: how to read a structure, a functional-group
  gallery, a real API, the peptide bond and a reforming reaction.
- **Rotating Snap Quotes** — Science &amp; engineering quotes on a fade cycle.
- **Offline-first** — Self-hosted fonts and zero third-party requests; works
  fully over `file://`. Respects `prefers-reduced-motion` and prints cleanly.

## Domains

| Domain | Tags | Key Topics |
|---|---|---|
| ⚗️ Stoichiometry &amp; Material Balances | CORE, FE | General balance, conservation of mass, recycle/bypass/purge, combustion, degrees of freedom |
| 🔥 Chemical &amp; Engineering Thermodynamics | CORE, PE | Four laws, enthalpy/entropy, Gibbs energy, equations of state, VLE, Raoult's law |
| 🌊 Fluid Mechanics | CORE, FE | Bernoulli, Reynolds number, friction factor, Moody chart, pumps, NPSH, affinity laws |
| ♨️ Heat Transfer | CORE, PE | Conduction/convection/radiation, resistance networks, LMTD, heat exchangers, fouling |
| 💧 Mass Transfer &amp; Separations | CORE, PE | Fick's laws, distillation, McCabe–Thiele, absorption, extraction, membranes, adsorption |
| 🧪 Reaction Engineering &amp; Kinetics | CORE, ADV | Rate laws, Arrhenius, batch/CSTR/PFR design, conversion, selectivity, catalysis |
| 🎛️ Process Dynamics &amp; Control | ADV, PE | Laplace transforms, transfer functions, PID tuning, stability, P&amp;IDs, ISA tags |
| 🧬 Biochemical &amp; Biomolecular Engineering | BIO, ADV | DNA &amp; the central dogma, enzyme kinetics, fermentation, bioreactors, downstream processing |
| 🔀 Transport Phenomena | ADV | Momentum/heat/mass analogy, shell balances, Navier–Stokes, dimensionless groups |
| 🏭 Unit Operations &amp; Equipment | CORE, LAB | Unit-operations toolkit, drying, crystallization, filtration, centrifugation |
| 🦺 Process Safety &amp; Ethics | SAFE, PE | HAZOP, LOPA, relief systems, flammability limits, Bhopal/Flixborough, engineering ethics |
| 🧱 Materials, Polymers &amp; Corrosion | FE | Crystal structure, phase diagrams, lever rule, polymers, Tg, corrosion cells |
| 🧫 Organic &amp; Analytical Chemistry | FE, LAB | Periodic trends, bonding, acids/bases &amp; pH, functional groups, spectroscopy |
| 📐 Process Design &amp; Economics | PE, CAPSTONE | PFD vs P&amp;ID, pinch analysis, NPV/IRR/payback, six-tenths rule, Lang factor |
| 🧮 Engineering Math &amp; Numerical Methods | FE | ODEs, linear algebra, root finding, Runge–Kutta, regression, statistics, DOE |

## Project Structure

```
index.html            Built output — open this in a browser (generated; do not hand-edit)
index-shell.html      Page skeleton (head, header, filter/search bar, notepad) — edit this
build.py              Assembles index-shell.html + data/* → index.html (minifies the output)
reconcile_build.py    Recovery tool: syncs a hand-patched index.html back into data/*
scaffold_domain.py    Wires a brand-new domain into domains.json, the shell, and the CSS
molsvg.py             Draws skeletal chemical structures as inline SVG and injects
                      them into data/*.html between <!-- mol:name --> markers
script.js             All interactive logic (accordion, filter, search, theme,
                      notepad, permalinks, progress, back-to-top)
style.css             Layout, themes, and component styles
data/
  domains.json        Domain metadata (id, colorClass, icon, title, tags, subtitle)
  stoich.html … math.html   One file per domain — the .domain-body inner content
Img/
  favicon/            favicon.ico, site.webmanifest, PNG variants
  fonts/              Self-hosted Share Tech Mono + Outfit woff2
  fonts.css           @font-face rules pointing at Img/fonts/
  Studying-Tips.png   Header infographic (optimized)
CONTRIBUTING.md       Canonical topic markup conventions for new content
.github/workflows/    CI: rebuilds index.html and fails if it is stale
```

## Editing Content

All topic content lives in `data/*.html` — one file per domain. To add or update a topic:

1. Edit the relevant `data/{domain}.html` file (see **CONTRIBUTING.md** for the
   canonical topic skeleton and class conventions).
2. Run `python3 build.py` from the project root.
3. Open `index.html` in a browser to verify.

To add a new domain, add an entry to `data/domains.json` and create the matching
`data/{id}.html` (or use `scaffold_domain.py` to wire the chip and colors for you).

To add a chemical structure, define it in `molsvg.py` (atoms, bonds and rings in
Python — see the existing molecules), drop a `<!-- mol:name --><!-- /mol:name -->`
marker pair where it belongs in `data/*.html`, then run `python3 molsvg.py --inject`
followed by `python3 build.py`. Re-running is idempotent, so a structure can be
tweaked and regenerated in place. `python3 molsvg.py <name>` prints one to stdout.
**Never hand-edit `index.html`** — it is generated; if it ever drifts from
`data/*`, `reconcile_build.py` can rebuild the sources from it.

## Built With

- **HTML5** — Semantic structure, no external frameworks.
- **Vanilla CSS** — CSS custom properties, Flexbox, Grid.
- **Vanilla JavaScript** — Event delegation, accordion, filtering, search, theme,
  notepad. No runtime dependencies.
- **Self-hosted fonts** — Share Tech Mono &amp; Outfit (no third-party requests).

## License

MIT License — see [LICENSE](LICENSE) for details.
