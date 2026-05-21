---
name: using-spx-cli
description: Use when you need to create a Gitea issue, update its spec/plan markers, or post a PR review comment in a repo that uses the spx CLI (superpowers-vscode workflow).
---

# Using spx CLI

## Overview

`spx` is a thin Gitea wrapper shipped with superpowers-vscode for agent (cc/codex) use. It reads host + token from `~/.config/tea/config.yml`, with `GITEA_TOKEN` env var as a fallback. After `opencli external register spx`, both `spx ...` and `opencli spx ...` work; prefer `opencli spx ...`.

## When to Use

You need to do exactly one of these against a Gitea repo:

- Create a new issue with optional `spec`/`plan` file markers
- Incrementally update an existing issue's `<!-- spx:spec=... -->` or `<!-- spx:plan=... -->` marker line
- Post a PR review comment (CLI auto-prepends `<!-- spx:review=1 -->`)

Not for: merging PRs, pushing to main, or rewriting issue bodies beyond the `spx:*` markers. Those are out of scope.

## Quick Reference

| Want to do | Command |
|---|---|
| Create issue | `opencli spx issue create --title "T" --spec PATH.md --plan PATH.md` |
| Update spec marker | `opencli spx issue marker --issue N --type spec --value PATH.md` |
| Update plan marker | `opencli spx issue marker --issue N --type plan --value PATH.md` |
| Post review comment | `opencli spx pr review-comment --pr N --body-file /tmp/x.md` |

## Global Flags

- `--repo OWNER/REPO` — defaults to the current git origin
- `--host URL` — defaults to the default login in `~/.config/tea/config.yml`
- `--json` — single-line JSON output instead of human text
- `--cwd PATH` — directory used for repo auto-detection (default `.`)

## Examples

Create an issue with both markers:

```
opencli spx issue create \
  --title "看板加 .env 锁定开关" \
  --spec docs/superpowers/specs/env-lock/spec.md \
  --plan docs/superpowers/plans/env-lock/plan.md
```

stdout: `#42` (or `{"number":42,"html_url":"..."}` with `--json`).

Update plan marker on an existing issue (replaces the existing line, or appends if absent):

```
opencli spx issue marker --issue 42 --type plan \
  --value docs/superpowers/plans/env-lock/plan.md
```

Post a review comment from a file (avoids shell-escaping large markdown):

```
opencli spx pr review-comment --pr 73 --body-file /tmp/review-73.md
```

## Common Mistakes

- Marker `value` must contain `/` and end with `.md`, otherwise the upstream webhook regex skips it and the kanban loses the marker.
- Don't hand-write `<!-- spx:* -->` lines — the CLI manages them. Manual writes confuse the upsert logic.
- `--body` and `--body-file` are mutually exclusive.
- For multi-line markdown, prefer `--body-file` over `--body` to avoid shell quoting bugs.
- Missing token → run `tea login` or `export GITEA_TOKEN=...`.
