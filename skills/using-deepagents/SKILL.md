---
name: using-deepagents
description: Use when a project is adopting Deep Agents and needs to decide the agent shape, rollout order, and runtime choices for memory, skills, tools, subagents, structured output, and infrastructure.
---

# 在项目中落地 Deep Agents

## Overview

这个 skill 用来指导项目如何落地 Deep Agents。

重点不是把参数一次配满，而是按复杂度递进：先做最小单 agent，再逐步补 `tools`、`memory`、`skills`、结构化输出、`subagents`，最后再处理运行时基础设施。

## When to Use

当你遇到下面这些情况时使用：

- 准备在项目里正式接入 Deep Agents
- 已经确定是 agent 问题，但不确定该从单 agent 还是多 agent 起步
- 分不清 `memory`、`skills`、`subagents` 什么时候该上
- 分不清 `backend`、`checkpointer`、`store`、`cache` 的职责
- 想把 demo 演进成真实工程结构

不要在这些场景使用：

- 只是一次性单轮 prompt 调用
- 只是普通聊天封装，没有工具、记忆、结构化输出需求
- 只是想查某个 API 的单点语法

## 快速决策流程

1. 先判断是不是 agent 问题
   - 只有单轮文本生成：先不要上 Deep Agents
   - 需要工具、文件、长期记忆、多轮上下文、结构化交付：继续

2. 再判断 agent 形态
   - 简单任务：单 agent
   - 有稳定流程：单 agent + `skills`
   - 有稳定职责边界：主代理 + `subagents`

3. 再判断交付方式
   - 结果要给程序消费：尽早上 `response_format`
   - 结果只是给人看：可以先文本输出

4. 最后判断运行时复杂度
   - 只有在需要跨线程恢复、共享数据、缓存优化时，再引入运行时基础设施参数

## 参数心智模型

如果把一个智能体类比成一个人：

- `model`：大脑型号
- `system_prompt`：岗位说明书
- `tools`：工具箱
- `memory`：长期背景记忆
- `skills`：按需取用的 SOP
- `subagents`：可以委派任务的团队同事
- `backend`：工作环境和文件世界
- `middleware`：自动介入的秘书和拦截层
- `checkpointer`：断点续办
- `store`：共享档案库
- `cache`：结果缓存
- `response_format`：最终交付格式

最容易混的 4 个参数：

- `backend`：文件和操作环境
- `checkpointer`：线程状态恢复
- `store`：长期共享数据层
- `cache`：性能优化和结果复用

主要 API 细节见：

- `references/create-deep-agent.md`
- `references/backends.md`
- `references/subagents.md`
- `references/structured-output.md`
- `references/runtime-infra.md`

## 推荐落地顺序

按这个顺序做，通常最稳：

1. 先做最小单 agent
2. 再补 `tools`
3. 再补 `memory` / `skills`
4. 尽早补 `response_format`
5. 只有职责稳定后再补 `subagents`
6. 最后处理 `backend` / `middleware` / `checkpointer` / `store` / `cache`

原则很简单：

- 先把业务结构做清楚
- 再把运行时复杂度加上去

## 推荐起步模板

```python
from deepagents import create_deep_agent


agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    system_prompt="你是项目中的业务智能体。",
    tools=[],
)
```

需要长期背景和工作流时，再补：

```python
agent = create_deep_agent(
    ...,
    memory=["./AGENTS.md"],
    skills=["./skills/"],
)
```

需要结构化交付时，再补：

```python
from langchain.agents.structured_output import ToolStrategy

agent = create_deep_agent(
    ...,
    response_format=ToolStrategy(schema=YourOutputSchema),
)
```

## 什么时候升级到 subagents

只有在这些条件满足时再拆：

- 任务内部有稳定职责边界
- 子任务有不同工具或不同提示词
- 主代理全包已经变乱
- 每个子代理交付结果已清晰定义

推荐路径：

- 先用声明式 `SubAgent`
- 再在需要独立 `response_format`、独立 runtime 配置时升级到 `CompiledSubAgent`

细节见 `references/subagents.md`。

## 运行时选择原则

### backend

先用最简单能工作的 backend。

- 本地项目：通常先 `FilesystemBackend`
- 临时状态驱动：考虑 `StateBackend`
- 不同路径不同策略：再上 `CompositeBackend`

细节见 `references/backends.md`。

### middleware

优先记住：`create_deep_agent()` 已经内置了不少基础 middleware。

手动传 `middleware=`，通常是为了追加：

- 人工确认
- 审计/日志
- 动态提示词注入
- 显式摘要策略

### checkpointer / store / cache

- 要恢复线程状态：上 `checkpointer`
- 要长期共享数据：上 `store`
- 要复用重复计算结果：上 `cache`

细节见 `references/runtime-infra.md`。

## 常见误区

- 把 `backend` 当成状态持久化
- 把 `checkpointer` 当成缓存
- 把 `store` 当成文件系统
- 把 `cache` 当成长期记忆
- 过早拆很多子代理
- 只写 prompt，不尽早定义结构化输出

## 参考示例

- `examples/customer-profile-agent/`
  - 适合看 `memory`、`skills`、`subagents`、结构化输出、运行时参数的整体组合
- `examples/content-builder-agent/`
  - 适合看偏 memory/skills 的组织方式
- `examples/deep_research/`
  - 适合看更直接的 agent 组装方式
- `examples/text-to-sql-agent/`
  - 适合看技能与垂直任务结合

## 最后原则

不要先追求“参数齐全”，先追求“结构清楚”。

优先回答 3 个问题：

1. 这个 agent 到底负责什么？
2. 它需要哪些外部能力？
3. 它交付给谁，交付格式是什么？

这 3 个问题清楚了，再去补 memory、skills、subagents 和运行时基础设施，通常就不会走偏。
