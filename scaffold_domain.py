#!/usr/bin/env python3
"""
scaffold_domain.py — Wire a new domain into the build.

Idempotently adds a domain to data/domains.json, a filter chip to
index-shell.html, and .chip.c-<id> + .domain-<id> rules to style.css.
The data/<id>.html content file must already exist.

Usage:
  python3 scaffold_domain.py <id> <icon> <title> <chip_label> \
      <chip_color> <accent> <sub> [certTag_cls:certTag_text ...]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent


def hexrgba(h, a):
    h = h.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r}, {g}, {b}, {a})"


def main():
    a = sys.argv[1:]
    did, icon, title, chip_label, chip_color, accent, sub = a[:7]
    certs = []
    for tok in a[7:]:
        cls, _, text = tok.partition(":")
        certs.append({"cls": cls, "text": text})

    # 1. domains.json
    dj = ROOT / "data" / "domains.json"
    domains = json.loads(dj.read_text(encoding="utf-8"))
    if any(d["id"] == did for d in domains):
        print(f"  domains.json: {did} already present")
    else:
        domains.append({
            "id": did,
            "colorClass": f"domain-{did}",
            "icon": icon,
            "title": title,
            "certTags": certs,
            "sub": sub,
        })
        dj.write_text(json.dumps(domains, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"  domains.json: added {did}")

    # 2. filter chip in index-shell.html (after the last existing chip)
    shell = (ROOT / "index-shell.html").read_text(encoding="utf-8")
    chip = f'        <div class="chip c-{did}"           data-domain="{did}">{icon} {chip_label}</div>\n'
    if f'data-domain="{did}"' in shell:
        print(f"  index-shell.html: chip {did} already present")
    else:
        # insert right before the closing </div> of .filter-inner: the last chip line
        m = list(re.finditer(r'^.*data-domain="[^"]+".*$\n', shell, re.MULTILINE))
        last = m[-1]
        shell = shell[:last.end()] + chip + shell[last.end():]
        (ROOT / "index-shell.html").write_text(shell, encoding="utf-8")
        print(f"  index-shell.html: added chip {did}")

    # 3. style.css — chip color + domain accent
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    if f".chip.c-{did}" in css:
        print(f"  style.css: rules for {did} already present")
    else:
        border = hexrgba(chip_color, "0.35")
        bg = hexrgba(chip_color, "0.12")
        block = (
            f"\n/* domain: {did} (scaffolded) */\n"
            f".chip.c-{did} {{\n  color: {chip_color};\n  border-color: {border};\n}}\n"
            f".chip.c-{did}.active,\n.chip.c-{did}:hover {{\n  background: {bg};\n}}\n"
            f".domain-{did} {{\n  --accent: {accent};\n}}\n"
        )
        css = css.rstrip() + "\n" + block
        (ROOT / "style.css").write_text(css, encoding="utf-8")
        print(f"  style.css: added rules for {did}")


if __name__ == "__main__":
    main()
