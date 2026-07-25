#!/usr/bin/env python3
"""
reconcile_build.py

Syncs the current patched index.html back into:
  - index-shell.html  (shell with search bar + notepad injections)
  - data/{id}.html    (each domain's .domain-body inner content)

After running this, `python3 build.py` should reproduce index.html exactly.
"""

from pathlib import Path
import re

ROOT = Path(__file__).parent
DATA = ROOT / "data"

DOMAIN_IDS = ["net", "sec", "threat", "grc", "ops", "pentest",
              "linux", "ai", "script", "shortcut", "lifestyle", "military"]

def extract_domain_body(content: str, domain_id: str) -> str:
    """Extract inner content of .domain-body for a given domain.

    Walks nested <div> tags from the opening .domain-body tag to its
    matching </div>, returning everything in between.
    """
    import re

    # Find the domain-section div (not filter bar chips which also have data-domain)
    ds_tag = '<div class="domain-section'
    search_from = 0
    ds_start = -1
    while True:
        pos = content.find(ds_tag, search_from)
        if pos < 0:
            break
        line_end = content.find('>', pos)
        if f'data-domain="{domain_id}"' in content[pos:line_end+1]:
            ds_start = pos
            break
        search_from = pos + 1
    if ds_start < 0:
        raise ValueError(f"Domain section not found: {domain_id}")

    # Find .domain-body div after the section start
    body_div = '<div class="domain-body">'
    body_tag_start = content.find(body_div, ds_start)
    if body_tag_start < 0:
        raise ValueError(f"domain-body not found for: {domain_id}")
    body_content_start = body_tag_start + len(body_div)

    # Walk the content counting <div> opens (+1) and </div> closes (-1).
    # We start at depth=1 (already inside .domain-body).
    # When depth reaches 0, the preceding </div> is the matching close tag.
    i = body_content_start
    depth = 1
    open_re = re.compile(r'<div\b', re.IGNORECASE)
    close_re = re.compile(r'</div\s*>', re.IGNORECASE)
    body_content_end = -1
    while i < len(content):
        o = open_re.search(content, i)
        c = close_re.search(content, i)
        if o is None and c is None:
            break
        # Pick whichever comes first
        if o is None or (c is not None and c.start() < o.start()):
            # Close tag first
            depth -= 1
            if depth == 0:
                body_content_end = c.start()
                break
            i = c.end()
        else:
            # Open tag first
            depth += 1
            i = o.end()

    if body_content_end < 0:
        raise ValueError(f"Could not find matching </div> for domain-body: {domain_id}")

    body = content[body_content_start:body_content_end]
    # build_domain_section template adds a \n before {body_content}; strip leading \n
    if body.startswith('\n'):
        body = body[1:]
    # Template adds \n        before </div>; strip any trailing indent whitespace
    body = body.rstrip(' \t')
    # But preserve the final \n if present (template uses \n{body}\n        </div>)
    # Actually template: \n{body_content}\n        </div>, body should NOT end with \n
    # strip trailing newlines too
    body = body.rstrip()
    return body


def build_new_shell(content: str) -> str:
    """Build the new index-shell.html by extracting shell structure from index.html."""

    # Part 1: everything from <!doctype to just before the search bar comment
    sb_marker = '<!-- SEARCH BAR'
    sb_start = content.find(sb_marker)
    if sb_start < 0:
        raise ValueError("Search bar comment not found in index.html")
    shell_prefix = content[:sb_start]

    # Part 2: search bar HTML (from <!-- SEARCH BAR --> up to and including <!-- /search-bar --><!-- /container -->)
    container_div = '<div class="container" id="domain-container">'
    container_start = content.find(container_div, sb_start)
    if container_start < 0:
        raise ValueError("Container div not found after search bar")
    # Search bar is from sb_start to just before container_div
    # Include the <!-- /container --> marker
    search_bar_html = content[sb_start:container_start]

    # Part 3: container + placeholder + closing
    # After all domain sections, find the container closing
    # The last domain closes with:  \n        </div>\n      </div>\n    </div>
    # Then script.js
    script_js = '<script src="script.js"></script>'
    script_pos = content.rfind(script_js)
    # Container closes just before script.js
    # Find the </div> before script.js (closing the container)
    closing_div_end = content.rfind('</div>', 0, script_pos) + len('</div>')
    # The container closing is that last </div> + \n\n
    container_close_section = content[container_start + len(container_div):closing_div_end]
    # We don't need the domains content, just need placeholder
    # Actually we just need: open container, placeholder, close container
    container_section = (
        container_div + "\n"
        "<!-- DOMAINS_CONTENT -->\n"
        "    </div>"
    )

    # Part 4: script.js + notepad HTML
    notepad_start = content.find('<!-- NOTEPAD: slide tab -->', script_pos)
    body_end = content.rfind('</body>')
    post_domains = "\n\n    " + script_js + "\n    " + content[notepad_start:body_end]

    # Part 5: closing tags (no leading \n — content[notepad_start:body_end] already ends with \n)
    closing = "</body>\n</html>\n"

    return shell_prefix + search_bar_html + container_section + post_domains + closing


def main():
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")

    # 1. Extract and write each domain's body content
    for domain_id in DOMAIN_IDS:
        body = extract_domain_body(index_html, domain_id)
        out_path = DATA / f"{domain_id}.html"
        out_path.write_text(body, encoding="utf-8")
        print(f"  wrote {out_path.name} ({len(body):,} chars)")

    # 2. Build and write new index-shell.html
    new_shell = build_new_shell(index_html)
    shell_path = ROOT / "index-shell.html"
    shell_path.write_text(new_shell, encoding="utf-8")
    print(f"\n  wrote index-shell.html ({len(new_shell):,} chars)")

    # 3. Verify: run build.py logic manually and compare
    import json
    import sys
    sys.path.insert(0, str(ROOT))
    import build as build_mod

    shell = new_shell
    domains = json.loads((DATA / "domains.json").read_text(encoding="utf-8"))
    sections = []
    for domain in domains:
        body_path = DATA / f"{domain['id']}.html"
        if not body_path.exists():
            print(f"  WARNING: {body_path} missing")
            continue
        body = body_path.read_text(encoding="utf-8")
        sections.append(build_mod.build_domain_section(domain, body))

    domains_html = "\n\n".join(sections)
    rebuilt = shell.replace("<!-- DOMAINS_CONTENT -->", domains_html)

    # Compare
    if rebuilt == index_html:
        print("\n  VERIFIED: build.py output matches current index.html exactly.")
    else:
        # Find first difference
        diff_pos = next((i for i, (a, b) in enumerate(zip(rebuilt, index_html)) if a != b), -1)
        if diff_pos < 0:
            print(f"\n  NEAR-MATCH: lengths differ (rebuilt={len(rebuilt)}, original={len(index_html)})")
        else:
            print(f"\n  MISMATCH at char {diff_pos}:")
            print(f"    rebuilt:  {repr(rebuilt[max(0,diff_pos-80):diff_pos+80])}")
            print(f"    original: {repr(index_html[max(0,diff_pos-80):diff_pos+80])}")
        print("  Writing rebuilt.html for diff inspection.")
        (ROOT / "rebuilt.html").write_text(rebuilt, encoding="utf-8")

    print(f"\nDone. Current index.html: {len(index_html):,} chars")


if __name__ == "__main__":
    main()
