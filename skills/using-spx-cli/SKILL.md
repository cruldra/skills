---
name: using-spx-cli
description: Use when you need to create a Gitea issue, update its spec/plan markers, read or merge an issue's state JSON, or post a PR review comment in a repo that uses the spx CLI (superpowers-vscode workflow).
---

# Using spx CLI

## Overview

`spx` is a thin Gitea wrapper shipped with superpowers-vscode for agent (cc/codex) use. It reads host + token from `~/.config/tea/config.yml`, with `GITEA_TOKEN` env var as a fallback. After `opencli external register spx`, both `spx ...` and `opencli spx ...` work; prefer `opencli spx ...`.

## When to Use

You need to do exactly one of these against a Gitea repo:

- Create a new issue with optional `spec`/`plan` markers and/or initial state JSON
- Incrementally update an existing issue's `<!-- spx:spec=... -->` or `<!-- spx:plan=... -->` marker line
- Read or merge an issue's persisted state JSON (column, sessionId, pr, branch, ...)
- Post a PR review comment (CLI auto-prepends `<!-- spx:review=1 -->`)

Not for: merging PRs, pushing to main, or rewriting issue bodies beyond the `spx:*` markers and the state JSON comment. Those are out of scope.

## State JSON

KanbanPanel persists per-issue orchestration state as a JSON blob in the issue's **last comment**. Schema (14 fields like `column`, `sessionId`, `pr`, `branch`, `implementStatus`, `autoReview`) lives at `schemas/state-json.schema.json` in superpowers-vscode. spx embeds the schema and **validates before any write** — bad input fails fast with a JSON-pointer field path.

## Quick Reference

| Want to do | Command |
|---|---|
| Create issue | `opencli spx issue create --json --title "T" --spec PATH.md --plan PATH.md` |
| Create issue + initial state | `opencli spx issue create --json --title "T" --state-json '{...}'` |
| Update spec / plan marker | `opencli spx issue marker --issue N --type spec\|plan --value PATH.md` |
| Read state JSON | `opencli spx issue state get --issue N` |
| Merge state JSON | `opencli spx issue state merge --issue N --state-json '{...}'` |
| Post review comment | `opencli spx pr review-comment --pr N --body-file /tmp/x.md` |

**Always pass `--json` to `issue create`** — without it stdout is just `#42` and you lose `html_url`. Recovering the URL afterwards is awkward (no `spx issue show`), and probing with another `create` will silently duplicate the issue.

`--state-json` / `--state-file` are mutually exclusive (on both `issue create` and `issue state merge`). `state merge` is shallow: incoming fields override existing ones, untouched fields remain.

## Global Flags

- `--repo OWNER/REPO` — defaults to the current git origin
- `--host URL` — defaults to the default login in `~/.config/tea/config.yml`
- `--json` — single-line JSON output instead of human text
- `--cwd PATH` — directory used for repo auto-detection (default `.`)

## Examples

Create an issue with markers and initial state in one shot:

```
opencli spx issue create --json \
  --title "看板加 .env 锁定开关" \
  --spec docs/superpowers/specs/env-lock/spec.md \
  --plan docs/superpowers/plans/env-lock/plan.md \
  --state-json '{"column":"todo","autoReview":true}'
```

stdout: `{"number":42,"html_url":"http://.../issues/42","state":{...}}`.

Update plan marker on an existing issue (replaces existing line, or appends):

```
opencli spx issue marker --issue 42 --type plan \
  --value docs/superpowers/plans/env-lock/plan.md
```

Read current state, then merge new fields (shallow merge, validated against schema):

```
opencli spx issue state get --issue 42
# {"column":"in-progress","pr":"73","branch":"feature/x","implementStatus":"running"}

opencli spx issue state merge --issue 42 \
  --state-json '{"implementStatus":"done","prMerged":true}'
```

Post a review comment from a file (avoids shell-escaping large markdown):

```
opencli spx pr review-comment --pr 73 --body-file /tmp/review-73.md
```

## Common Mistakes

- Forgetting `--json` on `issue create` — default stdout is just `#42`, no URL. Don't re-run `create` to "see the format"; it's a write op, you'll duplicate the issue.
- Marker `value` must contain `/` and end with `.md`, otherwise the upstream webhook regex skips it.
- Don't hand-write `<!-- spx:* -->` lines or the state JSON comment — use `issue marker` / `issue state merge`.
- Schema is strict (`additionalProperties: false`); typos like `coloum` (vs `column`) fail with a `/coloum` field-path error.
- `--body` / `--body-file` and `--state-json` / `--state-file` are mutually exclusive within their pair.
- Missing token → `tea login` or `export GITEA_TOKEN=...`.
