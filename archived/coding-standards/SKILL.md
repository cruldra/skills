---
name: coding-standards
description: Use when implementing, modifying, refactoring, or reviewing code and the agent must follow explicit coding standards for simplicity, readability, maintainability, testability, project conventions, and minimal safe changes.
---

# Coding Standards

## 目标

指导 code agent 写出符合项目规范、容易维护、容易验证的代码。默认先理解现有代码，再做最小必要修改，并用测试或等价检查证明行为正确。

## 工作流程

1. 先读相关代码、测试、文档和调用方，确认现有约定。
2. 明确本次改动的真实目标、边界和不做事项。
3. 优先复用项目已有模式、工具、类型、错误处理和测试方式。
4. 做小步、局部、可解释的修改，避免顺手重构无关代码。
5. 为有风险的行为补测试；低风险样式调整至少做静态检查。
6. 结束前说明改了什么、验证了什么、还剩什么风险。

## 事实文档

- 写 Python 代码或审查 Python 变更时，读取 [references/python.md](references/python.md)。
- 写 TypeScript 或 React 代码、审查 TS/TSX 变更时，读取 [references/typescript.md](references/typescript.md)。
- 用户指出新的反例和规范写法时，把它沉淀到对应事实文档；优先记录具体例子，不把个人经验改写成空泛口号。
- 当事实文档与通用最佳实践冲突时，以事实文档为准，除非当前项目已有更强的本地约定。

## 编码准则

### 简单性

- 不为未来假设提前加抽象、框架、缓存、工厂、注册表或通用层。
- 没有第二个真实使用场景时，不先抽公共接口。
- 能用普通函数清楚表达时，不引入类或管理器。

### 一致性

- 跟随当前文件和相邻模块的命名、分层、错误处理、日志、类型和测试风格。
- 优先使用项目已有 helper、schema、client、hook、fixture 和命令。
- 不在同一改动里混入格式化噪音、目录重排或无关重命名。

### 可读性

- 代码表达业务意图，命名具体，避免含糊的 `data`、`item`、`manager`、`handler`。
- 控制函数长度和分支深度；只在读者会卡住的地方写简短注释。
- 删除死代码、未使用变量和临时调试输出。

### 正确性

- 先处理边界条件、失败路径、并发/重试、空值和权限问题。
- 不吞异常；错误信息要能定位问题，但不能泄露敏感数据。
- 修改公共接口、数据结构或 API 返回值时，检查所有调用方。

### 可测试性

- 新增行为优先写针对性测试，避免只靠手工验证。
- Bugfix 先用失败用例复现，再做最小修复。
- 测试断言业务结果，不断言无关实现细节。

## 提交前自检

- 这次修改是否只解决当前明确问题？
- 是否遵守了项目现有模式，而不是新造一套？
- 是否覆盖了主要成功路径和失败路径？
- 是否有未解释的测试失败、类型错误、lint 错误或格式化噪音？
- 最终说明是否包含修改范围、验证命令和剩余风险？

## 待补充

- 语言专项规范：Shell、SQL 等。
- 场景专项规范：新功能、bugfix、重构、review 反馈处理。
- 反例库：常见不规范代码、风险解释和推荐改法。
