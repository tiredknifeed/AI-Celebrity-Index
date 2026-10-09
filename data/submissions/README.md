# Submissions

One JSON file per paid submission, added by the submission worker through a
pull request (`submission/<handle>-<id>` branches). See `docs/SUBMISSIONS.md`.

`scripts/build_data.py` merges a file into the index only when
`review.include` is `true` and the analyst ratings (`recognizability` and the
four `distinct` inputs) are filled in.
