# Chemical Engineering Reference — Content & Build-Out Plan

> The master roadmap for growing this repo from a 15-domain single-page reference
> into a full, deployable **Netlify** website: every topic to write, every
> interactive feature to build, every dataset to embed, and how to ship it.
>
> **Status legend:** ✅ done · 🚧 in progress · 📝 planned · 💡 stretch goal
>
> **Golden rule:** all content lives in `data/*.html`; run `python3 build.py`;
> **never hand-edit `index.html`**. See `CONTRIBUTING.md` for the topic skeleton.

---

## 0. Vision & Goals

Build the reference *we* wished existed in undergrad and kept using on the job:
an offline-first, zero-dependency, dark/light study hub that spans the entire
chemical-engineering curriculum, the FE/PE exams, and day-to-day plant practice.

**Design principles (inherited from the engine, keep them):**

- **Offline-first** — self-hosted fonts, no third-party requests, works over `file://`.
- **Zero runtime dependencies** — vanilla HTML/CSS/JS only. No React, no CDN.
- **Modular content** — one `data/{id}.html` per domain, assembled by `build.py`.
- **Accessible** — keyboard-operable accordions, ARIA state, `prefers-reduced-motion`, prints cleanly.
- **Fast** — minified single page, lazy nothing needed because it's already tiny.
- **Deep but scannable** — every topic is a `.topic-header` + collapsible `.topic-body`
  with a `.concept-card`, reference tables (`ref-table`), and `<pre class="code-block">`
  formula/diagram blocks.

**Success metrics:**

- 🚧 30 domains live · **131 topics** · 8 tools + quiz + flashcards (Phase 4 done; 5–6 advanced) · 📝 target **25+ domains**, **250+ topics**, **1000+ reference-table rows**.
- 🚧 Interactive tools — 7 calculators + steam-table lookup + quiz + flashcards.
- 🚧 Embedded reference data — steam table, Antoine coefficients, physical-property table live.
- ✅ Self-test quiz engine — 18 questions, instant feedback, best score saved (localStorage).
- 📝 Deployed on Netlify with a custom domain, deploy previews, and a feedback form.

---

## 1. Netlify Deployment Plan

The site is a **static build**: `build.py` (Python 3, stdlib only) assembles
`index.html` from `index-shell.html` + `data/*`. Netlify runs that build and
publishes the result.

### 1.1 `netlify.toml` (📝 add at repo root)

```toml
[build]
  command = "python3 build.py"
  publish = "."                     # index.html + style.css + script.js + Img/ are all at root

[build.environment]
  PYTHON_VERSION = "3.12"

# Long-cache immutable, hashed-ish assets; fonts & images rarely change.
[[headers]]
  for = "/Img/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=604800"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=604800"

# Security headers — the site makes zero external calls, so lock CSP down hard.
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
    Content-Security-Policy = "default-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'"
```

> **Note on `publish = "."`** — simplest for the current flat layout. If we later
> want a clean artifact dir, change `build.py` to write into `public/` (and copy
> `style.css`, `script.js`, `Img/` there), then set `publish = "public"`. Tracked
> as 💡 below.

### 1.2 Build & CI

- ✅ `.github/workflows/build-check.yml` already fails the build if `index.html`
  is stale vs `data/*`. Keep it — it guarantees Netlify never publishes a
  hand-edited page.
- 📝 Add a **Netlify build plugin** or a `postbuild` step that runs an HTML
  validator and a link checker (`htmlproofer`-style) on the built page.
- 📝 Enable **Deploy Previews** on every PR (Netlify default) so reviewers see
  the rendered site before merge.
- 📝 Enable **branch deploys** for `claude/*` working branches.

### 1.3 Routing & error pages (📝)

- Add `404.html` (styled to match the theme) and a `_redirects` file:
  ```
  /home    /            301
  /*       /404.html    404
  ```
- Deep-link permalinks already work via `#slug` hashes handled in `script.js`
  (`openHashTarget`) — no server routing needed.

### 1.4 Custom domain & HTTPS (📝)

- Point a custom domain (e.g. `cheref.dev` or a subdomain) at Netlify DNS.
- Netlify auto-provisions Let's Encrypt TLS. Force HTTPS.

### 1.5 Feedback / contributions (📝)

- **Netlify Forms** for a "report an error / suggest a topic" form (no backend):
  add a `<form name="feedback" netlify>` block behind a slide-out panel like the
  notepad. Spam-protect with a honeypot field.
- 💡 A single **Netlify Function** could email submissions or file a GitHub issue
  via the API — optional, keep the static purity unless needed.

### 1.6 Analytics & optimization (📝)

- **Netlify Analytics** (server-side, privacy-friendly, no client script → keeps
  CSP clean and offline-first intact).
- Enable **asset optimization** (CSS/JS/image compression) in Netlify build settings.
- 💡 Lighthouse CI budget: target 100/100/100/100.

### 1.7 PWA / installable (🚧 → 📝)

- `Img/favicon/site.webmanifest` already exists (✅ renamed to "Chemical
  Engineering Reference").
- 📝 Add a **service worker** (`sw.js`) that pre-caches `index.html`, `style.css`,
  `script.js`, fonts, and favicons → true offline install. Register it from
  `script.js` guarded by `'serviceWorker' in navigator`. (Note: SW won't run over
  `file://`, only on the deployed HTTPS site — the `file://` path stays SW-free.)

---

## 2. Information Architecture

### 2.1 Domain taxonomy (current + planned)

Each domain = one filter chip + one `data/{id}.html` + one `--accent` color +
cert/course tags. Use `scaffold_domain.py` to wire a new one:

```
python3 scaffold_domain.py <id> <icon> "<title>" "<CHIP LABEL>" \
    "<chipColor>" "<accent>" "<subtitle>" tagClass:TAGTEXT ...
```

### 2.2 Tag vocabulary (course/exam relevance)

| Tag | Meaning |
|-----|---------|
| `CORE` | Core undergraduate ChemE course |
| `FE` | On the NCEES **FE Chemical** exam |
| `PE` | On the NCEES **PE Chemical** exam |
| `ADV` | Advanced / graduate-level |
| `BIO` | Biochemical / biomolecular track |
| `LAB` | Unit-ops lab / hands-on |
| `SAFE` | Process-safety relevant |

📝 Add new tag classes as new domains land (`ENV`, `PHARMA`, `DATA`, `EXAM`, `CAREER`).

### 2.3 Topic skeleton (reminder)

```html
<div class="topic">
  <div class="topic-header">
    <span class="topic-icon">⚗️</span>
    <span class="topic-name">Title (search + slug use this)</span>
    <span class="topic-badge">OPTIONAL TAG</span>
    <span class="topic-chev">▶</span>
  </div>
  <div class="topic-body">
    <div class="concept-card">
      <div class="concept-label">Kicker</div>
      <div class="concept-title">Headline</div>
      <div class="concept-desc">Prose.</div>
      <div class="dw">
        <div class="dt">▸ SECTION HEADING</div>
        <table class="ref-table">…</table>
        <pre class="code-block">formulas / ASCII diagrams (whitespace preserved)</pre>
      </div>
      <div class="info-bar ib-muted">💡 Key takeaway.</div>
    </div>
  </div>
</div>
```

---

## 3. Content Roadmap — Existing Domains

Each domain lists **current** topics (✅) and the full **planned** topic set (📝)
to build it out to textbook depth. Aim for 8–15 topics per mature domain.

### 3.1 ⚗️ Stoichiometry & Material Balances (`stoich`)

✅ General balance equation · ✅ Recycle, bypass & purge · ✅ Combustion & DOF

📝 Planned topics:
- Units, dimensions & unit conversion (SI, USCS, mole vs mass, dimensional homogeneity)
- Process variables (density, specific gravity, flow rate, composition, mole/mass fraction, ppm)
- Choosing a basis of calculation
- Single-unit non-reactive balances (mixers, splitters, separators)
- Multiple-unit balances (sequential subsystems, overall vs internal)
- Reactive balances I — stoichiometry, limiting/excess reactant, extent of reaction ξ
- Reactive balances II — conversion, yield, selectivity for multiple reactions
- Combustion detail — theoretical/excess air, wet & dry flue gas, Orsat analysis
- Recycle with reaction — overall vs single-pass conversion
- Purge calculations — inert accumulation & steady-state purge ratio
- Balances on multiphase systems — vapor-liquid, condensation, Antoine/Raoult
- Humidity & psychrometry balances (link to HVAC)
- Unsteady-state (dynamic) material balances — the general ODE form
- Degrees-of-freedom analysis — the full recipe for multi-unit flowsheets

### 3.2 🔥 Chemical & Engineering Thermodynamics (`thermo`)

✅ The four laws · ✅ Entropy, Gibbs & spontaneity · ✅ EOS & VLE

📝 Planned topics:
- System, surroundings, state & path functions; the PVT surface
- Ideal-gas law & kinetic theory
- Real gases — compressibility factor Z, generalized/acentric-factor charts
- Cubic equations of state — van der Waals, RK, SRK, Peng-Robinson (when to use each)
- First law — closed systems (ΔU = Q − W), reversible/irreversible work
- First law — open systems, the general energy balance, shaft work
- Heat capacity, sensible heat, latent heat, enthalpy of mixing
- Thermochemistry — ΔHf, ΔHc, ΔHrxn, Hess's law, adiabatic flame temperature
- Second law, entropy, reversibility, Clausius inequality
- Entropy balances & lost work / exergy analysis
- Power cycles — Carnot, Rankine (+ reheat/regeneration), Brayton
- Refrigeration & heat pumps — vapor-compression cycle, COP
- Throttling & the Joule-Thomson coefficient
- Departure functions & residual properties
- Fugacity & fugacity coefficients
- Activity-coefficient models — Margules, Van Laar, Wilson, NRTL, UNIQUAC, UNIFAC
- Phase equilibria — Gibbs phase rule, Txy/Pxy/xy diagrams
- Flash calculations — isothermal flash, Rachford-Rice
- Bubble-point & dew-point calculations
- Chemical-reaction equilibrium — K, ΔG°, van't Hoff temperature dependence
- Electrolyte & multi-reaction equilibria (intro)

### 3.3 🌊 Fluid Mechanics (`fluids`)

✅ Bernoulli & mechanical energy · ✅ Reynolds & pipe friction · ✅ Pumps & NPSH

📝 Planned topics:
- Fluid properties — density, viscosity, surface tension, Newtonian vs non-Newtonian
- Fluid statics — pressure, manometry, barometric formula, buoyancy
- Continuity & the general mass balance on flow
- Momentum balance & forces on bends/nozzles
- Laminar flow — Hagen-Poiseuille, velocity profile
- Turbulent flow — universal velocity profile, roughness
- Friction factor & the Moody chart (Colebrook, Haaland, Swamee-Jain)
- Minor losses — fittings, K-values, equivalent length
- Pipe networks & series/parallel pipes
- Flow measurement — orifice, venturi, nozzle, rotameter, pitot tube
- Centrifugal pumps — characteristic & system curves, operating point
- Positive-displacement pumps
- Pumps in series & parallel; affinity laws (deeper)
- Compressors, blowers & fans (link to thermo)
- Flow past immersed bodies — drag coefficient, terminal velocity
- Flow through packed beds — Ergun equation
- Fluidization — minimum fluidization velocity, regimes
- Compressible flow — Mach number, choked/sonic flow, nozzles
- Boundary layers — laminar/turbulent, separation
- Non-Newtonian fluids & rheology — power-law, Bingham, Herschel-Bulkley

### 3.4 ♨️ Heat Transfer (`heat`)

✅ Three modes · ✅ Heat exchangers — LMTD & NTU

📝 Planned topics:
- Steady conduction — plane wall, cylinder, sphere, resistance networks
- Composite walls & the overall U-value / critical insulation radius
- Extended surfaces — fins, fin efficiency & effectiveness
- Transient conduction — lumped capacitance, Biot & Fourier numbers, Heisler charts
- Forced convection — internal (Dittus-Boelter, Sieder-Tate) & external flow
- Free/natural convection — Grashof & Rayleigh numbers, correlations
- Radiation — blackbody, Stefan-Boltzmann, emissivity, Kirchhoff's law
- Radiation exchange — view/shape factors, radiation networks, shields
- Shell-and-tube exchangers — TEMA types, design procedure, F-factor
- Compact & plate exchangers; air-cooled exchangers
- Fouling factors & cleaning
- Boiling — pool boiling curve, nucleate/film boiling, critical heat flux
- Condensation — film (Nusselt) vs dropwise
- Evaporators — single & multiple effect, boiling-point rise
- Heat-integration primer (full treatment in Process Design)

### 3.5 💧 Mass Transfer & Separations (`mass`)

✅ Diffusion — Fick's laws · ✅ Distillation & McCabe-Thiele · ✅ Absorption, extraction & membranes

📝 Planned topics:
- Molecular diffusion detail — equimolar counterdiffusion, diffusion through stagnant film
- Diffusivity estimation — gases (Chapman-Enskog), liquids (Wilke-Chang)
- Convective mass transfer & mass-transfer coefficients
- Two-film theory, penetration & surface-renewal theories
- Overall coefficients, HTU & NTU
- Interphase equilibrium — Henry's law, distribution coefficients
- Flash & differential (Rayleigh) distillation
- Continuous distillation — McCabe-Thiele full method, q-line, feed condition
- Tray efficiency (Murphree, overall), minimum/total reflux
- Shortcut multicomponent — Fenske-Underwood-Gilliland
- Packed vs tray columns — HETP, flooding, sizing
- Azeotropic, extractive & pressure-swing distillation
- Gas absorption & stripping — packed-column design, Kremser equation
- Liquid-liquid extraction — ternary diagrams, single & multistage, extraction factor
- Leaching & solid-liquid extraction
- Humidification & cooling towers
- Membrane separations — RO, NF, UF, MF, gas separation, pervaporation, polarization
- Adsorption — Langmuir/Freundlich isotherms, breakthrough curves, PSA/TSA
- Chromatography (link to Biochemical)

### 3.6 🧪 Reaction Engineering & Kinetics (`kinetics`)

✅ Rate laws & Arrhenius · ✅ Ideal reactors (batch/CSTR/PFR) · ✅ Selectivity, yield & catalysis

📝 Planned topics:
- Rate definitions, molecularity vs order, elementary vs non-elementary
- Analyzing rate data — integral, differential & half-life methods
- Batch reactor design & optimization
- CSTR design, sizing & multiple steady states
- PFR / tubular reactor design
- Reactor comparison & sizing (Levenspiel plots)
- Reactors in series & parallel; recycle reactors
- Multiple reactions — parallel/series, maximizing selectivity
- Non-isothermal reactor design — energy balance, adiabatic operation
- Thermal runaway & stability
- Heterogeneous catalysis — mechanisms, LHHW rate laws
- Internal & external diffusion — Thiele modulus & effectiveness factor
- Catalyst deactivation & regeneration
- Residence-time distribution (RTD) — tracer tests, tanks-in-series, dispersion model
- Non-ideal reactors & the segregation model
- Gas-liquid & gas-solid reactors (slurry, trickle-bed, fluidized)
- Bioreactor kinetics (link to Biochemical)

### 3.7 🎛️ Process Dynamics & Control (`control`)

✅ Laplace & transfer functions · ✅ PID tuning · ✅ P&IDs & ISA tags

📝 Planned topics:
- Modeling process dynamics — deriving transfer functions from balances
- Linearization of nonlinear models
- First-order systems — step/impulse/ramp response, time constant
- Second-order systems — overdamped/critically/underdamped, overshoot, decay ratio
- Integrating & dead-time processes; lead-lag
- Block-diagram algebra & closed-loop transfer functions
- Feedback control fundamentals & offset
- Controller modes — on/off, P, PI, PID (velocity vs position form)
- Stability analysis — Routh array, direct substitution
- Frequency response — Bode & Nyquist plots, gain & phase margins
- Root-locus method
- Tuning — Ziegler-Nichols, Cohen-Coon, IMC, relay auto-tuning, anti-windup
- Cascade, feedforward, ratio & override control
- Dead-time compensation — the Smith predictor
- Multivariable control & interaction — the RGA
- Instrumentation — sensors, transmitters, final control elements
- Control-valve sizing — Cv, characteristics, cavitation/flashing
- P&ID symbols & standards (deeper)
- Safety Instrumented Systems (SIS) & SIL (link to Safety)
- Digital/discrete control & intro to Model Predictive Control (MPC)

### 3.8 🧬 Biochemical & Biomolecular Engineering (`bio`)

✅ DNA & the central dogma · ✅ Enzyme kinetics (Michaelis-Menten) · ✅ Fermentation & bioreactors · ✅ Downstream processing

📝 Planned topics:
- Cell biology for engineers — prokaryotes vs eukaryotes, organelles
- The four biomolecules — carbohydrates, lipids, proteins, nucleic acids
- DNA structure & replication (deeper — semiconservative, polymerases, Okazaki)
- Transcription & translation detail; the genetic-code / codon table
- Recombinant DNA — plasmids, restriction enzymes, ligation, transformation
- PCR, gel electrophoresis, sequencing & CRISPR-Cas9
- Protein structure (1°–4°), folding & denaturation
- Enzyme inhibition — competitive, non-competitive, uncompetitive; Lineweaver-Burk
- Immobilized enzymes & biocatalysis
- Microbial growth — lag/exp/stationary/death phases, Monod, yields & maintenance
- Stoichiometry & energetics of cell growth
- Bioreactor types — stirred-tank, airlift, packed/fluidized, perfusion
- Oxygen transfer & kLa; scale-up criteria
- Sterilization — thermal death kinetics, Del factor, media/air sterilization
- Downstream unit ops — disruption, centrifugation, filtration, precipitation
- Chromatography — affinity, ion-exchange, size-exclusion, HIC
- Membrane bioseparations & concentration
- Metabolic engineering & flux balance analysis (intro)
- Industrial biotech — biofuels, biopolymers, bioremediation
- Cell-culture & bioprocess for biologics (link to Pharma/GMP)

### 3.9 🔀 Transport Phenomena (`transport`)

✅ The unified transport analogy · ✅ Navier-Stokes & dimensionless groups

📝 Planned topics:
- Continuum hypothesis, fields & flux
- Viscosity & the molecular origin of momentum transport
- Shell momentum balances — falling film, flow in a tube, annulus, adjacent fluids
- The equations of change — continuity & Navier-Stokes (Cartesian/cylindrical/spherical)
- Using the equations of change to set up problems
- Dimensional analysis of the equations of change
- Energy transport & shell energy balances; temperature distributions
- The energy equation & forced/free convection derivations
- Mass transport & shell mass balances; concentration distributions
- Diffusion with reaction
- The transport analogies — Reynolds & Chilton-Colburn
- Boundary-layer theory — Blasius solution, integral methods
- Turbulence — time-averaging, eddy diffusivity (intro)
- Transport in porous media
- Master table of dimensionless groups (Re, Pr, Sc, Nu, Sh, Gr, Pe, St, Bi, Fo, We, Da…)

### 3.10 🏭 Unit Operations & Equipment (`unitops`)

✅ The unit-operations toolkit · ✅ Drying, crystallization & filtration

📝 Planned topics:
- Classification & the unit-operations concept (deeper)
- Size reduction — crushers, mills; Rittinger, Kick & Bond laws
- Screening & size classification; particle-size distributions
- Sedimentation, thickeners & clarifiers
- Centrifugation — types, sigma factor, decanters
- Cyclones & gas-solid separation
- Filtration — cake vs depth, constant-pressure/rate, filter media & aids
- Mixing & agitation — impeller types, power number, blending, scale-up
- Solids handling, conveying & storage (hoppers, mass/funnel flow)
- Fluidization — regimes, bubbling beds, applications
- Drying — psychrometrics, drying curves, dryer types (tray/rotary/spray/fluid-bed/freeze)
- Evaporation — types, multiple-effect, economy, boiling-point rise
- Crystallization — nucleation & growth, MSMPR, population balance, crystallizer types
- Distillation & absorption column internals — trays, packing, distributors
- Extraction equipment — mixer-settlers, columns
- Membrane modules — spiral-wound, hollow-fiber, plate-and-frame
- Adsorption & ion-exchange equipment

### 3.11 🦺 Process Safety & Ethics (`safety`)

✅ HAZOP, LOPA & layers of protection · ✅ Relief systems & flammability · ✅ Engineering ethics

📝 Planned topics:
- Process Safety Management (PSM) — the 14 OSHA elements
- Hazard identification — checklists, what-if, HAZOP (deeper), FMEA
- Risk assessment — risk matrix, LOPA (deeper), QRA
- Fault-tree & event-tree analysis; bowtie diagrams
- Inherent safety — minimize, substitute, moderate, simplify
- Fire & explosion — fire triangle, LFL/UFL, flammability diagram, LOC
- Flash point, fire point, autoignition temperature
- Vapor-cloud explosions (VCE), BLEVE, dust explosions
- Deflagration vs detonation; explosion venting
- Toxicity & industrial hygiene — dose-response, TLV/PEL/IDLH, exposure routes
- Source & dispersion modeling — release rates, plume/puff models
- Relief-system design — scenarios, PSV & rupture-disk sizing (API 520/521)
- Flares, scrubbers & effluent handling; blowdown
- Static electricity & bonding/grounding
- Reactive chemicals & runaway reactions — calorimetry (DSC, ARC), CHETAH
- Case histories — Bhopal, Flixborough, Texas City, Piper Alpha, Seveso, Buncefield, T2 Labs
- Engineering ethics — AIChE/NSPE codes, whistleblowing, case studies
- Management of Change (MOC) & Process Hazard Analysis (PHA) programs

### 3.12 🧱 Materials, Polymers & Corrosion (`materials`)

✅ Crystal structure & phase diagrams · ✅ Polymers & plastics · ✅ Corrosion & materials selection

📝 Planned topics:
- Atomic bonding & the bonding-property link
- Crystal structures, Miller indices & crystallographic defects
- Mechanical properties — stress-strain, yield, UTS, ductility, hardness, toughness
- Fatigue, creep & fracture mechanics
- Binary phase diagrams — eutectic, peritectic, lever rule (deeper)
- The iron-carbon diagram & steel microstructures
- Heat treatment & TTT/CCT diagrams
- Metals & alloys — carbon/stainless steels, Ni/Al/Ti/Cu alloys
- Ceramics, refractories & glasses
- Polymer fundamentals — MW distribution, Tg/Tm, crystallinity
- Polymerization mechanisms — step vs chain; processing methods
- Viscoelasticity & polymer rheology
- Composites — fibers, matrices, rule of mixtures
- Corrosion electrochemistry — galvanic series, mixed-potential theory
- Forms of corrosion — uniform, galvanic, pitting, crevice, SCC, erosion
- Pourbaix & E-pH diagrams
- Corrosion control — coatings, inhibitors, cathodic/anodic protection, material upgrade
- High-temperature oxidation & creep service
- Materials selection — Ashby charts, service environment, cost

### 3.13 🧫 Organic & Analytical Chemistry (`chem`)

✅ Periodic trends & bonding · ✅ Acids, bases & pH · ✅ Functional groups & spectroscopy

📝 Planned topics:
- Atomic structure, quantum numbers & electron configuration
- Chemical bonding — VSEPR, hybridization, MO theory, intermolecular forces
- Stoichiometry, the mole & limiting reagents (chem view)
- Gas laws & kinetic molecular theory
- Solutions — concentration units, colligative properties
- Chemical equilibrium — Le Chatelier, Kc/Kp
- Acid-base detail — theories, titration curves, indicators, polyprotic
- Solubility equilibria — Ksp, common-ion effect
- Electrochemistry — redox balancing, galvanic/electrolytic cells, Nernst, Faraday's laws
- Reaction kinetics (chem view — rate laws, mechanisms, catalysis)
- Organic nomenclature (IUPAC) & isomerism
- Organic reaction types — substitution, addition, elimination, oxidation/reduction
- Reaction mechanisms & aromaticity
- Reactions of the major functional groups
- Analytical methods — gravimetric & volumetric analysis
- Spectroscopy detail — UV-Vis (Beer-Lambert), IR, NMR, MS, AAS
- Instrumental separation — GC, HPLC
- Industrial inorganic chemistry — Haber-Bosch, contact process, chlor-alkali, Ostwald

### 3.14 📐 Process Design & Economics (`design`)

✅ Flowsheets — PFD vs P&ID & pinch · ✅ Engineering economics & profitability

📝 Planned topics:
- The design process — from conceptual to detailed engineering
- Problem definition, scope & the design basis
- Process synthesis — hierarchy of decisions, flowsheet development
- BFD → PFD → P&ID development (deeper)
- Process simulation — Aspen Plus/HYSYS, thermo-model selection, convergence
- Equipment selection & sizing overview
- Mechanical design of vessels — ASME BPVC, wall thickness, pressure rating
- Heat integration & pinch analysis — composite curves, grand composite, MER, HEN synthesis
- Mass & water pinch analysis
- Utilities & site systems — steam, cooling water, refrigeration, power, inert gas
- Cost estimation — AACE estimate classes, equipment costing, CEPCI escalation
- Capital cost — Lang & Hand factors, FCI, working capital, TCI
- Operating cost — raw materials, utilities, labor, maintenance, overhead
- Profitability — cash-flow diagrams, NPV, IRR, ROI, payback, DCFROR
- Sensitivity analysis & optimization — LP/NLP, objective functions, constraints
- Sustainability & green design — atom economy, E-factor, LCA, circular economy
- Plant location, layout & spacing
- Safety & controllability in design (links)
- Project management & execution (FEL/stage-gate)
- Worked full-plant design case studies

### 3.15 🧮 Engineering Math & Numerical Methods (`math`)

✅ ODEs & linear algebra · ✅ Numerical methods & root finding · ✅ Statistics, regression & data

📝 Planned topics:
- Functions, algebra & precalculus review for engineers
- Differential calculus & applications (optimization, related rates)
- Integral calculus & applications (areas, volumes, averages)
- Infinite series & Taylor/Maclaurin expansions
- Vectors & vector calculus — gradient, divergence, curl; the operators in transport
- Matrices & linear algebra — systems, determinants, inverse, rank
- Eigenvalues & eigenvectors — stability, principal components
- Matrix decompositions — LU, QR, SVD
- First-order ODEs — separable, linear, exact, integrating factor
- Higher-order & systems of linear ODEs
- Laplace transforms for solving ODEs (link to Control)
- Partial differential equations — classification, separation of variables
- The heat, wave & Laplace equations; boundary/initial conditions
- Numerical root finding — bisection, Newton-Raphson, secant, fixed-point
- Numerical linear algebra — Gaussian elimination, LU, iterative (Jacobi/Gauss-Seidel)
- Interpolation & curve fitting — Lagrange, splines, least squares
- Numerical differentiation & integration — trapezoid, Simpson, Gauss quadrature
- Numerical ODE solvers — Euler, RK4, stiffness & implicit methods
- Numerical PDEs — finite-difference & finite-element intro
- Numerical optimization — gradient, Newton, constrained (KKT), LP intro
- Probability & distributions — normal, binomial, Poisson, exponential
- Descriptive & inferential statistics — CI, hypothesis testing, ANOVA
- Regression & correlation — linear, multiple, nonlinear
- Design of experiments — factorial, fractional factorial, RSM, Taguchi
- Error analysis & propagation of uncertainty
- Dimensional analysis & the Buckingham-π theorem
- Programming for engineers — Python (NumPy/SciPy/pandas/Matplotlib), MATLAB

---

## 4. Proposed New Domains

Wire each with `scaffold_domain.py`; pick a distinct accent color & chip.

### 4.1 ⚡ Electrochemical & Energy Engineering (`electro`) 📝
Electrode kinetics (Butler-Volmer), electrochemical cells & thermodynamics,
batteries (Li-ion, flow, lead-acid), fuel cells (PEM, SOFC), water electrolysis &
green hydrogen, electrochemical reactors, CO₂ electroreduction, electrodialysis,
electroplating & electrowinning.

### 4.2 🌱 Energy, Sustainability & Environment (`enviro`) 📝
Energy sources & the energy balance of society, renewable energy (solar, wind,
geothermal, biomass), carbon capture, utilization & storage (CCUS), the hydrogen
economy, water & wastewater treatment, air-pollution control, solid & hazardous
waste, life-cycle assessment (LCA), circular economy, ESG & decarbonization,
techno-economic analysis of green processes.

### 4.3 🛢️ Petroleum Refining & Petrochemicals (`petro`) 📝
Crude oil & assays, atmospheric & vacuum distillation, fluid catalytic cracking,
hydrocracking & hydrotreating, catalytic reforming, alkylation & isomerization,
gas processing & sweetening, LNG, the petrochemical tree (olefins, aromatics),
refinery economics & configuration.

### 4.4 💊 Pharmaceutical & GMP Engineering (`pharma`) 📝
Drug-development pipeline, API synthesis & process chemistry, pharma unit ops,
crystallization & polymorphism, sterile & aseptic processing, Good Manufacturing
Practice (GMP), process validation (IQ/OQ/PQ), Quality by Design (QbD) & PAT,
cleanrooms & containment, regulatory landscape (FDA, ICH Q8-Q11), continuous
manufacturing.

### 4.5 🌫️ Particle Technology & Powder Processing (`particles`) 📝
Particle characterization & size distributions, particle mechanics, powder flow &
storage, granulation & agglomeration, milling & comminution, gas-solid & liquid-
solid systems, pneumatic conveying, dust safety (link), spray drying.

### 4.6 🔬 Nanotechnology & Advanced Materials (`nano`) 📝
Nanoscale phenomena, synthesis (sol-gel, CVD, self-assembly), nanoparticles &
nanotubes, characterization (SEM, TEM, XRD, AFM), applications (catalysis, drug
delivery, membranes, electronics), safety & the environment.

### 4.7 📊 Process Data Science & ML for ChemE (`data`) 📝
Process data & historians, data cleaning & feature engineering, statistical
process monitoring (PCA, PLS), soft sensors, machine-learning models for property
prediction, surrogate models & digital twins, optimization under uncertainty,
Python/pandas workflows, physics-informed ML.

### 4.8 🧰 Worked Examples & Problem Sets (`examples`) 📝
Fully worked, step-by-step solved problems for every core domain — the "show me
how" companion. One topic per problem archetype (e.g. "flash-drum flash calc",
"CSTR sizing", "McCabe-Thiele by hand", "LMTD exchanger", "pump/NPSH check").

### 4.9 📄 Formula Sheet & Cheat Sheets (`formulas`) 📝
Dense, printable quick-reference cards — one collapsible topic per domain with
all key equations, dimensionless groups, and constants in `<pre>` blocks. Doubles
as an exam-day sheet.

### 4.10 🎓 FE / PE Exam Prep (`exam`) 📝
Exam structure & scoring (NCEES FE Chemical, PE Chemical), the reference handbook,
time strategy, topic weightings, common traps, mini practice sets with the quiz
engine, unit-consistency drills.

### 4.11 💼 Professional Practice & Career (`career`) 📝
PE licensure path (FE → EIT → PE), résumé & interview prep for ChemE roles,
industries & what engineers actually do in each, AIChE & professional societies,
patents & IP, communication & documentation, a-day-in-the-life profiles, ethics
in practice (link to Safety).

### 4.12 🌡️ Psychrometrics & HVAC (`psychro`) 💡
Humidity ratios, the psychrometric chart, wet/dry-bulb, adiabatic saturation,
cooling-tower & air-conditioning processes, dehumidification.

### 4.13 🧊 Cryogenics & Low-Temperature (`cryo`) 💡
Gas liquefaction cycles (Linde, Claude), air separation, cryogenic storage &
materials, refrigeration at low T.

---

## 5. Interactive Features Roadmap

All must stay **vanilla JS, offline-first, CSP-clean**. Add each as a widget the
same way the notepad & URL-codec were added (a slide panel or an in-topic block),
wired in `script.js`.

### 5.1 Already shipped ✅
Theme toggle · full-text search w/ highlight · accordions (+ keyboard) ·
expand/collapse-all · per-topic permalinks · study-progress counters ·
slide-out notepad · rotating quotes · back-to-top.

### 5.2 Calculators (📝) — an in-page `.calc` widget per formula
- **Unit converter** — length, mass, pressure, energy, power, flow, viscosity, temperature (comprehensive SI ⇄ USCS)
- **Ideal-gas calculator** (PV = nRT, any unknown)
- **Reynolds number** & flow-regime classifier
- **Friction factor** (Colebrook/Haaland) + Darcy pressure drop
- **Pump power & NPSH-available** checker
- **LMTD & exchanger duty** (Q = U·A·F·ΔT_lm)
- **Ideal-reactor sizing** (batch/CSTR/PFR for nth-order)
- **Antoine vapor pressure** (with built-in coefficient DB)
- **Raoult's-law flash / bubble & dew point** (binary)
- **Interactive McCabe-Thiele** stage-stepper (canvas/SVG)
- **pH / buffer** calculator (Henderson-Hasselbalch)
- **Psychrometric** calculator
- **Dimensionless-group** calculator (Re, Pr, Nu, Sh, …)
- **Engineering-economics** calculator (NPV, IRR, payback, six-tenths scaling)

### 5.3 Reference tools (📝)
- **Interactive periodic table** (click an element → properties card)
- **Steam-table lookup** (saturated & superheated, interpolating)
- **Physical-property database** lookup (Tc, Pc, ω, Cp, ΔHf, ΔHvap, MW)
- **Pipe-schedule** lookup (NPS → ID/OD/wall)
- **Glossary with hover tooltips** across all topics

### 5.4 Learning tools (📝)
- **Quiz / self-test engine** — per-domain MCQ banks, scored, `localStorage` progress, review-wrong-answers mode
- **Flashcards** with lightweight spaced repetition (Leitner boxes in `localStorage`)
- **Formula-sheet / cheat-sheet printable** view (print CSS already respected)
- **Bookmark / "my topics"** list (localStorage)

### 5.5 Visual/diagram upgrades (📝)
Replace ASCII diagrams with crisp inline **SVG** (still no external requests):
phase diagrams, Moody chart (interactive), McCabe-Thiele, block/PFD builder,
control block diagrams, the DNA double helix. Keep ASCII fallbacks for `file://`.

---

## 6. Embedded Reference Data (📝)

Ship as static JSON in `data/ref/` (or inline in the calculators), rendered into
tables and consumed by the calculators. No external API — everything bundled.

- **Steam tables** — saturated (by T & P) + superheated grid
- **Antoine coefficients** — 50+ common compounds (with valid T ranges & units)
- **Critical properties & acentric factors** — Tc, Pc, Vc, ω
- **Ideal-gas heat-capacity** coefficients (Cp = a + bT + cT² + dT³)
- **Standard enthalpies/Gibbs of formation** & absolute entropies
- **Heats of combustion & vaporization**
- **Conversion-factor** master table
- **Universal constants** (R in 10+ unit systems, g, N_A, k_B, F)
- **Dimensionless-groups** master table (definition, ratio, use)
- **Periodic-table** dataset (Z, symbol, name, mass, config, electronegativity, group)
- **Pipe dimensions** (schedule 5–160, NPS ⅛–24")
- **Fitting K-values / equivalent lengths**
- **TEMA exchanger** type codes
- **Typical U-values** for exchanger service pairs
- **ASME allowable stresses** for common materials vs temperature (subset)
- **Fluid properties** at standard conditions (water, air, common solvents)

> Cite sources in a `data/ref/SOURCES.md` (Perry's, Smith Van Ness Abbott,
> Felder & Rousseau, NIST WebBook, NCEES handbook) — for attribution only; embed
> **computed/public-domain values**, not copyrighted table images.

---

## 7. SEO, Accessibility & Performance (📝)

- **SEO** — per-page `<meta name="description">`, Open Graph & Twitter cards,
  `sitemap.xml`, `robots.txt`, JSON-LD `LearningResource` schema.
- **Accessibility** — audit to WCAG 2.1 AA: color contrast in both themes, focus
  rings, skip-to-content link, `aria-live` for search counts, reduced-motion
  (already partly honored).
- **Performance** — keep the single-file page < 250 KB; inline-critical is moot
  since CSS is already one small file; add `rel="preload"` for the two woff2
  fonts; ensure `font-display: swap` (already set).
- **Print** — a dedicated print stylesheet so any topic prints as clean study notes.

---

## 8. Content Standards & Style Guide

- **Voice** — precise, plain, exam-useful. Define every symbol the first time.
- **Units** — SI primary; give USCS in parentheses where field-relevant.
- **Equations** — in `<pre class="code-block">`; align with spaces (whitespace is
  preserved only inside `<pre>` — the minifier depends on this).
- **Tables** — `ref-table`; color cells by meaning with `var(--cyan|green|amber|red|purple|muted)`.
- **Callouts** — one `info-bar ib-muted` "key takeaway" per topic, led by an emoji.
- **Cross-links** — reference sibling domains in prose ("see Transport Phenomena")
  to reinforce the web of concepts.
- **Accuracy** — every formula & constant double-checked against a standard text;
  flag anything approximate. Prefer being correct over being clever.
- **Chunking** — 2–4 `.dt` sections per topic; if a topic sprawls, split it.

---

## 9. Phased Milestones

**Phase 1 — Foundation (✅ done)**
15 domains live · engine, theme, search, notepad, progress, permalinks ·
CI build-check · README/CONTRIBUTING.

**Phase 2 — Deploy (🚧 mostly done)**
✅ `netlify.toml` (build + strict CSP + cache headers) · ✅ themed `404.html` ·
✅ `_redirects` · ✅ `robots.txt` + `sitemap.xml` · ✅ SEO + Open-Graph/Twitter meta ·
✅ `sw.js` service worker (offline PWA) + registration · ✅ inline handlers removed
(CSP `script-src 'self'`) · ✅ Netlify Forms feedback panel · 📝 custom domain + HTTPS.

**Phase 3 — Depth (📝)**
Fill each existing domain to its full planned topic list (§3). Target 8–15
topics/domain. This is the bulk of the writing.

**Phase 4 — Breadth (✅ complete)**
All planned §4 domains delivered: Electrochemical, Sustainability, Petroleum,
Pharma/GMP, Data Science, Particles, Worked Examples, Formula Sheet, Exam Prep,
Career, Nanotech, Psychrometrics, Cryogenics — plus interactive Calculators &
Self-Test Quiz domains. 30 domains total.

**Phase 5 — Interactivity (🚧 well underway)**
✅ 4 calculators (unit converter, Reynolds, ideal gas, LMTD) · ✅ self-test quiz
engine (18 Q, scored, localStorage best). 📝 remaining: more calculators (§5.2),
reference-data tools/datasets (§5.3, §6), flashcards.

**Phase 6 — Polish (🚧 underway)**
✅ SEO JSON-LD (WebSite + LearningResource) · ✅ print stylesheet · ✅ skip-to-content
link (WCAG). 📝 remaining: SVG diagrams, fuller WCAG AA audit, Lighthouse pass, glossary tooltips.

---

## 10. Maintenance & Contribution Workflow

1. Pick a topic from this plan; mark it 🚧 here.
2. Edit the relevant `data/{domain}.html` (or scaffold a new domain).
3. `python3 build.py` → open `index.html`, verify (filter, search, expand, light/dark, print).
4. Commit content + rebuilt `index.html` together (CI enforces they match).
5. Push to a `claude/*` branch → Netlify deploy preview → review → merge.
6. Mark the topic ✅ here and add the next.

**Never** hand-edit `index.html`; if it ever drifts, `reconcile_build.py` rebuilds
`data/*` from it.

---

## 11. Backlog / Nice-to-Haves 💡

- Clean `public/` publish dir (adjust `build.py` to copy assets there).
- Multi-page split if the single page grows too large (per-domain routes + shared shell).
- i18n scaffolding (the engine is text-node based; search already handles Unicode).
- "Random topic" / "topic of the day" surfacing.
- Export a domain (or the whole site) to a single PDF study packet.
- Keyboard shortcuts (`/` focus search, `e` expand-all, `t` theme).
- A lightweight in-page equation renderer (KaTeX would break offline-first/CSP —
  prefer hand-set `<pre>`/SVG or a tiny custom renderer).
- Dark-mode-aware SVG diagrams driven by CSS variables.
- Contributor "topic linter" script that checks the skeleton & class conventions.
- Anonymous, privacy-preserving "most-viewed topics" via Netlify Analytics only.

---

## 12. Changelog

### 2026-07-25 — Deploy scaffolding + first content-depth pass
**Phase 2 (Deploy) — mostly complete:**
- `netlify.toml` — `python3 build.py` build, `publish = "."`, strict CSP
  (`script-src 'self'`), long-cache immutable assets, security & permissions headers.
- `sw.js` service worker + registration in `script.js` → installable offline PWA
  (https only; `file://` skips it). Precaches the whole site, cache-first.
- Removed all inline event handlers from `index-shell.html` (search, clear,
  notepad) and wired them in `script.js`, so the CSP needs no `script-src 'unsafe-inline'`.
- SEO: meta description, canonical, Open Graph & Twitter cards, `theme-color`
  (light/dark), pointed at the live Netlify URL.
- `robots.txt`, `sitemap.xml`, `_redirects`, and a themed `404.html`.

**Phase 3 (Depth) — first pass, +10 topics (42 → 52):**
- Material Balances: Units/Dimensions/Conversion · Reactive Balances (extent ξ)
- Thermodynamics: Real Gases (compressibility Z) · Thermochemistry (heats of reaction)
- Fluid Mechanics: Fluid Statics & Manometry
- Heat Transfer: Transient Conduction (lumped capacitance & Biot)
- Mass Transfer: Two-Film Theory & Overall Coefficients
- Process Control: Second-Order Dynamics & Response
- Reaction Engineering: Residence-Time Distribution (RTD)
- Process Safety: PSM — the 14 Elements (OSHA 1910.119)

**Still open (next passes):** finish each domain's planned topic list (§3), add
the new domains (§4), build the interactive calculators & datasets (§5–6), and a
Netlify Forms feedback panel.

### 2026-07-25 — Cross-site header link
- Added an **"IT Knowledge Base"** header button (`.hdr-link-btn`, cyan→purple
  gradient) linking to `https://garrettstudies.netlify.app/` in a new tab
  (`rel="noopener noreferrer"`). Mirrors the reciprocal button added on the IT
  site in Studies PR #17. Pure HTML/CSS — no CSP change needed (link navigation
  isn't governed by CSP fetch directives).

### 2026-07-25 — Phase 3 depth pass B (+30 topics, 52 → 82)
Added 2 topics to every one of the 15 domains:
- Material Balances: Multiple-Unit Balances; Psychrometry & Humidity
- Thermodynamics: Power & Refrigeration Cycles; Fugacity & Activity Coefficients
- Fluid Mechanics: Flow Measurement; Compressible & Choked Flow
- Heat Transfer: Fins & Extended Surfaces; Radiation Exchange & View Factors
- Mass Transfer: Packed Columns (HTU/NTU); Multicomponent Shortcut (FUG)
- Reaction Engineering: Non-Isothermal Reactors; Thiele Modulus & Effectiveness
- Process Control: Frequency Response & Margins; Cascade & Feedforward
- Biochemical: Recombinant DNA (PCR/cloning/CRISPR); Sterilization & Del factor
- Transport: Shell Balances (falling film); Boundary-Layer Theory
- Unit Operations: Size Reduction & Comminution; Mixing & Agitation
- Process Safety: Toxic Release & Dispersion; Fault Tree & Event Tree
- Materials: Mechanical Properties & Failure; Heat Treatment & Transformations
- Chemistry: Chemical Equilibrium & Le Chatelier; Electrochemistry & Nernst
- Process Design: Process Simulation & Convergence; Optimization & Green Design
- Engineering Math: Laplace Transforms; Partial Differential Equations

### 2026-07-25 — Phase 4 start: 2 new domains (+6 topics, 82 → 88; 15 → 17 domains)
- **⚡ Electrochemical & Energy Engineering** — Electrode Kinetics & Butler–Volmer;
  Batteries & Fuel Cells; Electrolysis & Green Hydrogen. (lime accent, ENERGY tag)
- **📄 Formula Sheet & Quick Reference** — Core Equations cheat sheet; Dimensionless
  Groups master table; Constants & Conversion Factors. (teal accent, REF/EXAM tags)
- Wired both via domains.json + chips + style.css (chip/accent colors, new
  `ctag-energy` / `ctag-ref` tag classes). Verified filter + render, zero console errors.

### 2026-07-25 — Content + interactivity pass (+3 domains, +10 topics; 88 → 98, 17 → 20)
**Interactivity (Phase 5 start):** new **🧰 Calculators** domain with 4 live tools —
Unit Converter (pressure/energy/power/length/mass/volume/temperature), Reynolds
Number (+regime), Ideal Gas Law solver (solve for any variable), and LMTD. All
vanilla JS in `script.js` (wired via addEventListener — CSP `script-src 'self'`),
offline, with a theme-aware `.calc` widget style. Verified: 1 atm→101.325 kPa,
100 °C→212 °F, Re=100000 turbulent, ideal-gas V=22.41 L, LMTD(50,20)=32.74; zero errors.

**Breadth (Phase 4):** two more domains —
- **🌱 Energy, Sustainability & Environment** — CCUS; water/wastewater treatment; LCA & circular economy.
- **🛢️ Petroleum Refining & Petrochemicals** — crude/atmospheric distillation; cracking & hydroprocessing; the petrochemical tree.

### 2026-07-25 — Phase 5: self-test quiz + Phase 4 domains (98 → 112, 20 → 27)
- **🧠 Self-Test Quiz** — 18 curriculum-spanning MCQs with instant feedback,
  running score, explanations, and a best score saved to localStorage. Vanilla,
  offline, CSP-safe (createElement/textContent, addEventListener). Verified full
  play-through: scoring, feedback states, finish screen, best-score persistence, zero errors.
- Plus the six Phase-4 domains landed this session (Pharma/GMP, Data Science,
  Particles, Worked Examples, Exam Prep, Career).

### 2026-07-25 — Calculators #5–6, feedback form, SEO schema (112 → 115)
- **Two more calculators**: Antoine vapor-pressure (built-in coefficients for water,
  ethanol, benzene, toluene, acetone) and buffer pH (Henderson–Hasselbalch).
  Verified: water Psat(100 °C) = 760 mmHg = 1 atm; buffer pH = pKa at equal conc.
- **Phase 2 finished**: Netlify Forms feedback panel (honeypot spam-guard, no
  external scripts) added to the Career domain.
- **Phase 6 started**: JSON-LD structured data (WebSite + LearningResource) in the
  head — a data block, so it's CSP-safe and survives minification (validated).

### 2026-07-25 — Phase 4 complete: Nanotech, Psychrometrics, Cryogenics (115 → 121, 27 → 30)
- **🔬 Nanotechnology & Advanced Materials** — nanoscale phenomena/synthesis; characterization & applications.
- **💨 Psychrometrics & HVAC** — the psychrometric chart; cooling towers & air conditioning.
- **❄️ Cryogenics & Low-Temperature** — gas liquefaction (Linde/Claude, Joule–Thomson); air separation & storage.
This closes the §4 new-domain list. The reference now spans 30 domains.

### 2026-07-25 — Steam-table lookup + flashcards (121 → 123)
- **Saturated steam-table lookup** (Calculators domain): interpolates an embedded
  saturated-water table (0–250 °C) for P_sat, h_f, h_g, h_fg. Verified exact at
  100 °C (101.35 kPa, h_fg 2257) and correct interpolation at 110 °C.
- **Flashcards** (Self-Test domain): 18 term/definition cards, click-to-flip,
  shuffle, and a "★ Got it" retire-from-rotation feature saved to localStorage
  (spaced-repetition-lite). Verified flip/next/persistence; zero errors.
- Interactive roster now: 7 calculators + steam table + quiz + flashcards, all
  vanilla, offline and CSP-safe.

### 2026-07-25 — Dataset + depth + accessibility (123 → 127)
- **Physical-properties dataset** (Formula Sheet): MW, Tc, Pc, ω, boiling point for
  10 common compounds — feeds the EOS/VLE methods.
- **Depth topics**: Turbulence & Eddy Transport (Transport); Evaporation &
  Multiple-Effect (Unit Ops); Utilities, Steam Levels & Cooling Water (Design).
- **Accessibility (Phase 6)**: a keyboard/screen-reader skip-to-content link.

### 2026-07-25 — Depth pass on newer domains (127 → 131)
Continuous Manufacturing & PAT (Pharma); Real-Time Optimization & MPC (Data
Science); Catalytic Reforming & Octane (Petroleum); The Hydrogen Economy
(Sustainability). Opened Testing branch + PR #4 for the test-URL deploy.
