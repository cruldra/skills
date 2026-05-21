---
name: using-gitea-issue
description: 用 spx CLI 管理 Gitea 工单的完整工作流——创建工单、维护 spec/plan marker、PR 审查评论。当用户说"帮我建工单"/"建工单"/"创建工单"/"新建工单"/"实施 #N"/"干 #N"/"审查 PR #N"/"review PR"时触发。
---

# Using Gitea Issue

用 `spx` CLI 在任意 cc 会话中管理 Gitea 工单 / PR，覆盖三种工作流：创建工单、实施计划、审查 PR。

## 何时使用

- "帮我建个工单 / 新建工单 / 创建一个关于 XX 的工单"
- "实施 #N / 干 #N / 开始实施这个 plan"
- "审查 PR #N / review this PR"
- 你需要写或更新一个工单的 spec / plan 文件

## 前置检查

执行任何 spx 命令前先确认：

- `which spx` 能找到（应在 `~/.local/bin/spx`）
- 已 `tea login` 或环境变量 `$GITEA_TOKEN` 已设置
- 当前 cwd 在一个有 gitea remote 的 git 仓库内

任一不满足，告诉用户卡在哪一步并停下，**不要乱猜 / 不要绕开**。

## 工作流 A：创建工单（头脑风暴）

触发：用户说"帮我建工单"。

1. **充分讨论需求**。不要急着调 CLI。让用户讲清"目标 / 范围 / 不做什么"。表述简略就主动追问，直到你能写出 1-2 段清晰描述。

2. **写 spec 文件**到 `docs/superpowers/specs/<feature-slug>/spec.md`。slug 用 kebab-case 英文短词（如 `kanban-env-lock`）。内容覆盖：目标、范围、非范围、关键决策、约束。

3. **写 plan 文件**到 `docs/superpowers/plans/<feature-slug>/plan.md`。内容：分阶段任务清单、每阶段验收标准。

4. **创建工单**：

   ```
   spx issue create \
     --title "<简短标题，中文，约 30 字>" \
     --spec docs/superpowers/specs/<slug>/spec.md \
     --plan docs/superpowers/plans/<slug>/plan.md
   ```

   如需自定义 body，加 `--body-file <临时 markdown 路径>`（与 `--body` 二选一）。CLI 会自动在 body 末尾追加 `<!-- spx:spec=... -->` / `<!-- spx:plan=... -->`。

   stdout 形如 `#42`。带 `--json` 则输出 `{"number":42,"html_url":"..."}`。

5. **告知用户**："已建工单 #42，spec/plan 已落在 docs/superpowers/..."

### 工单模板感知

如果当前仓库有 `.gitea/ISSUE_TEMPLATE/` 目录（`.md` 或 `.yaml`），**严格遵循模板结构**写 body（标题前缀、章节标题、必填字段都补齐），存成临时文件用 `--body-file` 传入。没有模板就普通 markdown 自由写或直接省略 body。

## 工作流 B：实施计划

触发：用户说"实施 #N"。

1. **拿到 plan 路径**：读取 issue body（`tea issues N -f body` 或 Gitea API），从 `<!-- spx:plan=PATH -->` 行解析出 plan 文件路径。

2. **确认 worktree**：插件已为该工单建好 worktree（路径形如 `.claude/worktrees/<branch>`）。如果你不在 worktree 中，**提示用户用插件触发实施流程**，不要自己创建 worktree。

3. **按 plan 分阶段写代码**：每阶段独立 commit（emoji 前缀风格，参考 `git log`）。

4. **创建 PR**：用 `tea pulls create` 或 Gitea API。PR body 末尾**必须包含** `Closes #N`。

5. **plan 在实施过程中需要修订**（发现遗漏 / 调整路线）时：

   ```
   spx issue marker --issue N --type plan --value docs/superpowers/plans/<slug>/plan.md
   ```

   更新 spec 同理（`--type spec`）。

## 工作流 C：审查 PR

触发：用户说"审查 PR #N"，或插件审查 tab 自动启动会话。

1. **拿到 PR diff**：用 `tea pulls diff N`，或读取 PR 内容。如能直接跑内置 `/review`，优先用。

2. **形成审查意见**：列出 P0/P1/P2 问题，每条带 `文件:行号` + 原因 + 建议改法。把内容写入临时文件，例如 `/tmp/review-N.md`（大段 markdown 经文件传比 `--body` 转义稳）。

3. **发评论**：

   ```
   spx pr review-comment --pr N --body-file /tmp/review-N.md
   ```

   CLI 会自动在 body 最前加 `<!-- spx:review=1 -->` 标识，**不要自己写这一行**。

## 严禁约定（重要）

- **严禁合并 PR**：任何 `tea pulls merge` 或等价合并操作都不允许。合并权完全在用户手上（用户拖工单到看板"完成"列时插件代为执行）。
- **严禁建议"合并 PR / merge"**：审查评论里也不要写这种建议；只指出问题或确认通过。
- **严禁 push 到 main / dev 分支**：只 push 当前 feature 分支。
- **严禁修改主 workspace 的 `.env*` 文件**：可能被插件 `chmod 444` 锁定。
- **spec / plan 路径规则**：必须包含 `/` 且以 `.md` 结尾，否则插件 marker 解析会忽略。绝不写占位路径（如 `...` / `<path>`）。

## spx 全局 flag

如下 flag 适用于所有子命令：

- `--repo OWNER/REPO`：缺省从当前 git origin 推断
- `--host URL`：缺省从 `~/.config/tea/config.yml` 默认 login 取
- `--json`：JSON 输出
- `--cwd PATH`：repo 探测的工作目录，缺省 `.`

## 常见错误

- `spx: command not found` → CLI 未安装，参考 `~/Sources/superpowers-vscode/cli/README.md` 跑 `make install`
- `没有可用的 Gitea token` → `tea login` 或 `export GITEA_TOKEN=...`
- `自动推断 owner/repo 失败` → 当前不在仓库里 / origin 不是 Gitea，显式用 `--repo OWNER/REPO`
- HTTP 404 → `--repo` 错了，或 issue / PR 编号不存在
