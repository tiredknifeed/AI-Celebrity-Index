# Paid submissions

Anyone can paste an Instagram link on `/submit`, pay once, and get the
profile analyzed with the index methodology. Approved characters join the
index; the database grows without anyone editing the workbook.

## Flow

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
| `SITE_URL` | Public URL, used for Stripe success / cancel redirects |
| `SUBMISSION_PRICE_CENTS`, `SUBMISSION_CURRENCY` | Price (default 4900 = $49) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe API key and the signing secret of a webhook pointing to `<SITE_URL>/api/stripe/webhook/` (note the trailing slash) for `checkout.session.completed` |
| `APIFY_TOKEN`, `APIFY_PROFILE_ACTOR`, `APIFY_POSTS_ACTOR` | Apify token and the actors that return the public profile and posts |
| `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BASE_BRANCH` | Token with contents + pull-request write access to the data repository |

Until the Stripe, Apify and GitHub keys are set, `/submit` stays visible but the API answers "Submissions are not open yet" and nothing is charged.

Hosting needs server functions (e.g. Vercel): the site is no longer a pure static export. The webhook route sets `maxDuration = 300`; on plans with a shorter limit the status endpoint finishes missed work.

To make approved submissions appear automatically, run `npm run data` as part of the build (or in a GitHub Action on merge) so the merged JSON lands in `src/data/generated/index.json`.

## Checks

- `npm run check:scoring` re-scores all 38 researched characters with `src/lib/scoring.ts` and compares with the workbook (worst difference must be 0.0).
- The Python scorer in `build_data.py` uses the same formulas; an end-to-end run with a synthetic submission produced identical Fame / Momentum in both.

## Notes

- Instagram data is collected from public profiles through a third-party provider. Make sure this fits Instagram's terms and the provider's terms in your jurisdiction before opening payments.
- Payment buys the analysis, not a placement: inclusion is decided by review, and scores are never edited for payment. Decide and publish a refund policy for rejected or private accounts.
