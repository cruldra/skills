# Middleware 参考

Middleware 继承 `AgentMiddleware`，在每次 LLM 调用前后拦截，可以：
- 动态注入/过滤工具
- 修改系统提示
- 变换消息历史
- 维护跨轮次状态

## Middleware vs 普通 Tool

| 维度 | Middleware | 普通 Tool |
|------|-----------|----------|
| 触发时机 | LLM 调用**前后** | LLM **调用后**（tool call） |
| 修改系统提示 | ✅ | ❌ |
| 跨轮次状态 | ✅ | ❌ |
| 动态过滤工具列表 | ✅ | ❌ |
| 实现复杂度 | 较高 | 低 |

**选择原则：**
- 需要修改系统提示或拦截请求 → 用 Middleware
- 纯粹的功能函数，无需感知 LLM 调用 → 用普通 Tool

---

## create_deep_agent 内置 Middleware 栈

`create_deep_agent` 自动构建以下中间件（按顺序）：

```
1. TodoListMiddleware         — 管理 todo 列表工具
2. SkillsMiddleware           — 若 skills 参数非空
3. FilesystemMiddleware       — 文件系统工具（ls/read/write/edit/glob/grep/execute）
4. SubAgentMiddleware         — task 工具（子代理调度）
5. SummarizationMiddleware    — 自动上下文压缩
6. PatchToolCallsMiddleware   — 修补工具调用格式兼容性
7. AsyncSubAgentMiddleware    — 若有 AsyncSubAgent
   ── 用户的 middleware 插入此处 ──
8. Provider 专属中间件         — 如 AnthropicPromptCachingMiddleware
9. MemoryMiddleware           — 若 memory 参数非空
10. HumanInTheLoopMiddleware  — 若 interrupt_on 参数非空
11. _PermissionMiddleware     — 若 permissions 参数非空（必须最后）
```

用户传入的 `middleware` 插入在第 7 步位置。

---

## 常用内置 Middleware

### SummarizationMiddleware（自动上下文压缩）

当 token 使用量超过阈值时，自动把旧消息压缩为摘要，防止上下文溢出。
`create_deep_agent` 已自动添加，一般无需手动配置。

如需自定义压缩参数：

```python
from deepagents.middleware import SummarizationMiddleware
from deepagents.backends import FilesystemBackend

backend = FilesystemBackend(root_dir="/data")

summ = SummarizationMiddleware(
    model="anthropic:claude-haiku-4-5",   # 压缩用的模型，建议用便宜模型
    backend=backend,
    trigger=("fraction", 0.85),  # 使用 85% 上下文窗口时触发
    keep=("fraction", 0.10),     # 保留最近 10% 的消息不压缩
)

agent = create_deep_agent(middleware=[summ])
```

**`trigger` / `keep` 格式：**

| 格式 | 含义 |
|------|------|
| `("tokens", 50000)` | 超过 50000 个 token 时触发 |
| `("messages", 20)` | 超过 20 条消息时触发 |
| `("fraction", 0.85)` | 使用超过 85% 上下文窗口时触发 |

压缩后的历史记录存储在 backend 的 `/conversation_history/{thread_id}.md`。

### SummarizationToolMiddleware（手动压缩工具）

暴露 `compact_conversation` 工具，让代理自行决定何时压缩，或供人工触发：

```python
from deepagents.middleware import SummarizationMiddleware, SummarizationToolMiddleware

summ = SummarizationMiddleware(model="anthropic:claude-haiku-4-5", backend=backend)
tool_mw = SummarizationToolMiddleware(summ)

agent = create_deep_agent(middleware=[summ, tool_mw])
```

### MemoryMiddleware

从 AGENTS.md 文件加载记忆注入系统提示（通过 `memory` 参数自动添加，一般不需要手动构建）。

### SkillsMiddleware

按需加载技能文件（通过 `skills` 参数自动添加，一般不需要手动构建）。

---

## 自定义 Middleware

继承 `AgentMiddleware`，重写 `wrap_model_call` 和/或 `awrap_model_call`：

```python
from collections.abc import Callable, Awaitable
from langchain.agents.middleware.types import (
    AgentMiddleware, ModelRequest, ModelResponse, ContextT, ResponseT
)

class LoggingMiddleware(AgentMiddleware):
    """记录每次 LLM 调用的 token 使用情况。"""

    def wrap_model_call(
        self,
        request: ModelRequest[ContextT],
        handler: Callable[[ModelRequest[ContextT]], ModelResponse[ResponseT]],
    ) -> ModelResponse[ResponseT]:
        response = handler(request)
        # 在此处理响应，例如记录 token 用量
        usage = getattr(response.response, "usage_metadata", None)
        if usage:
            print(f"[Token使用] input={usage.get('input_tokens')} output={usage.get('output_tokens')}")
        return response

    async def awrap_model_call(
        self,
        request: ModelRequest[ContextT],
        handler: Callable[[ModelRequest[ContextT]], Awaitable[ModelResponse[ResponseT]]],
    ) -> ModelResponse[ResponseT]:
        response = await handler(request)
        usage = getattr(response.response, "usage_metadata", None)
        if usage:
            print(f"[Token使用] input={usage.get('input_tokens')} output={usage.get('output_tokens')}")
        return response


agent = create_deep_agent(middleware=[LoggingMiddleware()])
```

**常用 `request` 操作：**

```python
# 追加内容到系统提示
from deepagents.middleware._utils import append_to_system_message

new_system = append_to_system_message(request.system_message, "额外指令...")
return handler(request.override(system_message=new_system))

# 注入额外工具
request_with_tools = request.override(tools=[*request.tools, my_tool])
return handler(request_with_tools)
```

---

## Middleware 与子代理

通过 `middleware` 参数传入 `create_deep_agent` 的中间件只作用于**主代理**。

子代理（`SubAgent`）有独立的中间件栈，通过 spec 的 `middleware` 字段添加额外中间件：

```python
researcher: SubAgent = {
    "name": "researcher",
    "description": "...",
    "system_prompt": "...",
    "middleware": [LoggingMiddleware()],  # 只作用于这个子代理
}
```
