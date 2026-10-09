# Submissions

Anyone can paste an Instagram link on `/submit` and get the profile analyzed
with the index methodology. Approved characters join the index; the database
grows without anyone editing the workbook.

There are two modes, switched with `SUBMISSIONS_FREE`:

- **Free (default, `SUBMISSIONS_FREE=true`).** No payment. `POST /api/submit/`
  runs the analysis right away (about 1-2 minutes), opens the review PR and
  returns an id; the submitter lands on `/submit/status/?id=…&handle=…`.
  Needs only `APIFY_TOKEN` and `GITHUB_TOKEN`.
- **Paid (`SUBMISSIONS_FREE=false`).** Stripe Checkout first; the flow below.

### Free-mode guards

- One review per character: if an open submission PR already exists for the
  handle, the submitter is sent to that PR's status page instead of a new one.
- Queue cap: no new submissions while `SUBMISSION_QUEUE_LIMIT` (default 40)
  PRs wait for review, so Apify costs and the review backlog stay bounded.
- Per-IP limit: `SUBMISSION_IP_HOURLY` (default 3) attempts per hour. Best
  effort: kept in memory per server instance.
- Honeypot form field against simple bots; already-ranked handles, private
  profiles and unknown handles are refused before anything is opened.

## Paid flow

```
/submit  ──POST /api/submit/──▶  Stripe Checkout  ──paid──▶  /api/stripe/webhook/
                                                                   │ (after response)
                                                                   ▼
                     Apify: public profile + up to 60 posts  ──▶  analyze()  ──▶  GitHub PR
                                                                                     │
/submit/status/?session_id=…  ◀── Stripe (paid?) + PR state + provisional report ◀──┘
                                                                                     │ analyst fills review, merges
                                                                                     ▼
                                       scripts/build_data.py merges data/submissions/<handle>.json
                                                                                     ▼
                                                              next deploy: ranked profile on the site
```

1. **`POST /api/submit/`** parses the link (`src/lib/submissions/handle.ts`), refuses characters already ranked, and creates a Stripe Checkout session with the handle in its metadata.
2. **`POST /api/stripe/webhook/`** verifies the Stripe signature and, for `checkout.session.completed`, runs the pipeline after the response (`after()`), so Stripe gets its 200 immediately.
3. **Pipeline** (`src/lib/submissions/process.ts`): fetch the public profile through Apify, compute the workbook metrics and provisional Fame / Momentum (`analyze.ts`, `src/lib/scoring.ts`), detect token signals in the bio, find tags of characters already in the index, then commit `data/submissions/<handle>.json` on a `submission/…` branch and open a pull request with a summary and review checklist.
4. **`GET /api/submit/status/`** derives the state from Stripe and the PR (paid → analysing → in review → added / rejected) and returns the provisional report. If the webhook was missed, a paid session without a PR is processed here.
5. **Review.** The analyst checks it is an AI or fictional character, fills `review` (name, type, universe, parody reference, recognizability and the four distinctiveness ratings), sets `include: true` and merges. Closing the PR rejects it.
6. **Build.** `npm run data` merges every approved file. Scores are recomputed in Python with the same formulas, so a submission is ranked exactly like a researched character.

There is no database: Stripe holds payments, GitHub holds the queue and the data.

## Setup

Copy `.env.example` to `.env` (or set the variables on the host):

| Variable | Purpose |
| --- | --- |
| `SUBMISSIONS_FREE` | `true` (default) for free submissions, `false` for paid |
| `SUBMISSION_QUEUE_LIMIT`, `SUBMISSION_IP_HOURLY` | Free-mode guards (defaults 40 and 3) |
| `SITE_URL` | Public URL, used for Stripe success / cancel redirects (paid) |
| `SUBMISSION_PRICE_CENTS`, `SUBMISSION_CURRENCY` | Price (default 4900 = $49) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paid mode only. Stripe API key and the signing secret of a webhook pointing to `<SITE_URL>/api/stripe/webhook/` (note the trailing slash) for `checkout.session.completed` |
| `APIFY_TOKEN`, `APIFY_PROFILE_ACTOR`, `APIFY_POSTS_ACTOR` | Apify token and the actors that return the public profile and posts |
| `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BASE_BRANCH` | Token with contents + pull-request write access to the data repository; the base branch defaults to the repository's default branch |

Until the Apify and GitHub keys (plus the Stripe keys in paid mode) are set, `/submit` stays visible but the API answers "Submissions are not open yet".

Hosting needs server functions (e.g. Vercel): the site is no longer a pure static export. The submit and webhook routes set `maxDuration = 300` (free submissions are analyzed inside the request); on plans with a shorter limit the status endpoint finishes missed work.

`netlify.toml` already runs `npm run data` before `next build` (Python + `requirements.txt`), so an approved submission appears with the build that the merge triggers. Deploy previews for `submission/*` branches are skipped to keep the build queue free. On other hosts, run `npm run data` as part of the build.

## Approving a submission

1. Open the submission PR on GitHub, then **Files changed → ⋯ → Edit file** on `data/submissions/<handle>.json` (or edit it on the default branch after merging).
2. Fill the `review` block: `name`, `characterType`, `universe` (a key from the universe list, e.g. `higgsfield-network`, or anything else for Independents), `parodyOf` if it imitates a real person or IP, `recognizability` and the four `distinct` ratings (0-5), and set `"include": true`.
3. Commit and merge. Netlify rebuilds once (a few minutes) and the character is ranked on the site.

A file with `"include": false` or any rating left empty is ignored by the build, so merging an unreviewed PR is harmless.

On the site, user-added characters carry a "+ Added by a user" label (identity `COMMUNITY`) instead of an identity verdict, and never show the verified mark.

## Avatars

The submission saves the Instagram profile picture with the PR (`data/avatars/source/<handle>.jpg`, the CDN link expires). After approval, the **Submission avatars** GitHub Action (`.github/workflows/avatars.yml`) runs `scripts/avatars/auto.py`: it finds the face (or frames by the silhouette for cartoons and animals), picks a contrasting accent, normalizes the picture with the same pipeline as the hand-tuned avatars and commits `public/avatars/<slug>/`. That push triggers one more site build. For submissions saved without a picture, the job fetches the current one through Apify (optional repository secret `APIFY_TOKEN`) or unavatar.io. To hand-tune a result, edit its entry in `scripts/avatars/avatars.json`, remove `"auto": true` and run `normalize.py <slug>`.

## Checks

- `npm run check:scoring` re-scores all 38 researched characters with `src/lib/scoring.ts` and compares with the workbook (worst difference must be 0.0).
- The Python scorer in `build_data.py` uses the same formulas; an end-to-end run with a synthetic submission produced identical Fame / Momentum in both.

## Notes

- Instagram data is collected from public profiles through a third-party provider. Make sure this fits Instagram's terms and the provider's terms in your jurisdiction before opening submissions.
- In paid mode, payment buys the analysis, not a placement: inclusion is decided by review, and scores are never edited for payment. Decide and publish a refund policy for rejected or private accounts.
