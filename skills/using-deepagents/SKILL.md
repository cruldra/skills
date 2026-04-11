---
name: using-deepagents
description: Use when integrating the deepagents SDK into a Python project — creating agents, configuring backends, adding subagents, middleware, memory, or skills. Also use when debugging deepagents agents or choosing between StateBackend, FilesystemBackend, and LocalShellBackend.
---

# using-deepagents

## 概述

`deepagents` 是 LangChain 官方的深度代理框架，核心入口是 `create_deep_agent()`。
它内置了规划工具、文件系统工具、子代理和上下文压缩，适合构建复杂的多步骤任务代理。

## 快速安装

```bash
uv add deepagents
# 或
pip install deepagents
```

需要设置模型 API Key，默认使用 Anthropic：
```bash
export ANTHROPIC_API_KEY=sk-...
```

## 最小可运行示例

```python
from deepagents import create_deep_agent

# 默认使用 claude-sonnet-4-6，需要 ANTHROPIC_API_KEY
agent = create_deep_agent()

# 流式调用
for chunk in agent.stream({"messages": [{"role": "user", "content": "列出当前目录的文件"}]}):
    print(chunk)
```

## create_deep_agent 核心参数速查

| 参数 | 类型 | 说明 |
|------|------|------|
| `model` | `str \| BaseChatModel \| None` | 模型，格式 `"provider:model-name"`，默认 `claude-sonnet-4-6` |
| `tools` | `Sequence[BaseTool]` | 额外工具，与内置工具合并 |
| `system_prompt` | `str \| SystemMessage` | 自定义系统提示，追加在基础提示之前 |
| `subagents` | `Sequence[SubAgent \| CompiledSubAgent \| AsyncSubAgent]` | 子代理列表 |
| `backend` | `BackendProtocol` | 文件存储后端，默认 `StateBackend()` |
| `memory` | `list[str]` | AGENTS.md 文件路径列表（注入系统提示） |
| `skills` | `list[str]` | 技能目录路径列表（按需加载） |
| `permissions` | `list[FilesystemPermission]` | 文件系统权限规则 |
| `middleware` | `Sequence[AgentMiddleware]` | 自定义中间件 |
| `checkpointer` | `Checkpointer` | 断点续跑，持久化对话状态 |
| `store` | `BaseStore` | 跨线程共享存储 |
| `interrupt_on` | `dict[str, bool]` | 指定工具调用前暂停，供人工审核 |
| `response_format` | `ResponseFormat` | 结构化输出格式 |

## Backend 选择

> 详细说明见 [Backend 参考](./references/backends.md)

```
需要执行 Shell 命令？
  ├─ 是，本地环境 → LocalShellBackend
  ├─ 是，云沙箱  → LangSmithSandbox
  └─ 否，只读写文件？
       ├─ 文件在磁盘  → FilesystemBackend(root_dir="/path")
       ├─ 文件在内存/请求中 → StateBackend（默认）
       ├─ 跨会话共享  → StoreBackend(store=..., namespace_factory=...)
       └─ 混合场景    → CompositeBackend([backend1, backend2])
```

```python
from deepagents.backends import FilesystemBackend, LocalShellBackend, CompositeBackend

# 本地开发：文件系统 + Shell 执行
backend = CompositeBackend([
    FilesystemBackend(root_dir="/workspace"),
    LocalShellBackend(),
])

agent = create_deep_agent(backend=backend)
```

## 子代理（Subagents）

> 详细说明见 [子代理参考](./references/subagents.md)

```python
from deepagents import SubAgent, create_deep_agent

researcher: SubAgent = {
    "name": "researcher",
    "description": "负责网络搜索和信息收集，返回结构化研究报告",
    "system_prompt": "你是专业研究员，负责深度搜索并整理信息。",
    "tools": [search_tool],
    "model": "openai:gpt-4o",  # 可以用不同模型
}

agent = create_deep_agent(subagents=[researcher])
```

子代理类型：
- `SubAgent`：声明式，SDK 自动套标准中间件栈
- `CompiledSubAgent`：传入预编译的 LangGraph runnable
- `AsyncSubAgent`：远程后台运行（LangSmith Deployments）

## Memory 与 Skills

> 详细说明见 [Skills 与 Memory 参考](./references/skills-and-memory.md)

**Memory**（每轮全量注入系统提示，适合项目背景/规范）：

```python
agent = create_deep_agent(
    memory=["/project/AGENTS.md"],
    backend=FilesystemBackend(root_dir="/"),
)
```

**Skills**（按需加载，适合工作流程/SOP）：

```python
agent = create_deep_agent(
    skills=["/skills/base/", "/skills/project/"],
    backend=FilesystemBackend(root_dir="/"),
)
```

## 权限控制

> 详细说明见 [Backend 参考 → FilesystemPermission](./references/backends.md#filesystempermission权限控制)

```python
from deepagents import FilesystemPermission

agent = create_deep_agent(
    permissions=[
        # 先匹配先生效，第一条命中即止
        FilesystemPermission(operations=["write"], paths=["/workspace/**"], mode="allow"),
        FilesystemPermission(operations=["write"], paths=["/**"], mode="deny"),
    ]
)
```

## Middleware

> 详细说明见 [Middleware 参考](./references/middleware.md)

```python
from langchain.agents.middleware.types import AgentMiddleware, ModelRequest, ModelResponse

class LoggingMiddleware(AgentMiddleware):
    def wrap_model_call(self, request, handler):
        response = handler(request)
        print(f"tokens: {response.response.usage_metadata}")
        return response

agent = create_deep_agent(middleware=[LoggingMiddleware()])
```

## Store 与 Checkpointer

> 详细说明见 [Store 与 Checkpointer 参考](./references/store-and-checkpointer.md)

```python
from langgraph.checkpoint.memory import InMemorySaver

agent = create_deep_agent(checkpointer=InMemorySaver())

# 同一 thread_id 下跨请求续跑
config = {"configurable": {"thread_id": "conversation-001"}}
agent.invoke({"messages": [...]}, config=config)
```

## 常见错误

| 错误 | 原因 | 修复 |
|------|------|------|
| `ANTHROPIC_API_KEY not set` | 缺少 API Key | 设置环境变量 |
| `SubAgent must specify 'model'` | SubAgent 缺少 model 字段 | 显式指定 `"model": "..."` |
| `execute tool returns error` | StateBackend 不支持 Shell 执行 | 换用 `LocalShellBackend` |
| `File not found` | FilesystemBackend root_dir 路径不对 | 检查 `root_dir` 是否正确 |

## 与 LangGraph 集成

`create_deep_agent` 返回 `CompiledStateGraph`，可直接用于 LangGraph Studio 或 LangSmith 部署：

```python
# langgraph.json 中配置
{
  "graphs": {
    "agent": "agent.py:agent"
  }
}
```

## 参考资源

- 官方文档：https://docs.langchain.com/oss/python/deepagents/overview
- API 参考：https://reference.langchain.com/python/deepagents/
