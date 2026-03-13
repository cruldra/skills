---
name: github-fork-sync-assistant
description: 批量同步 GitHub 上所有 fork 仓库与上游的更新，也支持指定特定仓库进行同步。当用户要求同步 fork、更新所有 fork 仓库、同步指定仓库、或执行类似 GitHub 界面上 "Sync fork" / "Update branch" 的操作时使用此技能。自动发现所有 fork 仓库或读取指定仓库列表，逐个同步上游更新，跳过存在合并冲突的仓库，并汇报完整结果。
---

# GitHub Fork 批量同步助手

批量将用户 GitHub 账号下所有 fork 仓库与上游（upstream）保持同步，等同于在 GitHub 界面上对每个 fork 点击 "Sync fork → Update branch"。

## 使用场景

当用户提出以下请求时触发此技能：

- "同步我所有的 fork 仓库"
- "帮我更新所有 fork"
- "把我 fork 的项目都和上游同步一下"
- "sync all my forks"
- "同步这几个仓库: user/repo1, user/repo2"
- "同步指定的 fork 仓库"
- 任何涉及批量同步或指定同步 fork 仓库的请求

## 前提条件

在开始同步前，**必须**按顺序验证以下条件：

1. **GitHub CLI (`gh`) 已安装**
   ```bash
   gh --version
   ```
   如果未安装，提示用户参考 https://cli.github.com/ 安装。

2. **已登录 GitHub**
   ```bash
   gh auth status
   ```
   如果未登录，引导用户执行：
   ```bash
   gh auth login
   ```
   或者，如果用户提供了 GitHub Personal Access Token (PAT)：
   ```bash
   echo "<TOKEN>" | gh auth login --with-token
   ```

3. **Token 权限**
   - 需要 `repo` 权限（对私有仓库）或 `public_repo` 权限（仅公开仓库）
   - 如果使用 Fine-grained PAT，需要 `Contents: Write` 权限

## 标准工作流

### 第 1 步：验证环境

执行前提条件中的检查。如果用户首次使用此技能需要提供 token，记录下来避免后续重复询问。

### 第 2 步：确定同步范围

根据用户请求确定是**同步全部 fork** 还是**同步指定仓库**。

#### 方式 A：同步全部 fork 仓库

使用 `gh repo list` 列出当前用户所有 fork 仓库：

```bash
gh repo list --fork --json nameWithOwner,defaultBranchRef --limit 1000 --no-archived
```

返回格式示例：
```json
[
  {
    "defaultBranchRef": { "name": "main" },
    "nameWithOwner": "myuser/some-project"
  },
  {
    "defaultBranchRef": { "name": "master" },
    "nameWithOwner": "myuser/another-project"
  }
]
```

如果用户 fork 数量超过 1000，需要分页获取（调大 `--limit` 或多次请求）。

**向用户展示** fork 仓库列表及数量，确认是否继续同步全部，或让用户选择性排除某些仓库。

#### 方式 B：同步指定仓库

当用户指定了具体仓库（如 `user/repo1, user/repo2`），或要同步多个特定仓库时：

1. **将仓库列表写入 `assets/repos.txt`**（每行一个 `owner/repo`）：

```
user/repo1
user/repo2
user/repo3
```

> `repos.txt` 支持空行和 `#` 开头的注释行，会自动跳过。

2. **执行同步脚本**：

```bash
bash scripts/sync_forks.sh
```

脚本会自动从 `assets/repos.txt` 读取仓库列表并逐个同步。也可以通过参数指定其他文件路径：

```bash
bash scripts/sync_forks.sh /path/to/custom-repos.txt
```

脚本执行后会在 `scripts/` 目录下生成日志文件：
- `success.log` — 成功更新的仓库
- `uptodate.log` — 已是最新的仓库
- `failed.log` — 同步失败的仓库及原因

### 第 3 步：逐个同步 fork 仓库

对每个 fork 仓库，执行同步命令：

```bash
gh repo sync <nameWithOwner>
```

例如：
```bash
gh repo sync myuser/some-project
```

此命令会：
- 自动识别上游（parent）仓库
- 将 fork 的默认分支与上游默认分支同步
- 执行 fast-forward 合并

**同步指定分支**（如果需要）：
```bash
gh repo sync <nameWithOwner> --branch <branch-name>
```

### 第 4 步：处理同步失败

同步可能因以下原因失败：

| 失败原因 | `gh repo sync` 表现 | 处理方式 |
|---------|---------------------|---------|
| 合并冲突 | 返回非零退出码，提示 conflict | **跳过**，记录到失败列表 |
| 仓库已归档 | 返回错误 | **跳过**（已在第 2 步通过 `--no-archived` 过滤） |
| 权限不足 | 返回 403/权限错误 | **跳过**，记录到失败列表 |
| 上游仓库已删除 | 返回错误 | **跳过**，记录到失败列表 |
| 已是最新 | 正常返回，提示 already up to date | 记录到成功列表 |

**关键规则**：遇到无法自动合并的仓库，**不要使用 `--force`**（会丢失用户在 fork 上的自定义提交），除非用户明确要求强制同步。

### 第 5 步：汇报结果

同步完成后，按以下格式向用户汇报：

```markdown
## Fork 同步结果

**同步时间**: 2024-01-15 14:30:00
**总计**: 25 个 fork 仓库

### ✅ 成功同步 (20)

| 仓库 | 默认分支 | 状态 |
|------|---------|------|
| myuser/project-a | main | 已更新 |
| myuser/project-b | master | 已是最新 |
| ... | ... | ... |

### ❌ 同步失败 (3)

| 仓库 | 默认分支 | 失败原因 |
|------|---------|---------|
| myuser/project-x | main | 存在合并冲突 |
| myuser/project-y | develop | 上游仓库已删除 |
| myuser/project-z | main | 权限不足 |

### ⏭️ 已跳过 (2)

| 仓库 | 原因 |
|------|------|
| myuser/old-project | 用户要求排除 |
| myuser/archived-project | 已归档 |
```

## 备选方案：使用 GitHub REST API

如果 `gh repo sync` 不可用或需要更细粒度的控制，可使用 GitHub REST API：

### 列出 fork 仓库

```bash
gh api user/repos --paginate --jq '.[] | select(.fork == true) | .full_name'
```

### 同步单个 fork

```bash
gh api repos/<owner>/<repo>/merge-upstream -f branch=<default-branch>
```

响应状态码：
- `200 OK` — 同步成功（fast-forward 或 merge commit）
- `409 Conflict` — 存在合并冲突，无法自动同步
- `422 Unprocessable Entity` — 分支不存在或其他错误

### 检查 fork 是否落后于上游

```bash
gh api repos/<owner>/<repo>/compare/<default-branch>...<upstream-owner>:<default-branch> --jq '.status'
```

返回值：`identical`（一致）、`behind`（落后）、`ahead`（领先）、`diverged`（分叉）。

## 命令模板

### 完整同步脚本（供参考）

以下是 Agent 执行同步时的核心逻辑（伪代码）：

#### 同步全部 fork

```
1. 验证 gh auth status
2. forks = gh repo list --fork --json nameWithOwner,defaultBranchRef --limit 1000 --no-archived
3. 展示列表，确认用户是否继续
4. 对每个 fork:
   a. 执行 gh repo sync <nameWithOwner>
   b. 根据退出码分类：成功 / 失败 / 已是最新
5. 汇总输出结果表格
```

#### 同步指定仓库

```
1. 验证 gh auth status
2. 将用户指定的仓库列表写入 assets/repos.txt（每行一个 owner/repo）
3. 执行 bash scripts/sync_forks.sh
4. 读取 scripts/ 下的日志文件，汇总输出结果表格
```

## 关键规则

- **绝不使用 `--force`**：除非用户明确要求，否则不要使用 `gh repo sync --force`，它会通过 hard reset 丢弃用户在 fork 上的所有自定义更改。
- **Token 复用**：首次获取用户的 GitHub 认证后记录下来，同一会话中不再重复询问。
- **并发控制**：逐个同步（串行），避免触发 GitHub API 速率限制（认证用户 5000 次/小时）。如果 fork 数量非常大（>100），考虑在每 30 个请求后暂停几秒。
- **只同步默认分支**：除非用户明确指定，否则只同步 fork 的默认分支。
- **不修改本地仓库**：此技能只操作 GitHub 远程仓库，不克隆或修改本地文件系统。

## 快速检查清单

- [ ] `gh --version` 成功
- [ ] `gh auth status` 显示已登录
- [ ] 已确定同步范围（全部 / 指定仓库）
- [ ] 如同步指定仓库：已将仓库列表写入 `assets/repos.txt`
- [ ] 已向用户确认同步范围
- [ ] 逐个执行同步（直接调用 `gh repo sync` 或通过 `scripts/sync_forks.sh`）
- [ ] 失败仓库已记录并跳过（未使用 `--force`）
- [ ] 结果已按格式汇报（成功/失败/跳过三类）

## 参考链接

- [gh repo sync 文档](https://cli.github.com/manual/gh_repo_sync)
- [gh repo list 文档](https://cli.github.com/manual/gh_repo_list)
- [GitHub REST API: Sync a fork branch](https://docs.github.com/en/rest/branches/branches#sync-a-fork-branch-with-the-upstream-repository)
- [GitHub 界面同步 fork 指南](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)
