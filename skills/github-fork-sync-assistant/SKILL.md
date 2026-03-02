---
name: github-fork-sync-assistant
description: A brief description of what this skill does
---

# github-fork-sync-assistant

Instructions for the agent to follow when this skill is activated.

## When to use

Describe when this skill should be used.

## Instructions

1. 要求提供github key并记录，避免重复询问
2. 找到所有fork别人的仓库
3. 对每个fork的仓库，同步上游仓库的更新，相当于界面上点击"Update branch"按钮
4. 忽略掉无法自动合并的仓库
5. 汇报结果，列出成功同步的仓库和无法自动合并的仓库
