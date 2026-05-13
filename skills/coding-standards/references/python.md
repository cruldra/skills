# Python 代码规范事实文档

## 使用原则

本文档记录用户认可的 Python 编码规范事实。它不是通用 PEP8 摘抄，也不追求“大厂标准”；它优先沉淀用户在实际项目中发现的反例、风险和规范写法。

当用户提供新的反例时，按下面格式追加：

````markdown
## PYN-编号：简短标题

**适用范围**：说明适用的代码类型、框架或项目场景。

**不规范写法**：

```python
# 反例
```

**规范写法**：

```python
# 推荐写法
```

**理由**：说明为什么反例不合适，以及规范写法解决了什么维护、正确性或可读性问题。
````

## PYN-001：先跟随项目已有 Python 风格

**适用范围**：所有 Python 修改。

**规范**：修改 Python 代码前，先查看同目录或相邻模块的命名、分层、类型注解、异常处理、日志、测试 fixture 和依赖管理方式。除非用户明确要求调整规范，否则不要在一次任务中引入新的风格体系。

**理由**：同一项目内的一致性通常比抽象的通用标准更重要。局部代码突然换风格，会增加 review 成本和维护成本。

## PYN-002：不要用宽泛异常掩盖失败

**适用范围**：业务逻辑、任务执行、外部服务调用、数据库读写。

**不规范写法**：

```python
try:
    result = await client.fetch()
except Exception:
    return None
```

**规范写法**：

```python
try:
    result = await client.fetch()
except ClientTimeoutError as exc:
    raise ServiceUnavailableError("upstream request timed out") from exc
```

**理由**：宽泛捕获再静默返回会隐藏真实故障，让调用方误以为业务结果为空。除非当前项目已有明确的降级协议，否则失败应保留语义并可追踪。

## PYN-003：不要为了“更面向对象”引入空壳类

**适用范围**：工具函数、单一流程、没有共享状态的逻辑。

**不规范写法**：

```python
class UserFormatter:
    def format_name(self, user: User) -> str:
        return format_name(user)
```

**规范写法**：

```python
def format_name(user: User) -> str:
    return user.display_name or user.email
```

**理由**：没有状态、没有多实现、没有生命周期管理时，空壳类只增加调用层级。普通函数更直接，也更容易测试。

## PYN-004：类型注解服务于边界，不追求形式完整

**适用范围**：公共函数、模块边界、复杂数据结构、测试 helper。

**规范**：公共函数、跨模块函数和复杂返回值应写清类型；局部变量只有在类型不明显或能改善阅读时才添加注解。不要为了填满类型而制造冗长别名或重复模型。

**理由**：类型注解的价值是帮助调用方理解契约和让工具发现问题。过度注解局部实现会增加噪音，削弱真正重要的边界类型。

## PYN-005：稳定路径推导应定义为模块常量

**适用范围**：基于 `__file__`、项目根目录、backend 目录、配置目录、模板目录等稳定路径的 Python 代码。

**不规范写法**：

```python
backend_dir = Path(__file__).resolve().parent.parent.parent
config_path = backend_dir / "config" / "settings.yaml"
```

如果多个函数或多个文件都需要同一个稳定路径，不要在各处重复写这段推导逻辑。

**规范写法**：

```python
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = BACKEND_DIR / "config" / "settings.yaml"
```

在使用处直接引用常量：

```python
def load_settings() -> dict[str, Any]:
    return read_yaml(CONFIG_PATH)
```

**理由**：这种路径不是运行时临时值，而是模块级稳定事实。集中定义为大写常量能减少重复、避免不同位置推导层级不一致，也让后续目录结构变化时只改一个地方。
