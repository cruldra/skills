# Deep Agents 结构化输出说明

## 这个能力解决什么问题

结构化输出解决的是“交付格式稳定”问题。

当 agent 的结果要进入程序、数据库或下游系统时，尽量尽早使用结构化输出。

## 什么时候该上

满足任一条件就建议上：

- 结果要落库
- 结果要给程序消费
- 结果要被下游稳定解析
- 主代理要汇总多个中间结果

## 最常见写法

```python
from langchain.agents.structured_output import ToolStrategy

agent = create_deep_agent(
    ...,
    response_format=ToolStrategy(schema=YourSchema),
)
```

## 主代理结构化输出

适合：最终交付物要给系统消费。

## 子代理结构化输出

适合：主代理需要汇总多个来源的 patch 或中间结果。

这也是复杂场景下常用 `CompiledSubAgent` 的原因之一。

## 常见坑

- 只写自然语言，迟迟不上 schema
- 以为结构化输出会限制模型思考
- 中间步骤明明要汇总，却只在最后一步才考虑结构化
