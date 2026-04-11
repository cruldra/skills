# Backend 参考

Backend 决定代理的文件存储位置和执行环境。所有 Backend 实现 `BackendProtocol`，
提供统一的读/写/编辑/搜索接口。

## Backend 类型一览

| Backend | Shell执行 | 持久化 | 适用场景 |
|---------|-----------|--------|---------|
| `StateBackend` | ❌ | 会话内 | API服务、无磁盘场景 |
| `FilesystemBackend` | ❌ | ✅ 磁盘 | 只需读写文件 |
| `LocalShellBackend` | ✅ 本机 | ✅ 磁盘 | 本地开发工具 |
| `LangSmithSandbox` | ✅ 云沙箱 | 沙箱内 | 生产部署 |
| `StoreBackend` | ❌ | ✅ 跨线程 | 多用户共享存储 |
| `CompositeBackend` | 取决于组合 | 取决于组合 | 混合场景 |

---

## StateBackend（默认）

文件存储在 LangGraph 的 agent state 中（内存），随会话生命周期存在。
配合 `checkpointer` 可在同一线程内断点续跑。

```python
from deepagents import create_deep_agent
from deepagents.backends import StateBackend

# 默认行为，等同于不传 backend
agent = create_deep_agent(backend=StateBackend())
```

**特点：**
- 文件随会话消失，不写磁盘
- 不支持 `execute` Shell 命令（会返回错误）
- 适合 API 服务端部署，无需磁盘权限

---

## FilesystemBackend

直接读写本机磁盘文件，相对路径基于 `root_dir`。

```python
from deepagents.backends import FilesystemBackend

backend = FilesystemBackend(root_dir="/workspace")

agent = create_deep_agent(backend=backend)
```

**参数：**
- `root_dir`：文件根目录，所有路径相对于此解析

> ⚠️ 安全警告：代理可以读写 `root_dir` 下任何文件。
> 建议配合 `FilesystemPermission` 限制访问范围。

---

## LocalShellBackend

继承 `FilesystemBackend`，额外支持在本机执行 Shell 命令（`execute` 工具）。

```python
from deepagents.backends import LocalShellBackend

backend = LocalShellBackend(
    root_dir="/workspace",    # 默认 cwd
    execute_timeout=120,      # 命令超时秒数，默认 120
)

agent = create_deep_agent(backend=backend)
```

**参数：**
- `root_dir`：文件根目录
- `execute_timeout`：Shell 命令最大执行时间（秒）

> ⚠️ 安全警告：代理可执行任意 Shell 命令，拥有当前用户权限。
> 仅限本地开发环境使用，**不要用于生产服务**。

---

## LangSmithSandbox

云沙箱执行环境，通过 LangSmith 托管部署使用。

```python
from deepagents.backends import LangSmithSandbox

backend = LangSmithSandbox()

agent = create_deep_agent(backend=backend)
```

需要设置 `LANGSMITH_API_KEY` 环境变量。

---

## StoreBackend

基于 LangGraph `BaseStore` 的持久化存储，支持跨线程/跨会话共享文件。
适合多用户场景，每个用户有独立的存储命名空间。

```python
from deepagents.backends import StoreBackend
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()

backend = StoreBackend(
    store=store,
    # namespace_factory 决定每次调用的存储命名空间
    namespace_factory=lambda rt: (rt.server_info.user.identity, "files"),
)

agent = create_deep_agent(
    backend=backend,
    store=store,
)
```

**参数：**
- `store`：`BaseStore` 实例（InMemoryStore、PostgresStore 等）
- `namespace_factory`：接收 `Runtime`，返回命名空间元组

---

## CompositeBackend

组合多个 Backend，按顺序代理调用。常用于同时需要文件系统和 Shell 执行：

```python
from deepagents.backends import CompositeBackend, FilesystemBackend, LocalShellBackend

backend = CompositeBackend([
    FilesystemBackend(root_dir="/workspace"),
    LocalShellBackend(),
])

agent = create_deep_agent(backend=backend)
```

`CompositeBackend` 将操作路由到第一个能处理的 backend。

---

## FilesystemPermission（权限控制）

独立于 Backend，通过 `permissions` 参数传入 `create_deep_agent`，拦截工具调用：

```python
from deepagents import FilesystemPermission, create_deep_agent

agent = create_deep_agent(
    backend=LocalShellBackend(root_dir="/"),
    permissions=[
        # 先匹配先生效，第一条命中即止
        FilesystemPermission(
            operations=["write"],
            paths=["/workspace/**"],
            mode="allow",
        ),
        FilesystemPermission(
            operations=["write"],
            paths=["/**"],
            mode="deny",   # 阻止写入其他所有路径
        ),
    ],
)
```

**`FilesystemPermission` 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `operations` | `list["read" \| "write"]` | 控制的操作类型 |
| `paths` | `list[str]` | glob 路径模式，需以 `/` 开头 |
| `mode` | `"allow" \| "deny"` | 匹配时的处理方式，默认 `"allow"` |

`read` 覆盖：`ls`, `read_file`, `glob`, `grep`
`write` 覆盖：`write_file`, `edit_file`

规则按声明顺序评估，**第一条匹配的规则生效**。若无规则匹配，默认允许。

子代理继承父代理权限，除非在 `SubAgent` spec 中显式声明 `permissions` 字段（完全替换，不合并）。
