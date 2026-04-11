# 子代理（Subagents）参考

子代理通过 `task` 工具被主代理调用，用于将复杂任务分解、隔离上下文、并行处理。

## 三种子代理类型

| 类型 | 特点 | 适用场景 |
|------|------|---------|
| `SubAgent` | 声明式，SDK 自动构建 | 大多数场景，推荐默认选择 |
| `CompiledSubAgent` | 传入预编译的 LangGraph runnable | 需要自定义图结构时 |
| `AsyncSubAgent` | 远程后台运行，非阻塞 | 长任务、LangSmith 部署 |

---

## SubAgent（声明式）

最常用的形式，SDK 自动为其套上标准中间件栈（TodoList、Filesystem、Summarization 等）。

```python
from deepagents import SubAgent, create_deep_agent

researcher: SubAgent = {
    # 必填
    "name": "researcher",                        # 唯一标识，主代理通过此名调用
    "description": "搜索和整理信息，返回结构化报告",  # 主代理据此判断何时委派
    "system_prompt": "你是专业研究员，擅长信息检索和总结。",

    # 可选
    "tools": [search_tool],                      # 若不指定则继承主代理工具
    "model": "openai:gpt-4o",                    # 可使用不同模型，格式 provider:model
    "middleware": [custom_middleware],            # 额外中间件
    "skills": ["/skills/research/"],             # 子代理专属技能目录
    "permissions": [...],                        # 若指定则完全替换父代理权限
    "interrupt_on": {"write_file": True},        # 需要 checkpointer
}

agent = create_deep_agent(subagents=[researcher])
```

**中间件栈（自动构建，由外到内）：**
1. `TodoListMiddleware`
2. `FilesystemMiddleware`
3. `SummarizationMiddleware`
4. `PatchToolCallsMiddleware`
5. `SkillsMiddleware`（若 `skills` 非空）
6. 用户传入的 `middleware`
7. Provider 专属中间件
8. `AnthropicPromptCachingMiddleware`
9. `_PermissionMiddleware`（若有权限规则）

---

## CompiledSubAgent（预编译）

传入已编译的 runnable，SDK 不会自动添加中间件。State schema 必须包含 `messages` 键。

```python
from deepagents import CompiledSubAgent, create_deep_agent
from langchain.agents import create_agent

# 手动构建子代理图
my_graph = create_agent(
    "anthropic:claude-haiku-4-5",
    system_prompt="你是数据分析师。",
    tools=[data_tool],
)

analyst: CompiledSubAgent = {
    "name": "analyst",
    "description": "分析数据并生成图表报告",
    "runnable": my_graph,
}

agent = create_deep_agent(subagents=[analyst])
```

子代理完成后，最后一条 `messages` 消息作为 `ToolMessage` 返回给主代理。

---

## AsyncSubAgent（异步远程）

连接 LangGraph Platform 或自托管的 Agent Protocol 服务器，后台非阻塞运行。

```python
from deepagents import AsyncSubAgent, create_deep_agent

remote_agent: AsyncSubAgent = {
    "name": "deep-researcher",
    "description": "在云端执行深度研究任务，可能耗时数分钟",
    "graph_id": "research-agent",               # 远端 graph 名或 assistant ID
    "url": "https://my-langsmith-deployment.com",  # 可选，默认使用 SDK 端点
    "headers": {"Authorization": "Bearer ..."},   # 可选，自定义认证头
}

agent = create_deep_agent(subagents=[remote_agent])
```

**环境变量（用于 LangGraph Platform）：**
- `LANGGRAPH_API_KEY`
- `LANGSMITH_API_KEY`（备选）
- `LANGCHAIN_API_KEY`（备选）

异步子代理会向主代理注入额外工具：启动任务、检查状态、更新、取消、列出任务。

---

## general-purpose 子代理

若未传入名为 `general-purpose` 的子代理，SDK **自动添加**一个通用子代理，
拥有与主代理相同的工具和模型。可通过传入同名子代理覆盖其配置：

```python
from deepagents import SubAgent, create_deep_agent

# 覆盖默认 general-purpose 子代理
custom_gp: SubAgent = {
    "name": "general-purpose",
    "description": "通用代理，处理所有未分类任务",
    "system_prompt": "你是通用助手，优先使用中文回答。",
}

agent = create_deep_agent(subagents=[custom_gp])
```

---

## interrupt_on（人工介入）

在指定工具调用前暂停，等待人工审核或修改。需要配合 `checkpointer`：

```python
from langgraph.checkpoint.memory import InMemorySaver

agent = create_deep_agent(
    interrupt_on={
        "edit_file": True,      # 每次编辑文件前暂停
        "execute": True,        # 每次执行命令前暂停
    },
    checkpointer=InMemorySaver(),
)

# 恢复执行（通过 LangGraph 的 Command 机制）
agent.invoke(Command(resume=True), config={"configurable": {"thread_id": "..."}})
```

主代理的 `interrupt_on` 默认也会被 `SubAgent` 继承，
除非子代理 spec 中显式声明了自己的 `interrupt_on`（完全替换，不合并）。
`CompiledSubAgent` 和 `AsyncSubAgent` 不继承 `interrupt_on`。
