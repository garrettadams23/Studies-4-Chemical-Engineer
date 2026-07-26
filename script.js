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
function toggleDomain(h) {
  const b = h.nextElementSibling;
  const open = b.classList.toggle("open");
  h.classList.toggle("open", open);
  h.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleTopic(h) {
  const open = h.classList.toggle("open");
  h.nextElementSibling.classList.toggle("open", open);
  h.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) updateTopicHash(h.parentElement);
}

// ── FILTER ─────────────────────────────────────────────────────────────────
function filter(domain, chip) {
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  document.querySelectorAll(".domain-section").forEach(s => {
    s.classList.toggle("hidden", domain !== "all" && s.dataset.domain !== domain);
  });
}

// ── EXPAND / COLLAPSE ALL ──────────────────────────────────────────────────
function toggleAll() {
  allExpanded = !allExpanded;
  document.querySelectorAll(".domain-header, .topic-header").forEach(h => {
    h.classList.toggle("open", allExpanded);
    if (h.hasAttribute("aria-expanded")) h.setAttribute("aria-expanded", allExpanded ? "true" : "false");
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

  // Filter chips — event delegation on the filter bar
  document.querySelector(".filter-bar")?.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (chip) filter(chip.dataset.domain || "all", chip);
  });

  // Accordion — event delegation on the container
  const container = document.getElementById("domain-container");
  container?.addEventListener("click", e => {
    // Per-topic tool buttons take precedence over the toggle
    const tool = e.target.closest(".topic-review, .topic-permalink");
    if (tool) { e.stopPropagation(); handleTopicTool(tool); return; }
    const dh = e.target.closest(".domain-header");
    if (dh) { toggleDomain(dh); return; }
    const th = e.target.closest(".topic-header");
    if (th) toggleTopic(th);
  });

  // Accordion — keyboard support (Enter / Space on focused headers)
  container?.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const header = e.target.closest(".domain-header, .topic-header");
    if (!header || e.target.closest(".topic-review, .topic-permalink")) return;
    e.preventDefault();
    header.classList.contains("domain-header") ? toggleDomain(header) : toggleTopic(header);
  });

  // Header control buttons
  document.getElementById("hdr-theme-btn")?.addEventListener("click", toggleTheme);
  document.getElementById("hdr-expand-btn")?.addEventListener("click", toggleAll);

  // Search + notepad — wired here (not inline) so the CSP can stay script-src 'self'
  document.getElementById("search-input")?.addEventListener("input", e => onSearchInput(e.target.value));
  document.getElementById("search-clear")?.addEventListener("click", clearSearch);
  document.getElementById("notepad-tab")?.addEventListener("click", toggleNotepad);

  initAccessibilityAndTools();
  initBackToTop();
  initCalculators();
  initQuiz();
});

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
  // Make every accordion header focusable and announce its state
  document.querySelectorAll(".domain-header, .topic-header").forEach(h => {
    h.setAttribute("tabindex", "0");
    h.setAttribute("role", "button");
    h.setAttribute("aria-expanded", h.classList.contains("open") ? "true" : "false");
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

      // Inject the tool cluster (reviewed toggle + permalink) once
      if (!header.querySelector(".topic-tools")) {
        const tools = document.createElement("span");
        tools.className = "topic-tools";

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

        tools.append(review, link);
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
  if (btn.classList.contains("topic-review")) {
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
  domain?.querySelector(".domain-header")?.classList.add("open");
  domain?.querySelector(".domain-body")?.classList.add("open");
  domain?.querySelector(".domain-header")?.setAttribute("aria-expanded", "true");
  const th = topic.querySelector(".topic-header");
  th?.classList.add("open");
  th?.setAttribute("aria-expanded", "true");
  topic.querySelector(".topic-body")?.classList.add("open");
  topic.scrollIntoView({ behavior: "smooth", block: "start" });
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

function initCalculators() {
  initUnitConverter();
  initReynolds();
  initIdealGas();
  initLMTD();
  initAntoine();
  initPH();
  initSteamTable();
  initFriction();
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
