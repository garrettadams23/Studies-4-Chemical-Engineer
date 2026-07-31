/**
 * script.js  —  Chemical Engineering Reference  |  2026 Edition
 * =============================================================
 * toggleDomain / toggleTopic / filter / toggleAll
 * toggleTheme / updateThemeUI
 * initSnapQuote / initCloudStack / initTouchFeedback
 * URL codec helpers
 */

// ── STATE ──────────────────────────────────────────────────────────────────
let allExpanded = false;

const QUOTES = [
  "What we observe is not nature itself, but nature exposed to our method of questioning. — Werner Heisenberg",
  "Energy can neither be created nor destroyed. — First Law of Thermodynamics",
  "In any spontaneous process, the entropy of the universe increases. — Second Law of Thermodynamics",
  "Nothing in life is to be feared, it is only to be understood. — Marie Curie",
  "The important thing is to never stop questioning. — Albert Einstein",
  "Every reaction seeks its equilibrium. — Le Chatelier's principle, paraphrased",
  "The whole of science is nothing more than a refinement of everyday thinking. — Albert Einstein",
  "A theory is the more impressive the greater the simplicity of its premises. — Albert Einstein",
  "The rate of a reaction depends on the concentration of the reactants. — Law of Mass Action",
  "Measure what is measurable, and make measurable what is not so. — Galileo Galilei",
  "In matter balances, what goes in must come out or accumulate. — Conservation of mass",
  "The engineer's first problem in any design situation is to discover what the problem really is. — Anonymous",
  "Heat flows from hot to cold, never the reverse without work. — Clausius statement",
  "The dose makes the poison. — Paracelsus",
  "Structure determines function — for a molecule as for a plant. — Molecular biology maxim",
  "DNA is like a computer program but far more advanced than any software ever created. — Bill Gates",
  "Scale-up is where the elegant equations meet the messy real world. — Process engineering proverb",
  "Safety is not the absence of accidents, but the presence of defenses. — Process-safety principle"
];

// ── ACCORDION ──────────────────────────────────────────────────────────────
// Sync the disclosure state onto the header's toggle button (the accessible
// control), falling back to the header itself for safety.
function setHeaderExpanded(h, open) {
  const btn = h.querySelector(":scope > .hdr-toggle");
  (btn || h).setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleDomain(h) {
  const b = h.nextElementSibling;
  const open = b.classList.toggle("open");
  h.classList.toggle("open", open);
  setHeaderExpanded(h, open);
}

function toggleTopic(h) {
  const open = h.classList.toggle("open");
  h.nextElementSibling.classList.toggle("open", open);
  setHeaderExpanded(h, open);
  if (open) updateTopicHash(h.parentElement);
}

// ── FILTER ─────────────────────────────────────────────────────────────────
function filter(domain, chip) {
  document.querySelectorAll(".chip").forEach(c => {
    c.classList.remove("active");
    c.setAttribute("aria-pressed", "false");
  });
  chip.classList.add("active");
  chip.setAttribute("aria-pressed", "true");
  document.querySelectorAll(".domain-section").forEach(s => {
    s.classList.toggle("hidden", domain !== "all" && s.dataset.domain !== domain);
  });
}

// ── EXPAND / COLLAPSE ALL ──────────────────────────────────────────────────
function toggleAll() {
  allExpanded = !allExpanded;
  document.querySelectorAll(".domain-header, .topic-header").forEach(h => {
    h.classList.toggle("open", allExpanded);
    setHeaderExpanded(h, allExpanded);
  });
  document.querySelectorAll(".domain-body, .topic-body").forEach(b => b.classList.toggle("open", allExpanded));
  const hdrBtn = document.getElementById("hdr-expand-btn");
  if (hdrBtn) {
    hdrBtn.title = allExpanded ? "Collapse all" : "Expand all";
    hdrBtn.setAttribute("aria-checked", allExpanded ? "true" : "false");
  }
}

// ── THEME ──────────────────────────────────────────────────────────────────
function toggleTheme() {
  const doc  = document.documentElement;
  const next = doc.getAttribute("data-theme") === "light" ? "dark" : "light";
  doc.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeUI(next);
}

function updateThemeUI(theme) {
  const btn = document.getElementById("hdr-theme-btn");
  if (btn) btn.setAttribute("aria-checked", theme === "light" ? "true" : "false");
}

// ── INIT THEME (prevent flash) ─────────────────────────────────────────────
(function () {
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
})();

// ── DOM READY ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateThemeUI(document.documentElement.getAttribute("data-theme"));
  initSnapQuote();
  initCloudStack();
  initTouchFeedback();

  // Filter chips — make them keyboard-accessible (they are <div>s) and announce state
  document.querySelectorAll(".chip").forEach(c => {
    c.setAttribute("role", "button");
    c.setAttribute("tabindex", "0");
    c.setAttribute("aria-pressed", c.classList.contains("active") ? "true" : "false");
  });
  // Filter chips — event delegation on the filter bar (click + keyboard)
  document.querySelector(".filter-bar")?.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (chip) filter(chip.dataset.domain || "all", chip);
  });
  document.querySelector(".filter-bar")?.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const chip = e.target.closest(".chip");
    if (chip) { e.preventDefault(); filter(chip.dataset.domain || "all", chip); }
  });

  // Accordion — event delegation on the container
  const container = document.getElementById("domain-container");
  container?.addEventListener("click", e => {
    // Per-topic tool buttons take precedence over the toggle
    const tool = e.target.closest(".topic-bookmark, .topic-review, .topic-permalink");
    if (tool) { e.stopPropagation(); handleTopicTool(tool); return; }
    const dh = e.target.closest(".domain-header");
    if (dh) { toggleDomain(dh); return; }
    const th = e.target.closest(".topic-header");
    if (th) toggleTopic(th);
  });

  // Note: keyboard activation of a header is handled natively by its
  // .hdr-toggle <button> (Enter/Space fire a click, which the delegated
  // click handler above turns into a toggle) — no separate keydown needed.

  // Header control buttons
  document.getElementById("hdr-theme-btn")?.addEventListener("click", toggleTheme);
  document.getElementById("hdr-expand-btn")?.addEventListener("click", toggleAll);
  document.getElementById("hdr-random-btn")?.addEventListener("click", jumpToRandomTopic);

  // Search + notepad — wired here (not inline) so the CSP can stay script-src 'self'
  document.getElementById("search-input")?.addEventListener("input", e => onSearchInput(e.target.value));
  document.getElementById("search-clear")?.addEventListener("click", clearSearch);
  document.getElementById("notepad-tab")?.addEventListener("click", toggleNotepad);

  // Global keyboard shortcuts (ignored while typing in a field)
  document.addEventListener("keydown", handleGlobalKeys);

  initAccessibilityAndTools();
  initBackToTop();
  initCalculators();
  initQuiz();
  initGlossary();
  initStudyTools();
});

// ── GLOSSARY TOOLTIPS ────────────────────────────────────────────────────────
// Curated chemical-engineering terms. The first plain-text occurrence of each
// (inside concept descriptions only — never code/tables/headings) is wrapped in
// a keyboard-focusable <span class="gloss"> whose definition shows on hover/focus
// via a pure-CSS tooltip (CSP-safe: no inline handlers, no innerHTML injection).
const GLOSSARY = {
  "Reynolds number": "Dimensionless ratio of inertial to viscous forces (Re = ρvD/μ); Re < 2100 is laminar, > 4000 turbulent.",
  "activation energy": "The minimum energy barrier reactants must overcome to react (Arrhenius Eₐ).",
  "Gibbs free energy": "G = H − TS; a process is spontaneous at constant T and P when ΔG < 0.",
  "vapor pressure": "The pressure of a vapor in equilibrium with its own liquid at a given temperature.",
  "residence time": "Average time a fluid element spends in a reactor or vessel (τ = V/Q).",
  "mass transfer": "Net movement of a species from high to low concentration, driven by a gradient.",
  "steady state": "A condition where properties at each point stay constant in time (accumulation = 0).",
  "heat flux": "Rate of heat transfer per unit area (W/m²).",
  "enthalpy": "Heat content of a system at constant pressure (H = U + PV).",
  "entropy": "A measure of energy dispersal / disorder (S); the second law says it never decreases for an isolated system.",
  "azeotrope": "A mixture whose vapor and liquid share the same composition, so simple distillation cannot separate it further.",
  "fugacity": "An 'effective pressure' that corrects for non-ideal behavior in phase and reaction equilibria.",
  "stoichiometry": "The quantitative mole ratios between reactants and products in a balanced reaction.",
  "catalyst": "A substance that speeds a reaction by lowering its activation energy without being consumed.",
  "viscosity": "A fluid's resistance to shear or flow (μ).",
  "laminar": "Smooth, orderly flow in parallel layers (low Reynolds number).",
  "turbulent": "Chaotic, eddying flow with strong mixing (high Reynolds number).",
  "adiabatic": "A process that exchanges no heat with its surroundings (Q = 0).",
  "isothermal": "A process held at constant temperature.",
  "distillation": "Separation of components by differences in volatility (boiling point).",
  "reflux": "The portion of condensed overhead liquid returned to a column to sharpen a separation.",
  "sublimation": "A direct solid-to-vapor phase change without passing through the liquid state."
};

function initGlossary() {
  const descs = document.querySelectorAll(".concept-desc");
  if (!descs.length) return;
  // Longest phrases first so multi-word terms win over their sub-words.
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const remaining = new Set(terms); // wrap only the first global occurrence of each

  for (const el of descs) {
    if (!remaining.size) break;
    for (const term of terms) {
      if (!remaining.has(term)) continue;
      const re = new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !re.test(node.nodeValue)) return NodeFilter.FILTER_SKIP;
          // Skip anything already inside a gloss/code/anchor.
          if (node.parentElement.closest(".gloss, code, pre, a, .code-block")) return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const textNode = walker.nextNode();
      if (!textNode) continue;
      const m = re.exec(textNode.nodeValue);
      if (!m) continue;
      const after = textNode.splitText(m.index);
      after.nodeValue = after.nodeValue.slice(m[0].length);
      const span = document.createElement("span");
      span.className = "gloss";
      span.textContent = m[0];
      span.setAttribute("data-def", GLOSSARY[term]);
      span.setAttribute("tabindex", "0");
      span.setAttribute("role", "note");
      span.setAttribute("aria-label", m[0] + ": " + GLOSSARY[term]);
      after.parentNode.insertBefore(span, after);
      remaining.delete(term);
    }
  }
}

// ── SERVICE WORKER (offline PWA; https only — never over file://) ────────────
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ── SNAP QUOTE ─────────────────────────────────────────────────────────────
function initSnapQuote() {
  const el  = document.getElementById("sq-text");
  const box = document.getElementById("snap-quote");
  if (!el || !box) return;

  let idx = Math.floor(Math.random() * QUOTES.length);

  const show = (i) => {
    box.classList.remove("visible");
    setTimeout(() => {
      el.textContent = QUOTES[i % QUOTES.length];
      box.classList.add("visible");
    }, 600);
  };

  show(idx);
  setInterval(() => show(++idx), 8000);
}

// ── CLOUD RESPONSIBILITY MATRIX ────────────────────────────────────────────
function initCloudStack() {
  const container = document.getElementById("cloud-stack");
  if (!container) return;

  const layers = ["Applications","Data","Runtime","Middleware","OS","Virtualization","Servers","Storage","Networking"];
  const resp   = [[1,1,1,0],[1,1,1,0],[1,1,0,0],[1,1,0,0],[1,1,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]];

  layers.forEach((name, r) => {
    const row = document.createElement("div");
    row.className = "cloud-row";

    const lbl = document.createElement("div");
    lbl.className = "cloud-label";
    lbl.textContent = name;
    row.appendChild(lbl);

    resp[r].forEach((isCust, c) => {
      const cell = document.createElement("div");
      cell.className = `cloud-cell ${isCust ? `cloud-cell-c${c}` : "cloud-cell-provider"}`;
      cell.textContent = isCust ? "Customer" : "Provider";
      row.appendChild(cell);
    });
    container.appendChild(row);
  });
}

// ── TOUCH FEEDBACK ─────────────────────────────────────────────────────────
function initTouchFeedback() {
  document.querySelectorAll(".chip, .domain-header, .topic-header").forEach(el => {
    el.addEventListener("touchstart",  function() { this.classList.add("is-tapping");    }, { passive: true });
    el.addEventListener("touchend",    function() { this.classList.remove("is-tapping"); }, { passive: true });
    el.addEventListener("touchcancel", function() { this.classList.remove("is-tapping"); }, { passive: true });
  });
}

// ── ACCESSIBILITY, PERMALINKS & PROGRESS ───────────────────────────────────
const REVIEWED_PREFIX = "reviewed:";
const BOOKMARK_PREFIX = "bookmark:";

function slugify(s) {
  return s.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "topic";
}

/**
 * One pass over the DOM to make the accordion accessible and add per-topic
 * permalink + "mark reviewed" tools. Runs once at load.
 */
function initAccessibilityAndTools() {
  // Give every accordion header a single real <button> as the disclosure
  // control. We deliberately do NOT put role="button" on the header itself,
  // because the header also holds the review/permalink tool buttons — a
  // focusable control inside a role="button" is a nested-interactive WCAG
  // failure. The toggle is an invisible overlay spanning the whole header, so
  // the entire bar stays clickable while exposing one clean control to AT.
  document.querySelectorAll(".domain-header, .topic-header").forEach(h => {
    if (h.querySelector(":scope > .hdr-toggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hdr-toggle";
    btn.setAttribute("aria-expanded", h.classList.contains("open") ? "true" : "false");
    const name = (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90);
    btn.setAttribute("aria-label", (h.classList.contains("topic-header") ? "Toggle topic: " : "Toggle section: ") + name);
    h.insertBefore(btn, h.firstChild);
  });

  const usedIds = new Set();
  document.querySelectorAll(".domain-section").forEach(domain => {
    domain.querySelectorAll(".topic").forEach(topic => {
      const header = topic.querySelector(":scope > .topic-header");
      if (!header) return;
      const nameEl = header.querySelector(".topic-name");
      // Older "Beginner" topics carry the title as a bare text node in the
      // header (no .topic-name); fall back to the header's own text.
      const label = (nameEl ? nameEl.textContent : header.textContent).trim();

      // Stable, unique slug id for deep-linking
      if (!topic.id) {
        let base = slugify(label), id = base, i = 2;
        while (usedIds.has(id)) id = `${base}-${i++}`;
        usedIds.add(id);
        topic.id = id;
      }

      // Reflect stored "reviewed" state
      if (localStorage.getItem(REVIEWED_PREFIX + topic.id) === "1") {
        topic.classList.add("reviewed");
      }
      // Reflect stored "bookmarked" state
      if (localStorage.getItem(BOOKMARK_PREFIX + topic.id) === "1") {
        topic.classList.add("bookmarked");
      }

      // Inject the tool cluster (bookmark + reviewed toggle + permalink) once
      if (!header.querySelector(".topic-tools")) {
        const tools = document.createElement("span");
        tools.className = "topic-tools";

        const bookmark = document.createElement("button");
        bookmark.type = "button";
        bookmark.className = "topic-bookmark";
        bookmark.title = "Save to study list";
        bookmark.setAttribute("aria-label", "Save topic to study list");
        bookmark.textContent = "★";

        const review = document.createElement("button");
        review.type = "button";
        review.className = "topic-review";
        review.title = "Mark topic as reviewed";
        review.setAttribute("aria-label", "Mark topic as reviewed");
        review.textContent = "✓";

        const link = document.createElement("button");
        link.type = "button";
        link.className = "topic-permalink";
        link.title = "Copy link to this topic";
        link.setAttribute("aria-label", "Copy link to this topic");
        link.textContent = "🔗";

        tools.append(bookmark, review, link);
        // Insert before the chevron so it stays right-aligned
        const chev = header.querySelector(".topic-chev");
        chev ? header.insertBefore(tools, chev) : header.appendChild(tools);
      }
    });
    updateDomainProgress(domain);
  });

  // Deep-link: open + scroll to a topic referenced in the URL hash
  openHashTarget();
  window.addEventListener("hashchange", openHashTarget);
}

function handleTopicTool(btn) {
  const topic = btn.closest(".topic");
  if (!topic) return;
  if (btn.classList.contains("topic-bookmark")) {
    const on = topic.classList.toggle("bookmarked");
    const key = BOOKMARK_PREFIX + topic.id;
    on ? localStorage.setItem(key, "1") : localStorage.removeItem(key);
    if (typeof stRefreshStudyList === "function") stRefreshStudyList();
  } else if (btn.classList.contains("topic-review")) {
    const on = topic.classList.toggle("reviewed");
    const key = REVIEWED_PREFIX + topic.id;
    on ? localStorage.setItem(key, "1") : localStorage.removeItem(key);
    updateDomainProgress(topic.closest(".domain-section"));
  } else if (btn.classList.contains("topic-permalink")) {
    const url = `${location.origin}${location.pathname}#${topic.id}`;
    const done = () => { btn.classList.add("copied"); setTimeout(() => btn.classList.remove("copied"), 1200); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => { location.hash = topic.id; });
    } else {
      location.hash = topic.id; done();
    }
  }
}

/** Update the "n/m reviewed" badge on a domain header. */
function updateDomainProgress(domain) {
  if (!domain) return;
  const header = domain.querySelector(".domain-header");
  if (!header) return;
  const topics = domain.querySelectorAll(".topic");
  const done = domain.querySelectorAll(".topic.reviewed").length;
  let badge = header.querySelector(".domain-progress");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "domain-progress";
    const chev = header.querySelector(".chevron");
    chev ? header.insertBefore(badge, chev) : header.appendChild(badge);
  }
  badge.textContent = `${done}/${topics.length}`;
  badge.classList.toggle("complete", done === topics.length && topics.length > 0);
}

/** Reflect the currently-open topic in the URL without a scroll jump. */
function updateTopicHash(topic) {
  if (topic?.id) history.replaceState(null, "", `#${topic.id}`);
}

/** Expand and scroll to the topic named in location.hash, if any. */
function openHashTarget() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const topic = document.getElementById(id);
  if (!topic || !topic.classList.contains("topic")) return;
  const domain = topic.closest(".domain-section");
  const dh = domain?.querySelector(".domain-header");
  dh?.classList.add("open");
  domain?.querySelector(".domain-body")?.classList.add("open");
  if (dh) setHeaderExpanded(dh, true);
  const th = topic.querySelector(".topic-header");
  th?.classList.add("open");
  if (th) setHeaderExpanded(th, true);
  topic.querySelector(".topic-body")?.classList.add("open");
  topic.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── RANDOM TOPIC ─────────────────────────────────────────────────────────────
// Open a random topic (and its domain), update the hash, and scroll to it.
function jumpToRandomTopic() {
  const topics = document.querySelectorAll(".topic[id]");
  if (!topics.length) return;
  const topic = topics[Math.floor(Math.random() * topics.length)];
  // Clear any active filter/search so the pick is guaranteed visible
  if (typeof clearSearch === "function") {
    const si = document.getElementById("search-input");
    if (si && si.value) clearSearch();
  }
  location.hash = topic.id;   // openHashTarget (hashchange) expands + scrolls
  openHashTarget();
}

// ── GLOBAL KEYBOARD SHORTCUTS ────────────────────────────────────────────────
// "/" focus search · "e" expand/collapse all · "t" toggle theme · "r" random ·
// Esc clears the search. Ignored while typing in a field (Esc still clears search).
function handleGlobalKeys(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // While a study-tools modal is open, let it own the keyboard.
  if (_stOverlay && !_stOverlay.hidden) return;
  const t = e.target;
  const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" || t.isContentEditable);

  if (e.key === "Escape") {
    const si = document.getElementById("search-input");
    if (si && si.value) { clearSearch(); si.blur(); e.preventDefault(); }
    else if (typing && t.blur) t.blur();
    return;
  }
  if (typing) return;

  switch (e.key) {
    case "/":
      { const si = document.getElementById("search-input");
        if (si) { e.preventDefault(); si.focus(); si.select?.(); } }
      break;
    case "e": case "E": e.preventDefault(); toggleAll(); break;
    case "t": case "T": e.preventDefault(); toggleTheme(); break;
    case "r": case "R": e.preventDefault(); jumpToRandomTopic(); break;
    default: break;
  }
}

// ── BACK TO TOP ─────────────────────────────────────────────────────────────
function initBackToTop() {
  const btn = document.createElement("button");
  btn.id = "back-to-top";
  btn.type = "button";
  btn.title = "Back to top";
  btn.setAttribute("aria-label", "Back to top");
  btn.textContent = "↑";
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(btn);

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      btn.classList.toggle("visible", window.scrollY > window.innerHeight * 1.5);
      ticking = false;
    });
  }, { passive: true });
}

// ── URL CODEC WIDGET ───────────────────────────────────────────────────────
const _in  = () => document.getElementById("url-codec-input")?.value || "";
const _out = (v) => { const el = document.getElementById("url-codec-output"); if (el) el.value = v; };
const _msg = (txt, color = "var(--muted)") => {
  const el = document.getElementById("url-codec-msg");
  if (!el) return;
  el.textContent = txt;
  el.style.color = color;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.textContent = "", 2500);
};

function urlToolEncode() {
  const raw = _in();
  if (!raw) return _msg("⚠ Nothing to encode.", "var(--amber)");
  try { _out(encodeURIComponent(raw)); _msg("✓ Encoded.", "var(--green)"); }
  catch (e) { _msg("✗ " + e.message, "var(--red)"); }
}

function urlToolDecode() {
  const raw = _in();
  if (!raw) return _msg("⚠ Nothing to decode.", "var(--amber)");
  try { _out(decodeURIComponent(raw.replace(/\+/g, " "))); _msg("✓ Decoded.", "var(--cyan)"); }
  catch (e) { _msg("✗ Malformed encoding.", "var(--red)"); }
}

function urlToolCopy() {
  const el = document.getElementById("url-codec-output");
  if (!el?.value) return _msg("⚠ Nothing to copy.", "var(--amber)");
  navigator.clipboard.writeText(el.value).then(() => _msg("✓ Copied.", "var(--green)"));
}

function urlToolClear() {
  const i = document.getElementById("url-codec-input");
  const o = document.getElementById("url-codec-output");
  if (i) i.value = "";
  if (o) o.value = "";
  _msg("");
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────

/** Nodes we injected <mark> highlights into during the current search. */
const _highlighted = new Set();

/** Lowercased textContent per topic, computed once (content never changes). */
const _topicTextCache = new WeakMap();
function topicSearchText(topic) {
  let t = _topicTextCache.get(topic);
  if (t === undefined) {
    t = topic.textContent.toLowerCase();
    _topicTextCache.set(topic, t);
  }
  return t;
}

/** Cached domain sections (built once on first search). */
let _domainSections = null;
function domainSections() {
  if (!_domainSections) _domainSections = [...document.querySelectorAll(".domain-section")];
  return _domainSections;
}

/** Remove all <mark class="sh"> wrappers, restoring the original text nodes. */
function clearHighlights() {
  _highlighted.forEach(el => {
    el.querySelectorAll("mark.sh").forEach(m => {
      m.replaceWith(document.createTextNode(m.textContent));
    });
    el.normalize(); // merge adjacent text nodes back together
  });
  _highlighted.clear();
}

/**
 * Wrap every occurrence of `term` inside `el` in <mark class="sh">.
 * Walks real text nodes only — never touches tags or attributes, so it
 * cannot corrupt the markup the way an innerHTML string-replace would.
 */
function highlightIn(el, term) {
  const termLower = term.toLowerCase();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeValue.toLowerCase().includes(termLower)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const targets = [];
  while (walker.nextNode()) targets.push(walker.currentNode);
  if (!targets.length) return;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "gi");
  targets.forEach(node => {
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const mark = document.createElement("mark");
      mark.className = "sh";
      mark.textContent = m[0];
      frag.appendChild(mark);
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++; // guard against zero-width matches
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  _highlighted.add(el);
}

/**
 * Immediate search runner. Prefer the debounced onSearchInput() for keystrokes.
 * @param {string} raw - Current value of the search input.
 */
function runSearch(raw) {
  const term = raw.trim();
  const clearBtn = document.getElementById("search-clear");
  const countEl  = document.getElementById("search-count");

  if (clearBtn) clearBtn.classList.toggle("visible", term.length > 0);

  // Reset previous highlights and visibility
  clearHighlights();
  document.querySelectorAll(".topic.search-hidden, .domain-section.search-hidden")
    .forEach(el => el.classList.remove("search-hidden"));

  if (term.length < 2) {
    if (countEl) countEl.textContent = "";
    return;
  }

  const termLower = term.toLowerCase();
  let matchCount = 0;

  domainSections().forEach(domain => {
    let domainHasMatch = false;

    domain.querySelectorAll(".topic").forEach(topic => {
      if (topicSearchText(topic).includes(termLower)) {
        domainHasMatch = true;
        matchCount++;

        // Auto-expand the topic and its parent domain
        topic.querySelector(".topic-header")?.classList.add("open");
        topic.querySelector(".topic-body")?.classList.add("open");
        domain.querySelector(".domain-header")?.classList.add("open");
        domain.querySelector(".domain-body")?.classList.add("open");

        // Highlight only the text-bearing nodes of matched topics
        topic.querySelectorAll(
          ".topic-name, .concept-title, .concept-label, .concept-desc, .dw, .dt, .code-block"
        ).forEach(n => highlightIn(n, term));
      } else {
        topic.classList.add("search-hidden");
      }
    });

    if (!domainHasMatch) domain.classList.add("search-hidden");
  });

  if (countEl) countEl.textContent = matchCount ? `${matchCount} match${matchCount !== 1 ? "es" : ""}` : "no matches";
}

/** Debounced entry point wired to the search box's oninput. */
let _searchTimer = null;
function onSearchInput(raw) {
  // Toggle the clear button immediately for responsiveness
  const clearBtn = document.getElementById("search-clear");
  if (clearBtn) clearBtn.classList.toggle("visible", raw.trim().length > 0);
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => runSearch(raw), 180);
}

/** Backwards-compatible alias (older markup may call searchContent). */
function searchContent(raw) { onSearchInput(raw); }

/** Clear search input and reset view immediately. */
function clearSearch() {
  clearTimeout(_searchTimer);
  const input = document.getElementById("search-input");
  if (input) { input.value = ""; input.focus(); }
  runSearch("");
}

// ── NOTEPAD SLIDE TAB ────────────────────────────────────────────────────────
// Vanilla, dependency-free notepad backed by localStorage. Notes persist in the
// visitor's own browser and sync live across their open tabs via the `storage`
// event — no React, no Babel, no CDN, and it works over file://.

const NP_MAX_CHARS  = 500;
const NP_STORE_KEY  = "shared-notepad-notes";
const NP_SESSION_KEY = "notepad-session-id";
const NP_AUTHOR_KEY = "notepad-author";

let _notepadMounted = false;

function npSessionId() {
  let id = sessionStorage.getItem(NP_SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(NP_SESSION_KEY, id);
  }
  return id;
}

function npLoad() {
  try {
    const raw = localStorage.getItem(NP_STORE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function npSave(notes) {
  try { localStorage.setItem(NP_STORE_KEY, JSON.stringify(notes)); }
  catch (e) { console.error("Notepad storage write failed", e); }
}

function npRelativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function toggleNotepad() {
  const panel = document.getElementById("notepad-panel");
  const tab   = document.getElementById("notepad-tab");
  const open  = panel.classList.toggle("open");
  tab.classList.toggle("open", open);
  if (open && !_notepadMounted) {
    _notepadMounted = true;
    mountNotepad(document.getElementById("notepad-root"));
  }
}

function mountNotepad(root) {
  const sessionId = npSessionId();
  let notes = npLoad();
  let sort = "newest";
  let filter = "";

  // Build the static skeleton with textContent-safe DOM (no innerHTML of data).
  root.textContent = "";
  root.insertAdjacentHTML("beforeend", `
    <div class="np-wrap">
      <div class="np-hdr">
        <span class="np-hdr-icon">📋</span>
        <div>
          <div class="np-hdr-title">Notepad</div>
          <div class="np-hdr-sub">Saved in this browser · synced across your tabs</div>
        </div>
      </div>
      <div class="np-compose">
        <div class="np-compose-top">
          <input class="np-name" type="text" placeholder="Your name (optional)" maxlength="30" />
          <span class="np-char">0/${NP_MAX_CHARS}</span>
        </div>
        <textarea class="np-input" rows="3" placeholder="Leave a note for yourself…"></textarea>
        <div class="np-compose-footer">
          <span class="np-hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> to post</span>
          <button class="np-post" type="button" disabled>POST NOTE ▶</button>
        </div>
      </div>
      <div class="np-toolbar">
        <span class="np-count"></span>
        <input class="np-filter" type="text" placeholder="⌕ filter notes…" />
        <button class="np-sort active" type="button" data-sort="newest">NEWEST</button>
        <button class="np-sort" type="button" data-sort="oldest">OLDEST</button>
      </div>
      <div class="np-list"></div>
      <div class="np-toast"></div>
    </div>
  `);

  const nameEl   = root.querySelector(".np-name");
  const charEl   = root.querySelector(".np-char");
  const inputEl  = root.querySelector(".np-input");
  const postBtn  = root.querySelector(".np-post");
  const countEl  = root.querySelector(".np-count");
  const filterEl = root.querySelector(".np-filter");
  const listEl   = root.querySelector(".np-list");
  const toastEl  = root.querySelector(".np-toast");
  const sortBtns = [...root.querySelectorAll(".np-sort")];

  nameEl.value = localStorage.getItem(NP_AUTHOR_KEY) || "";

  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function updateCharCount() {
    const n = inputEl.value.length;
    charEl.textContent = `${n}/${NP_MAX_CHARS}`;
    charEl.classList.toggle("over", n > NP_MAX_CHARS);
    charEl.classList.toggle("warn", n > NP_MAX_CHARS * 0.85 && n <= NP_MAX_CHARS);
    postBtn.disabled = inputEl.value.trim().length === 0 || n > NP_MAX_CHARS;
  }

  function renderList() {
    const q = filter.toLowerCase();
    const shown = notes
      .filter(n => !q || n.body.toLowerCase().includes(q) || (n.author || "").toLowerCase().includes(q))
      .sort((a, b) => sort === "newest" ? b.ts - a.ts : a.ts - b.ts);

    countEl.textContent = `${notes.length} note${notes.length !== 1 ? "s" : ""}`;
    listEl.textContent = "";

    if (!shown.length) {
      const empty = document.createElement("div");
      empty.className = "np-empty";
      empty.textContent = filter
        ? "No notes match that filter."
        : "No notes yet — jot something down.";
      listEl.appendChild(empty);
      return;
    }

    shown.forEach(n => {
      const own = n.sessionId === sessionId;
      const card = document.createElement("div");
      card.className = "np-card" + (own ? " own" : "");

      const meta = document.createElement("div");
      meta.className = "np-meta";
      const author = document.createElement("span");
      author.className = "np-author";
      author.textContent = n.author || "Anonymous";
      const time = document.createElement("span");
      time.className = "np-time";
      time.textContent = npRelativeTime(n.ts);
      meta.append(author, time);
      if (own) {
        const badge = document.createElement("span");
        badge.className = "np-badge";
        badge.textContent = "YOU";
        const del = document.createElement("button");
        del.className = "np-del";
        del.type = "button";
        del.title = "Delete";
        del.textContent = "✕";
        del.addEventListener("click", () => deleteNote(n.id));
        meta.append(badge, del);
      }

      const bodyEl = document.createElement("div");
      bodyEl.className = "np-body";
      bodyEl.textContent = n.body; // textContent — never interprets note as HTML

      card.append(meta, bodyEl);
      listEl.appendChild(card);
    });
  }

  function postNote() {
    const body = inputEl.value.trim();
    const author = nameEl.value.trim() || "Anonymous";
    if (!body || body.length > NP_MAX_CHARS) return;
    if (nameEl.value.trim()) localStorage.setItem(NP_AUTHOR_KEY, nameEl.value.trim());

    notes = npLoad(); // re-read so we don't clobber a note from another tab
    notes.unshift({
      id: Math.random().toString(36).slice(2),
      author, body, ts: Date.now(), sessionId,
    });
    npSave(notes);
    inputEl.value = "";
    updateCharCount();
    renderList();
    showToast("✓ note posted");
  }

  function deleteNote(id) {
    notes = npLoad().filter(n => n.id !== id);
    npSave(notes);
    renderList();
    showToast("note removed");
  }

  // Wire events
  inputEl.addEventListener("input", updateCharCount);
  inputEl.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); postNote(); }
  });
  postBtn.addEventListener("click", postNote);
  filterEl.addEventListener("input", () => { filter = filterEl.value.trim(); renderList(); });
  sortBtns.forEach(btn => btn.addEventListener("click", () => {
    sort = btn.dataset.sort;
    sortBtns.forEach(b => b.classList.toggle("active", b === btn));
    renderList();
  }));

  // Live sync across the visitor's own tabs
  window.addEventListener("storage", e => {
    if (e.key === NP_STORE_KEY) { notes = npLoad(); renderList(); }
  });

  updateCharCount();
  renderList();
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE CALCULATORS  (vanilla · offline · CSP-safe — all logic lives here,
// never inline, so the page keeps script-src 'self'.)
// ─────────────────────────────────────────────────────────────────────────────

/** Format a number for display: fixed for normal magnitudes, exponential for extremes. */
function calcFmt(x) {
  if (x === null || x === undefined || !isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e6)) return x.toExponential(4);
  return parseFloat(x.toPrecision(6)).toString();
}

// Conversion factors → SI base unit for each category.
const UC_UNITS = {
  Pressure: { Pa: 1, kPa: 1000, bar: 1e5, atm: 101325, psi: 6894.757, mmHg: 133.322, torr: 133.322 },
  Energy:   { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, BTU: 1055.06, kWh: 3.6e6 },
  Power:    { W: 1, kW: 1000, MW: 1e6, hp: 745.7, "BTU/h": 0.293071 },
  Length:   { m: 1, cm: 0.01, mm: 0.001, km: 1000, in: 0.0254, ft: 0.3048, mi: 1609.344 },
  Mass:     { kg: 1, g: 0.001, mg: 1e-6, "t (metric)": 1000, lb: 0.453592, oz: 0.0283495 },
  Volume:   { "m³": 1, L: 0.001, mL: 1e-6, "gal (US)": 0.00378541, "ft³": 0.0283168, bbl: 0.158987 },
};

function ucTempToK(v, from) {
  if (from === "°C") return v + 273.15;
  if (from === "°F") return (v - 32) * 5 / 9 + 273.15;
  if (from === "°R") return v * 5 / 9;
  return v; // K
}
function ucTempFromK(K, to) {
  if (to === "°C") return K - 273.15;
  if (to === "°F") return (K - 273.15) * 9 / 5 + 32;
  if (to === "°R") return K * 9 / 5;
  return K; // K
}

function calcFillSelect(sel, opts, selectedIndex) {
  sel.textContent = "";
  opts.forEach((o, i) => {
    const e = document.createElement("option");
    e.value = o;
    e.textContent = o;
    if (i === selectedIndex) e.selected = true;
    sel.appendChild(e);
  });
}

function initUnitConverter() {
  const cat = document.getElementById("uc-cat");
  const val = document.getElementById("uc-val");
  const from = document.getElementById("uc-from");
  const to = document.getElementById("uc-to");
  const out = document.getElementById("uc-out");
  if (!cat || !val || !from || !to || !out) return;

  const cats = [...Object.keys(UC_UNITS), "Temperature"];
  const unitsFor = c => (c === "Temperature" ? ["°C", "°F", "K", "°R"] : Object.keys(UC_UNITS[c]));

  function convert() {
    const c = cat.value;
    const v = parseFloat(val.value);
    if (isNaN(v)) { out.textContent = "—"; return; }
    let r;
    if (c === "Temperature") r = ucTempFromK(ucTempToK(v, from.value), to.value);
    else { const f = UC_UNITS[c]; r = (v * f[from.value]) / f[to.value]; }
    out.textContent = calcFmt(r) + " " + to.value;
  }
  function rebuildUnits() {
    const u = unitsFor(cat.value);
    calcFillSelect(from, u, 0);
    calcFillSelect(to, u, Math.min(1, u.length - 1));
    convert();
  }

  calcFillSelect(cat, cats, 0);
  rebuildUnits();
  cat.addEventListener("change", rebuildUnits);
  [val, from, to].forEach(el => el.addEventListener("input", convert));
}

function initReynolds() {
  const rho = document.getElementById("re-rho");
  const v = document.getElementById("re-v");
  const d = document.getElementById("re-d");
  const mu = document.getElementById("re-mu");
  const out = document.getElementById("re-out");
  const reg = document.getElementById("re-regime");
  if (!rho || !v || !d || !mu || !out) return;

  function calc() {
    const vals = [rho, v, d, mu].map(e => parseFloat(e.value));
    if (vals.some(isNaN) || vals[3] === 0) { out.textContent = "—"; if (reg) reg.textContent = ""; return; }
    const Re = (vals[0] * vals[1] * vals[2]) / vals[3];
    out.textContent = calcFmt(Re);
    if (reg) reg.textContent = Re < 2100 ? "· laminar" : Re < 4000 ? "· transitional" : "· turbulent";
  }
  [rho, v, d, mu].forEach(e => e.addEventListener("input", calc));
  calc();
}

function initIdealGas() {
  const solve = document.getElementById("ig-solve");
  const P = document.getElementById("ig-P");
  const V = document.getElementById("ig-V");
  const n = document.getElementById("ig-n");
  const T = document.getElementById("ig-T");
  const out = document.getElementById("ig-out");
  const lbl = document.getElementById("ig-lbl");
  if (!solve || !P || !V || !n || !T || !out) return;
  const R = 8.314; // L·kPa/(mol·K)  ==  J/(mol·K)
  const map = { P, V, n, T };
  const units = { P: "kPa", V: "L", n: "mol", T: "K" };

  function calc() {
    const s = solve.value;
    Object.entries(map).forEach(([k, el]) => { el.disabled = k === s; });
    const p = parseFloat(P.value), v = parseFloat(V.value), nn = parseFloat(n.value), t = parseFloat(T.value);
    let res;
    if (s === "P") res = (nn * R * t) / v;
    else if (s === "V") res = (nn * R * t) / p;
    else if (s === "n") res = (p * v) / (R * t);
    else res = (p * v) / (nn * R);
    if (lbl) lbl.textContent = s + " =";
    out.textContent = isFinite(res) ? calcFmt(res) + " " + units[s] : "—";
  }
  [P, V, n, T].forEach(e => e.addEventListener("input", calc));
  solve.addEventListener("change", calc);
  calc();
}

function initLMTD() {
  const t1 = document.getElementById("lm-t1");
  const t2 = document.getElementById("lm-t2");
  const out = document.getElementById("lm-out");
  if (!t1 || !t2 || !out) return;
  function calc() {
    const a = parseFloat(t1.value), b = parseFloat(t2.value);
    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) { out.textContent = "—"; return; }
    const lmtd = Math.abs(a - b) < 1e-9 ? a : (a - b) / Math.log(a / b);
    out.textContent = calcFmt(lmtd);
  }
  [t1, t2].forEach(e => e.addEventListener("input", calc));
  calc();
}

// Antoine coefficients for log10(P[mmHg]) = A − B/(C + T[°C]).
const ANTOINE = {
  Water:   { A: 8.07131, B: 1730.63, C: 233.426 },
  Ethanol: { A: 8.20417, B: 1642.89, C: 230.300 },
  Benzene: { A: 6.90565, B: 1211.033, C: 220.790 },
  Toluene: { A: 6.95464, B: 1344.800, C: 219.482 },
  Acetone: { A: 7.02447, B: 1161.000, C: 224.000 },
};

function initAntoine() {
  const sel = document.getElementById("an-comp");
  const T = document.getElementById("an-T");
  const out = document.getElementById("an-out");
  if (!sel || !T || !out) return;
  calcFillSelect(sel, Object.keys(ANTOINE), 0);
  function calc() {
    const c = ANTOINE[sel.value];
    const t = parseFloat(T.value);
    if (!c || isNaN(t)) { out.textContent = "—"; return; }
    const mmHg = Math.pow(10, c.A - c.B / (c.C + t));
    out.textContent = calcFmt(mmHg) + " mmHg  (" + calcFmt(mmHg * 0.133322) + " kPa)";
  }
  sel.addEventListener("change", calc);
  T.addEventListener("input", calc);
  calc();
}

function initPH() {
  const pKa = document.getElementById("ph-pka");
  const A = document.getElementById("ph-a");
  const HA = document.getElementById("ph-ha");
  const out = document.getElementById("ph-out");
  if (!pKa || !A || !HA || !out) return;
  function calc() {
    const k = parseFloat(pKa.value), a = parseFloat(A.value), ha = parseFloat(HA.value);
    if ([k, a, ha].some(isNaN) || ha <= 0 || a <= 0) { out.textContent = "—"; return; }
    out.textContent = calcFmt(k + Math.log10(a / ha));
  }
  [pKa, A, HA].forEach(e => e.addEventListener("input", calc));
  calc();
}

// Saturated water/steam table: [T °C, P kPa, hf kJ/kg, hg kJ/kg].
const STEAM = [
  [0.01, 0.6113, 0.0, 2501.3], [10, 1.2276, 42.0, 2519.8], [20, 2.339, 83.9, 2538.1],
  [30, 4.246, 125.7, 2556.3], [40, 7.384, 167.5, 2574.3], [50, 12.35, 209.3, 2592.1],
  [60, 19.94, 251.1, 2609.6], [70, 31.19, 293.0, 2626.8], [80, 47.39, 334.9, 2643.7],
  [90, 70.14, 376.9, 2660.1], [100, 101.35, 419.0, 2676.1], [120, 198.53, 503.7, 2706.3],
  [140, 361.3, 589.1, 2733.9], [160, 617.8, 675.5, 2758.1], [180, 1002.1, 763.2, 2778.2],
  [200, 1554.9, 852.4, 2793.2], [220, 2318, 943.6, 2802.1], [250, 3973, 1085.4, 2801.5],
];

function initSteamTable() {
  const T = document.getElementById("st-T");
  const out = document.getElementById("st-out");
  if (!T || !out) return;
  function interp(t) {
    const d = STEAM;
    if (t <= d[0][0]) return d[0];
    if (t >= d[d.length - 1][0]) return d[d.length - 1];
    for (let i = 0; i < d.length - 1; i++) {
      if (t >= d[i][0] && t <= d[i + 1][0]) {
        const f = (t - d[i][0]) / (d[i + 1][0] - d[i][0]);
        return d[i].map((v, k) => v + f * (d[i + 1][k] - v));
      }
    }
    return d[d.length - 1];
  }
  function calc() {
    const t = parseFloat(T.value);
    if (isNaN(t)) { out.textContent = "—"; return; }
    const [, P, hf, hg] = interp(t);
    out.textContent = `P_sat ${calcFmt(P)} kPa · h_f ${calcFmt(hf)} · h_g ${calcFmt(hg)} · h_fg ${calcFmt(hg - hf)} kJ/kg`;
  }
  T.addEventListener("input", calc);
  calc();
}

const FLASHCARDS = [
  { front: "Reynolds number", back: "Re = ρvD/μ — inertial vs viscous; <2100 laminar, >4000 turbulent" },
  { front: "Bernoulli equation", back: "P/ρ + v²/2 + gz = constant (frictionless mechanical-energy balance)" },
  { front: "First law (open, steady)", back: "Q̇ − Ẇs = Σṁ(h + v²/2 + gz)_out − _in" },
  { front: "Gibbs free energy", back: "G = H − TS; ΔG<0 spontaneous; ΔG° = −RT·ln K" },
  { front: "Arrhenius equation", back: "k = A·exp(−Ea/RT); rate roughly doubles per +10 °C" },
  { front: "CSTR design equation", back: "V = F_A0·X / (−r_A)" },
  { front: "PFR design equation", back: "V = F_A0·∫ dX/(−r_A)" },
  { front: "LMTD", back: "(ΔT₁−ΔT₂)/ln(ΔT₁/ΔT₂); Q = U·A·F·ΔT_lm" },
  { front: "Fick's first law", back: "J = −D·dC/dz (diffusion down a concentration gradient)" },
  { front: "Relative volatility α", back: "(y_A/x_A)/(y_B/x_B); α=1 → azeotrope (no ordinary distillation)" },
  { front: "Raoult's law", back: "y_i·P = x_i·P_i^sat (ideal vapor-liquid equilibrium)" },
  { front: "Thiele modulus", back: "φ = L·√(k/D_eff); φ≫1 → pore-diffusion limited (η ≈ 1/φ)" },
  { front: "NPSH rule", back: "NPSH_available > NPSH_required to avoid pump cavitation" },
  { front: "Biot number", back: "Bi = hL/k; <0.1 → lumped-capacitance model valid" },
  { front: "Henderson–Hasselbalch", back: "pH = pKa + log([A⁻]/[HA])" },
  { front: "DNA base pairing", back: "A=T (2 H-bonds), G≡C (3 H-bonds); antiparallel double helix" },
  { front: "Damköhler number", back: "Da = reaction rate / transport rate" },
  { front: "Green-chemistry E-factor", back: "kg waste / kg product — lower is greener" },
  { front: "Joule–Thomson coefficient", back: "μ_JT = (∂T/∂P)_H; >0 cools on throttling (below inversion T)" },
  { front: "Fenske equation", back: "N_min = ln[(x_D/(1−x_D))((1−x_B)/x_B)] / ln α (total reflux)" },
  { front: "Nernst equation", back: "E = E° − (RT/nF)·ln Q; ~59 mV/decade per e⁻ at 25 °C" },
  { front: "Faraday's law", back: "m = I·t·M/(n·F); F = 96,485 C per mol e⁻" },
  { front: "Humidity ratio", back: "W = 0.622·p_w/(P − p_w) [kg water / kg dry air]" },
  { front: "Magnus saturation pressure", back: "p_ws = 0.61094·exp[17.625T/(T+243.04)] kPa (T in °C)" },
  { front: "Bond's law (grinding)", back: "E = Wᵢ(10/√P₈₀ − 10/√F₈₀); ties energy to size reduction" },
  { front: "Net Present Value", back: "NPV = −C₀ + Σ CFₜ/(1+i)ᵗ; accept if NPV > 0" },
  { front: "Quantum confinement", back: "Smaller nanoparticle → larger band gap → bluer emission" },
  { front: "Current efficiency", back: "η = actual product mass / theoretical (Faraday); rest lost to side reactions" },
];

function initFlashcards() {
  const root = document.getElementById("flash-root");
  if (!root) return;
  const KEY = "flash-known";
  const ce = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const known = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); } };
  const activeIdx = () => { const k = known(); const a = [...FLASHCARDS.keys()].filter(i => !k.has(i)); return a.length ? a : [...FLASHCARDS.keys()]; };
  let order, cur, showBack;

  function start() { order = quizShuffle(activeIdx()); cur = 0; showBack = false; render(); }
  function render() {
    root.textContent = "";
    const card = FLASHCARDS[order[cur]];
    const wrap = ce("div", "flash");
    const c = ce("div", "flash-card" + (showBack ? " back" : ""), showBack ? card.back : card.front);
    c.addEventListener("click", () => { showBack = !showBack; render(); });
    const ctr = ce("div", "flash-controls");
    const flip = ce("button", "quiz-btn", showBack ? "Show term" : "Flip ⟳"); flip.type = "button";
    flip.addEventListener("click", () => { showBack = !showBack; render(); });
    const next = ce("button", "quiz-btn", "Next ▶"); next.type = "button";
    next.addEventListener("click", () => { cur = (cur + 1) % order.length; showBack = false; render(); });
    const got = ce("button", "quiz-btn", "★ Got it"); got.type = "button";
    got.addEventListener("click", () => { const k = known(); k.add(order[cur]); localStorage.setItem(KEY, JSON.stringify([...k])); start(); });
    const learned = FLASHCARDS.length - activeIdx().length;
    const meta = ce("div", "flash-meta", `Card ${cur + 1}/${order.length} · ${learned} learned`);
    ctr.append(flip, next, got, meta);
    wrap.append(c, ctr);
    if (learned > 0) {
      const reset = ce("button", "quiz-btn", "↺ Reset learned"); reset.type = "button";
      reset.addEventListener("click", () => { localStorage.removeItem(KEY); start(); });
      wrap.append(reset);
    }
    root.appendChild(wrap);
  }
  start();
}

function initFriction() {
  const re = document.getElementById("ff-re");
  const rr = document.getElementById("ff-rr");
  const out = document.getElementById("ff-out");
  if (!re || !rr || !out) return;
  function calc() {
    const Re = parseFloat(re.value), eD = parseFloat(rr.value);
    if (isNaN(Re) || isNaN(eD) || Re <= 0 || eD < 0) { out.textContent = "—"; return; }
    if (Re < 2100) {
      out.textContent = calcFmt(64 / Re) + "  (laminar · 64/Re)";
    } else {
      const inv = -1.8 * Math.log10(Math.pow(eD / 3.7, 1.11) + 6.9 / Re);
      out.textContent = calcFmt(1 / (inv * inv)) + "  (turbulent · Haaland)";
    }
  }
  [re, rr].forEach(e => e.addEventListener("input", calc));
  calc();
}

// IUPAC standard atomic weights (g/mol) for the common elements. Enough to
// cover essentially anything typed on a chemical-engineering site.
const ATOMIC_WEIGHTS = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007,
  O: 15.999, F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085,
  P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078, Sc: 44.956,
  Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693,
  Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904,
  Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95,
  Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71,
  Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91,
  Ce: 140.12, W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97,
  Hg: 200.59, Tl: 204.38, Pb: 207.2, Bi: 208.98, U: 238.03,
};

// Parse a chemical formula (with parentheses/brackets and subscripts) into an
// element→count map, throwing a friendly error on anything malformed.
function parseFormula(formula) {
  let i = 0;
  const s = formula.replace(/\s+/g, "");
  function count() {
    let n = "";
    while (i < s.length && s[i] >= "0" && s[i] <= "9") { n += s[i]; i++; }
    return n === "" ? 1 : parseInt(n, 10);
  }
  function group() {
    const acc = {};
    while (i < s.length) {
      const ch = s[i];
      if (ch === "(" || ch === "[") {
        i++;
        const inner = group();
        if (s[i] !== ")" && s[i] !== "]") throw new Error("unbalanced parentheses");
        i++;
        const m = count();
        for (const el in inner) acc[el] = (acc[el] || 0) + inner[el] * m;
      } else if (ch === ")" || ch === "]") {
        break;
      } else if (ch >= "A" && ch <= "Z") {
        let sym = ch; i++;
        if (i < s.length && s[i] >= "a" && s[i] <= "z") { sym += s[i]; i++; }
        if (!(sym in ATOMIC_WEIGHTS)) throw new Error("unknown element “" + sym + "”");
        const n = count();
        acc[sym] = (acc[sym] || 0) + n;
      } else {
        throw new Error("unexpected character “" + ch + "”");
      }
    }
    return acc;
  }
  if (!s) throw new Error("empty formula");
  const counts = group();
  if (i < s.length) throw new Error("unbalanced parentheses");
  return counts;
}

function initMolarMass() {
  const inp = document.getElementById("mw-formula");
  const out = document.getElementById("mw-out");
  const note = document.getElementById("mw-note");
  if (!inp || !out) return;
  function calc() {
    const raw = inp.value.trim();
    if (!raw) { out.textContent = "—"; if (note) note.textContent = ""; return; }
    try {
      const counts = parseFormula(raw);
      let mass = 0;
      const parts = [];
      for (const el in counts) {
        const contrib = ATOMIC_WEIGHTS[el] * counts[el];
        mass += contrib;
        parts.push(el + (counts[el] > 1 ? counts[el] : "") + " " + calcFmt(contrib) + " g/mol");
      }
      out.textContent = calcFmt(mass) + " g/mol";
      if (note) note.textContent = "🧮 " + parts.join("  ·  ");
    } catch (e) {
      out.textContent = "—";
      if (note) note.textContent = "⚠️ " + e.message;
    }
  }
  inp.addEventListener("input", calc);
  calc();
}

function initPsychrometrics() {
  const t = document.getElementById("psy-t");
  const rh = document.getElementById("psy-rh");
  const pT = document.getElementById("psy-p");
  const oPws = document.getElementById("psy-pws");
  const oPw = document.getElementById("psy-pw");
  const oW = document.getElementById("psy-w");
  const oDp = document.getElementById("psy-dp");
  const oH = document.getElementById("psy-h");
  if (!t || !rh || !pT || !oPws) return;
  // Magnus saturation vapour pressure over water (kPa), T in °C.
  const pSat = T => 0.61094 * Math.exp((17.625 * T) / (T + 243.04));
  function calc() {
    const T = parseFloat(t.value), RH = parseFloat(rh.value), P = parseFloat(pT.value);
    const set = (el, v) => { if (el) el.textContent = v; };
    if ([T, RH, P].some(isNaN) || P <= 0 || RH < 0) {
      [oPws, oPw, oW, oDp, oH].forEach(e => set(e, "—")); return;
    }
    const pws = pSat(T);
    const pw = (RH / 100) * pws;
    const W = pw < P ? 0.62198 * (pw / (P - pw)) : NaN;      // kg water / kg dry air
    const enth = 1.006 * T + W * (2501 + 1.86 * T);          // kJ / kg dry air
    // Inverse Magnus for dew point (°C).
    let dp = NaN;
    if (pw > 0) { const a = Math.log(pw / 0.61094); dp = (243.04 * a) / (17.625 - a); }
    set(oPws, calcFmt(pws) + " kPa");
    set(oPw, calcFmt(pw) + " kPa");
    set(oW, isFinite(W) ? calcFmt(W) + " kg/kg" : "—");
    set(oDp, isFinite(dp) ? calcFmt(dp) + " °C" : "—");
    set(oH, isFinite(enth) ? calcFmt(enth) + " kJ/kg" : "—");
  }
  [t, rh, pT].forEach(e => e.addEventListener("input", calc));
  calc();
}

// Associate each calculator <label> with its control so screen readers
// announce a name (the markup uses adjacent <label> + <input>/<select> without
// a `for`/id link). Belt-and-suspenders: set both `for` and `aria-label`.
function associateCalcLabels() {
  document.querySelectorAll(".calc-field").forEach(field => {
    const label = field.querySelector("label");
    const ctrl = field.querySelector("input, select, textarea");
    if (!label || !ctrl) return;
    const text = label.textContent.replace(/\s+/g, " ").trim();
    if (ctrl.id) label.setAttribute("for", ctrl.id);
    if (!ctrl.hasAttribute("aria-label") && text) ctrl.setAttribute("aria-label", text);
  });
}

function initCalculators() {
  associateCalcLabels();
  initUnitConverter();
  initReynolds();
  initIdealGas();
  initLMTD();
  initAntoine();
  initPH();
  initSteamTable();
  initFriction();
  initMolarMass();
  initPsychrometrics();
  initFlashcards();
}

// ─────────────────────────────────────────────────────────────────────────────
// SELF-TEST QUIZ  (vanilla · offline · CSP-safe · localStorage best score)
// Built with createElement/textContent only — never innerHTML of data.
// ─────────────────────────────────────────────────────────────────────────────
const QUIZ_BANK = [
  { q: "For a first-order reaction, the half-life is…", opts: ["Proportional to initial concentration", "Independent of initial concentration", "Inversely proportional to k²", "Always zero"], a: 1, exp: "t½ = ln2 / k — it does not depend on C₀." },
  { q: "The Reynolds number compares…", opts: ["Inertial to viscous forces", "Heat to mass transfer", "Pressure to temperature", "Reaction to diffusion"], a: 0, exp: "Re = ρvD/μ = inertial / viscous forces." },
  { q: "For a given duty, LMTD is largest with…", opts: ["Co-current flow", "Counter-current flow", "Cross flow", "They are always equal"], a: 1, exp: "Counter-current keeps the largest average ΔT — most efficient." },
  { q: "Which expression defines the Gibbs free energy?", opts: ["ΔU = Q − W", "G = H − TS", "PV = nRT", "J = −D dC/dx"], a: 1, exp: "G = H − TS; at constant T,P, ΔG < 0 ⇒ spontaneous." },
  { q: "At equal conversion (positive-order kinetics), a CSTR vs a PFR needs…", opts: ["Less volume", "More volume", "Equal volume", "No reactant"], a: 1, exp: "A CSTR operates at the low exit concentration everywhere, so it needs more volume." },
  { q: "In DNA, adenine (A) pairs with…", opts: ["Guanine", "Cytosine", "Thymine", "Another adenine"], a: 2, exp: "A=T (two H-bonds); G≡C (three H-bonds)." },
  { q: "A Biot number well below 0.1 means…", opts: ["Lumped-capacitance analysis is valid", "Internal gradients dominate", "Flow is turbulent", "The nozzle is choked"], a: 0, exp: "Small Bi ⇒ uniform internal temperature; the surface film controls." },
  { q: "A relative volatility α = 1 indicates…", opts: ["Very easy distillation", "An azeotrope — no split by ordinary distillation", "Total reflux", "Minimum stages"], a: 1, exp: "α = 1 means vapor and liquid have equal composition — an azeotrope." },
  { q: "Le Chatelier: raising pressure shifts a gas equilibrium toward…", opts: ["More gas moles", "Fewer gas moles", "It never changes", "Higher temperature"], a: 1, exp: "The system relieves the pressure by favoring the side with fewer gas moles." },
  { q: "The Thiele modulus compares…", opts: ["Reaction rate to diffusion rate in a pellet", "Inertia to viscosity", "Convection to conduction", "Buoyancy to viscous forces"], a: 0, exp: "φ compares intrinsic reaction rate with internal pore diffusion." },
  { q: "Pump cavitation is avoided when…", opts: ["NPSH available > NPSH required", "The flow is turbulent", "The head is zero", "Re < 2100"], a: 0, exp: "Keep NPSH_available above NPSH_required so the liquid doesn't flash." },
  { q: "Which separation is driven by a partition (distribution) coefficient?", opts: ["Distillation", "Liquid-liquid extraction", "Filtration", "Cyclone separation"], a: 1, exp: "Extraction exploits how a solute partitions between two liquid phases." },
  { q: "In electrode kinetics, the exchange current density i₀ reflects…", opts: ["Electrode/catalyst activity", "Pipe roughness", "Fin efficiency", "Crystal packing factor"], a: 0, exp: "A higher i₀ means lower activation overpotential — a more active catalyst." },
  { q: "The residence-time distribution of an ideal PFR is…", opts: ["A sharp spike at t = τ", "Exponential decay", "Perfectly uniform", "Bimodal"], a: 0, exp: "Plug flow gives every element the same residence time τ — a delta spike." },
  { q: "For fully developed laminar pipe flow, the friction factor is…", opts: ["f = 64/Re", "f = 0.316/Re^0.25", "Independent of Re", "Exactly 1.0"], a: 0, exp: "Laminar: f = 64/Re (Darcy). Turbulent uses the Moody chart." },
  { q: "The green-chemistry E-factor measures…", opts: ["kg waste per kg product", "Energy per mole", "Atomic radius", "Reaction rate constant"], a: 0, exp: "E-factor = kg waste / kg product — lower is greener." },
  { q: "A Professional Engineer's paramount duty is to…", opts: ["The client", "The employer", "Public safety, health & welfare", "Shareholders"], a: 2, exp: "Codes of ethics hold public safety, health and welfare paramount." },
  { q: "Choked (sonic) flow through a relief valve occurs at Mach…", opts: ["0.1", "0.3", "1.0", "5.0"], a: 2, exp: "Flow chokes at Ma = 1 at the throat; lowering downstream P won't raise it further." },
  { q: "The Joule–Thomson coefficient μ_JT is positive when a throttled gas…", opts: ["Warms up", "Cools down", "Stays constant", "Ionizes"], a: 1, exp: "μ_JT > 0 (below the inversion temperature) means throttling cools the gas — the basis of liquefaction." },
  { q: "The Fenske equation gives the…", opts: ["Minimum reflux ratio", "Minimum number of stages at total reflux", "Column diameter", "Reboiler duty"], a: 1, exp: "Fenske gives N_min at total reflux from the relative volatility and end compositions." },
  { q: "The wet-bulb temperature is always…", opts: ["Above the dry-bulb", "Below or equal to the dry-bulb", "Equal to the dew point", "Independent of humidity"], a: 1, exp: "Evaporative cooling makes T_wb ≤ T_dry, with equality only at saturation." },
  { q: "In the Nernst equation, cell potential depends on temperature and…", opts: ["Electrode colour", "The reaction quotient Q", "Wire length", "Ambient light"], a: 1, exp: "E = E° − (RT/nF)·ln Q — potential shifts with concentrations via Q." },
  { q: "Faraday's constant (~96,485 C/mol) converts charge to…", opts: ["Moles of electrons", "Joules", "Kelvin", "Pascals"], a: 0, exp: "F is the charge per mole of electrons; m = ItM/(nF)." },
  { q: "A quantum dot's emission colour is set primarily by its…", opts: ["Temperature", "Size (diameter)", "Charge", "Mass"], a: 1, exp: "Quantum confinement makes a smaller dot emit bluer light — colour tracks size." },
  { q: "Bond's law relates comminution energy to particle…", opts: ["Colour", "Size (√ of 80%-passing size)", "Density only", "Charge"], a: 1, exp: "Bond: E = Wᵢ(10/√P₈₀ − 10/√F₈₀), tying grinding energy to size reduction." },
  { q: "In DOE, the main advantage over one-factor-at-a-time is capturing…", opts: ["Fewer factors", "Interactions between factors", "Only linear effects", "Nothing new"], a: 1, exp: "Factorial designs estimate interaction effects that OFAT completely misses." },
  { q: "A cyclone separates particles from gas using…", opts: ["Magnetism", "Centrifugal (inertial) force", "Electrostatics", "Gravity settling only"], a: 1, exp: "Swirling flow flings particles to the wall by centrifugal force — no moving parts." },
  { q: "Net Present Value discounts future cash flows to account for…", opts: ["Inflation only", "The time value of money", "Taxes only", "Depreciation only"], a: 1, exp: "NPV = −C₀ + Σ CFₜ/(1+i)ᵗ; money later is worth less than money now." },
];

function quizShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initQuiz() {
  const root = document.getElementById("quiz-root");
  if (!root) return;
  const N = QUIZ_BANK.length;
  let order, cur, score;

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  function start() {
    order = quizShuffle([...Array(N).keys()]);
    cur = 0;
    score = 0;
    renderQuestion();
  }

  function renderQuestion() {
    root.textContent = "";
    const item = QUIZ_BANK[order[cur]];
    const wrap = el("div", "quiz");
    const meta = el("div", "quiz-meta");
    meta.append(el("span", null, `Question ${cur + 1} / ${N}`), el("span", null, `Score: ${score}`));
    const q = el("div", "quiz-q", item.q);
    const opts = el("div", "quiz-opts");
    const exp = el("div", "quiz-exp", item.exp || "");
    exp.style.display = "none";
    const next = el("button", "quiz-btn", cur + 1 < N ? "Next ▶" : "See results ▶");
    next.type = "button";
    next.style.display = "none";

    item.opts.forEach((o, i) => {
      const btn = el("button", "quiz-opt", o);
      btn.type = "button";
      btn.addEventListener("click", () => {
        [...opts.children].forEach(c => { c.disabled = true; });
        if (i === item.a) { btn.classList.add("correct"); score++; }
        else { btn.classList.add("wrong"); opts.children[item.a].classList.add("correct"); }
        meta.lastChild.textContent = `Score: ${score}`;
        exp.style.display = "";
        next.style.display = "";
      });
      opts.appendChild(btn);
    });
    next.addEventListener("click", () => { cur++; cur < N ? renderQuestion() : finish(); });

    wrap.append(meta, q, opts, exp, next);
    root.appendChild(wrap);
  }

  function finish() {
    root.textContent = "";
    const prevBest = parseInt(localStorage.getItem("quiz-best") || "0", 10);
    const best = Math.max(score, prevBest);
    localStorage.setItem("quiz-best", String(best));
    const pct = Math.round((100 * score) / N);
    const verdict = pct >= 80 ? "Excellent — exam-ready!" : pct >= 60 ? "Solid — review the ones you missed." : "Keep studying — revisit the domains above.";
    const wrap = el("div", "quiz");
    wrap.append(
      el("div", "quiz-score", `You scored ${score} / ${N}  ·  ${pct}%`),
      el("div", "quiz-exp", `Best: ${best}/${N}. ${verdict}`)
    );
    const again = el("button", "quiz-btn", "↻ Restart quiz");
    again.type = "button";
    again.addEventListener("click", start);
    wrap.appendChild(again);
    root.appendChild(wrap);
  }

  // Landing state
  root.textContent = "";
  const holder = el("div", "quiz");
  const best = localStorage.getItem("quiz-best");
  holder.appendChild(el("div", "quiz-meta", best ? `Best score: ${best}/${N}` : `${N} questions · instant feedback · saved to this browser`));
  const startBtn = el("button", "quiz-btn", "▶ Start quiz");
  startBtn.type = "button";
  startBtn.addEventListener("click", start);
  holder.appendChild(startBtn);
  root.appendChild(holder);
}

// ═══════════════════════════════════════════════════════════════════════════
// STUDY TOOLS — bookmarks / study list, quick-jump palette, flashcards, quiz.
// Ported from the IT Knowledge Base (sister site) so the feature matches.
// All vanilla JS, state in localStorage, UI injected at runtime. CSP-safe:
// innerHTML carries no scripts/handlers; events wired via addEventListener.
// ═══════════════════════════════════════════════════════════════════════════
const KNOWN_PREFIX = "known:";
let _stIndex = null;

/** Build a flat index of every topic on the page (once). */
function stIndex() {
  if (_stIndex) return _stIndex;
  _stIndex = [];
  document.querySelectorAll(".domain-section").forEach(domain => {
    const domainId = domain.dataset.domain || "";
    const domainTitle = (domain.querySelector(".domain-title")?.textContent || "").trim();
    const domainIcon = (domain.querySelector(".domain-icon")?.textContent || "").trim();
    domain.querySelectorAll(".topic").forEach(t => {
      const name = (t.querySelector(".topic-name")?.textContent
        || t.querySelector(".topic-header")?.textContent || "").trim();
      const title = (t.querySelector(".concept-title")?.textContent || "").trim();
      const desc = (t.querySelector(".concept-desc")?.textContent || "").trim();
      const badge = (t.querySelector(".topic-badge")?.textContent || "").trim();
      if (t.id && name) _stIndex.push({ id: t.id, name, title, desc, badge, domainId, domainTitle, domainIcon, el: t });
    });
  });
  return _stIndex;
}

function stIsBookmarked(id) { return localStorage.getItem(BOOKMARK_PREFIX + id) === "1"; }

/** Reveal + scroll to a topic by id (reuses the deep-link opener). */
function stGoToTopic(id) {
  location.hash = id;      // triggers openHashTarget via hashchange
  openHashTarget();
}

// ── Shared modal shell ──────────────────────────────────────────────────────
let _stOverlay = null;
function stModal() {
  if (_stOverlay) return _stOverlay;
  const ov = document.createElement("div");
  ov.id = "st-overlay";
  ov.hidden = true;
  ov.innerHTML =
    '<div id="st-modal" role="dialog" aria-modal="true" aria-label="Study tools">' +
    '<button id="st-close" title="Close (Esc)" aria-label="Close">✕</button>' +
    '<div id="st-body"></div></div>';
  ov.addEventListener("click", e => { if (e.target === ov) stClose(); });
  ov.querySelector("#st-close").addEventListener("click", stClose);
  document.body.appendChild(ov);
  _stOverlay = ov;
  return ov;
}
function stOpen(renderFn) {
  const ov = stModal();
  ov.hidden = false;
  document.body.classList.add("st-lock");
  renderFn(ov.querySelector("#st-body"));
}
function stClose() {
  if (_stOverlay) _stOverlay.hidden = true;
  document.body.classList.remove("st-lock");
  _stQuizState = null;
  _stCardState = null;
}

function esc(s) { return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// ── Scope selector (All / a domain / Bookmarks) ─────────────────────────────
function stScopeOptions() {
  const doms = [];
  const seen = new Set();
  stIndex().forEach(t => {
    if (!seen.has(t.domainId)) { seen.add(t.domainId); doms.push({ id: t.domainId, title: t.domainTitle, icon: t.domainIcon }); }
  });
  return doms;
}
function stTopicsForScope(scope) {
  const all = stIndex();
  if (scope === "__all") return all.slice();
  if (scope === "__bookmarks") return all.filter(t => stIsBookmarked(t.id));
  return all.filter(t => t.domainId === scope);
}
function stScopeSelectHTML(id) {
  const opts = ['<option value="__all">◈ All domains</option>',
    '<option value="__bookmarks">★ My study list</option>']
    .concat(stScopeOptions().map(d => `<option value="${esc(d.id)}">${esc(d.icon)} ${esc(d.domainTitle)}</option>`));
  return `<select id="${id}" class="st-select" aria-label="Topic scope">${opts.join("")}</select>`;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── QUICK-JUMP PALETTE ──────────────────────────────────────────────────────
function stOpenJump() {
  stOpen(body => {
    body.innerHTML =
      '<h2 class="st-h">Quick jump</h2>' +
      '<input id="st-jump-input" class="st-input" type="search" placeholder="Type a topic or domain…" autocomplete="off" />' +
      '<ul id="st-jump-list" class="st-jump-list" tabindex="0" aria-label="Matching topics"></ul>' +
      '<p class="st-hint">↑ ↓ to move · Enter to jump · Esc to close</p>';
    const input = body.querySelector("#st-jump-input");
    const list = body.querySelector("#st-jump-list");
    let items = [], active = 0;

    function render(q) {
      const query = q.trim().toLowerCase();
      const idx = stIndex();
      items = (query
        ? idx.filter(t => (t.name + " " + t.domainTitle + " " + t.title).toLowerCase().includes(query))
        : idx).slice(0, 60);
      active = 0;
      list.innerHTML = items.map((t, i) =>
        `<li class="st-jump-item${i === 0 ? " active" : ""}" data-i="${i}">` +
        `<span class="st-jump-name">${esc(t.name)}</span>` +
        `<span class="st-jump-dom">${esc(t.domainIcon)} ${esc(t.domainTitle)}</span></li>`).join("")
        || '<li class="st-jump-empty">No matches</li>';
    }
    function move(d) {
      if (!items.length) return;
      active = (active + d + items.length) % items.length;
      list.querySelectorAll(".st-jump-item").forEach((el, i) => el.classList.toggle("active", i === active));
      list.querySelector(".st-jump-item.active")?.scrollIntoView({ block: "nearest" });
    }
    function choose() { const t = items[active]; if (t) { stClose(); stGoToTopic(t.id); } }

    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); choose(); }
    });
    list.addEventListener("click", e => {
      const li = e.target.closest(".st-jump-item"); if (!li) return;
      active = +li.dataset.i; choose();
    });
    render("");
    setTimeout(() => input.focus(), 30);
  });
}

// ── FLASHCARDS ──────────────────────────────────────────────────────────────
let _stCardState = null;
function stOpenFlashcards() {
  stOpen(body => {
    body.innerHTML =
      '<h2 class="st-h">Flashcards</h2>' +
      '<div class="st-toolbar"><label class="st-lbl">Deck</label>' + stScopeSelectHTML("st-fc-scope") +
      '<button id="st-fc-start" class="st-btn st-btn-primary">Start</button></div>' +
      '<div id="st-fc-stage"></div>';
    const scope = body.querySelector("#st-fc-scope");
    body.querySelector("#st-fc-start").addEventListener("click", () => stStartFlashcards(scope.value, body.querySelector("#st-fc-stage")));
    stStartFlashcards(scope.value, body.querySelector("#st-fc-stage"));
  });
}
function stStartFlashcards(scope, stage) {
  let deck = shuffle(stTopicsForScope(scope));
  if (!deck.length) { stage.innerHTML = '<p class="st-empty">No cards in this deck. Star some topics with ★, or pick another deck.</p>'; return; }
  _stCardState = { deck, i: 0, flipped: false, total: deck.length, done: 0 };
  stRenderCard(stage);
}
function stRenderCard(stage) {
  const s = _stCardState; if (!s) return;
  if (s.i >= s.deck.length) {
    stage.innerHTML = `<div class="st-result"><div class="st-result-big">✅</div><p>Deck complete — ${s.total} card${s.total === 1 ? "" : "s"} reviewed.</p>` +
      '<button id="st-fc-again" class="st-btn st-btn-primary">Shuffle &amp; repeat</button></div>';
    stage.querySelector("#st-fc-again").addEventListener("click", () => { s.deck = shuffle(s.deck); s.i = 0; s.done = 0; stRenderCard(stage); });
    return;
  }
  const t = s.deck[s.i];
  stage.innerHTML =
    `<div class="st-progress">Card ${s.i + 1} / ${s.deck.length}</div>` +
    `<div class="st-card${s.flipped ? " flipped" : ""}" id="st-card" tabindex="0" role="button" aria-label="Flip card">` +
      `<div class="st-card-face st-card-front"><span class="st-card-dom">${esc(t.domainIcon)} ${esc(t.domainTitle)}</span>` +
        `<span class="st-card-q">${esc(t.name)}</span><span class="st-card-tap">Tap or press Space to flip</span></div>` +
      `<div class="st-card-face st-card-back"><span class="st-card-title">${esc(t.title || t.name)}</span>` +
        `<span class="st-card-desc">${esc(t.desc || "(open the topic for details)")}</span></div>` +
    `</div>` +
    (s.flipped
      ? '<div class="st-card-actions"><button id="st-again" class="st-btn st-btn-again">↻ Again</button>' +
        '<button id="st-good" class="st-btn st-btn-good">✓ Got it</button>' +
        '<button id="st-open" class="st-btn">Open topic ↗</button></div>'
      : '<div class="st-card-actions"><button id="st-flip" class="st-btn st-btn-primary">Flip</button></div>');

  const card = stage.querySelector("#st-card");
  const flip = () => { s.flipped = !s.flipped; stRenderCard(stage); };
  card.addEventListener("click", flip);
  card.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
  stage.querySelector("#st-flip")?.addEventListener("click", flip);
  stage.querySelector("#st-again")?.addEventListener("click", () => { s.deck.push(t); s.flipped = false; s.i++; stRenderCard(stage); });
  stage.querySelector("#st-good")?.addEventListener("click", () => { localStorage.setItem(KNOWN_PREFIX + t.id, "1"); s.done++; s.flipped = false; s.i++; stRenderCard(stage); });
  stage.querySelector("#st-open")?.addEventListener("click", () => { stClose(); stGoToTopic(t.id); });
  setTimeout(() => card.focus(), 20);
}

// ── QUIZ (multiple choice, auto-generated) ──────────────────────────────────
let _stQuizState = null;
function stOpenQuiz() {
  stOpen(body => {
    body.innerHTML =
      '<h2 class="st-h">Quiz</h2>' +
      '<div class="st-toolbar"><label class="st-lbl">From</label>' + stScopeSelectHTML("st-qz-scope") +
      '<button id="st-qz-start" class="st-btn st-btn-primary">Start</button></div>' +
      '<div id="st-qz-stage"></div>';
    const scope = body.querySelector("#st-qz-scope");
    body.querySelector("#st-qz-start").addEventListener("click", () => stStartQuiz(scope.value, body.querySelector("#st-qz-stage")));
    stStartQuiz(scope.value, body.querySelector("#st-qz-stage"));
  });
}
function stStartQuiz(scope, stage) {
  const pool = stTopicsForScope(scope).filter(t => t.title || t.desc);
  if (pool.length < 4) { stage.innerHTML = '<p class="st-empty">Need at least 4 topics with descriptions to build a quiz. Pick a broader scope.</p>'; return; }
  const questions = shuffle(pool.slice()).slice(0, Math.min(10, pool.length));
  _stQuizState = { pool, questions, i: 0, score: 0, answered: false };
  stRenderQuestion(stage);
}
function stRenderQuestion(stage) {
  const s = _stQuizState; if (!s) return;
  if (s.i >= s.questions.length) {
    const pct = Math.round((s.score / s.questions.length) * 100);
    stage.innerHTML = `<div class="st-result"><div class="st-result-big">${pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚"}</div>` +
      `<p>Score: <strong>${s.score} / ${s.questions.length}</strong> (${pct}%)</p>` +
      '<button id="st-qz-retry" class="st-btn st-btn-primary">New quiz</button></div>';
    stage.querySelector("#st-qz-retry").addEventListener("click", () => stRestartQuizSame(stage));
    return;
  }
  const q = s.questions[s.i];
  const prompt = q.title || q.desc.slice(0, 160);
  const distractors = shuffle(s.pool.filter(t => t.id !== q.id)).slice(0, 3);
  const options = shuffle([q, ...distractors]);
  stage.innerHTML =
    `<div class="st-progress">Question ${s.i + 1} / ${s.questions.length} · Score ${s.score}</div>` +
    `<div class="st-q-prompt"><span class="st-q-label">Which topic does this describe?</span>${esc(prompt)}</div>` +
    '<ul class="st-q-options">' + options.map(o =>
      `<li><button class="st-q-opt" data-id="${esc(o.id)}">${esc(o.name)}</button></li>`).join("") + '</ul>' +
    '<div id="st-q-feedback" class="st-q-feedback"></div>';
  s.answered = false;
  stage.querySelectorAll(".st-q-opt").forEach(btn => btn.addEventListener("click", () => {
    if (s.answered) return; s.answered = true;
    const correct = btn.dataset.id === q.id;
    if (correct) s.score++;
    stage.querySelectorAll(".st-q-opt").forEach(b => {
      if (b.dataset.id === q.id) b.classList.add("correct");
      else if (b === btn) b.classList.add("wrong");
      b.disabled = true;
    });
    const fb = stage.querySelector("#st-q-feedback");
    fb.innerHTML = (correct ? '<span class="st-ok">Correct!</span> ' : '<span class="st-no">Not quite.</span> ') +
      `Answer: <strong>${esc(q.name)}</strong>` +
      ` · <button class="st-link" id="st-q-open">open ↗</button>` +
      ` <button class="st-btn st-btn-primary st-next" id="st-q-next">Next →</button>`;
    fb.querySelector("#st-q-open").addEventListener("click", () => { stClose(); stGoToTopic(q.id); });
    fb.querySelector("#st-q-next").addEventListener("click", () => { s.i++; stRenderQuestion(stage); });
  }));
}
function stRestartQuizSame(stage) {
  const s = _stQuizState; if (!s) return;
  s.questions = shuffle(s.pool.slice()).slice(0, Math.min(10, s.pool.length));
  s.i = 0; s.score = 0; stRenderQuestion(stage);
}

// ── STUDY LIST (bookmarks) ──────────────────────────────────────────────────
function stOpenStudyList() {
  stOpen(body => {
    body.innerHTML = '<h2 class="st-h">★ My study list</h2><div id="st-list-body"></div>';
    stRenderStudyList(body.querySelector("#st-list-body"));
  });
}
function stRenderStudyList(host) {
  const marked = stIndex().filter(t => stIsBookmarked(t.id));
  if (!marked.length) {
    host.innerHTML = '<p class="st-empty">No saved topics yet. Click the ★ on any topic to add it here, then quiz or flashcard just your list.</p>';
    return;
  }
  const byDom = {};
  marked.forEach(t => { (byDom[t.domainTitle] = byDom[t.domainTitle] || []).push(t); });
  host.innerHTML =
    `<div class="st-toolbar"><span class="st-count">${marked.length} saved</span>` +
    '<button id="st-list-fc" class="st-btn">Flashcard these</button>' +
    '<button id="st-list-qz" class="st-btn">Quiz these</button></div>' +
    '<ul class="st-list">' + Object.keys(byDom).map(dom =>
      `<li class="st-list-dom">${esc(byDom[dom][0].domainIcon)} ${esc(dom)}</li>` +
      byDom[dom].map(t =>
        `<li class="st-list-item"><button class="st-list-link" data-id="${esc(t.id)}">${esc(t.name)}</button>` +
        `<button class="st-list-remove" data-id="${esc(t.id)}" title="Remove">✕</button></li>`).join("")
    ).join("") + '</ul>';
  host.querySelector("#st-list-fc").addEventListener("click", () => stOpenFlashcards());
  host.querySelector("#st-list-qz").addEventListener("click", () => stOpenQuiz());
  host.querySelectorAll(".st-list-link").forEach(b => b.addEventListener("click", () => { stClose(); stGoToTopic(b.dataset.id); }));
  host.querySelectorAll(".st-list-remove").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.id;
    localStorage.removeItem(BOOKMARK_PREFIX + id);
    document.getElementById(id)?.classList.remove("bookmarked");
    stRenderStudyList(host);
  }));
}
/** Called when a bookmark toggles elsewhere so an open list stays fresh. */
function stRefreshStudyList() {
  const host = document.getElementById("st-list-body");
  if (host && _stOverlay && !_stOverlay.hidden) stRenderStudyList(host);
}

// ── LAUNCHER (FAB + menu) + keyboard shortcut ───────────────────────────────
function initStudyTools() {
  const fab = document.createElement("div");
  fab.id = "study-fab-wrap";
  fab.innerHTML =
    '<div id="study-menu" hidden>' +
      '<button class="study-mi" data-act="jump"><span>⌘K</span> Quick jump</button>' +
      '<button class="study-mi" data-act="cards"><span>🃏</span> Flashcards</button>' +
      '<button class="study-mi" data-act="quiz"><span>❓</span> Quiz</button>' +
      '<button class="study-mi" data-act="list"><span>★</span> Study list</button>' +
    '</div>' +
    '<button id="study-fab" title="Study tools" aria-label="Study tools" aria-haspopup="true" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M12 3 1 8l11 5 9-4.09V15h2V8L12 3z"/>' +
        '<path fill="currentColor" d="M5 11.18v3.02C5 15.75 8.13 17 12 17s7-1.25 7-2.8v-3.02l-7 3.18-7-3.18z"/>' +
      '</svg></button>';
  document.body.appendChild(fab);

  const menu = fab.querySelector("#study-menu");
  const btn = fab.querySelector("#study-fab");
  const closeMenu = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", e => {
    // Stop this click from also reaching the document "click-outside" handler,
    // which could otherwise re-close the menu we just opened (touch devices).
    e.stopPropagation();
    const willOpen = menu.hidden;      // currently hidden -> we're opening
    menu.hidden = !willOpen;           // toggle
    btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
  menu.addEventListener("click", e => {
    const mi = e.target.closest(".study-mi"); if (!mi) return;
    closeMenu();
    ({ jump: stOpenJump, cards: stOpenFlashcards, quiz: stOpenQuiz, list: stOpenStudyList }[mi.dataset.act])();
  });
  document.addEventListener("click", e => { if (!fab.contains(e.target) && !menu.hidden) closeMenu(); });

  // Global keyboard shortcuts
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); stOpenJump(); return; }
    if (e.key === "Escape" && _stOverlay && !_stOverlay.hidden) { stClose(); }
  });
}
