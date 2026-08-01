#!/usr/bin/env python3
"""
molsvg.py — Renders skeletal (line-angle) structure diagrams as inline SVG.

Chemical structures are drawn the way a chemist draws them: bonds are lines,
every unlabelled vertex is a carbon, hydrogens on carbon are implied, and
heteroatoms carry a label. Output is plain inline SVG that uses the site's CSS
variables, so the diagrams follow the light/dark theme and need no network,
no fonts and no JavaScript.

Usage:
  python3 molsvg.py --list              Show the molecules this file can draw
  python3 molsvg.py <name>              Print one molecule's SVG
  python3 molsvg.py --inject            Write every molecule into data/*.html

Injection targets a marker pair in the data files, so re-running is idempotent:

  <!-- mol:benzene -->…generated…<!-- /mol:benzene -->
"""

import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
DATA = ROOT / "data"

BOND = 34.0        # bond length, user units
PAD = 16.0         # viewBox padding
CLEAR = 9.5        # gap left between a bond end and an atom label
DBL = 3.4          # perpendicular offset of a double-bond's second line

# Heteroatom colors, mapped onto the site's theme variables so both themes work.
ATOM_COLOR = {
    "N": "var(--cyan)", "O": "var(--red)", "S": "var(--amber)",
    "P": "var(--purple)", "F": "var(--green)", "Cl": "var(--green)",
    "Br": "var(--green)", "I": "var(--green)",
}


def _color_for(label):
    """Pick the color for an atom label like 'NH', 'OH', 'Cl' or 'R'."""
    for sym in ("Cl", "Br"):
        if label.startswith(sym):
            return ATOM_COLOR[sym]
    return ATOM_COLOR.get(label[:1], "var(--text)")


class Mol:
    """A molecule under construction: atoms at (x, y), bonds between them."""

    def __init__(self):
        self.atoms = []          # (x, y, label, color, anchor)
        self.bonds = []          # (i, j, order, inner_center)
        self.notes = []          # free annotations: (kind, payload)

    # ── building ────────────────────────────────────────────────────────────
    def atom(self, x, y, label=None, color=None, anchor="middle"):
        self.atoms.append((x, y, label, color or (_color_for(label) if label else None), anchor))
        return len(self.atoms) - 1

    def bond(self, i, j, order=1, inner=None):
        self.bonds.append((i, j, order, inner))
        return self

    def chain(self, idxs, order=1):
        for a, b in zip(idxs, idxs[1:]):
            self.bond(a, b, order)
        return self

    def ring(self, cx, cy, n=6, r=None, rot=0.0, labels=None):
        """Place an n-membered ring and return its atom indices (clockwise)."""
        r = r if r is not None else BOND / (2 * math.sin(math.pi / n))
        idxs = []
        for k in range(n):
            a = math.radians(rot + k * 360.0 / n)
            lab = (labels or {}).get(k)
            idxs.append(self.atom(cx + r * math.cos(a), cy - r * math.sin(a), lab))
        return idxs

    def close_ring(self, idxs, doubles=(), center=None):
        """Bond a ring's atoms in a cycle; `doubles` lists bond positions."""
        n = len(idxs)
        for k in range(n):
            self.bond(idxs[k], idxs[(k + 1) % n], 2 if k in doubles else 1, center)
        return self

    def label(self, x, y, text, cls="lbl-muted", anchor="start", size=None):
        self.notes.append(("text", (x, y, text, cls, anchor, size)))
        return self

    def leader(self, x1, y1, x2, y2):
        """A thin dashed pointer from an annotation to the structure."""
        self.notes.append(("leader", (x1, y1, x2, y2)))
        return self

    def bracket(self, x, y, w, h, cls="brk"):
        self.notes.append(("box", (x, y, w, h, cls)))
        return self

    # ── geometry ────────────────────────────────────────────────────────────
    def _pt(self, i):
        return self.atoms[i][0], self.atoms[i][1]

    def _trim(self, i, j):
        """Shorten a bond at whichever end carries a label, so text stays clear."""
        (x1, y1), (x2, y2) = self._pt(i), self._pt(j)
        dx, dy = x2 - x1, y2 - y1
        d = math.hypot(dx, dy) or 1.0
        ux, uy = dx / d, dy / d
        # Wider labels need a wider gap or the line pokes out from under them.
        c1 = (CLEAR + 2.6 * max(0, len(self.atoms[i][2] or "") - 1)) if self.atoms[i][2] else 0.0
        c2 = (CLEAR + 2.6 * max(0, len(self.atoms[j][2] or "") - 1)) if self.atoms[j][2] else 0.0
        return x1 + ux * c1, y1 + uy * c1, x2 - ux * c2, y2 - uy * c2

    # ── rendering ───────────────────────────────────────────────────────────
    def _bond_svg(self, i, j, order, inner):
        x1, y1, x2, y2 = self._trim(i, j)
        dx, dy = x2 - x1, y2 - y1
        d = math.hypot(dx, dy) or 1.0
        px, py = -dy / d, dx / d                      # unit perpendicular
        line = ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" />' %
                (x1, y1, x2, y2))
        if order == 1:
            return line
        if order == 3:
            return line + "".join(
                '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" />' %
                (x1 + px * s * DBL, y1 + py * s * DBL, x2 + px * s * DBL, y2 + py * s * DBL)
                for s in (1, -1))
        # Double bond. Inside a ring the second line is drawn short, on the
        # ring's side; otherwise the pair straddles the bond axis.
        if inner is not None:
            cx, cy = inner
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            side = 1 if (px * (cx - mx) + py * (cy - my)) > 0 else -1
            ox, oy = px * side * DBL * 1.5, py * side * DBL * 1.5
            sx1, sy1 = x1 + dx * 0.14, y1 + dy * 0.14
            sx2, sy2 = x2 - dx * 0.14, y2 - dy * 0.14
            return line + ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" />' %
                           (sx1 + ox, sy1 + oy, sx2 + ox, sy2 + oy))
        return "".join(
            '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" />' %
            (x1 + px * s * DBL, y1 + py * s * DBL, x2 + px * s * DBL, y2 + py * s * DBL)
            for s in (1, -1))

    def _extent(self):
        xs, ys = [], []
        for x, y, label, _c, _a in self.atoms:
            w = 5.0 + 4.2 * len(label or "")
            xs += [x - w, x + w]
            ys += [y - 9, y + 9]
        for kind, p in self.notes:
            if kind == "text":
                x, y, text, _cls, anchor, _s = p
                w = 6.2 * len(text)
                xs += [x - (w if anchor == "end" else 0), x + (w if anchor != "end" else 0)]
                ys += [y - 10, y + 4]
            elif kind == "leader":
                xs += [p[0], p[2]]
                ys += [p[1], p[3]]
            elif kind == "box":
                xs += [p[0], p[0] + p[2]]
                ys += [p[1], p[1] + p[3]]
        return min(xs), min(ys), max(xs), max(ys)

    def svg(self, aria, name="", extra_class=""):
        x0, y0, x1, y1 = self._extent()
        vb = (x0 - PAD, y0 - PAD, (x1 - x0) + 2 * PAD, (y1 - y0) + 2 * PAD)
        parts = ['<g class="mol-bonds">']
        for i, j, order, inner in self.bonds:
            parts.append(self._bond_svg(i, j, order, inner))
        parts.append("</g>")
        for kind, p in self.notes:
            if kind == "leader":
                parts.append('<line class="mol-leader" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" />' % p)
            elif kind == "box":
                x, y, w, h, cls = p
                parts.append('<rect class="%s" x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="6" />'
                             % (cls, x, y, w, h))
        for x, y, label, color, anchor in self.atoms:
            if not label:
                continue
            parts.append('<text class="mol-atom" x="%.1f" y="%.1f" text-anchor="%s"%s>%s</text>'
                         % (x, y, anchor, ' style="fill: %s"' % color if color else "", label))
        for kind, p in self.notes:
            if kind == "text":
                x, y, text, cls, anchor, size = p
                parts.append('<text class="%s" x="%.1f" y="%.1f" text-anchor="%s"%s>%s</text>'
                             % (cls, x, y, anchor, ' style="font-size: %dpx"' % size if size else "", text))
        return ('<svg class="svg-diagram molecule%s"%s viewBox="%.1f %.1f %.1f %.1f" '
                'role="img" aria-label="%s">%s</svg>'
                % (" " + extra_class if extra_class else "",
                   ' data-name="%s"' % name if name else "",
                   vb[0], vb[1], vb[2], vb[3], aria, "".join(parts)))


# ── geometry helpers ────────────────────────────────────────────────────────
def step(x, y, deg, n=1.0):
    """Walk n bond lengths from (x, y) at deg (0 = east, counter-clockwise)."""
    a = math.radians(deg)
    return x + BOND * n * math.cos(a), y - BOND * n * math.sin(a)


def attach_ring(mol, anchor, deg, n=6, labels=None):
    """
    Hang a ring off an existing atom, pointing away at `deg`.

    The ring's first atom sits one bond length from the anchor and the ring
    centre continues along the same line, so the joining bond always comes out
    the right length and the ring never lands on top of what it is bonded to.
    Returns the ring's atom indices (index 0 is the attachment point) and its
    centre, ready to hand to close_ring().
    """
    ax, ay = mol._pt(anchor)
    px, py = step(ax, ay, deg)
    r = BOND / (2 * math.sin(math.pi / n))
    cx, cy = step(px, py, deg, r / BOND)
    idxs = mol.ring(cx, cy, n, r=r, rot=deg + 180, labels=labels)
    mol.bond(anchor, idxs[0])
    return idxs, (cx, cy)


def radial(mol, ring_idxs, k, center):
    """Direction, in degrees, pointing straight out of a ring at vertex k."""
    x, y = mol._pt(ring_idxs[k])
    return math.degrees(math.atan2(center[1] - y, x - center[0]))


def substituent(mol, ring_idxs, k, center, label=None):
    """Bond a single atom onto ring vertex k, pointing radially outward."""
    x, y = mol._pt(ring_idxs[k])
    nx, ny = step(x, y, radial(mol, ring_idxs, k, center))
    i = mol.atom(nx, ny, label)
    mol.bond(ring_idxs[k], i)
    return i


def zigzag(mol, x, y, count, up=30, down=-30, start_up=True):
    """Draw a standard zig-zag carbon chain; returns the atom indices."""
    idxs = [mol.atom(x, y)]
    ang = up if start_up else down
    for _ in range(count - 1):
        x, y = step(x, y, ang)
        idxs.append(mol.atom(x, y))
        ang = down if ang == up else up
    mol.chain(idxs)
    return idxs


# ═══════════════════════════════════════════════════════════════════════════
# THE MOLECULES
# ═══════════════════════════════════════════════════════════════════════════

def m_skeletal_guide():
    """How to read a skeletal formula, annotated. Drawn on pentan-1-ol."""
    m = Mol()
    c = zigzag(m, 0, 60, 5)
    ox, oy = step(*m._pt(c[4]), 30)
    o = m.atom(ox, oy, "OH")
    m.bond(c[4], o)

    m.label(-60, 14, "a line end is a CH₃", size=11)
    m.leader(-26, 22, -2, 82)

    m.label(59, 152, "every corner is a carbon —", anchor="middle", size=11)
    m.label(59, 166, "its hydrogens are implied", anchor="middle", size=11)
    m.leader(59, 140, 59, 98)

    m.label(290, 14, "heteroatoms are labelled", anchor="end", size=11)
    m.leader(200, 22, ox + 4, oy - 10)
    return m, ("A skeletal (line-angle) formula of pentan-1-ol, annotated: each corner and "
               "line end is a carbon atom, hydrogens on carbon are implied, and the hydroxyl "
               "oxygen is written out as O H.")


def m_functional_groups():
    """A gallery of the functional groups an engineer meets by name."""
    cells = []

    def alcohol(m, x, y):
        a = m.atom(x, y, "R"); b = m.atom(*step(x, y, 30))
        c = m.atom(*step(*step(x, y, 30), -30), "OH")
        m.bond(a, b); m.bond(b, c)

    def ether(m, x, y):
        a = m.atom(x, y, "R"); b = m.atom(*step(x, y, 30), "O")
        c = m.atom(*step(*step(x, y, 30), -30), "R")
        m.bond(a, b); m.bond(b, c)

    def carbonyl(m, x, y, left="R", right=None):
        a = m.atom(x, y, left)
        bx, by = step(x, y, 30)
        b = m.atom(bx, by)
        ox, oy = step(bx, by, 90)
        m.atom(ox, oy, "O")
        m.bond(a, b); m.bond(b, len(m.atoms) - 1, 2)
        cx, cy = step(bx, by, -30)
        c = m.atom(cx, cy, right)
        m.bond(b, c)
        return b

    def aldehyde(m, x, y):
        carbonyl(m, x, y, "R", "H")

    def ketone(m, x, y):
        carbonyl(m, x, y, "R", "R")

    def acid(m, x, y):
        carbonyl(m, x, y, "R", "OH")

    def ester(m, x, y):
        b = carbonyl(m, x, y, "R", "O")
        o = len(m.atoms) - 1
        m.bond(o, m.atom(*step(*m._pt(o), 30), "R"))

    def amide(m, x, y):
        carbonyl(m, x, y, "R", "NH₂")

    def amine(m, x, y):
        a = m.atom(x, y, "R"); b = m.atom(*step(x, y, 30))
        c = m.atom(*step(*step(x, y, 30), -30), "NH₂")
        m.bond(a, b); m.bond(b, c)

    def nitrile(m, x, y):
        a = m.atom(x, y, "R"); b = m.atom(*step(x, y, 30))
        c = m.atom(*step(*step(x, y, 30), -30), "N")
        m.bond(a, b); m.bond(b, c, 3)

    def thiol(m, x, y):
        a = m.atom(x, y, "R"); b = m.atom(*step(x, y, 30))
        c = m.atom(*step(*step(x, y, 30), -30), "SH")
        m.bond(a, b); m.bond(b, c)

    def alkene(m, x, y):
        a = m.atom(x, y, "R"); b = m.atom(*step(x, y, 30))
        c = m.atom(*step(*step(x, y, 30), -30))
        d = m.atom(*step(*step(*step(x, y, 30), -30), 30), "R")
        m.bond(a, b); m.bond(b, c, 2); m.bond(c, d)

    def halide(m, x, y):
        a = m.atom(x, y, "R"); b = m.atom(*step(x, y, 30))
        c = m.atom(*step(*step(x, y, 30), -30), "Cl")
        m.bond(a, b); m.bond(b, c)

    def aromatic(m, x, y):
        r = m.ring(x + 30, y + 6, 6, rot=30)
        m.close_ring(r, doubles=(0, 2, 4), center=(x + 30, y + 6))

    cells = [
        ("Alcohol  R–OH", alcohol), ("Ether  R–O–R", ether),
        ("Aldehyde  R–CHO", aldehyde), ("Ketone  R–CO–R", ketone),
        ("Carboxylic acid", acid), ("Ester  R–COO–R", ester),
        ("Amine  R–NH₂", amine), ("Amide  R–CONH₂", amide),
        ("Nitrile  R–C≡N", nitrile), ("Thiol  R–SH", thiol),
        ("Alkene  C=C", alkene), ("Aromatic ring", aromatic),
    ]
    m = Mol()
    COLW, ROWH = 168, 122
    for k, (title, draw) in enumerate(cells):
        col, row = k % 3, k // 3
        x, y = col * COLW, row * ROWH
        m.label(x, y, title, cls="mol-title", anchor="start", size=11)
        # Carbonyl oxygens reach a full bond length above the chain, so the
        # structure starts well below its caption.
        draw(m, x + 8, y + 62)
    return m, ("A gallery of twelve organic functional groups drawn as skeletal formulas: "
               "alcohol, ether, aldehyde, ketone, carboxylic acid, ester, amine, amide, "
               "nitrile, thiol, alkene and an aromatic ring.")


def m_kinase_inhibitor():
    """
    CHIR-99021 — a real aminopyrimidine kinase inhibitor, ring by ring.

    Central pyrimidine drawn with a vertex east and west, so the two rings on
    the right splay apart the way a chemist would draw them:
      k0 = C4 (2,4-dichlorophenyl)   k1 = N3   k2 = C2 (amine linker)
      k3 = N1                        k4 = C6   k5 = C5 (4-methylpyrrole)
    """
    m = Mol()
    pc = (250.0, 250.0)
    pyr = m.ring(pc[0], pc[1], 6, rot=30, labels={1: "N", 3: "N"})
    m.close_ring(pyr, doubles=(0, 2, 4), center=pc)

    # C4 → 2,4-dichlorophenyl (chlorines ortho and para to the join).
    ph, phc = attach_ring(m, pyr[0], radial(m, pyr, 0, pc))
    m.close_ring(ph, doubles=(1, 3, 5), center=phc)
    # Either ortho carbon is the "2" position; ph[5] keeps the label clear of
    # the pyrrole hanging below.
    substituent(m, ph, 5, phc, "Cl")
    substituent(m, ph, 3, phc, "Cl")

    # C5 → 4-methyl-1H-pyrrol-2-yl. Ring order from the join: N1, C5, C4, C3.
    pyrrole, prc = attach_ring(m, pyr[5], radial(m, pyr, 5, pc), n=5, labels={1: "NH"})
    m.close_ring(pyrrole, doubles=(2, 4), center=prc)
    substituent(m, pyrrole, 3, prc)                       # the 4-methyl

    # C2 → NH–CH₂CH₂–NH linker, walking up and left toward the pyridine.
    n1 = m.atom(*step(*m._pt(pyr[2]), radial(m, pyr, 2, pc)), "HN")
    m.bond(pyr[2], n1)
    e1 = m.atom(*step(*m._pt(n1), -150))
    e2 = m.atom(*step(*m._pt(e1), 150))
    n2 = m.atom(*step(*m._pt(e2), 90), "HN")
    m.chain([n1, e1, e2, n2])

    # …ending at a nicotinonitrile: ring N next to the join, nitrile para to it.
    py, pyc = attach_ring(m, n2, 90, labels={1: "N"})
    m.close_ring(py, doubles=(0, 2, 4), center=pyc)
    cn = substituent(m, py, 3, pyc)
    nn = m.atom(*step(*m._pt(cn), radial(m, py, 3, pyc)), "N")
    m.bond(cn, nn, 3)
    return m, ("The skeletal structure of CHIR-99021, an aminopyrimidine kinase inhibitor: a "
               "central pyrimidine ring bearing a 2,4-dichlorophenyl group, a 4-methylpyrrole, "
               "and an ethylenediamine linker to a cyanopyridine.")


def m_peptide_bond():
    """Two amino acids condensing into a dipeptide, losing water."""
    m = Mol()

    def amino_acid(x, y, r_label="R"):
        n = m.atom(x, y, "H₂N")
        ca_x, ca_y = step(x, y, -30)
        ca = m.atom(ca_x, ca_y)
        r = m.atom(*step(ca_x, ca_y, -90), r_label)
        cx, cy = step(ca_x, ca_y, 30)
        c = m.atom(cx, cy)
        o = m.atom(*step(cx, cy, 90), "O")
        oh = m.atom(*step(cx, cy, -30), "OH")
        m.bond(n, ca); m.bond(ca, r); m.bond(ca, c); m.bond(c, o, 2); m.bond(c, oh)
        return n, ca, c, o, oh

    a = amino_acid(0, 90, "R¹")
    b = amino_acid(250, 90, "R²")
    m.label(150, 60, "+", cls="mol-op", anchor="middle", size=18)

    # Product
    ox = 0
    oy = 240
    n = m.atom(ox, oy, "H₂N")
    ca_x, ca_y = step(ox, oy, -30)
    ca = m.atom(ca_x, ca_y)
    r1 = m.atom(*step(ca_x, ca_y, -90), "R¹")
    cx, cy = step(ca_x, ca_y, 30)
    c = m.atom(cx, cy)
    o = m.atom(*step(cx, cy, 90), "O")
    nx, ny = step(cx, cy, -30)
    nh = m.atom(nx, ny, "NH")
    ca2_x, ca2_y = step(nx, ny, 30)
    ca2 = m.atom(ca2_x, ca2_y)
    r2 = m.atom(*step(ca2_x, ca2_y, 90), "R²")
    c2x, c2y = step(ca2_x, ca2_y, -30)
    c2 = m.atom(c2x, c2y)
    o2 = m.atom(*step(c2x, c2y, -90), "O")
    oh2 = m.atom(*step(c2x, c2y, 30), "OH")
    m.bond(n, ca); m.bond(ca, r1); m.bond(ca, c); m.bond(c, o, 2); m.bond(c, nh)
    m.bond(nh, ca2); m.bond(ca2, r2); m.bond(ca2, c2); m.bond(c2, o2, 2); m.bond(c2, oh2)

    m.bracket(cx - 20, cy - 46, 70, 92, cls="mol-hilite")
    m.label(cx + 20, cy + 68, "peptide bond", cls="mol-title", anchor="middle", size=11)
    m.label(150, 186, "− H₂O   (condensation)", cls="mol-op", anchor="middle", size=12)
    return m, ("Two amino acids condensing into a dipeptide: the carboxyl group of the first "
               "and the amino group of the second lose a molecule of water, forming the "
               "peptide bond that links them.")


def m_reforming():
    """Catalytic reforming: n-heptane dehydrocyclizes to toluene + hydrogen."""
    m = Mol()
    zigzag(m, 0, 90, 7)
    m.label(100, 132, "n-heptane   RON ≈ 0", cls="mol-title", anchor="middle", size=11)

    m.label(268, 74, "→", cls="mol-op", anchor="middle", size=20)
    m.label(268, 96, "Pt / Re", cls="lbl-muted", anchor="middle", size=10)

    cx, cy = 380.0, 74.0
    r = m.ring(cx, cy, 6, rot=30)
    m.close_ring(r, doubles=(0, 2, 4), center=(cx, cy))
    me = m.atom(*step(*m._pt(r[3]), 210))
    m.bond(r[3], me)
    m.label(380, 132, "toluene   RON ≈ 120", cls="mol-title", anchor="middle", size=11)
    m.label(380, 150, "+ 4 H₂", cls="mol-op", anchor="middle", size=12)
    return m, ("Catalytic reforming: n-heptane, a straight-chain alkane with an octane number "
               "near zero, is dehydrocyclized over a platinum-rhenium catalyst into toluene, "
               "an aromatic with a research octane number near 120, releasing four molecules "
               "of hydrogen.")


def m_lipinski():
    """An API annotated with the properties a formulator screens on."""
    m = Mol()
    # Ibuprofen: small, familiar, and every Lipinski feature is visible.
    cx, cy = 120.0, 110.0
    r = m.ring(cx, cy, 6, rot=0)
    m.close_ring(r, doubles=(0, 2, 4), center=(cx, cy))

    # Isobutyl arm on the left.
    a1 = m.atom(*step(*m._pt(r[3]), 150))
    a2 = m.atom(*step(*m._pt(a1), -150))
    a3 = m.atom(*step(*m._pt(a2), 150))
    a4 = m.atom(*step(*m._pt(a2), -90))
    m.bond(r[3], a1); m.bond(a1, a2); m.bond(a2, a3); m.bond(a2, a4)

    # Propanoic-acid arm on the right.
    b1 = m.atom(*step(*m._pt(r[0]), -30))
    me = m.atom(*step(*m._pt(b1), -90))
    cbx, cby = step(*m._pt(b1), 30)
    cb = m.atom(cbx, cby)
    o1 = m.atom(*step(cbx, cby, 90), "O")
    o2 = m.atom(*step(cbx, cby, -30), "OH")
    m.bond(r[0], b1); m.bond(b1, me); m.bond(b1, cb); m.bond(cb, o1, 2); m.bond(cb, o2)

    ox2, oy2 = m._pt(o2)
    m.label(cbx + 46, cby - 40, "H-bond acceptors (2)", size=11)
    m.leader(cbx + 42, cby - 44, *m._pt(o1))
    m.label(ox2 + 46, oy2 + 24, "H-bond donor (1)", size=11)
    m.leader(ox2 + 42, oy2 + 20, ox2 + 8, oy2 + 4)
    m.label(20, 200, "ibuprofen · MW 206 · cLogP 3.5", cls="mol-title", anchor="start", size=11)
    m.label(20, 216, "0 Lipinski violations", cls="mol-op", anchor="start", size=11)
    return m, ("Ibuprofen drawn as a skeletal formula and annotated for Lipinski's rule of "
               "five: one hydrogen-bond donor at the acid O H, two acceptors at the carboxyl "
               "oxygens, molecular weight 206 and cLogP 3.5 — no violations.")


MOLECULES = {
    "skeletal-guide": (m_skeletal_guide, "chem"),
    "functional-groups": (m_functional_groups, "chem"),
    "kinase-inhibitor": (m_kinase_inhibitor, "pharma"),
    "lipinski": (m_lipinski, "pharma"),
    "peptide-bond": (m_peptide_bond, "bio"),
    "reforming": (m_reforming, "petro"),
}


def render(name):
    build, _domain = MOLECULES[name]
    mol, aria = build()
    return mol.svg(aria, name=name)


def inject():
    """Replace every <!-- mol:NAME -->…<!-- /mol:NAME --> block in data/*.html."""
    touched = 0
    for name, (_build, domain) in MOLECULES.items():
        path = DATA / (domain + ".html")
        text = path.read_text()
        pat = re.compile(r"(<!-- mol:%s -->).*?(<!-- /mol:%s -->)" % (name, name), re.DOTALL)
        if not pat.search(text):
            print("  ! no marker for %s in %s" % (name, path.name))
            continue
        svg = render(name)
        path.write_text(pat.sub(lambda mo: mo.group(1) + svg + mo.group(2), text))
        print("  + %-18s → %-12s (%d chars)" % (name, path.name, len(svg)))
        touched += 1
    print("injected %d/%d molecules" % (touched, len(MOLECULES)))


def main():
    args = sys.argv[1:]
    if not args or args[0] == "--list":
        for name, (_b, domain) in MOLECULES.items():
            print("%-18s %s" % (name, domain))
    elif args[0] == "--inject":
        inject()
    elif args[0] in MOLECULES:
        print(render(args[0]))
    else:
        sys.exit("unknown molecule: %s (try --list)" % args[0])


if __name__ == "__main__":
    main()
