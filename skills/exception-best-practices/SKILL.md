---
name: exception-best-practices
description: 异常处理与创建最佳实践指南（语言无关）。涵盖 try/catch/finally 使用、常见条件预检、异步异常处理、状态恢复、异常重抛、自定义异常类型设计等全场景指导。当用户在项目中需要设计、优化或审查异常处理策略时使用此技能。
---

# 异常处理最佳实践指南

正确的异常处理对应用程序的可靠性至关重要。你可以有意识地处理预期的异常来防止应用崩溃。然而，一个崩溃的应用比一个行为未定义的应用更可靠、更易于诊断。

本技能提供**语言无关**的异常处理和创建指导，从处理策略到自定义异常设计，覆盖实战中的各种场景。

## 何时使用此技能

- 设计或优化项目的异常处理策略
- 评审代码中的异常处理实践
- 创建自定义异常类型
- 处理异步方法中的异常
- 需要恢复因异常导致的状态不一致
- 重构异常捕获和重抛逻辑

## 最佳实践总览

| 实践 | 影响 | 难度 |
|------|------|------|
| 使用 try/catch/finally 恢复错误或释放资源 | ⭐⭐⭐⭐⭐ | ⭐ |
| 处理常见条件以避免异常 | ⭐⭐⭐⭐ | ⭐⭐ |
| 优先使用不抛异常的替代 API | ⭐⭐⭐⭐ | ⭐ |
| 正确处理取消和异步异常 | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 设计可避免异常的类 | ⭐⭐⭐ | ⭐⭐⭐ |
| 异常时恢复状态 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 正确捕获和重抛异常 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 使用预定义异常类型 | ⭐⭐⭐⭐ | ⭐ |
| 使用异常构建器方法 | ⭐⭐⭐ | ⭐⭐ |
| 自定义异常遵循命名约定 | ⭐⭐⭐ | ⭐ |
| 自定义异常提供标准构造方式 | ⭐⭐⭐ | ⭐⭐ |

---

## 处理异常

### 1. 使用 try/catch/finally 恢复错误或释放资源

对可能生成异常的代码，且应用可以从该异常中恢复时，使用 `try`/`except` 块包围代码。

**关键规则**：

- 在 `except` 块中，**始终从最具体的异常到最通用的异常排序**——通用的 except 不会处理更具体的异常
- 当代码**无法从异常中恢复时，不要捕获该异常**，让调用栈上层的方法有机会恢复
- 使用语言提供的资源管理机制自动清理资源（如 Python 的 `with`、Java 的 `try-with-resources`、C# 的 `using`、Go 的 `defer`）
- 使用 `finally` 块清理无法自动管理的资源——`finally` 中的代码即使抛出异常也几乎总是会执行

```python
# ✅ 异常从最具体到最通用排序
try:
    result = process_data(data)
except ValidationError:    # 最具体的异常优先
    handle_validation()
except ProcessingError:    # 然后是更通用的
    handle_processing()
finally:
    cleanup_resources()

# ✅ 使用 with 自动管理资源
with open("file.txt") as f:
    content = f.read()
```

### 2. 处理常见条件以避免异常

对于可能发生但会触发异常的条件，考虑以**避免异常的方式**处理。

```python
# ✅ 先检查状态，避免异常
if conn.is_connected():
    conn.close()

# ❌ 不检查直接捕获异常
try:
    conn.close()
except ConnectionError as e:
    print(e)
```

**选择策略**：

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 事件很少发生（真正的异常情况） | 异常处理 | 正常条件下执行的代码更少 |
| 事件经常发生（正常执行的一部分） | 预先检查条件 | 避免异常开销，执行代码更少 |

> **注意**：预先检查在大多数情况下能消除异常，但在竞态条件下，被保护的条件可能在检查和操作之间发生变化，此时仍可能产生异常。

### 3. 优先使用不抛异常的替代 API

当异常的性能代价过高时，优先使用返回错误状态而非抛出异常的 API。

```python
# ❌ 无效输入时抛出 ValueError
value = int(user_input)

# ✅ LBYL（Look Before You Leap）先验证再操作
if user_input.isdigit():
    value = int(user_input)

# ✅ 使用 dict.get() 代替 dict[key]，不抛 KeyError
result = my_dict.get(key, default_value)

# ✅ 使用 getattr 提供默认值，不抛 AttributeError
value = getattr(obj, "attr_name", default_value)
```

### 4. 正确处理取消和异步异常

- 捕获**最通用的取消异常基类**，而非特定子类
- 异步方法中抛出的异常通常存储在返回的异步对象中，在 await/等待时才抛出
- 参数验证等即时异常应同步抛出

```python
import asyncio

# ✅ 捕获 CancelledError，清理后重新传播
try:
    await some_async_operation()
except asyncio.CancelledError:
    cleanup()
    raise  # 不要吞掉取消异常

# ✅ 捕获 Task 中存储的异常
task = asyncio.create_task(some_coroutine())
try:
    result = await task  # 异常在这里抛出
except SomeError as e:
    handle_error(e)
```

### 5. 设计可避免异常的类

类可以提供方法或属性，让调用者**避免触发异常**。

```python
# ✅ 提供检查方法，让调用者避免异常
class DataReader:
    def has_next(self) -> bool:
        """调用者可先检查是否有下一条数据"""
        return self._position < len(self._data)

    def read_next(self):
        if not self.has_next():
            raise StopIteration("No more data")
        item = self._data[self._position]
        self._position += 1
        return item

# 调用者可以避免异常
while reader.has_next():
    item = reader.read_next()
```

**通用策略**：

- 对常见错误情况返回 `None` 而非抛出异常，将其视为正常控制流
- 提供查询方法（如 `has_next()`、`exists()`、`is_valid()`）让调用者预先检查
- 权衡空值返回的引入：有时使值的存在/缺失更清晰，有时只是创建了不必要的额外检查

### 6. 异常时恢复状态

调用者应假设**方法抛出异常时不会产生副作用**。

```python
# ❌ 如果存款失败，取款不应保留生效
def transfer_funds(from_acct, to_acct, amount):
    from_acct.withdraw(amount)
    to_acct.deposit(amount)  # 如果这里失败，取款已经生效了

# ✅ 捕获异常并回滚
def transfer_funds(from_acct, to_acct, amount):
    withdrawal_id = from_acct.withdraw(amount)
    try:
        to_acct.deposit(amount)
    except Exception:
        from_acct.rollback(withdrawal_id)
        raise  # 重抛原始异常
```

**替代方案**：抛出新异常并将原始异常作为 cause：

```python
    except Exception as e:
        from_acct.rollback(withdrawal_id)
        raise TransferError("Deposit failed after withdrawal") from e
```

### 7. 正确捕获和重抛异常

异常携带的**堆栈追踪**从抛出异常的方法开始，到捕获异常的方法结束。错误的重抛方式会丢失原始堆栈信息。

```python
# ✅ 不带参数的 raise 保留原始堆栈
try:
    do_something()
except SomeError:
    log_error()
    raise  # 保留原始堆栈追踪

# ✅ 使用 raise ... from 链接异常，保留因果链
try:
    do_something()
except SomeError as e:
    raise NewError("Context info") from e

# ❌ 重新创建异常，丢失原始堆栈
try:
    do_something()
except SomeError as e:
    raise SomeError(str(e))  # 堆栈追踪从这里重新开始！
```

---

## 抛出异常

### 8. 使用预定义/标准异常类型

仅当标准类型不适用时才引入新的异常类。常用标准异常类型：

| 场景 | Python 异常类型 |
|------|----------------|
| 无效参数 | `ValueError` |
| 参数类型错误 | `TypeError` |
| 对象状态不正确 | `RuntimeError` |
| 未实现的功能 | `NotImplementedError` |
| 索引越界 | `IndexError` |
| 键不存在 | `KeyError` |
| 属性不存在 | `AttributeError` |
| IO 错误 | `OSError` / `IOError` |
| 超时 | `TimeoutError` |
| 权限不足 | `PermissionError` |
| 文件未找到 | `FileNotFoundError` |

### 9. 使用异常构建器方法

当类在多个地方抛出相同异常时，创建**辅助方法**来构建异常，减少重复代码：

```python
class FileReader:
    def __init__(self, path: str):
        self._path = path

    def read(self, size: int) -> bytes:
        data = self._read_from_file(size)
        if data is None:
            raise self._new_io_error()
        return data

    def read_line(self) -> str:
        line = self._read_line_from_file()
        if line is None:
            raise self._new_io_error()
        return line

    # 异常构建器方法——多处复用
    def _new_io_error(self) -> FileReaderError:
        return FileReaderError(f"Failed to read file: {self._path}")
```

### 10. 异常消息的编写规范

- 消息应**清晰描述发生了什么以及为什么**
- 使用正确的语法和结尾标点
- 包含有助于诊断的上下文信息

```python
# ✅ 清晰、有上下文
raise ValueError(f"Order amount must be positive, got {amount}.")
raise ConnectionError(f"Failed to connect to {host}:{port} after {retries} retries.")

# ❌ 模糊、缺少上下文
raise ValueError("Invalid value")
raise ConnectionError("Connection failed")
```

### 11. 不要在清理代码中抛出异常

`finally` 块用于释放资源，不应引入新的异常。如果清理操作可能失败，应捕获并记录，而非让其传播：

```python
# ✅ 清理中的异常被捕获记录
try:
    process()
finally:
    try:
        cleanup()
    except Exception:
        logger.warning("Cleanup failed", exc_info=True)
```

### 12. 不要在意外的地方抛出异常

以下类型的方法**不应抛出异常**：

- 相等比较（`__eq__`）
- 哈希计算（`__hash__`）
- 字符串表示（`__str__`、`__repr__`）
- 析构器（`__del__`）
- 上下文管理器的 `__exit__`（应返回 `False` 而非抛异常）
- 布尔转换（`__bool__`）

### 13. 在异步方法中同步抛出参数验证异常

在异步方法中，参数验证应在进入异步部分**之前**完成，确保调用者能立即感知错误。

```python
# ✅ 参数验证在异步操作之前，异常立即抛出
async def fetch_data(url: str) -> str:
    if not url:
        raise ValueError("URL must not be empty.")  # 立即抛出
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()

# ❌ 验证逻辑混在异步操作中，调用者难以立即感知
async def fetch_data(url: str) -> str:
    async with aiohttp.ClientSession() as session:
        if not url:
            raise ValueError("URL must not be empty.")  # 太晚了
        async with session.get(url) as response:
            return await response.text()
```

---

## 自定义异常类型

### 14. 遵循命名约定

Python 中自定义异常类名应以 `Error` 结尾，并继承自合适的内置异常类：

```python
# ✅ 命名正确，继承合理
class OrderProcessingError(Exception): ...
class InsufficientFundsError(ValueError): ...
class DatabaseConnectionError(ConnectionError): ...

# ❌ 命名不规范
class OrderProblem(Exception): ...
class BadFunds(Exception): ...
```

### 15. 提供标准的构造方式

自定义异常应支持常见的构造模式：

```python
class OrderProcessingError(Exception):
    """订单处理过程中发生的异常"""

    def __init__(
        self,
        message: str = "Order processing failed.",
        order_id: str | None = None,
        cause: Exception | None = None,
    ):
        super().__init__(message)
        self.order_id = order_id
        if cause is not None:
            self.__cause__ = cause
```

### 16. 根据需要提供额外属性

仅当额外信息在**编程场景中有用**时才添加自定义属性：

```python
# ✅ 提供有助于程序化处理的额外属性
class TransferError(Exception):
    def __init__(self, message, *, from_account=None, to_account=None, amount=None):
        super().__init__(message)
        self.from_account = from_account
        self.to_account = to_account
        self.amount = amount

# 调用者可以根据属性做出决策
try:
    transfer_funds(acct_a, acct_b, 1000)
except TransferError as e:
    logger.error(f"Transfer of {e.amount} from {e.from_account} failed: {e}")
    if e.amount > THRESHOLD:
        alert_admin(e)
```

---

## 检查清单

设计或审查异常处理策略时逐项确认：

**处理层面**：
- [ ] `except` 块中异常从最具体到最通用排序
- [ ] 无法恢复的异常不被捕获，而是向上传播
- [ ] 使用 `with` 语句自动管理资源
- [ ] 无法用 `with` 管理的资源在 `finally` 块中清理
- [ ] 经常发生的条件通过预检查避免异常，而非 try/except
- [ ] 优先使用不抛异常的替代 API（如 `dict.get()`、`getattr()`）
- [ ] 异步取消正确捕获 `asyncio.CancelledError` 并重新传播
- [ ] 方法因异常未完成时，状态已正确回滚

**重抛层面**：
- [ ] 重抛使用 `raise` 而非 `raise e`（保留原始堆栈）
- [ ] 包装异常使用 `raise ... from e`（保留因果链）
- [ ] 未重新创建异常实例来重抛（丢失堆栈）

**抛出层面**：
- [ ] 优先使用 Python 内置异常类型
- [ ] 异常消息清晰、包含上下文、有正确的语法
- [ ] `finally` 块中不抛出异常
- [ ] `__eq__`、`__hash__`、`__str__`、`__del__` 等方法中不抛出异常
- [ ] 异步方法中参数验证在进入异步部分之前完成

**自定义异常层面**：
- [ ] 异常类名以 `Error` 结尾
- [ ] 继承自合适的内置异常类
- [ ] 提供标准构造方式（消息、消息+cause）
- [ ] 仅在有编程场景需要时添加额外属性
