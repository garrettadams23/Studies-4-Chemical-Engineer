# Contributing — Content & Markup Conventions

All visible content lives in `data/*.html` (one file per domain) and is assembled
into `index.html` by `build.py`. **Never hand-edit `index.html`.**

## Workflow

1. Edit the relevant `data/{domain}.html`.
2. Run `python3 build.py`.
3. Open `index.html` and verify (filter, search, expand, light/dark).

## Canonical topic skeleton

Every topic is a `.topic` containing a `.topic-header` (the clickable bar) and a
`.topic-body` (revealed on expand). Use exactly this structure so styling,
filtering, search, permalinks, and progress tracking all work:

```html
<div class="topic">
  <div class="topic-header">
    <span class="topic-icon">⚗️</span>
    <span class="topic-name">Human-Readable Topic Title</span>
    <span class="topic-badge">OPTIONAL TAG</span>
    <span class="topic-chev">▶</span>
  </div>
  <div class="topic-body">
    <div class="concept-card">
      <div class="concept-label">Reference</div>
      <div class="concept-title">Card Title</div>
      <div class="concept-desc">Prose explanation.</div>
      <!-- diagram wrappers (.dw / .dt), tables, formula blocks, etc. -->
    </div>
  </div>
</div>
```

Notes:
- The permalink/reviewed tools and `aria`/keyboard support are added by
  `script.js` at load — you do **not** add them in markup.
- `.topic-name` is what the deep-link slug and search use; always include it.

## Formula & diagram blocks

Wrap literal formulas, reactions, and ASCII diagrams in
`<pre class="code-block">…</pre>`. Use `<pre>`, **not** `<div>`: the build's
minifier preserves whitespace **only** inside `<pre>`, and `<pre>`'s default
`white-space: pre` is what keeps multi-line equations and process diagrams
aligned. Indentation is never significant anywhere else.

## Reference tables

Use `<table class="ref-table">` for tabular reference material. Color a cell by
its meaning with the theme-aware CSS variables, e.g.
`<td style="color: var(--cyan)">…</td>` (`--cyan`, `--green`, `--amber`,
`--red`, `--purple`, `--muted`). Inline text can use the `.text-*` helper
classes (`text-blue`, `text-green`, `text-red`, `text-amber`, `text-purple`,
`text-cyan`).

## Adding a domain

Add an entry to `data/domains.json` (`id`, `colorClass`, `icon`, `title`,
`certTags`, `sub`) and create a matching `data/{id}.html` with the topics. The
`scaffold_domain.py` helper can add the filter chip and chip/accent colors to
`style.css` for a new `id` automatically.
