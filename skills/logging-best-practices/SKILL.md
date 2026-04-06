---
name: logging-best-practices
description: 应用程序日志记录最佳实践指南。涵盖日志目标设定、级别使用、结构化日志、有意义的日志条目、日志采样、规范日志行、日志聚合、保留策略、安全防护、敏感数据处理、性能影响、监控边界等全场景指导。当用户在项目中需要设计、优化或审查日志记录策略时使用此技能。
---

# 应用程序日志记录最佳实践指南

本技能提供应用程序日志记录的全面指导，从日志策略设计到具体实现，覆盖日志格式化、结构化、安全性、性能优化等实战场景。

## 何时使用此技能

- 设计或优化项目的日志记录策略
- 选择和配置日志框架
- 评审代码中的日志记录实践
- 处理日志性能问题或成本控制
- 实施日志安全和敏感数据保护
- 配置日志聚合、保留和轮转策略

## 最佳实践总览

| 实践 | 影响 | 难度 |
|------|------|------|
| 建立清晰的日志目标 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 正确使用日志级别 | ⭐⭐⭐⭐⭐ | ⭐ |
| 结构化你的日志 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 编写有意义的日志条目 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 采样你的日志 | ⭐⭐⭐⭐ | ⭐⭐ |
| 使用规范日志行 | ⭐⭐⭐⭐ | ⭐⭐ |
| 聚合和集中化你的日志 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 建立日志保留策略 | ⭐⭐⭐ | ⭐⭐ |
| 保护你的日志 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 不要记录敏感数据 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 不要忽视日志的性能开销 | ⭐⭐⭐ | ⭐⭐⭐ |
| 不要用日志做监控 | ⭐⭐⭐ | ⭐ |

## 1. 建立清晰的日志目标

在开始记录日志之前，先回答以下问题：

- 应用的核心业务目标是什么？
- 关键性能指标（KPI）有哪些？
- 哪些事件应该通过日志记录，哪些更适合用指标（metrics）或链路追踪（traces）？

> **核心原则**：日志的目的不仅是记录错误，而是**让错误能被解决**。记录错误详情和导致错误的事件链，提供帮助诊断根本原因的叙事。

```
# ❌ 错误：记录一切，没有目标
logger.info("进入函数")
logger.info("变量 x = 42")
logger.info("退出函数")

# ✅ 正确：围绕业务目标记录
logger.info("订单创建成功", order_id=order.id, user_id=user.id, amount=order.total)
logger.error("支付处理失败", order_id=order.id, error=str(e), retry_count=attempt)
```

**建议**：初期宁可多记一些日志，然后建立定期审查流程来调整日志级别，识别和修正过于冗长或缺失的日志。

## 2. 正确使用日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| `TRACE` | 最细粒度的调试信息 | 函数参数值、循环迭代 |
| `DEBUG` | 开发调试时的详细信息 | SQL 查询、缓存命中/未命中 |
| `INFO` | 重要的业务事件 | 用户登录、订单创建、服务启动 |
| `WARN` | 异常情况，可能预示未来问题 | 磁盘空间不足、重试操作、弃用 API 调用 |
| `ERROR` | 影响特定操作的不可恢复错误 | 数据库连接失败、第三方 API 超时 |
| `FATAL` | 影响整个程序的不可恢复错误 | 配置文件缺失、端口被占用 |

**关键要点**：

- 生产环境通常默认 `INFO` 级别
- 实现**动态调整日志级别**的机制，避免重启服务才能调级
- 支持按组件/模块单独调整级别，而非全局调整
- 排查完毕后记得**恢复日志级别**

```python
# ✅ 级别使用正确
logger.info("用户登录成功", user_id=user.id)
logger.warning("缓存未命中率过高", miss_rate=0.85, threshold=0.7)
logger.error("数据库连接超时", host=db_host, timeout_ms=5000)

# ❌ 级别使用错误
logger.error("用户登录成功")  # 这不是错误
logger.info("数据库连接失败")  # 这应该是 error
logger.debug("订单创建完成")  # 重要业务事件应该是 info
```

## 3. 结构化你的日志

### 3.1 三种日志格式

**非结构化日志**（避免在生产环境使用）：

```
[2023-11-03 08:45:33,123] ERROR: Database connection failed: Timeout exceeded.
```

**半结构化日志**：

```
2023-06-28 19:09:48.801818 I [969609:60] MyApp -- Starting application on port 3000
```

**结构化日志**（推荐）：

```json
{
  "timestamp": "2023-06-28T17:20:19.409882Z",
  "level": "info",
  "pid": 982617,
  "name": "MyApp",
  "message": "Starting application on port 3000"
}
```

### 3.2 实施步骤

1. **采用支持结构化输出的日志框架**（如 Python 的 structlog、Go 的 slog、Node.js 的 pino）
2. **配置应用依赖输出结构化数据**（如 PostgreSQL 15+ 支持 JSON 日志，Nginx 可配置 JSON 格式）
3. **使用日志传送工具**将非结构化日志转换为结构化格式（如 Vector、Fluentd）

### 3.3 Nginx JSON 日志配置示例

```nginx
http {
  log_format custom_json escape=json
  '{'
    '"timestamp":"$time_iso8601",'
    '"pid":"$pid",'
    '"remote_addr":"$remote_addr",'
    '"remote_user":"$remote_user",'
    '"request":"$request",'
    '"status": "$status",'
    '"body_bytes_sent":"$body_bytes_sent",'
    '"request_time_ms":"$request_time",'
    '"http_referrer":"$http_referer",'
    '"http_user_agent":"$http_user_agent"'
  '}';

  access_log /var/log/nginx/access.json custom_json;
}
```

> **开发环境**：可使用彩色化、易读的半结构化格式；**生产环境**：默认使用 JSON 结构化输出。

## 4. 编写有意义的日志条目

### 4.1 必要的上下文字段

- 请求 ID / 关联 ID（correlation ID）
- 用户 ID
- 数据库表名和元数据
- 错误的堆栈追踪
- 服务名称
- 设备/客户端信息

### 4.2 对比示例

```json
// ❌ 缺乏上下文
{
  "timestamp": "2023-11-06T14:52:43.123Z",
  "level": "INFO",
  "message": "Login attempt failed"
}

// ✅ 包含足够上下文
{
  "timestamp": "2023-11-06T14:52:43.123Z",
  "level": "INFO",
  "message": "Login attempt failed due to incorrect password",
  "user_id": "12345",
  "source_ip": "192.168.1.25",
  "attempt_num": 3,
  "request_id": "xyz-request-456",
  "service": "user-authentication",
  "device_info": "iPhone 12; iOS 16.1",
  "location": "New York, NY"
}
```

> **原则**：为未来的自己编写日志——消息要清晰、信息丰富，精确描述被捕获的事件。

## 5. 采样你的日志

对于每天产生数百 GB 或 TB 级数据的系统，日志采样是关键的成本控制策略。

### 5.1 基本采样

```go
// Go + zerolog 示例：每 5 条日志只保留 1 条
log := zerolog.New(os.Stdout).
    With().
    Timestamp().
    Logger().
    Sample(&zerolog.BasicSampler{N: 5})
```

### 5.2 高级采样策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| 固定比例采样 | 每 N 条保留 1 条 | 高流量、低差异的日志 |
| 基于内容的采样 | 根据日志内容调整采样率 | 错误日志保留更多，信息日志保留更少 |
| 基于级别的采样 | 不同级别不同采样率 | ERROR 全保留，INFO 采样 |
| 选择性跳过 | 某些类别跳过采样 | 审计日志不采样 |

> **关键**：尽早引入日志采样，不要等到成本已经成为问题。优先在应用层实现采样（如果框架支持），其次在日志管道中实现。

## 6. 使用规范日志行（Canonical Log Lines）

每个请求结束时创建一条**唯一的、全面的日志条目**，汇总该请求的所有关键信息。

```json
{
  "http_verb": "POST",
  "path": "/user/login",
  "source_ip": "203.0.113.45",
  "user_agent": "Mozilla/5.0 ...",
  "request_id": "req_98765",
  "response_status": 500,
  "error_id": "ERR500",
  "error_message": "Internal Server Error",
  "oauth_application": "AuthApp_123",
  "user_id": "user_789",
  "service_name": "AuthService",
  "git_revision": "7f8ff286cda761c340719191e218fb22f3d0a72",
  "request_duration_ms": 320,
  "database_time_ms": 120,
  "rate_limit_remaining": 99,
  "rate_limit_total": 100
}
```

**优势**：排查失败请求时只需查看一条日志，包含输入参数、调用者身份、数据库查询次数、耗时信息、速率限制等。

## 7. 聚合和集中化你的日志

在分布式系统中，将所有日志汇聚到集中式日志管理系统，创建单一、可搜索的真相来源：

- **跨服务关联事件**
- **加速事件响应**，快速定位根本原因
- **确保合规性**
- **降低存储和基础设施成本**

## 8. 建立日志保留策略

| 日志类别 | 建议保留期限 | 说明 |
|----------|-------------|------|
| 审计日志 | 1-7 年 | 法规合规要求 |
| 错误日志 | 30-90 天 | 故障排查需要 |
| 应用日志 | 7-30 天 | 日常运维 |
| 调试日志 | 1-7 天 | 临时排查 |

**关键措施**：

- 指定日志在活跃分析中保留多长时间
- 何时压缩并移至低成本存储
- 何时彻底清除
- 不同类别应用不同策略
- 在应用主机上设置日志轮转（logrotate）

## 9. 保护你的日志

- **加密**：静态和传输中均使用强加密算法
- **访问控制**：只有授权人员能访问敏感日志数据
- **审计追踪**：记录所有与日志的交互操作
- **供应商合规**：验证日志管理提供商的数据处理、存储、访问和销毁实践

## 10. 不要记录敏感数据

### 10.1 应用层防护

在应用层面隐藏敏感信息，即使包含敏感字段的对象被记录，也确保信息被省略或匿名化。

```go
// Go slog 示例：实现 LogValuer 接口控制日志输出
type User struct {
    ID        string `json:"id"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Email     string `json:"email"`
    Password  string `json:"password"`
}

// 只暴露 ID，隐藏所有其他字段
func (u *User) LogValue() slog.Value {
    return slog.StringValue(u.ID)
}

// 输出：{"user":"user-12234"} —— 密码和邮箱不会泄露
```

```python
# Python structlog 示例：自定义处理器脱敏
import structlog
import re

SENSITIVE_PATTERNS = {
    "password": r".*",
    "token": r".*",
    "email": r"(.).*@",  # 保留首字母
    "phone": r"(\d{3})\d{4}(\d{4})",  # 保留前3后4
}

def redact_sensitive_fields(logger, method_name, event_dict):
    for key, pattern in SENSITIVE_PATTERNS.items():
        if key in event_dict:
            if key in ("password", "token"):
                event_dict[key] = "***REDACTED***"
            elif key == "email":
                event_dict[key] = re.sub(pattern, r"\1***@", event_dict[key])
            elif key == "phone":
                event_dict[key] = re.sub(pattern, r"\1****\2", event_dict[key])
    return event_dict

structlog.configure(processors=[redact_sensitive_fields, ...])
```

### 10.2 最佳做法

- **始终为自定义对象实现日志控制接口**，即使今天没有敏感字段，未来可能会添加
- **在日志管道中进行二次脱敏**，捕获应用层遗漏的情况
- **建立统一的脱敏策略**，适用于不同语言开发的所有应用

## 11. 不要忽视日志的性能开销

### 11.1 性能对比（Go 示例）

| 方案 | 请求/秒 | 性能影响 |
|------|---------|---------|
| 无日志 | ~192k | 基准 |
| Logrus（JSON） | ~153k | **-20%** |
| Slog（JSON） | ~153k → ~187k | **-3%** |

### 11.2 性能优化策略

- **选择高效的日志框架**（如 Go 用 slog/zerolog，Python 用 structlog，Node.js 用 pino）
- **使用日志采样**减少输出量
- **将序列化和刷新卸载到单独线程**
- **日志写入单独的分区**
- **进行负载测试**验证峰值流量下的日志处理能力
- **监控资源使用**防止磁盘溢出

## 12. 不要用日志做监控

日志只捕获预定义的事件和错误，不适合趋势分析和异常检测。应使用**指标（metrics）**回答以下问题：

- 服务的请求率是多少？
- 服务的错误率是多少？
- 服务的延迟是多少？

| 用途 | 适合工具 | 不适合 |
|------|----------|--------|
| 趋势分析 | 指标（Prometheus、Grafana） | 日志 |
| 异常检测 | 指标 + 告警规则 | 日志 |
| 实时仪表盘 | 指标 | 日志 |
| 故障排查 | 日志 + 链路追踪 | 仅指标 |
| 审计追踪 | 日志 | 指标 |

---

## 日志格式化最佳实践

| 实践 | 影响 | 难度 |
|------|------|------|
| 使用 JSON 结构化日志 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 统一使用字符串日志级别 | ⭐⭐⭐ | ⭐ |
| 时间戳使用 ISO-8601 格式 | ⭐⭐⭐⭐ | ⭐⭐ |
| 包含日志来源信息 | ⭐⭐⭐ | ⭐ |
| 添加构建版本或 Git commit hash | ⭐⭐⭐ | ⭐ |
| 错误日志包含堆栈追踪 | ⭐⭐⭐⭐⭐ | ⭐ |
| 标准化上下文字段 | ⭐⭐⭐ | ⭐⭐⭐ |
| 使用关联 ID 分组相关日志 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 选择性记录对象字段 | ⭐⭐⭐ | ⭐⭐⭐ |

### F1. 统一使用字符串日志级别

不同框架的整数级别映射不同（如 Pino 中 `60` = FATAL，Go slog 中 `8` = ERROR），会造成混淆。

```json
// ❌ 整数级别，不同框架含义不同
{"level": 60, "msg": "Fatal message"}

// ✅ 字符串级别，含义明确
{"level": "FATAL", "msg": "Fatal message"}
```

### F2. 时间戳使用 ISO-8601 / RFC 3339

```
// ✅ ISO-8601 格式，人类可读且无歧义
2023-09-10T12:34:56.123456789Z
2023-11-17T12:34:56.123456789+08:00

// ❌ 其他格式
1687927940843                    // Unix 时间戳，不可读
06/28/2023 04:49:48              // 美式日期，有歧义
```

> **规范**：将时间戳统一标准化为 UTC，如需本地时区则带偏移量。

### F3. 包含日志来源信息

```json
{
  "time": "2023-05-24T19:39:27.005Z",
  "level": "DEBUG",
  "source": {
    "function": "main.main",
    "file": "app/main.go",
    "line": 30
  },
  "msg": "Debug message"
}
```

在分布式系统中还应包含：主机名、容器 ID 等标识信息。

### F4. 包含构建版本或 commit hash

```json
{
  "time": "2023-06-29T06:37:38.429Z",
  "level": "ERROR",
  "msg": "an unexpected error",
  "build_info": {
    "go_version": "go1.20.2",
    "commit_hash": "9b0695e1c4732a2ea2c8ac678472c4c3c235101b"
  }
}
```

> **作用**：代码重构后，仍能通过 commit hash 精确回溯到日志产生时的代码状态。

### F5. 错误日志包含堆栈追踪

```json
// ✅ 结构化堆栈追踪（优先选择）
{
  "level": "error",
  "message": "Cannot divide one by zero!",
  "exception": [
    {
      "exc_type": "ZeroDivisionError",
      "exc_value": "division by zero",
      "frames": [
        {
          "filename": "/app/main.py",
          "lineno": 16,
          "name": "<module>"
        }
      ]
    }
  ]
}

// ✅ 字符串堆栈追踪（可接受）
{
  "level": "ERROR",
  "message": "division by zero",
  "exc_info": "Traceback (most recent call last):\n  File \"app/main.py\", line 24\n    1 / 0\nZeroDivisionError: division by zero"
}
```

### F6. 标准化上下文字段

```python
# ✅ 使用键值对，而非嵌入消息字符串
slog.Info("User logged in", slog.Int("user_id", 42))

# ❌ 将上下文嵌入字符串
log.Println("User '" + user.id + "' logged in")
```

**命名规范**：

| 规则 | 示例 |
|------|------|
| 统一字段名，避免同义词 | `user_id`（不要混用 `user`、`userId`、`userID`） |
| 数值字段名包含单位 | `execution_time_ms`、`response_size_bytes` |
| 使用 snake_case | `request_id`、`source_ip` |

### F7. 使用关联 ID 分组相关日志

在基础设施边缘生成关联 ID，贯穿整个请求生命周期：

```json
{
  "timestamp": "2023-09-10T15:30:45.123456Z",
  "correlation_id": "9ea8f2b4-639e-4de7-b406-f6cd3a155e9f",
  "level": "INFO",
  "message": "Received incoming HTTP request",
  "request": {
    "method": "GET",
    "path": "/api/resource",
    "remote_address": "192.168.1.100"
  }
}
```

### F8. 选择性记录对象字段

```go
// Go：实现 LogValuer 接口
type User struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    Email    string `json:"email"`
    Password string `json:"password"`
}

func (u *User) LogValue() slog.Value {
    return slog.StringValue(u.ID)
}
// 只记录 ID，防止密码和邮箱泄露
```

```python
# Python：自定义 __repr__ 或 __str__
class User:
    def __init__(self, id, name, email, password):
        self.id = id
        self.name = name
        self.email = email
        self.password = password

    def __repr__(self):
        return f"User(id={self.id})"
```

---

## 检查清单

设计或审查日志策略时逐项确认：

**策略层面**：
- [ ] 明确了日志记录的业务目标和 KPI
- [ ] 区分了哪些用日志、哪些用指标、哪些用链路追踪
- [ ] 建立了定期审查日志策略的流程

**实现层面**：
- [ ] 使用了支持结构化输出（JSON）的日志框架
- [ ] 日志级别使用正确（INFO/WARN/ERROR/FATAL）
- [ ] 支持动态调整日志级别（无需重启服务）
- [ ] 时间戳使用 ISO-8601/RFC 3339 格式，统一 UTC
- [ ] 日志级别使用字符串表示，非整数
- [ ] 上下文信息使用键值对，非嵌入消息字符串
- [ ] 字段命名统一（snake_case），数值字段带单位
- [ ] 每个请求有关联 ID 贯穿完整生命周期
- [ ] 错误日志包含堆栈追踪
- [ ] 日志中包含 build version 或 git commit hash

**安全层面**：
- [ ] 自定义对象实现了日志输出控制（LogValuer / __repr__）
- [ ] 密码、token、密钥等敏感数据不会出现在日志中
- [ ] 日志静态和传输中已加密
- [ ] 日志访问控制已配置

**运维层面**：
- [ ] 日志已聚合到集中式管理系统
- [ ] 配置了合适的保留策略（不同类别不同期限）
- [ ] 配置了日志轮转防止磁盘溢出
- [ ] 对高流量日志实施了采样策略
- [ ] 进行过负载测试验证峰值下的日志处理能力
