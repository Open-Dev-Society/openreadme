# OpenReadme check

Finds the claims in your README that stopped being true — dead links, badges
pointing at a workflow that no longer exists, star counts that have drifted.

```yaml
name: README check
on:
  pull_request:
    paths: ["**/README.md"]

permissions:
  contents: read
  pull-requests: write   # only needed for the comment

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Open-Dev-Society/openreadme@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Default | What it does |
| --- | --- | --- |
| `api-url` | the hosted endpoint | Where the checks run. Point it at your own deployment to keep README content in-house. |
| `comment` | `true` | Post findings as a PR comment, updating the previous one instead of stacking. |
| `fail-on-findings` | `false` | Fail the job when a claim is untrue. Off by default: a drifted README should not block the fix. |

`GITHUB_TOKEN` is only used to post the comment. Without it the findings still
appear as annotations on the diff and in the job summary.

## What it will not do

It reports only what it can disprove. A network failure, a bot wall (403, or
LinkedIn's 999), a rate limit or a 5xx all mean "could not check", never
"broken" — and if the API is unreachable, the step passes rather than failing
your build over our outage.

## Badge

```markdown
[![readme health](https://openreadme.vercel.app/api/badge?repo=OWNER/REPO)](https://openreadme.vercel.app/check)
```

Reports GitHub's own community profile score: green at 80% and above, amber from
50, red below. `&label=` renames it. A repository the API cannot read reads
`unknown` rather than `0%` — a badge that lies is worse than no badge.
