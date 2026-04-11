# `create_deep_agent(...)` 主要 API 说明

## 这个 API 解决什么问题

`create_deep_agent(...)` 是 Deep Agents 的统一入口。

它的作用是把这些东西装配成一个可运行的 agent：

- 大脑：`model`
- 总原则：`system_prompt`
- 外部能力：`tools`
- 长期背景：`memory`
- 按需流程：`skills`
- 团队拆分：`subagents`
- 运行时基础设施：`backend`、`middleware`、`checkpointer`、`store`、`cache`
- 交付格式：`response_format`

## 什么时候用

当你已经确定：

- 这不是一个简单的单轮 LLM 调用
- 你需要工具、文件、记忆、技能、多代理或结构化输出中的至少一部分

就应该从 `create_deep_agent(...)` 开始。

## 最小写法

```python
from deepagents import create_deep_agent


agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    system_prompt="你是项目中的业务智能体。",
)
```

## 常见升级写法

### 加工具

```python
agent = create_deep_agent(
    ...,
    tools=[search_orders, fetch_customer_profile],
)
```

### 加长期背景和工作流

```python
agent = create_deep_agent(
    ...,
    memory=["./AGENTS.md"],
    skills=["./skills/"],
)
```

### 加结构化输出

```python
from langchain.agents.structured_output import ToolStrategy

agent = create_deep_agent(
    ...,
    response_format=ToolStrategy(schema=YourOutputSchema),
)
```

### 加子代理

```python
agent = create_deep_agent(
    ...,
    subagents=subagents,
)
```

细节见 `references/subagents.md`。

### 加运行时基础设施

```python
agent = create_deep_agent(
    ...,
    backend=backend,
    middleware=middleware,
    checkpointer=checkpointer,
    store=store,
    cache=cache,
)
```

细节见：

- `references/backends.md`
- `references/runtime-infra.md`

## 推荐接入顺序

1. `model`
2. `system_prompt`
3. `tools`
4. `memory` / `skills`
5. `response_format`
6. `subagents`
7. `backend` / `middleware` / `checkpointer` / `store` / `cache`

## 常见坑

- 一开始就把所有参数配满
- 业务结构还没稳定就先拆很多子代理
- 输出要给程序消费却迟迟不上 `response_format`
- 把运行时复杂度问题提到业务结构问题之前
