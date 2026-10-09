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

## Avatars

All portraits follow one profile-picture system, described in [`docs/AVATAR_STYLE.md`](docs/AVATAR_STYLE.md): same framing grid, accent-gradient background, colour grade, key light, contact shadow and white sticker outline.

- Normalized avatars live in `public/avatars/<slug>/` (`avatar-1024/512/160.webp` plus a transparent `cutout-1024.webp`). They are produced from the official source images in `data/avatars/source/` by `scripts/avatars/normalize.py` (per-character anchors in `scripts/avatars/avatars.json`). `public/avatars/report.json` records the source and enlargement of each one.
- Characters without an official image keep a flat sticker illustration (`src/components/CharacterArt.tsx`) on the same background system. When the look is unknown, a neutral placeholder with initials is shown instead of an invented face.
- Each profile labels which kind of portrait it shows.

To add an avatar: put the official image in `data/avatars/source/`, add its anchors to `avatars.json`, run the script and set `avatar: true` for the slug in `src/data/portraits.ts`.

## Token layer

Token data follows `token.verification` from the data pipeline:

| Level | Meaning | What the UI shows |
| --- | --- | --- |
| `CONTRACT` | Full contract address in the character's own bio | Ticker, contract (copy), pump.fun link, live market data, optional DexScreener chart embed |
| `PROFILE` | Ticker or pump.fun link on the profile, contract not captured | Ticker and link; no prices (they need the contract) |
| `UNVERIFIED` | Ticker only reported off-Instagram or supplied with the brief | "Token status · unverified" with the mention; never linked or priced |
| `NONE` | Nothing token-related found | "No verified token" |

Live market data (market cap, 24h change, volume, liquidity, price path) is requested **from the visitor's browser** from DexScreener's public API (`src/lib/market.ts`) and cached for 5 minutes in session storage. If the request fails, the card says the data is unavailable; nothing is estimated. Holder counts are not available from this source.

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
