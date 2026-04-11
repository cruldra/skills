# Deep Agents `backend` 说明

## 这个参数解决什么问题

`backend` 决定智能体的文件世界和执行环境。

最容易记的理解方式：

- `backend` 管“东西放哪”和“能做什么操作”

## 什么时候重点考虑

当你开始关心下面这些问题时：

- 智能体读写的是磁盘文件还是临时状态
- 是否允许执行 shell 命令
- 不同路径是否要走不同存储策略
- 是否需要自定义文件访问逻辑

## 最常见选择

### `FilesystemBackend`

```python
from deepagents.backends import FilesystemBackend

backend = FilesystemBackend(root_dir=".")
```

适合：

- 本地开发
- 示例项目
- 需要直接读取项目目录

### `StateBackend`

```python
from deepagents.backends import StateBackend

backend = StateBackend
```

或：

```python
backend = lambda runtime: StateBackend(runtime)
```

适合：

- 临时会话
- Web/API 场景
- 不想落磁盘

### `LocalShellBackend`

```python
from deepagents.backends import LocalShellBackend

backend = LocalShellBackend(root_dir=".", virtual_mode=True)
```

适合：

- 本地开发助手
- 需要执行 shell 命令

### `CompositeBackend`

```python
from deepagents.backends import CompositeBackend, FilesystemBackend

backend = CompositeBackend(
    default=FilesystemBackend(root_dir=".", virtual_mode=True),
    routes={
        "/uploads/": FilesystemBackend(root_dir="./uploads", virtual_mode=True),
    },
)
```

适合：

- 不同路径走不同 backend
- 做分层存储
- 做路径隔离

### 自定义 backend

适合：

- 内置 backend 不够用
- 要接对象存储、数据库、权限包装器、审计逻辑

## 最小判断原则

- 本地项目：通常先 `FilesystemBackend`
- 临时会话：考虑 `StateBackend`
- 需要执行命令：考虑 `LocalShellBackend`
- 路径分层：考虑 `CompositeBackend`

## 常见坑

- 把 `backend` 当成线程状态恢复
- 以为换了 `StateBackend` 还能无改动使用所有磁盘路径记忆和技能
- 没有明确需求就过早上 `CompositeBackend`

## 联动参数

如果你要使用 `StoreBackend(runtime)`，通常还必须一起传 `store=`。

细节见 `references/runtime-infra.md`。
