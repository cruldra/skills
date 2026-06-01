---
name: ascii-tree-explanations
description: Use when explaining code, plans, architecture, trade-offs, debugging, summaries, or other user-facing content as an ASCII tree.
---

# ASCII Tree Explanations

## Overview

Explain as an ASCII tree. The tree is the explanation, not decoration after paragraphs.

Core principle: **show hierarchy, sequence, causes, risks, and recommendations through tree structure.**

## When to Use

Use for:

- Code walkthroughs, data flow, call chains, and API behavior
- Task plans, implementation plans, phased work, and checklists
- Architecture, dependencies, trade-offs, recommendations, and summaries
- Debugging findings, root causes, fixes, verification, and risks

Skip only when user asks for JSON, table, patch, exact command output, commit message, or a very short direct answer.

## Output Contract

Use one top-level ASCII tree:

```text
主题
├── 结论
│   ├── 要点 A
│   └── 要点 B
├── 结构 / 原因 / 步骤
│   ├── 子项
│   └── 子项
└── 下一步 / 风险 / 验证
    ├── 动作
    └── 证据
```

Rules:

1. Start with a concrete root node, not `说明` or `总结`.
2. Use `├──`, `│`, and `└──` for hierarchy.
3. Put conclusions near the top; details below.
4. Keep sibling nodes parallel.
5. Put examples, caveats, risks, and code in leaves.
6. Avoid Markdown headings, tables, and prose as the main explanation.

## Quick Reference

| Type | Shape |
|---|---|
| Code | `函数 → 入口 → 分支 → 返回值 → 边界问题` |
| Plan | `目标 → 阶段 → 动作 → 验证 → 风险` |
| Architecture | `系统 → 模块 → 数据流 → 依赖 → 约束` |
| Debugging | `现象 → 证据 → 根因 → 修复 → 验证` |
| Trade-off | `问题 → 方案 A/B → 优缺点 → 推荐 → 条件` |
| Summary | `结论 → 已完成 → 未完成 → 风险 → 下一步` |

## Example

```text
登录功能计划
├── 结论
│   └── 先交付账号密码登录主链路，不急着加短信、OAuth 或 MFA
├── 后端
│   ├── 用户表
│   │   ├── 保存账号、密码哈希、状态、时间戳
│   │   └── 不保存明文密码
│   ├── POST /auth/login
│   │   ├── 校验账号密码
│   │   └── 创建服务端会话或令牌
│   └── GET /auth/me
│       └── 返回当前用户，不返回密码哈希
├── 前端
│   ├── 登录表单
│   ├── 登录成功跳转
│   └── 未登录访问受保护页面时跳回登录页
├── 安全
│   ├── HttpOnly Cookie 或安全令牌存储
│   ├── 登录限流
│   └── 模糊错误：账号或密码错误
└── 验证
    ├── 正确账号密码可以登录
    ├── 错误密码不能登录
    └── 退出后不能继续访问受保护接口
```

## Rationalizations

| Excuse | Reality |
|---|---|
| “短解释不用树” | 短树也可以：根节点加 2-3 个分支。 |
| “表格更清楚” | 除非用户点名要表格，否则用树表达对比。 |
| “计划就是列表” | 计划需要目标、阶段、动作、验证的层级。 |
| “先写段落再总结” | 总结必须是树的一部分。 |

## Red Flags

Rewrite as a tree if the answer starts with:

- Markdown headings like `## 说明`
- A numbered list as the main explanation
- A comparison table as the main explanation
- Several prose paragraphs before any tree
- `简单来说：` followed by a paragraph

## Common Mistakes

- **Tree as decoration**: put the whole answer in the tree.
- **Too much nesting**: use 2-4 levels unless deeper structure is necessary.
- **Mixed formats**: embed only essential code or commands as leaves.
- **Weak root**: use concrete topics like `retry 函数讲解` or `登录功能计划`.
