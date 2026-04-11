# Store 与 Checkpointer 参考

`store` 和 `checkpointer` 都用于持久化，但职责不同：

| 维度 | `checkpointer` | `store` |
|------|---------------|---------|
| 存储内容 | 完整 agent state（消息历史、todo 等） | 应用级共享数据 |
| 作用域 | 单个线程（thread_id） | 跨线程、跨用户（命名空间隔离） |
| 典型用途 | 断点续跑、人工介入 | 多用户文件存储、长期知识库 |
| 对应 Backend | — | `StoreBackend` |

---

## Checkpointer（断点续跑）

Checkpointer 让代理在每次 agent 步骤后保存完整状态，可以：
- 在同一 `thread_id` 下跨请求续跑对话
- 配合 `interrupt_on` 暂停后恢复执行
- 在崩溃或超时后从上次状态恢复

### 快速上手

```python
from deepagents import create_deep_agent
from langgraph.checkpoint.memory import InMemorySaver

agent = create_deep_agent(
    checkpointer=InMemorySaver(),  # 开发测试用，进程退出即消失
)

config = {"configurable": {"thread_id": "conversation-001"}}

# 第一轮
agent.invoke(
    {"messages": [{"role": "user", "content": "我叫李雷"}]},
    config=config,
)

# 第二轮（同一 thread_id，代理记得上文）
agent.invoke(
    {"messages": [{"role": "user", "content": "我叫什么名字？"}]},
    config=config,
)
```

### 生产环境 Checkpointer

开发用 `InMemorySaver`，生产需用持久化实现：

```bash
# PostgreSQL checkpointer
uv add langgraph-checkpoint-postgres

# SQLite checkpointer
uv add langgraph-checkpoint-sqlite
```

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://user:pass@host/db") as checkpointer:
    agent = create_deep_agent(checkpointer=checkpointer)
```

### 配合 interrupt_on 恢复执行

```python
from langgraph.types import Command
from langgraph.checkpoint.memory import InMemorySaver

agent = create_deep_agent(
    checkpointer=InMemorySaver(),
    interrupt_on={"write_file": True},  # 写文件前暂停
)

config = {"configurable": {"thread_id": "thread-001"}}

# 执行到 write_file 时会暂停，返回当前状态
result = agent.invoke(
    {"messages": [{"role": "user", "content": "把结果写入 output.txt"}]},
    config=config,
)

# 查看暂停原因（pending tool calls）
print(result["__interrupt__"])

# 审核后继续执行
agent.invoke(Command(resume=True), config=config)

# 也可以拒绝并提供反馈
agent.invoke(Command(resume="请改为写入 result.txt"), config=config)
```

---

## Store（跨线程持久化存储）

`store` 是 LangGraph 的应用级存储，通过命名空间隔离不同用户/场景的数据。
主要用途：
- `StoreBackend` 将文件持久化到 store（跨会话保留）
- 多用户场景下每个用户有独立的存储空间

### 快速上手

```python
from deepagents import create_deep_agent
from deepagents.backends import StoreBackend
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()

agent = create_deep_agent(
    backend=StoreBackend(
        store=store,
        # namespace_factory 接收 Runtime，返回命名空间元组
        # 每个用户的文件存储在独立的命名空间中
        namespace_factory=lambda rt: (rt.server_info.user.identity, "files"),
    ),
    store=store,  # 同时传给 create_deep_agent，供 LangGraph 内部使用
)
```

> `store` 参数需要同时传给 `StoreBackend` 和 `create_deep_agent`，两者共用同一个 store 实例。

### 生产环境 Store

```bash
# PostgreSQL store（推荐生产）
uv add langgraph-store-postgres
```

```python
from langgraph.store.postgres import PostgresStore

with PostgresStore.from_conn_string("postgresql://user:pass@host/db") as store:
    agent = create_deep_agent(
        backend=StoreBackend(
            store=store,
            namespace_factory=lambda rt: (rt.server_info.user.identity, "files"),
        ),
        store=store,
    )
```

### 命名空间设计

`namespace_factory` 返回一个字符串元组，决定数据的隔离粒度：

```python
# 按用户隔离
lambda rt: (rt.server_info.user.identity, "files")

# 按用户 + 项目隔离
lambda rt: (rt.server_info.user.identity, rt.context.project_id, "files")

# 全局共享（所有用户共用同一份文件）
lambda rt: ("global", "files")
```

命名空间字符只允许：字母、数字、`-`、`_`、`.`、`@`、`+`、`:`、`~`。

---

## 组合使用

多用户 API 服务的典型配置（同时使用 store + checkpointer）：

```python
from deepagents import create_deep_agent
from deepagents.backends import StoreBackend
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.store.postgres import PostgresStore

store = PostgresStore.from_conn_string("postgresql://...")
checkpointer = PostgresSaver.from_conn_string("postgresql://...")

agent = create_deep_agent(
    backend=StoreBackend(
        store=store,
        namespace_factory=lambda rt: (rt.server_info.user.identity, "files"),
    ),
    store=store,        # 跨会话文件持久化
    checkpointer=checkpointer,  # 同一会话内断点续跑
)
```

**调用时需传入 `thread_id`（checkpointer 必须）：**

```python
agent.invoke(
    {"messages": [{"role": "user", "content": "..."}]},
    config={"configurable": {"thread_id": "user-123-session-456"}},
)
```
