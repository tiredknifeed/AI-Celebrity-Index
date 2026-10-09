# Avatar style guide

One profile-picture system for every character: same grid, same light, same
background, different personalities. Implemented by
`scripts/avatars/normalize.py`, configured per character in
`scripts/avatars/avatars.json`.

## 1. Framing

Square master canvas, 1024 × 1024. Rounded corners are applied by the UI
(cards use `rounded-4xl`, compact avatars `rounded-2xl` or a circle), never
baked into the image.

| Guide | Value |
| --- | --- |
| Crop | Tight head-and-shoulders, centred on the face |
| Eye line | 43% from the top |
| Eye → chin | 25% of the canvas (head, crown to chin, ≈ 56%) |
| Face centre | Horizontal centre of the canvas |
| Bottom | The body always exits the bottom edge; nothing floats |
| Crown | Never cut by a hard edge inside the frame. If the source already crops the crown, the source top is pinned to the canvas top (tight crop) |
| Sides | Where the source ends inside the canvas, the subject dissolves over 10% of the width instead of showing a hard cut |

Documented exceptions (character-first beats the grid):

- **Abu Nutty**: framed wider (eye line 34%, eye → chin 15%) so the fight glove, his signature prop, stays in shot.
- **Mr. Stretchy**: the oversized toon head is the character, so the head reads bigger than the grid once the body is made to reach the bottom edge.
- **Nobody Sausage**: a flat graphic character; colour grading is skipped, and the eye line sits at 60% because its eyes are mid-body.
- **Archibald Brown**: framed wider (eye line 36%, eye → chin 14%) so the two-hand gesture from his portrait stays in shot.
- **Candy the Greyhound** and **Casper the Italian Greyhound**: dogs; "chin" is the bottom of the muzzle. Candy is shown full-length so the UFC gloves stay in shot.
- **Granny Spills**: white balance is off (`"wb": 0`), because the all-pink outfit fills the frame and grey-world correction turns the skin green.

## 2. Background system

- Subject cut out from its original scene (rembg).
- New background: the character's accent colour (from `src/data/portraits.ts`) as a radial gradient, 42% lighter at the centre behind the head (50% / 36%), 10% darker at the edges.
- 12 px dot grain at 6%, the same texture as the site's `.grain` utility.
- No scenery, no text, no logos added.

The UI reproduces the same gradient in CSS (`avatarBg()` in `src/data/portraits.ts`) behind transparent cut-outs and illustrations, so layered layouts match the baked files.

## 3. Lighting and finish

- Partial grey-world white balance (45%, per-character `wb` override) to remove colour casts from the original scene.
- Percentile levels on luminance (0.6% / 99.4%), then a gentle S-curve.
- Saturation pulled towards one shared target (mean 0.34, clamped 0.8×–1.35×).
- Slight warmth (+2% red, −1.5% blue) and a clarity pass (unsharp mask, 2.2 px).
- Key light from the top-left (+7%) and soft shade at the bottom (−7%).
- Soft contact shadow under the subject (26 px blur, 16 px drop, 24%).
- 7 px white sticker outline around the subject. The same outline is drawn on the SVG illustrations, which ties photos and illustrations into one family.

## 4. Resolution

Sources under 700 px are enlarged 4× with OpenCV's EDSR super-resolution model before cut-out and grading. The report (`public/avatars/report.json`) records the effective enlargement over the native source and flags anything above 2.6×.

## 5. Exports

Per character in `public/avatars/<slug>/`:

| File | Size | Use |
| --- | --- | --- |
| `avatar-1024.webp` | 1024² | Hero, share images |
| `avatar-512.webp` | 512² | Large graph nodes, cards that need a baked square |
| `avatar-160.webp` | 160² | Compact UI: index strip, chart rows, search, graph nodes, related lists |
| `cutout-1024.webp` | 1024², transparent | Layered layouts: homepage hero, podium, profile header, breakout and collectible cards |

## 6. Characters without an official image

When no official source image is available, the character keeps its flat sticker illustration (`src/components/CharacterArt.tsx`), drawn from the look described in the research, placed on the same gradient background with the same outline and shadow. When the look itself is unknown, a neutral placeholder with initials is shown instead of an invented face. Each profile labels which kind of portrait it shows.

## Re-running

```bash
pip install pillow numpy rembg opencv-contrib-python-headless
curl -L -o EDSR_x4.pb https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x4.pb
python3 scripts/avatars/normalize.py --sr-model EDSR_x4.pb            # all
python3 scripts/avatars/normalize.py --sr-model EDSR_x4.pb derek-mercer
```

To add a character: drop the official image into `data/avatars/source/`, add an entry with its anchors to `avatars.json`, run the script, and set `avatar: true` for the slug in `src/data/portraits.ts`.

## User-added characters

`scripts/avatars/auto.py` applies the same grid without hand-set anchors: OpenCV frontal-face detection when a face is found (human-segmentation cut-out), otherwise framing by the cut-out silhouette with the head assumed in its upper part (general cut-out model). The accent is the site palette colour that contrasts most with the subject. Entries are marked `"auto": true` in `scripts/avatars/avatars.json`.
