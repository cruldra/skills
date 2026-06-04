---
name: mapping-domain-vocabulary
description: Use when needing to quickly understand or explain code spanning multiple subsystems/services/packages — onboarding to an unfamiliar domain, the user asks to survey a domain's code/concepts/terms (梳理/盘点某领域的代码、概念、术语、单词), or before designing/refactoring across module boundaries.
---

# Mapping Domain Vocabulary

## Overview

The fastest index into complex cross-subsystem code is not the call chain — it is the **domain vocabulary**. Read the code as a dictionary: exhaustively extract every domain word (models, enums, fields, actions), give each a one-sentence role, and organize them into an ASCII tree grouped by subsystem → module → word.

**Core principle: vocabulary before mechanism.** Newcomers don't get stuck on flows; they get stuck on nouns. Once `hold`, `entitlement`, `subminor` are understood as words, the call chains read themselves.

## When to Use

- The user asks to "survey the code for X" / "help me quickly understand domain Y" (梳理/盘点)
- The domain spans 2+ directories/services/packages (e.g. commerce + billing + sdk)
- You need a panoramic grasp of a subdomain before design or refactoring

**NOT for:** single-file/single-module questions (just read it); questions about one specific flow (explain the call chain instead).

## Process

1. **Draw boundaries**: split the domain into 2–4 subsystems by directory/service/package.
2. **Fan out in parallel**: dispatch one Explore subagent per subsystem (all in a single message) using the prompt template below, demanding **exhaustive** collection.
3. **Merge into a tree**: in the main session, dedupe and merge, then organize an ASCII tree by layer → module → word (format per the explaining-with-ascii-tree skill). Leaf = `word ...... one-sentence role`.
4. **Dualities after the tree**: cross-layer synonyms/dual terms (e.g. order↔entry), flow directions, and unit conventions go in 1–2 short paragraphs after the tree — never a paragraph per branch.
5. **Archive**: the output is ready to save as-is (Obsidian/docs).

## Subagent Prompt Template

```
Explore <subsystem path> (<one-line description>), search breadth: very thorough.
Goal: collect all domain vocabulary related to <domain> (English words / identifiers).
1. Read the module's README/docs first (if any)
2. Sweep every submodule's models, schemas, service, routes
Return a list grouped by module, one term per line:
word | role (one sentence, in the conversation language) | path:line
Be exhaustive: model class names, every enum value, key concept fields,
task names, external integration concepts, exceptions. Err on the side of
too many. Return raw data — no polish needed.
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| Writing a call-chain narrative (`## 1/2/3` headers + paragraphs) | Vocabulary is the index; mechanism goes in 1–2 paragraphs after the tree |
| Cherry-picking "highlights", skipping enum values/states/fields | Exhaustiveness is the whole point — err on the side of too many |
| Exploring sequentially in one thread | Fan out per subsystem in parallel — saves time and main-session context |
| Writing leaves as full paragraphs | Leaf = word + one-sentence role; split anything longer than one line |
| Dropping code locations | Mark paths at branch level, `path:line` on key terms |
| Same concept named differently per layer, left unstated | Dual terms (order↔entry, minor↔subminor) must be listed explicitly |

## Example

The payment/billing domain of this repo (commerce + billing + sdk, three subsystems) was swept in one round with 2 parallel subagents; output archived as the Obsidian note「付费扣费领域词汇表」.
