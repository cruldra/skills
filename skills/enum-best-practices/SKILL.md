---
name: enum-best-practices
description: Python 枚举（Enum）最佳实践指南。涵盖枚举定义、命名规范、继承策略、序列化、数据库集成、模式匹配、Flag 位运算等全场景用法。当用户在 Python 项目中需要定义、使用或重构枚举类型时使用此技能。
---

# Python 枚举最佳实践指南

本技能提供 Python 枚举的全面使用指导，从基础定义到高级模式，覆盖 Web 框架集成、数据库 ORM、序列化、模式匹配等实战场景。

## 何时使用此技能

- 在 Python 项目中定义新的枚举类型
- 重构硬编码字符串/魔法数字为枚举
- 枚举与 Pydantic / FastAPI / Django / SQLAlchemy 集成
- 枚举序列化（JSON、API 响应、数据库存储）
- 使用 `match/case` 进行模式匹配
- 需要位运算标志（Flag）的场景

## 1. 枚举定义基础

### 1.1 始终继承 `str` 或 `int`

裸 `Enum` 的值不能直接序列化，也无法与字符串/整数直接比较。**必须混入基础类型**：

```python
from enum import Enum

# ✅ 正确：继承 str, Enum
class Color(str, Enum):
    RED = "red"
    GREEN = "green"
    BLUE = "blue"

# ✅ 正确：Python 3.11+ 使用 StrEnum（推荐）
from enum import StrEnum

class Color(StrEnum):
    RED = "red"
    GREEN = "green"
    BLUE = "blue"

# ✅ 正确：整数枚举
from enum import IntEnum

class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

# ❌ 错误：裸 Enum 无法直接序列化和比较
class Color(Enum):
    RED = "red"  # Color.RED == "red" 为 False！
```

### 1.2 `str, Enum` vs `StrEnum` 的区别

```python
# str, Enum：值是枚举成员，可以当 str 用
class Status(str, Enum):
    ACTIVE = "active"

Status.ACTIVE == "active"     # True
isinstance(Status.ACTIVE, str) # True
f"状态: {Status.ACTIVE}"       # "状态: Status.ACTIVE" (Python 3.11+)
                                # "状态: active" (Python 3.10-)

# StrEnum (3.11+)：行为一致且更明确
class Status(StrEnum):
    ACTIVE = "active"

str(Status.ACTIVE)  # "active"（StrEnum 保证 str() 返回值）
f"状态: {Status.ACTIVE}"  # "状态: active"（始终一致）
```

> **建议**：Python 3.11+ 项目用 `StrEnum`；需兼容旧版本用 `str, Enum`。

### 1.3 使用 `auto()` 自动生成值

当枚举值本身不重要、只需要唯一标识时：

```python
from enum import Enum, auto

# 整数自增（默认行为）
class Direction(Enum):
    NORTH = auto()  # 1
    SOUTH = auto()  # 2
    EAST = auto()   # 3
    WEST = auto()   # 4

# 自定义 auto() 生成逻辑
class LowerCaseEnum(str, Enum):
    """auto() 自动生成小写名称作为值"""
    @staticmethod
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()

class Color(LowerCaseEnum):
    RED = auto()    # "red"
    GREEN = auto()  # "green"
    BLUE = auto()   # "blue"
```

## 2. 命名规范

| 层级 | 规则 | 示例 |
|------|------|------|
| 枚举类名 | PascalCase，名词或形容词 | `UserType`, `OrderStatus`, `Color` |
| 枚举成员 | UPPER_SNAKE_CASE | `ACTIVE`, `PENDING_REVIEW`, `IN_PROGRESS` |
| 枚举值（字符串） | 小写蛇形 或 大写蛇形 | `"active"`, `"PENDING"` |
| 数据库枚举名 | 小写 + `_enum` 后缀 | `user_type_enum`, `order_status_enum` |

**值的大小写约定**：

```python
# 风格一：值与成员名一致（大写）—— 适合数据库枚举、状态机
class OrderStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

# 风格二：值为小写 —— 适合 API 响应、前端展示
class UserType(str, Enum):
    NORMAL = "normal"
    ADMIN = "admin"
    AGENT = "agent"
```

> **选一种风格，全项目保持一致。**

## 3. 枚举组织策略

### 3.1 模型内嵌枚举（与特定模型强相关）

```python
class Order(SQLModel, table=True):
    """订单表"""

    class Status(str, Enum):
        """订单状态"""
        PENDING = "PENDING"
        PAID = "PAID"
        CANCELLED = "CANCELLED"
        REFUNDED = "REFUNDED"

    class PaymentMethod(str, Enum):
        """支付方式"""
        ALIPAY = "alipay"
        WECHATPAY = "wechatpay"

    status: Status = Field(default=Status.PENDING)
    payment_method: PaymentMethod = Field(default=PaymentMethod.ALIPAY)
```

**优点**：枚举与模型紧密关联，引用清晰 `Order.Status.PAID`。

### 3.2 独立枚举（多模型共享）

```python
# enums.py 或 constants.py
class ProductType(str, Enum):
    """产品类型 —— 被 Order、PaymentPlan 等多个模型共享"""
    APP = "app"
    COURSE = "course"
    DIGITAL_VIDEO = "digital_video"
    TOOL = "tool"
```

### 3.3 选择原则

| 场景 | 策略 | 理由 |
|------|------|------|
| 只在一个模型中使用 | 内嵌在模型类中 | 内聚性强，不污染模块命名空间 |
| 2+ 个模型共享 | 独立定义在 `enums.py` | 避免循环导入和重复定义 |
| 跨多个模块使用 | 独立定义 + 重新导出 | 在 `__init__.py` 中统一导出 |

## 4. 枚举常用操作

### 4.1 成员访问与比较

```python
class Status(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

# 通过名称访问
Status["ACTIVE"]          # Status.ACTIVE
Status.__members__        # {'ACTIVE': Status.ACTIVE, 'INACTIVE': Status.INACTIVE}

# 通过值访问
Status("active")          # Status.ACTIVE

# 比较（str, Enum 支持直接与字符串比较）
Status.ACTIVE == "active"  # True
Status.ACTIVE is Status.ACTIVE  # True

# 遍历
for s in Status:
    print(s.name, s.value)  # ACTIVE active / INACTIVE inactive

# 成员检查
"active" in Status._value2member_map_  # True
```

### 4.2 安全地从外部输入构建枚举

```python
# ❌ 危险：无效值会抛 ValueError
status = Status(user_input)

# ✅ 安全方式一：捕获异常
try:
    status = Status(user_input)
except ValueError:
    status = Status.ACTIVE  # 回退默认值

# ✅ 安全方式二：使用 _missing_ 钩子
class Status(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

    @classmethod
    def _missing_(cls, value):
        """处理未知值，返回默认成员或 None"""
        for member in cls:
            if member.value == str(value).lower():
                return member
        return None  # 返回 None 会抛 ValueError
```

### 4.3 枚举扩展方法

```python
class HttpStatus(IntEnum):
    OK = 200
    NOT_FOUND = 404
    SERVER_ERROR = 500

    @property
    def is_success(self) -> bool:
        return 200 <= self.value < 300

    @property
    def is_error(self) -> bool:
        return self.value >= 400

    @property
    def label(self) -> str:
        labels = {
            HttpStatus.OK: "成功",
            HttpStatus.NOT_FOUND: "未找到",
            HttpStatus.SERVER_ERROR: "服务器错误",
        }
        return labels.get(self, "未知状态")

# 使用
HttpStatus.OK.is_success   # True
HttpStatus.NOT_FOUND.label  # "未找到"
```

## 5. 序列化与反序列化

### 5.1 JSON 序列化

```python
import json

class Status(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

# str, Enum 可直接 json.dumps
json.dumps({"status": Status.ACTIVE})  # '{"status": "active"}'

# 裸 Enum 需要自定义编码器（这也是为什么要继承 str）
class EnumEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        return super().default(obj)
```

### 5.2 Pydantic 集成

```python
from pydantic import BaseModel, Field

class OrderCreate(BaseModel):
    status: Status = Field(default=Status.ACTIVE, description="订单状态")
    payment: Order.PaymentMethod = Field(
        default=Order.PaymentMethod.ALIPAY,
        description="支付方式"
    )

# Pydantic v2 自动处理 str, Enum 的序列化
order = OrderCreate(status="active")  # 字符串自动转枚举
order.model_dump()  # {"status": "active", "payment": "alipay"}
```

### 5.3 FastAPI 集成

```python
from fastapi import APIRouter, Query

router = APIRouter()

@router.get("/orders")
async def list_orders(
    status: Status = Query(default=Status.ACTIVE, description="筛选状态"),
):
    """FastAPI 自动生成 OpenAPI 枚举约束"""
    return {"filter": status}

# Swagger UI 会自动显示下拉选项：active, inactive
```

## 6. 数据库集成

### 6.1 SQLAlchemy / SQLModel

```python
from sqlalchemy import Column, Enum as SQLAlchemyEnum
from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    class UserType(str, Enum):
        NORMAL = "normal"
        AGENT = "agent"

    user_type: UserType = Field(
        default=UserType.NORMAL,
        sa_column=Column(
            SQLAlchemyEnum(UserType, name="user_type_enum"),
            comment="用户类型",
        ),
    )
```

**关键点**：
- `SQLAlchemyEnum` 的 `name` 参数定义数据库中的枚举类型名，必须唯一
- 命名统一用 `小写_enum` 后缀

### 6.2 Alembic 数据库迁移（PostgreSQL）

PostgreSQL 的枚举是独立的数据库类型，增删值需要专门的迁移处理。使用 `alembic-postgresql-enum` 扩展来自动化管理。

#### 依赖安装

```toml
[project]
dependencies = [
    "alembic>=1.14.0",
    "alembic-postgresql-enum>=1.7.0",
]
```

#### 迁移环境配置

在 `env.py` 中启用枚举变更检测：

```python
# migrations/env.py
import alembic_postgresql_enum

alembic_postgresql_enum.set_configuration(
    alembic_postgresql_enum.Config(
        add_type_ignore=True,            # 启用类型忽略注释
        drop_unused_enums=True,          # 清理未使用的枚举
        detect_enum_values_changes=True, # 检测枚举值变更
    )
)

def run_migrations_online():
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # 必须开启，否则检测不到枚举变更
        )
```

#### 生成与应用迁移

```bash
# 生成迁移脚本（自动检测枚举变更）
python -m alembic revision --autogenerate -m "add new enum value"

# 应用迁移
python -m alembic upgrade head
```

#### 迁移脚本示例：sync_enum_values（推荐）

`alembic-postgresql-enum` 提供的 `sync_enum_values` 方法可以安全地同步枚举值：

```python
"""add knowledge-base to agent type enum"""
from alembic import op
from alembic_postgresql_enum import TableReference

def upgrade() -> None:
    op.sync_enum_values(
        enum_schema="public",
        enum_name="agent_type_enum",
        new_values=["CHAT", "AGENT_CHAT", "WORKFLOW", "COMPLETION", "KNOWLEDGE_BASE"],
        affected_columns=[
            TableReference(
                table_schema="public",
                table_name="qu_agents",
                column_name="type",
            )
        ],
        enum_values_to_rename=[],
    )

def downgrade() -> None:
    op.sync_enum_values(
        enum_schema="public",
        enum_name="agent_type_enum",
        new_values=["CHAT", "AGENT_CHAT", "WORKFLOW", "COMPLETION"],
        affected_columns=[
            TableReference(
                table_schema="public",
                table_name="qu_agents",
                column_name="type",
            )
        ],
        enum_values_to_rename=[],
    )
```

#### 迁移脚本示例：原生 SQL（仅添加新值时可用）

```python
"""add digital_video enum value"""
from alembic import op

def upgrade() -> None:
    op.execute("ALTER TYPE product_type_enum ADD VALUE IF NOT EXISTS 'DIGITAL_VIDEO'")

def downgrade() -> None:
    # PostgreSQL 不支持删除枚举值，无法回滚
    pass
```

#### 迁移注意事项

1. **PostgreSQL 不支持删除枚举值** — 修改需谨慎，生产环境务必先在测试环境验证
2. **优先用 `sync_enum_values`** — 比原生 SQL 更安全，支持 upgrade/downgrade 双向迁移
3. **重大变更前备份数据** — 枚举重命名或删除可能导致数据丢失
4. **`compare_type=True` 必须开启** — 否则 `--autogenerate` 无法检测到枚举变更

### 6.3 Django

```python
from django.db import models

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "待处理"
        PAID = "PAID", "已支付"
        CANCELLED = "CANCELLED", "已取消"

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

# 使用
order.status = Order.Status.PAID
order.get_status_display()  # "已支付"
```

### 6.4 查询中使用枚举

```python
# SQLModel / SQLAlchemy
statement = select(Order).where(Order.status == Order.Status.PAID)

# Django
Order.objects.filter(status=Order.Status.PAID)

# ✅ 始终使用枚举常量
Order.objects.filter(status=Order.Status.PAID)

# ❌ 不要硬编码字符串
Order.objects.filter(status="PAID")
```

## 7. 模式匹配（Python 3.10+）

```python
class Command(str, Enum):
    START = "start"
    STOP = "stop"
    RESTART = "restart"
    STATUS = "status"

def handle_command(cmd: Command) -> str:
    match cmd:
        case Command.START:
            return "启动服务..."
        case Command.STOP:
            return "停止服务..."
        case Command.RESTART:
            return "重启服务..."
        case Command.STATUS:
            return "查询状态..."
        case _:
            return "未知命令"
```

> **注意**：`match/case` 中必须使用 `Command.START` 全限定名，不能用裸 `START`。

## 8. Flag 位运算

适用于需要组合多个选项的场景（权限、特性开关等）：

```python
from enum import Flag, auto

class Permission(Flag):
    READ = auto()     # 1
    WRITE = auto()    # 2
    EXECUTE = auto()  # 4
    DELETE = auto()   # 8

    # 预定义组合
    READ_WRITE = READ | WRITE
    ADMIN = READ | WRITE | EXECUTE | DELETE

# 组合权限
user_perm = Permission.READ | Permission.WRITE

# 检查权限
Permission.READ in user_perm      # True
Permission.EXECUTE in user_perm   # False

# 添加/移除权限
user_perm |= Permission.EXECUTE   # 添加
user_perm &= ~Permission.WRITE    # 移除
```

## 9. 常见陷阱与反模式

### 9.1 枚举不可变 — 不要试图修改

```python
# ❌ 运行时添加成员会报错
Color.YELLOW = "yellow"  # AttributeError
```

### 9.2 跨模块枚举比较

```python
# ⚠️ 同名但不同定义的枚举不相等
# module_a.py
class Status(str, Enum):
    ACTIVE = "active"

# module_b.py
class Status(str, Enum):
    ACTIVE = "active"

# module_a.Status.ACTIVE == module_b.Status.ACTIVE → False（不同类）
# module_a.Status.ACTIVE == "active" → True（值相等，因为继承了 str）
```

> **解决**：枚举只定义一次，全项目从同一位置导入。

### 9.3 不要用枚举做大量数据映射

```python
# ❌ 反模式：把枚举当字典用
class City(str, Enum):
    BEIJING = "beijing"
    SHANGHAI = "shanghai"
    # ... 几百个城市

# ✅ 正确：用常规字典或数据库
CITIES = {"beijing": "北京", "shanghai": "上海"}
```

### 9.4 子类化限制

```python
# ❌ 已有成员的枚举不能被继承
class Base(str, Enum):
    A = "a"

class Child(Base):  # TypeError!
    B = "b"

# ✅ 可以继承没有成员的枚举基类
class LabeledEnum(str, Enum):
    @property
    def label(self) -> str:
        return self.name.replace("_", " ").title()

class Status(LabeledEnum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

Status.IN_PROGRESS.label  # "In Progress"
```

## 10. 检查清单

定义新枚举时逐项确认：

- [ ] 继承了 `str, Enum`（或 `StrEnum` / `IntEnum`）而非裸 `Enum`
- [ ] 成员名使用 UPPER_SNAKE_CASE
- [ ] 每个成员有注释说明含义
- [ ] 值的大小写风格与项目其他枚举一致
- [ ] 只在一处定义，其他位置通过导入使用
- [ ] 与模型强相关的枚举内嵌在模型类中
- [ ] 数据库字段使用 `SQLAlchemyEnum` 并指定 `name` 参数
- [ ] API 层使用 Pydantic `Field` 添加 `description`
- [ ] 业务逻辑中用枚举常量比较，不用硬编码字符串
