#!/usr/bin/env python3
"""Normalize Instagram avatars, with no hand-set anchors, for every ranked
character that has no avatar yet (user-added ones and researched characters
still shown as an illustration).

    python3 scripts/avatars/auto.py [--sr-model EDSR_x4.pb] [--force] [slug ...]

Runs after scripts/build_data.py (it reads src/data/generated/index.json).
For every INCLUDED character without an avatar (public/avatars/<slug>/ or
`avatar: true` in src/data/portraits.ts):

1. source picture: the one committed with the submission
   (data/submissions/<handle>.json -> avatar.path), one already in
   data/avatars/source/<handle>.*, or the current profile picture from
   Instagram's public profile endpoint, Apify (APIFY_TOKEN) or unavatar.io
2. framing anchors found automatically: OpenCV face detection, or the
   cut-out silhouette when no face is found (cartoons, animals)
3. accent: the character's accent from src/data/portraits.ts, else the site
   palette colour that contrasts most with the subject
4. the same pipeline as the hand-tuned avatars (normalize.py run()), and an
   entry in scripts/avatars/avatars.json marked "auto": true

Re-run scripts/build_data.py afterwards so the site picks the avatars up
(src/data/generated/portraits.json).
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import normalize as N  # noqa: E402

ROOT = N.ROOT
INDEX = ROOT / "src/data/generated/index.json"
SUBMISSIONS = ROOT / "data/submissions"

# accents already used on the site; the most contrasting one is picked
PALETTE = ["#C6F432", "#FF6A3D", "#6E9BD8", "#EDB54F", "#F7A1C4", "#9BCBB1", "#CFA06A",
           "#F4AE79", "#5ED3F3", "#FFB547", "#ECC660", "#6DB3AA", "#B79CF2"]
UA = {"user-agent": "Mozilla/5.0 (AI Fame Index avatar bot)"}


def fetch(url: str, data: bytes | None = None, timeout=60) -> bytes | None:
    try:
        req = urllib.request.Request(url, data=data, headers={**UA, **({"content-type": "application/json"} if data else {})})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except Exception as e:  # network or HTTP error: try the next source
        print(f"  fetch failed: {url.split('?')[0]}: {e}")
        return None


IG_UA = "Instagram 300.0.0.0.0 Android (33/13; 420dpi; 1080x2340; samsung; SM-S918B; dm3q; qcom; en_US; 520000000)"
_apify: dict[str, str] = {}


def apify_pictures(handles: list[str]) -> None:
    """One Apify run for every handle still missing a picture (needs APIFY_TOKEN)."""
    token = os.environ.get("APIFY_TOKEN")
    if not token or not handles:
        return
    actor = os.environ.get("APIFY_PROFILE_ACTOR", "apify~instagram-profile-scraper")
    raw = fetch(f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items?token={token}&timeout=280",
                json.dumps({"usernames": handles}).encode(), timeout=300)
    for p in json.loads(raw) if raw else []:
        url = p.get("profilePicUrlHD") or p.get("profilePicUrl")
        if p.get("username") and url:
            _apify[p["username"].lower()] = url


def current_picture(handle: str) -> tuple[bytes, str] | None:
    # Instagram's own public profile endpoint (works without login from many networks)
    try:
        req = urllib.request.Request(f"https://i.instagram.com/api/v1/users/web_profile_info/?username={handle}",
                                     headers={"user-agent": IG_UA, "x-ig-app-id": "936619743392459"})
        with urllib.request.urlopen(req, timeout=30) as r:
            user = json.loads(r.read())["data"]["user"]
        url = user.get("profile_pic_url_hd") or user.get("profile_pic_url")
        img = fetch(url) if url else None
        if img and len(img) > 1000:
            return img, "Instagram profile picture"
    except Exception as e:
        print(f"  instagram endpoint failed for @{handle}: {e}")
    if handle in _apify:
        img = fetch(_apify[handle])
        if img:
            return img, "Instagram profile picture (Apify)"
    img = fetch(f"https://unavatar.io/instagram/{handle}?fallback=false")
    if img and len(img) > 1000:
        return img, "Instagram profile picture (unavatar.io)"
    return None


def source_for(c: dict) -> tuple[str, str] | None:
    """Filename inside data/avatars/source/ and its origin note."""
    rec_path = SUBMISSIONS / f"{c['handle']}.json"
    rec = json.loads(rec_path.read_text(encoding="utf-8")) if rec_path.exists() else {}
    av = rec.get("avatar") or {}
    if av.get("path") and (ROOT / av["path"]).exists():
        return Path(av["path"]).name, f"{av.get('origin', 'Instagram profile picture')}, captured {av.get('capturedAt', '')}".strip(", ")
    for ext in ("jpg", "png", "webp"):
        if (N.SOURCES / f"{c['handle']}.{ext}").exists():
            return f"{c['handle']}.{ext}", "Instagram profile picture"
    got = current_picture(c["handle"])
    if not got:
        return None
    data, origin = got
    name = f"{c['handle']}.jpg"
    Image.open(io.BytesIO(data)).convert("RGB").save(N.SOURCES / name, quality=95)
    return name, origin


def anchors(img: Image.Image, alpha: np.ndarray) -> tuple[dict, str]:
    """cx / eye / chin / top as fractions of the source image."""
    import cv2

    w, h = img.size
    rows = np.where((alpha > 0.5).mean(axis=1) > 0.01)[0]
    top_px = int(rows[0]) if len(rows) else 0
    top = top_px / h if top_px > 2 else None  # subject touching the top edge: crown cropped
    gray = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
    m = int(min(w, h) * 0.12)
    # the default frontal detector is strict; looser ones misfire on hair and props,
    # where the silhouette fallback below frames better
    found = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml").detectMultiScale(
        gray, scaleFactor=1.06, minNeighbors=6, minSize=(m, m))
    # keep faces that sit on the cut-out subject
    faces = [f for f in found if alpha[int(f[1] + f[3] / 2), int(f[0] + f[2] / 2)] > 0.5]
    if faces:
        x, y, fw, fh = (float(v) for v in max(faces, key=lambda f: f[2] * f[3]))
        return {"cx": (x + fw / 2) / w, "eye": (y + 0.40 * fh) / h, "chin": min((y + 0.95 * fh) / h, 0.98), "top": top}, "face"
    # no face (cartoon, animal): frame by the silhouette, head assumed in the upper part
    bottom = int(rows[-1]) if len(rows) else h - 1
    bh = max(bottom - top_px, 1)
    band = alpha[top_px : top_px + max(int(0.22 * bh), 1)]  # the crown: shoulders and props would pull the centre
    xs = np.where(band > 0.5)[1]
    cx = float(xs.mean()) / w if len(xs) else 0.5
    return {"cx": cx, "eye": (top_px + 0.30 * bh) / h, "chin": (top_px + 0.58 * bh) / h, "top": top}, "silhouette"


def accent_for(img: Image.Image, alpha: np.ndarray) -> str:
    px = np.array(img).reshape(-1, 3)[alpha.reshape(-1) > 0.5].astype(float)
    mean = px.mean(axis=0) if len(px) else np.array([128.0, 128, 128])
    return max(PALETTE, key=lambda a: float(np.linalg.norm(N.hex_rgb(a) - mean)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--sr-model", default=None)
    ap.add_argument("--force", action="store_true", help="redo avatars that already exist")
    args = ap.parse_args()
    data = json.loads(INDEX.read_text(encoding="utf-8"))
    cfgs = json.loads(N.CONFIG.read_text(encoding="utf-8"))
    report_path = N.OUT / "report.json"
    report = json.loads(report_path.read_text()) if report_path.exists() else []
    accents = N.accents()
    hand_made = set(re.findall(r'"([a-z0-9-]+)":\s*\{[^}]*?avatar:\s*true', N.PORTRAITS_TS.read_text(encoding="utf-8")))
    todo = []
    for c in data["characters"]:
        if c.get("inclusion") != "INCLUDED" or (args.slugs and c["slug"] not in args.slugs):
            continue
        if c["slug"] in hand_made and not args.force:
            continue
        if (N.OUT / c["slug"] / "avatar-512.webp").exists() and not args.force:
            continue
        todo.append(c)
    have = {p.stem for p in N.SOURCES.iterdir()}
    apify_pictures([c["handle"] for c in todo if c["handle"] not in have and c.get("group") != "SUBMITTED"])
    done = 0
    for c in todo:
        slug = c["slug"]
        existing = cfgs.get(slug)
        cfg = existing if existing and not existing.get("auto") else None  # a hand-tuned entry wins
        if cfg is None:
            src = source_for(c)
            if not src:
                print(f"{slug}: no picture found, keeps the placeholder")
                continue
            name, origin = src
            img = Image.open(N.SOURCES / name).convert("RGB")
            alpha = N.cut_out(img, "isnet-general-use")
            a, how = anchors(img, alpha)
            model = "isnet-general-use"
            if how == "face":  # people: the human-segmentation model keeps hair edges cleaner
                model = "u2net_human_seg"
                alpha = N.cut_out(img, model)
            cfg = {"source": name, "origin": origin, "model": model, **{k: round(v, 3) if v is not None else None for k, v in a.items()},
                   "accent": accents.get(slug) or accent_for(img, alpha), "auto": True, "_why": f"Anchors found automatically ({how})."}
            cfgs[slug] = cfg
        r = N.run(slug, cfg, cfg.get("accent", "#CFC8BA"), args.sr_model)
        r["origin"] = cfg["origin"]
        report = [x for x in report if x.get("slug") != slug] + [r]
        print(f"{slug:20s} {cfg['_why'] if cfg.get('auto') else 'hand-tuned'}  {r['scale']}x  {'; '.join(r['notes'])}")
        done += 1
    N.CONFIG.write_text(json.dumps(cfgs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    report_path.write_text(json.dumps(report, indent=1))
    print(f"{done} avatar(s) normalized")


if __name__ == "__main__":
    sys.exit(main())
