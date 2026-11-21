"""Shape text with HarfBuzz and return SVG path data (y-down), so wordmarks don't depend on installed fonts."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

_cache = {}

def _load(path):
    if path not in _cache:
        data = open(path, 'rb').read()
        face = hb.Face(hb.Blob(data))
        font = hb.Font(face)
        tt = TTFont(path)
        _cache[path] = (font, tt, tt.getGlyphSet(), tt['head'].unitsPerEm)
    return _cache[path]

def text_path(text, font_path, size, x=0.0, y=0.0, tracking=0.0, direction=None):
    """Return (d, width). (x, y) is the left end of the baseline. tracking in em."""
    font, tt, gs, upem = _load(font_path)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    if direction:
        buf.direction = direction
    hb.shape(font, buf, {"kern": True, "liga": True})
    scale = size / upem
    order = tt.getGlyphOrder()
    pen = SVGPathPen(gs)
    pen_x = 0.0
    infos, poss = buf.glyph_infos, buf.glyph_positions
    for i, (info, pos) in enumerate(zip(infos, poss)):
        gname = order[info.codepoint]
        ox = x + (pen_x + pos.x_offset) * scale
        oy = y - pos.y_offset * scale
        tpen = TransformPen(pen, (scale, 0, 0, -scale, ox, oy))
        gs[gname].draw(tpen)
        pen_x += pos.x_advance + (tracking * upem if i < len(infos) - 1 else 0)
    return pen.getCommands(), pen_x * scale

def text_bbox(text, font_path, size, **kw):
    from fontTools.pens.boundsPen import BoundsPen
    font, tt, gs, upem = _load(font_path)
    d, w = text_path(text, font_path, size, **kw)
    # crude bbox via svg parse is overkill; use bounds pen on a second pass
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties(); hb.shape(font, buf, {})
    scale = size / upem; order = tt.getGlyphOrder(); bp = BoundsPen(gs); px = 0
    tracking = kw.get('tracking', 0.0)
    for i,(info,pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        t = TransformPen(bp, (scale,0,0,-scale,(px+pos.x_offset)*scale, -pos.y_offset*scale))
        gs[order[info.codepoint]].draw(t); px += pos.x_advance + tracking*upem
    return bp.bounds, w  # (xmin, ymin, xmax, ymax) in y-down coords relative to baseline origin
