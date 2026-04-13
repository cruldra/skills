---
name: generate-git-commit-message
description: 用于指导如何生成符合格式的git提交消息，在执行git commit之前使用此技能
---

# Generate Git Commit Message

指导如何生成符合格式的git提交消息

## 何时使用此技能

1. when user say : "commit"
2. 执行git commit之前


## Format Requirement
The commit message MUST follow this exact format:
`<emoji> <type>(<scope>): <subject>`

## Emoji Mapping Strategy
Use the following mapping for types and emojis:
- **feat**:     ✨ (sparkles) -> for new features
- **fix**:      🐛 (bug) -> for bug fixes
- **docs**:     📝 (memo) -> for documentation changes
- **style**:    💄 (lipstick) -> for formatting, missing semi colons, etc (no code change)
- **refactor**: ♻️ (recycle) -> for refactoring code (neither fix nor feature)
- **perf**:     ⚡ (zap) -> for performance improvements
- **test**:     ✅ (white_check_mark) -> for adding or correcting tests
- **build**:    📦 (package) -> for build system or external dependencies
- **ci**:       👷 (construction_worker) -> for CI configuration files and scripts
- **chore**:    🔧 (wrench) -> for other changes that don't modify src or test files
- **revert**:   ⏪ (rewind) -> for reverting a commit

## Content Rules
1. **Language**: Generate the subject in Chinese (Simplified).
2. **Scope**: Optional. Only use if the change is isolated to a specific module.
3. **Subject**:
    - Use imperative mood (e.g., "新增登录功能" not "新增了...").
    - Do not end with a period.
    - Be concise (under 50 characters if possible).
