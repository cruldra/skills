# Deep Agents `subagents` 说明

## 这个参数解决什么问题

`subagents` 用来给主代理提供“可委派的专长代理”。

适合在一个任务内部已经存在稳定职责拆分时使用。

## 什么时候该上

满足这些条件时再考虑：

- 任务边界稳定
- 子任务有明显不同的工具或提示词
- 主代理自己全包已经混乱
- 每个子代理交付结果已清晰定义

## 两种主流形态

### `SubAgent`

声明式子代理。

```python
from deepagents import SubAgent

subagents: list[SubAgent] = [
    {
        "name": "research-agent",
        "description": "负责收集资料并整理研究摘要。",
        "system_prompt": "你是一个研究子代理。",
        "tools": [],
        "skills": ["./skills/research/"],
    }
]
```

适合：

- 子代理逻辑简单
- 想快速起步

### `CompiledSubAgent`

编译型子代理。

```python
from deepagents import CompiledSubAgent, create_deep_agent

runnable = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    system_prompt="你是一个结构化研究子代理。",
)

subagents: list[CompiledSubAgent] = [
    {
        "name": "research-agent",
        "description": "负责结构化研究。",
        "runnable": runnable,
    }
]
```

适合：

- 子代理需要独立 `response_format`
- 子代理需要独立 runtime 配置
- 子代理值得单独建一个 graph

## 推荐演进路径

1. 单 agent
2. 单 agent + `skills`
3. 主代理 + 简单 `SubAgent`
4. 主代理 + `CompiledSubAgent`

## 常见坑

- 业务边界还没稳定就过早拆子代理
- 子代理职责定义过宽
- 子代理输出仍然是模糊自然语言，导致主代理难汇总
