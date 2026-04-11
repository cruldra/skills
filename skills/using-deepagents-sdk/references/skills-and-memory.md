# Skills 与 Memory 参考

## Skills（按需技能）

Skills 是代理的"工作手册"，按需加载到系统提示中，不会在每轮都占用 token。
对应 Anthropic 的 [Agent Skills](https://agentskills.io/specification) 规范。

### Skill 目录结构

```
/skills/project/
├── web-research/
│   ├── SKILL.md      # 必须，含 YAML frontmatter
│   └── helpers.py    # 可选支持文件
└── data-analysis/
    └── SKILL.md
```

SKILL.md 格式：

```markdown
---
name: web-research
description: Use when user asks to research a topic online
---

# Web Research

## When to Use
- 用户要求搜索某个话题
...
```

### 配置方式

```python
from deepagents import create_deep_agent
from deepagents.backends import FilesystemBackend

agent = create_deep_agent(
    backend=FilesystemBackend(root_dir="/"),
    skills=[
        "/skills/base/",     # 基础技能（先加载）
        "/skills/project/",  # 项目级技能（后加载，同名覆盖前者）
    ],
)
```

**路径规则：**
- 使用 POSIX 路径（正斜杠）
- 相对于 backend 的根目录
- **后加载的 source 同名 skill 覆盖前者**（last-wins）

### 使用 StateBackend 传入 Skill 文件

StateBackend 下无磁盘，通过 `invoke` 的 `files` 参数注入：

```python
from deepagents import create_deep_agent
from deepagents.backends import StateBackend

agent = create_deep_agent(
    backend=StateBackend(),
    skills=["/skills/"],
)

skill_content = """---
name: summarizer
description: Use when user asks to summarize content
---
# Summarizer
Always produce bullet-point summaries.
"""

agent.invoke(
    {"messages": [{"role": "user", "content": "总结这篇文章"}]},
    files={"/skills/summarizer/SKILL.md": skill_content},
)
```

### 子代理独立技能

子代理可以有与主代理不同的技能集：

```python
from deepagents import SubAgent

researcher: SubAgent = {
    "name": "researcher",
    "description": "...",
    "system_prompt": "...",
    "skills": ["/skills/research/"],  # 子代理专属技能
}
```

---

## Memory（持久背景记忆）

Memory 对应 [AGENTS.md 规范](https://agents.md/)，在代理**启动时**全量加载到系统提示中。
与 Skills 不同，Memory 总是存在，适合放置项目背景、编码规范等长期上下文。

### AGENTS.md 格式

标准 Markdown，无强制结构。常见内容：

```markdown
# 项目概述
这是一个电商平台的后端服务。

## 技术栈
- Python 3.12 + FastAPI
- PostgreSQL 16
- Redis 缓存层

## 编码规范
- 所有公共函数需要类型注解
- 异常统一使用 `AppError` 基类
- 日志使用结构化格式（JSON）

## 常用命令
- 运行测试：`uv run pytest`
- 格式化：`uv run ruff format .`
```

### 配置方式

```python
from deepagents import create_deep_agent
from deepagents.backends import FilesystemBackend

agent = create_deep_agent(
    backend=FilesystemBackend(root_dir="/"),
    memory=[
        "/project/AGENTS.md",          # 项目级记忆（先加载）
        "/home/user/.deepagents/AGENTS.md",  # 用户级记忆（后追加）
    ],
)
```

**加载规则：**
- 所有 memory 文件按列表顺序拼接，全部注入系统提示
- 文件不存在时静默跳过（不报错）
- 显示名称自动从路径末尾推断

### Memory vs Skills 对比

| 维度 | Memory | Skills |
|------|--------|--------|
| 加载时机 | 每轮都在系统提示中 | 按需，仅主代理请求时加载 |
| 适合内容 | 项目背景、规范、常用命令 | 具体工作流程、SOP |
| Token 消耗 | 每轮全量消耗 | 仅加载时消耗 |
| 文件格式 | AGENTS.md（任意 Markdown） | SKILL.md（含 frontmatter） |
| 更新方式 | 修改文件后自动生效 | 修改文件后自动生效 |

### 使用 StateBackend 传入 Memory 文件

```python
agent.invoke(
    {"messages": [{"role": "user", "content": "帮我写一个接口"}]},
    files={"/project/AGENTS.md": "# 项目规范\n使用 FastAPI..."},
)
```
