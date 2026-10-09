#!/usr/bin/env python3
"""Normalize character avatars into one profile-picture system.

    python3 scripts/avatars/normalize.py [--sr-model EDSR_x4.pb] [slug ...]

For every character in scripts/avatars/avatars.json:

1. optional 4x super-resolution (OpenCV EDSR) for sources under 700px
2. background removal (rembg)
3. colour grade: partial grey-world white balance, percentile levels,
   gentle S-curve, saturation normalised to a shared target, clarity
4. framing: eye line, eye-to-chin distance and face centre mapped to the
   shared grid (docs/AVATAR_STYLE.md); the subject always reaches the
   bottom edge and never shows a cut-off crown inside the frame
5. composition on the shared background: accent radial gradient + dot
   grain, soft contact shadow, white sticker outline, key light
6. exports to public/avatars/<slug>/: avatar-1024.webp (hero),
   avatar-512.webp (cards, profile), avatar-160.webp (compact UI) and
   cutout-1024.webp (transparent, for layered hero layouts)

Needs: pillow, numpy, rembg, opencv-contrib-python-headless (for --sr-model).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "scripts/avatars/avatars.json"
SOURCES = ROOT / "data/avatars/source"
CACHE = ROOT / "data/avatars/.cache"
OUT = ROOT / "public/avatars"
PORTRAITS_TS = ROOT / "src/data/portraits.ts"

C = 1024  # master canvas

# ---- the grid (fractions of the canvas) -------------------------------------
EYE_Y = 0.43        # eye line
EYE_CHIN = 0.25     # eye-to-chin distance -> head (crown to chin) ~56%
OUTLINE_PX = 7      # white sticker outline
SHADOW_BLUR = 26
SHADOW_OFFSET = 16
SHADOW_ALPHA = 0.24
TARGET_SAT = 0.34   # mean HSV saturation of the subject after grading


def accents() -> dict[str, str]:
    src = PORTRAITS_TS.read_text(encoding="utf-8")
    return {m.group(1): m.group(2) for m in re.finditer(r'"([a-z0-9-]+)":\s*\{\s*accent:\s*"(#[0-9A-Fa-f]{6})"', src)}


def hex_rgb(h: str) -> np.ndarray:
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


# ---- steps ---------------------------------------------------------------------


def super_resolve(img: Image.Image, slug: str, model: str | None) -> tuple[Image.Image, bool]:
    if not model or min(img.size) >= 700:
        return img, False
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / f"{slug}-x4.png"
    if cached.exists():
        return Image.open(cached).convert("RGB"), True
    import cv2

    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(model)
    sr.setModel("edsr", 4)
    up = sr.upsample(cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR))
    out = Image.fromarray(cv2.cvtColor(up, cv2.COLOR_BGR2RGB))
    out.save(cached)
    return out, True


_sessions: dict = {}


def cut_out(img: Image.Image, model: str) -> np.ndarray:
    from rembg import new_session, remove

    if model not in _sessions:
        _sessions[model] = new_session(model)
    rgba = remove(img, session=_sessions[model], post_process_mask=True)
    a = np.array(rgba)[..., 3].astype(np.float32) / 255.0
    # tidy the matte: close pinholes, then a 1px feather
    m = Image.fromarray((a * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    return np.array(m).astype(np.float32) / 255.0


def grade(rgb: np.ndarray, alpha: np.ndarray, graphic: bool) -> np.ndarray:
    x = rgb.astype(np.float32) / 255.0
    mask = alpha > 0.5
    if graphic:
        return np.clip(x, 0, 1)
    px = x[mask]
    # partial grey-world white balance
    means = px.mean(axis=0)
    gain = means.mean() / np.maximum(means, 1e-4)
    x = x * (1 + 0.45 * (gain - 1))
    # percentile levels on luminance
    lum = (x[mask] @ np.array([0.299, 0.587, 0.114], dtype=np.float32))
    lo, hi = np.percentile(lum, 0.6), np.percentile(lum, 99.4)
    x = (x - lo) / max(hi - lo, 1e-3)
    # gentle S-curve
    x = np.clip(x, 0, 1)
    x = x + 0.12 * (x - 0.5) * (1 - np.abs(2 * x - 1))
    # saturation towards a shared target
    mx = x.max(axis=2, keepdims=True)
    mn = x.min(axis=2, keepdims=True)
    sat = ((mx - mn) / np.maximum(mx, 1e-4))[mask].mean()
    k = np.clip(TARGET_SAT / max(sat, 1e-3), 0.8, 1.35)
    grey = x.mean(axis=2, keepdims=True)
    x = grey + (x - grey) * k
    # slight warmth
    x[..., 0] *= 1.02
    x[..., 2] *= 0.985
    x = np.clip(x, 0, 1)
    # clarity
    im = Image.fromarray((x * 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    return np.array(im).astype(np.float32) / 255.0


def frame(cfg: dict, w: int, h: int) -> tuple[float, float, float, list[str]]:
    """Scale k (canvas px per source px) and offset (ox, oy) for the grid."""
    notes = []
    eye_y = cfg.get("eyeY", EYE_Y)
    eye_chin = cfg.get("eyeChin", EYE_CHIN)
    k = eye_chin * C / ((cfg["chin"] - cfg["eye"]) * h)
    oy = eye_y * C - cfg["eye"] * h * k
    # the subject must reach the bottom edge
    if oy + h * k < C:
        k = (C - eye_y * C) / ((1 - cfg["eye"]) * h)
        oy = eye_y * C - cfg["eye"] * h * k
        notes.append("scaled up so the body reaches the bottom edge")
    # never show a cropped crown inside the frame
    if cfg.get("top") is None and oy > 0:
        oy = 0
        if h * k < C:
            k = C / h
        notes.append("crown cropped in source: top-anchored tight crop")
    elif cfg.get("top") is not None and oy + cfg["top"] * h * k < 0.04 * C:
        notes.append("hair touches the top edge")
    ox = C / 2 - cfg["cx"] * w * k
    return k, ox, oy, notes


def background(accent: str) -> np.ndarray:
    a = hex_rgb(accent) / 255.0
    yy, xx = np.mgrid[0:C, 0:C].astype(np.float32) / C
    d = np.sqrt((xx - 0.5) ** 2 + ((yy - 0.36) * 1.1) ** 2)
    t = np.clip(d / 0.78, 0, 1)[..., None]
    centre = a * 0.58 + 0.42
    edge = a * 0.9
    bg = centre * (1 - t) + edge * t
    # dot grain, same as the site's .grain utility
    dots = ((np.mod(xx * C, 12) - 6) ** 2 + (np.mod(yy * C, 12) - 6) ** 2) < 2.2
    bg = bg * (1 - 0.06 * dots[..., None])
    return np.clip(bg, 0, 1)


def place(arr: np.ndarray, k: float, ox: float, oy: float, mode=Image.LANCZOS) -> np.ndarray:
    h, w = arr.shape[:2]
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
    img = img.resize((max(1, round(w * k)), max(1, round(h * k))), mode)
    canvas = Image.new(img.mode, (C, C), 0)
    canvas.paste(img, (round(ox), round(oy)))
    return np.array(canvas).astype(np.float32) / 255.0


def edge_fade(alpha: np.ndarray, k: float, ox: float, oy: float, w: int, h: int) -> np.ndarray:
    """Dissolve the subject where the source image ends inside the canvas."""
    yy, xx = np.mgrid[0:C, 0:C].astype(np.float32)
    left, right = ox, ox + w * k
    top = oy
    ramp = 0.1 * C
    f = np.ones_like(alpha)
    if left > 1:
        f *= np.clip((xx - left) / ramp, 0, 1)
    if right < C - 1:
        f *= np.clip((right - xx) / ramp, 0, 1)
    if top > 1:
        f *= np.clip((yy - top) / ramp, 0, 1)
    return alpha * f


def compose(subject: np.ndarray, alpha: np.ndarray, accent: str) -> tuple[np.ndarray, np.ndarray]:
    a8 = Image.fromarray((alpha * 255).astype(np.uint8))
    outline = np.array(a8.filter(ImageFilter.MaxFilter(OUTLINE_PX * 2 + 1)).filter(ImageFilter.GaussianBlur(1.0))).astype(np.float32) / 255
    shadow = np.array(a8.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))).astype(np.float32) / 255
    shifted = np.zeros_like(shadow)
    shifted[SHADOW_OFFSET:] = shadow[:-SHADOW_OFFSET]
    shadow = shifted * SHADOW_ALPHA

    # key light from the top-left, a touch of shade at the bottom
    yy, xx = np.mgrid[0:C, 0:C].astype(np.float32) / C
    light = 1 + 0.07 * np.clip(1 - np.sqrt((xx - 0.3) ** 2 + (yy - 0.18) ** 2) / 0.7, 0, 1) - 0.07 * np.clip((yy - 0.7) / 0.3, 0, 1)
    lit = np.clip(subject * light[..., None], 0, 1)

    bg = background(accent)
    out = bg * (1 - shadow[..., None])
    out = out * (1 - outline[..., None] * 0.96) + 0.96 * outline[..., None]
    out = out * (1 - alpha[..., None]) + lit * alpha[..., None]

    # transparent cut-out keeps outline + subject (no background, no shadow)
    cut_a = np.maximum(alpha, outline * 0.96)
    cut_rgb = (lit * alpha[..., None] + 0.96 * outline[..., None] * (1 - alpha[..., None])) / np.maximum(cut_a[..., None], 1e-4)
    cutout = np.dstack([np.clip(cut_rgb, 0, 1), cut_a])
    return out, cutout


def export(slug: str, rgb: np.ndarray, cutout: np.ndarray) -> None:
    d = OUT / slug
    d.mkdir(parents=True, exist_ok=True)
    im = Image.fromarray((rgb * 255).astype(np.uint8))
    for size, q in ((1024, 84), (512, 86), (160, 88)):
        im.resize((size, size), Image.LANCZOS).save(d / f"avatar-{size}.webp", quality=q, method=6)
    Image.fromarray((cutout * 255).astype(np.uint8), "RGBA").save(d / "cutout-1024.webp", quality=86, method=6)


def run(slug: str, cfg: dict, accent: str, sr_model: str | None) -> dict:
    src = Image.open(SOURCES / cfg["source"]).convert("RGB")
    native = src.size
    img, upscaled = super_resolve(src, slug, sr_model)
    alpha = cut_out(img, cfg.get("model", "u2net_human_seg"))
    rgb = grade(np.array(img), alpha, cfg.get("graphic", False))
    w, h = img.size
    k, ox, oy, notes = frame(cfg, w, h)
    subject = place(rgb, k, ox, oy)
    a = place(alpha, k, ox, oy)
    a = edge_fade(a, k, ox, oy, w, h)
    out, cutout = compose(subject, a, accent)
    export(slug, out, cutout)
    eff = k * (w / native[0])  # canvas px per native source px
    if eff > 2.6:
        notes.append(f"heavy enlargement ({eff:.1f}x native)")
    return {"slug": slug, "native": native, "superResolved": upscaled, "scale": round(eff, 2), "notes": notes}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--sr-model", default=None, help="path to EDSR_x4.pb (OpenCV dnn_superres)")
    args = ap.parse_args()
    cfgs = {k: v for k, v in json.loads(CONFIG.read_text()).items() if not k.startswith("_")}
    acc = accents()
    report = []
    for slug, cfg in cfgs.items():
        if args.slugs and slug not in args.slugs:
            continue
        r = run(slug, cfg, acc.get(slug, "#CFC8BA"), args.sr_model)
        r["origin"] = cfg["origin"]
        report.append(r)
        print(f"{slug:20s} native {r['native'][0]}x{r['native'][1]}  sr={r['superResolved']}  {r['scale']}x  {'; '.join(r['notes'])}")
    (OUT / "report.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    sys.exit(main())
