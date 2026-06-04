---
name: explaining-with-ascii-tree
description: Use when explaining a design, architecture, plan, code structure, module/component breakdown, data flow, or option comparison to the user in this repo — any multi-part technical structure. Render it as an ASCII tree, not prose paragraphs or `##` header sections.
---

# Explaining with ASCII Tree

## Overview

When explaining anything hierarchical or multi-part to the user — designs, architecture, code structure, plans, trade-offs — render it as an **ASCII tree**, not prose paragraphs or `## 一、## 二、` header sections. The tree exposes structure and relationships at a glance; prose buries them.

**Core rule:** structure first, prose second. If the explanation has parts and sub-parts, it is a tree.

## When to Use

- Explaining a design or architecture (data model, data flow, components)
- Walking through code structure (modules, files, symbols, call paths)
- Presenting a plan, breakdown, or option comparison
- Any answer where you'd otherwise reach for `##` headers or deeply nested bullet lists

**When NOT to use:**

- One-line or single-fact answers
- A genuinely linear narrative with no hierarchy
- The act of running commands / editing code (this skill governs *explanations to the user*, not tool use)

## Format

- Box-drawing chars: `├──`, `└──`, `│`, two-space indent per level
- Root = the topic; branches = parts; leaves = the concrete detail / decision / `path:line`
- Put the **key fact on the node line** — use `...` filler to align short labels when it aids scanning
- Leaves are labels + the fact, not sentences. The tree is a skeleton.
- Add follow-up prose *only* for the one or two points that genuinely need a paragraph; everything else stays in the tree.

## Example

```
商品库存语义
├── ① 数据模型  ProductCatalog (commerce/models.py:46)
│   ├── stock_total: int|None ........ NULL=无限; 上架总量
│   ├── stock_remaining: int|None .... NULL=无限; 实时余额
│   └── CHECK ........................ remaining>=0 · remaining<=total
├── ② 扣减  create_order
│   └── UPDATE ... remaining-1 WHERE remaining>0 → rowcount=0 抛 OutOfStockError
├── ③ 回补  release_stock
│   ├── 超时关单 cron ..... PENDING→CANCELLED
│   └── 退款 finalize ..... →REFUNDED (3 入口)
└── ④ 测试 .............. 并发抢最后1库存 → 仅1成功
```

Then, below the tree, one short paragraph on the single subtlety that needs it (e.g. idempotency of 回补) — not a paragraph per branch.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Falling back to `## headers + 段落` because content "feels too detailed for a tree" | Detail nests **deeper** in the tree; it doesn't leave the tree |
| Wrapping every leaf in a full sentence | Leaf = label + key fact; move sentences out |
| Dropping code locations | Put `path:line` on the relevant leaf |
| A paragraph per branch after the tree | At most 1–2 follow-up paragraphs total, only for real subtleties |
