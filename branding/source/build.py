"""Builds every Qirsh logo / icon SVG from one geometry so they stay consistent."""
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen, RecordingPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

OUT = '../out/svg'; os.makedirs(OUT, exist_ok=True)
NILE, NILE_DARK, GOLD, GOLD_DEEP, SAND, INK, WHITE = '#0B5F57', '#062E2A', '#F0B341', '#E29A1B', '#FAF6EC', '#10201E', '#FFFFFF'
SEMIBOLD = '../fonts/ReadexPro-SemiBold.ttf'

# ---------- the mark (q + qaf dots), native box 280 x 460, origin top-left ----------
CX, CY, R, r = 140, 252, 140, 72
W = R - r
JY = math.sqrt(R*R - r*r)                     # where stem's inner edge meets the ring
STEM = 170                                     # stem length below the ring centre
MARK_W, MARK_H = 2*R, CY + STEM + W/2           # 280 x 457
DOTS = [(CX + r + W/2 - 62, 72, 28), (CX + r + W/2, 30, 28)]   # stepping up to the right
BODY_D = (f"M{CX+R},{CY}V{CY+STEM}A{W/2},{W/2} 0 0 1 {CX+r},{CY+STEM}V{CY+JY:.2f}"
          f"A{R},{R} 0 1 1 {CX+R},{CY}Z"
          f"M{CX-r},{CY}A{r},{r} 0 1 0 {CX+r},{CY}A{r},{r} 0 1 0 {CX-r},{CY}Z")
DOTS_TOP = min(y - rr for _, y, rr in DOTS)    # 2

def mark_group(body, dots, x=0, y=0, s=1.0):
    dd = ''.join(f'<circle cx="{cx}" cy="{cy}" r="{rr}"/>' for cx, cy, rr in DOTS)
    return (f'<g transform="translate({x:.2f},{y:.2f}) scale({s:.5f})">'
            f'<path fill="{body}" fill-rule="evenodd" d="{BODY_D}"/><g fill="{dots}">{dd}</g></g>')

def svg(w, h, inner, bg=None, title='Qirsh'):
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{b}{inner}</svg>')

def save(name, content):
    open(os.path.join(OUT, name), 'w').write(content)

# ---------- text to outlines, splitting each glyph's "dots" from its body ----------
_tt = TTFont(SEMIBOLD); _gs = _tt.getGlyphSet(); _order = _tt.getGlyphOrder(); UPEM = _tt['head'].unitsPerEm
_hbfont = hb.Font(hb.Face(hb.Blob(open(SEMIBOLD, 'rb').read())))

def shaped(text):
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties(); hb.shape(_hbfont, buf, {'kern': True})
    return [(_order[i.codepoint], p) for i, p in zip(buf.glyph_infos, buf.glyph_positions)]

def contours(gname):
    p = DecomposingRecordingPen(_gs); _gs[gname].draw(p)
    out, cur = [], []
    for op, args in p.value:
        cur.append((op, args))
        if op in ('closePath', 'endPath'): out.append(cur); cur = []
    res = []
    for c in out:
        bp = BoundsPen(_gs); rp = RecordingPen(); rp.value = c; rp.replay(bp); res.append((c, bp.bounds))
    return res

def wordmark_paths(text, size, x, baseline, gold_dots_in):
    """Returns (body_d, dots_d, width). Dots of glyphs whose name is in gold_dots_in go to dots_d."""
    scale = size / UPEM
    body, dots = SVGPathPen(_gs), SVGPathPen(_gs)
    pen_x = 0
    for gname, pos in shaped(text):
        ox, oy = x + (pen_x + pos.x_offset) * scale, baseline - pos.y_offset * scale
        for c, (x0, y0, x1, y1) in contours(gname):
            dotlike = (y1 - y0) < 240 and (x1 - x0) < 240 and y0 > 380
            if dotlike:
                # Every dot becomes a round coin (the font draws Arabic dots as diamonds).
                ccx, ccy = ox + (x0 + x1) / 2 * scale, oy - (y0 + y1) / 2 * scale
                rad = (0.74 if gname.startswith('uni06') else 0.96) * max(x1 - x0, y1 - y0) / 2 * scale
                target = dots if gname in gold_dots_in else body
                target._commands.append(f"M{ccx - rad:.2f} {ccy:.2f}a{rad:.2f} {rad:.2f} 0 1 0 {2*rad:.2f} 0a{rad:.2f} {rad:.2f} 0 1 0 {-2*rad:.2f} 0Z")
                continue
            rp = RecordingPen(); rp.value = c
            rp.replay(TransformPen(body, (scale, 0, 0, -scale, ox, oy)))
        pen_x += pos.x_advance
    return body.getCommands(), dots.getCommands(), pen_x * scale

def word_bounds(text, size):
    scale = size / UPEM; bp = BoundsPen(_gs); px = 0
    for g, p in shaped(text):
        _gs[g].draw(TransformPen(bp, (scale, 0, 0, -scale, (px + p.x_offset) * scale, -p.y_offset * scale))); px += p.x_advance
    return bp.bounds  # y-down, relative to baseline at 0

def wordmark(text, size, x, baseline, ink, dot, gold_glyphs):
    b, d, w = wordmark_paths(text, size, x, baseline, gold_glyphs)
    return f'<path fill="{ink}" d="{b}"/><path fill="{dot}" d="{d}"/>', w

EN, AR = 'qirsh', 'قرش'
EN_GOLD, AR_GOLD = {'i'}, {'uni0642.init'}

def build():
    # 1) marks
    pad = 24
    w, h = MARK_W + 2*pad, MARK_H - DOTS_TOP + 2*pad
    for name, body, dots in [('qirsh-mark.svg', NILE, GOLD_DEEP), ('qirsh-mark-on-dark.svg', SAND, GOLD),
                             ('qirsh-mark-mono-ink.svg', INK, INK), ('qirsh-mark-mono-white.svg', WHITE, WHITE)]:
        save(name, svg(w, h, mark_group(body, dots, pad, pad - DOTS_TOP)))

    # 2) wordmarks
    size = 200
    for text, gold, fname in [(EN, EN_GOLD, 'qirsh-wordmark-en'), (AR, AR_GOLD, 'qirsh-wordmark-ar')]:
        x0, y0, x1, y1 = word_bounds(text, size)
        ww, hh = x1 - x0 + 2*pad, y1 - y0 + 2*pad
        for suffix, ink, dot in [('', INK, GOLD_DEEP), ('-on-dark', SAND, GOLD)]:
            g, _ = wordmark(text, size, pad - x0, pad - y0, ink, dot, gold)
            save(f'{fname}{suffix}.svg', svg(round(ww), round(hh), g, title='Qirsh' if text == EN else 'قرش'))

    # 3) horizontal lockup: mark | qirsh  ·  قرش   (English x-height aligned to the ring)
    def lockup_h(body, dots, ink, dot, bg=None):
        s = 0.50                                  # mark scale
        mh = (MARK_H - DOTS_TOP) * s
        size = 168
        ex0, ey0, ex1, ey1 = word_bounds(EN, size)
        ax0, ay0, ax1, ay1 = word_bounds(AR, size * 0.78)
        gap = 46
        top = 40
        ring_c = top + (CY - DOTS_TOP) * s        # ring centre y
        xh = 0.53 * size                          # approx x-height of Readex Pro
        baseline = ring_c + xh / 2 + 4
        mark_x = 40
        tx = mark_x + MARK_W * s + gap
        en, enw = wordmark(EN, size, tx - ex0, baseline, ink, dot, EN_GOLD)
        sep_x = tx + (ex1 - ex0) + 44
        ar_x = sep_x + 44
        ar, arw = wordmark(AR, size * 0.78, ar_x - ax0, baseline, ink, dot, AR_GOLD)
        total_w = ar_x + (ax1 - ax0) + 40
        total_h = top + mh + 40
        sep = f'<rect x="{sep_x:.1f}" y="{baseline - xh*1.25:.1f}" width="4" height="{xh*1.5:.1f}" rx="2" fill="{ink}" opacity="0.25"/>'
        return svg(round(total_w), round(total_h), mark_group(body, dots, mark_x, top - DOTS_TOP*s, s) + en + sep + ar, bg)
    save('qirsh-lockup-horizontal.svg', lockup_h(NILE, GOLD_DEEP, INK, GOLD_DEEP))
    save('qirsh-lockup-horizontal-on-dark.svg', lockup_h(SAND, GOLD, SAND, GOLD))

    # 4) stacked lockup
    def lockup_v(body, dots, ink, dot):
        s = 0.62; mw, mh = MARK_W * s, (MARK_H - DOTS_TOP) * s
        size = 150
        ex0, ey0, ex1, ey1 = word_bounds(EN, size); ax0, ay0, ax1, ay1 = word_bounds(AR, size * 0.8)
        width = max(ex1 - ex0, ax1 - ax0, mw) + 120
        top = 50
        m = mark_group(body, dots, (width - mw) / 2, top - DOTS_TOP * s, s)
        b1 = top + mh + 40 - ey0
        en, _ = wordmark(EN, size, (width - (ex1 - ex0)) / 2 - ex0, b1, ink, dot, EN_GOLD)
        b2 = b1 + ey1 + 26 - ay0
        ar, _ = wordmark(AR, size * 0.8, (width - (ax1 - ax0)) / 2 - ax0, b2, ink, dot, AR_GOLD)
        return svg(round(width), round(b2 + ay1 + 50), m + en + ar)
    save('qirsh-lockup-stacked.svg', lockup_v(NILE, GOLD_DEEP, INK, GOLD_DEEP))
    save('qirsh-lockup-stacked-on-dark.svg', lockup_v(SAND, GOLD, SAND, GOLD))

    # 5) app icon (full-bleed square; iOS/Android apply their own mask)
    def icon(size=1024, frac=0.56, bg=NILE, body=SAND, dots=GOLD, transparent=False):
        mh = MARK_H - DOTS_TOP
        s = size * frac / mh
        x = (size - MARK_W * s) / 2
        y = (size - mh * s) / 2 - DOTS_TOP * s
        return svg(size, size, mark_group(body, dots, x, y, s), None if transparent else bg)
    save('app-icon.svg', icon())
    save('android-adaptive-foreground.svg', icon(frac=0.44, transparent=True))   # inside the 66% safe zone
    save('android-adaptive-background.svg', svg(1024, 1024, '', NILE))
    save('android-adaptive-monochrome.svg', icon(frac=0.44, transparent=True, body=WHITE, dots=WHITE))
    save('splash-icon.svg', icon(frac=0.9, transparent=True, body=NILE, dots=GOLD_DEEP))
    save('splash-icon-dark.svg', icon(frac=0.9, transparent=True, body=SAND, dots=GOLD))
    save('favicon.svg', icon(size=64, frac=0.66))

build()
print('\n'.join(sorted(os.listdir(OUT))))
