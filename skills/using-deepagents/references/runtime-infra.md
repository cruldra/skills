# Deep Agents 运行时基础设施说明

## 这组参数解决什么问题

这组参数主要解决：

- 自动拦截和增强
- 状态恢复
- 长期共享存储
- 性能优化

对应参数是：

- `middleware`
- `checkpointer`
- `store`
- `cache`

## 什么时候重点考虑

当你开始关心下面这些问题时：

- 有没有人工确认、审计、动态提示词注入
- thread 能不能续上
- 多线程或多会话能不能共享长期数据
- 重复执行能不能跳过

## `middleware`

解决：模型调用前后的自动增强。

适合：

- 人工审批
- 日志与审计
- 动态提示词注入
- 显式摘要策略

## `checkpointer`

解决：graph state / thread state 恢复。

最常见写法：

```python
from langgraph.checkpoint.memory import InMemorySaver

checkpointer = InMemorySaver()
```

适合：

- thread 续聊
- HITL 中断恢复
- 长流程状态跨轮保留

## `store`

解决：长期共享数据层。

最常见写法：

```python
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
```

适合：

- `StoreBackend`
- 团队级共享数据
- 跨线程共享同一层持久化数据

## `cache`

解决：重复计算的性能优化。

最常见写法：

```python
from langgraph.cache.memory import InMemoryCache

cache = InMemoryCache()
```

服务端常见写法：

```python
from langgraph.cache.redis import RedisCache

cache = RedisCache.from_conn_string("redis://localhost:6379")
```

适合：

- 重复请求很多
- 某些节点特别贵
- 想复用中间结果

## 最实用的区分方式

- `middleware`：自动拦截和增强
- `checkpointer`：状态恢复
- `store`：长期共享数据层
- `cache`：性能优化和结果复用

## 常见坑

- 把 `checkpointer` 当成缓存
- 把 `store` 当成文件系统
- 把 `cache` 当成长期记忆
- 在业务结构还没稳定前过早优化缓存策略
