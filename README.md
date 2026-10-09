# AI Celebrity Index

**Who owns the internet today?** A live cultural index of fictional AI influencers, synthetic celebrities and internet-native AI characters, with Fame and Momentum scores, a social graph, career arcs, live status, identity labels and an optional token layer.

Built with Next.js (App Router, static export), React, TypeScript, Tailwind CSS, Framer Motion and d3-force.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Editorial hero with the #1 character, live index strip, Fame vs Momentum, the AI Top 100 (top 10), Breaking the Internet, editorial stories, rivalries, universes |
| `/chart/` | The full AI Top 100 (ranked by Index, Fame, Momentum or Breakout; swipe between rankings on phones) plus the watchlist |
| `/breakout/` | Every character ranked by Momentum, as large cards |
| `/network/` | The Universe: an interactive force graph. Node size = Fame, pulse = Momentum, lines = relationships. Pick a universe to isolate it. Deep links: `?u=ai-fight-league`, `?focus=derek-mercer` |
| `/discover/` | Visual discovery with search and filters (AI humans, AI animals, parody, crypto, virtual, verified, tokenized, active, rising) |
| `/c/[slug]/` | Character profile: overview, career arc, fame history, network, posts, token, sources |
| `/methodology/`, `/sources/`, `/about/` | How scores work, every source, house rules |

## Data

The research workbook lives in `data/raw/`. A script converts it into the JSON the site reads:

```bash
npm run data        # python3 scripts/build_data.py -> src/data/generated/index.json
```

The script needs Python 3 with `openpyxl`. It:

- keeps INCLUDED characters (ranked) and WATCHLIST characters (unranked), and lists EXCLUDED accounts with the reason
- ranks dynamically from the workbook scores (Index, Fame, Momentum, Distinctiveness); nothing is hard-coded
- builds the social graph from the workbook's edge list, tags relationship types (rival, storyline, collab, mention, same universe) and groups characters into universes
- parses career milestones and period trajectories into timeline events and fame-history points
- derives live status from the last post date (never fake realtime), identity labels (verified / official / unverified / parody / unknown) and the token layer (verified only when the character's own Instagram shows it)
- keeps the OBSERVED / INFERRED / UNKNOWN label on every derived claim

`src/lib/data.ts` is the only module that imports the JSON. To move to a backend, return the same shape (`src/lib/types.ts`) from an API and swap that import.

## Portraits

- Photo portraits in `public/portraits/` (and background-removed cutouts in `public/portraits/cutouts/`) are stills from the supplied promo video.
- Everyone else gets a flat sticker illustration drawn from the look described in the workbook (`src/components/CharacterArt.tsx`). When the workbook marks the look as unknown, a neutral placeholder with initials is shown instead of an invented face.
- Each profile labels which kind of portrait it shows.

To add a real image: put `<slug>.webp` in `public/portraits/` (and optionally a transparent `cutouts/<slug>.webp`), then set `photo: true` for that slug in `src/data/portraits.ts`. Accent colours also live there.

## Develop

```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # static site in out/
npm run typecheck
```

## Ground rules

- Characters are the UI; numbers support them.
- Scores are an index methodology, not objective truth.
- Parody personas are marked "Parody / unofficial AI persona" and never implied to be affiliated.
- Tickers are never invented. Off-Instagram or supplied tickers are shown as unverified mentions.
