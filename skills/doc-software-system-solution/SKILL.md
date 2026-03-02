---
name: doc-software-system-solution
description: End-to-end technical solution architecting for software projects. Use when users ask to analyze a project directory and generate a technical solution document, architecture documentation, or system design proposal. Handles context gathering from project files, requirements analysis, architecture design with Mermaid diagrams and interactive prototypes, and DOCX generation via Pandoc. Automatically processes pptx, docx, xlsx, and pdf files using corresponding skills.
---

# Technical Solution Document Generator

本技能帮助用户从项目目录中收集信息，分析需求，设计系统架构，并生成专业的技术解决方案文档。

## 使用场景

当用户提出类似以下请求时触发此技能：
- "了解$dir这个项目，并帮我生成一份技术解决方案"
- "为项目$dir创建一个技术方案文档"
- "分析$dir项目并输出系统架构设计"

## 前置条件

用户应将所有项目相关信息放置在指定的`$dir`目录下，包括：
- 背景调查报告
- 需求文档（.docx, .pptx, .xlsx, .pdf等）
- 设计文档
- 交互原型
- 其他相关资料

## 执行流程

### Phase 1: 背景调查 (Discovery)

1. **扫描项目目录**
   - 使用`glob`扫描`$dir`目录结构
   - 识别所有文档文件（.md, .docx, .pptx, .xlsx, .pdf等）
   - 列出发现的文件清单

2. **收集背景信息**
   从可用文档中提取以下信息：
   - **参与者**：用户、客户、利益相关者
   - **目标**：项目旨在实现的核心目标
   - **挑战**：可能遇到的障碍或限制
   - **进度**：项目当前在真实世界中的推进情况
   - **预算**：项目的财务资源
   - **其他相关信息**

3. **信息缺口识别**
   - 如文档中缺少关键背景信息，主动向用户提问
   - 示例提问：
     - "请问这个项目的客户/甲方是谁？"
     - "项目的目标交付时间是什么时候？"
     - "是否有预算限制需要考虑？"

### Phase 2: 需求分析 (Analysis)

1. **文档内容提取**
   - 对于文本文件(.md, .txt)：直接读取内容
   - 对于非文本文件：
     - `.pptx` → 使用`pptx` skill分析
     - `.docx` → 使用`docx` skill分析
     - `.xlsx` → 使用`xlsx` skill分析
     - `.pdf` → 使用`pdf` skill分析

2. **需求整理**
   将收集到的需求分类为：
   - **功能需求**：系统应该做什么
   - **非功能需求**：性能、安全、可扩展性等
   - **约束条件**：技术栈、时间、预算限制

3. **需求验证**
   - 向用户确认理解是否正确
   - 澄清模糊或不明确的需求点

### Phase 3: 架构及功能设计 (Design)

1. **系统架构设计**
   - 确定系统的主要组件
   - 定义组件之间的关系和交互
   - 考虑系统的可扩展性、可维护性和性能

2. **创建架构图**
   - 使用Mermaid语法创建图表
   - 支持的图表类型：
     - 系统架构图 (graph TB/LR)
     - 数据流图
     - 时序图 (sequenceDiagram)
     - 类图 (classDiagram)
   
   示例：
   ```mermaid
   graph TB
       A[用户界面] --> B[API网关]
       B --> C[业务服务层]
       C --> D[数据访问层]
       D --> E[(数据库)]
   ```

3. **组件详细设计**
   - **前端**：技术栈、设计模式、UI框架
   - **后端**：API设计、业务逻辑、中间件
   - **数据库**：数据模型、存储方案

4. **创建交互式原型** (Interactive Prototype)
   - 识别架构中的关键交互或复杂数据流
   - 使用 `web-artifacts-builder` 或 `frontend-design` 技能创建交互式原型
   - 使用模板 `references/demo-prompt-template.md` 构建提示词
   - 将生成的HTML原型保存至 `$dir/prototypes/` 目录

5. **捕获原型截图**
   - 使用 `playwright` 技能（或 `dev-browser`）打开生成的HTML原型
   - 截取关键交互状态的屏幕截图
   - 将截图保存至 `$dir/assets/` 目录，命名清晰（如 `auth-flow-demo.png`）

### Phase 4: 文档创建 (Drafting)

1. **使用模板**
   - 加载`references/technical-solution-template.md`作为基础模板
   - 根据项目具体情况填充各章节内容

2. **文档结构**
   按照模板结构组织内容：
   - 执行摘要
   - 背景与需求
   - 系统架构（在此处插入Mermaid图表和原型截图）
     - 插入截图示例：`![交互原型：用户登录流程](./assets/auth-flow-demo.png)`
     - 添加说明文字：`*图：用户登录流程的交互原型截图。完整演示请查看 [HTML文件](./prototypes/login.html)*`
   - 实施计划
   - 风险评估

3. **格式要求**
   - 使用Markdown格式
   - 插入Mermaid图表（使用```mermaid代码块）
   - 使用表格展示对比信息
   - 保持专业、清晰的技术写作风格

### Phase 5: 文档转换 (Delivery)

1. **Markdown转DOCX**
   - 使用提供的脚本进行转换：
   ```bash
   ./scripts/convert_doc.sh <input.md> [output.docx]
   ```
   
   - 或直接运行Pandoc命令：
   ```bash
   pandoc "source.md" \
     --lua-filter=scripts/mermaid-filter.lua \
     -o "output.docx"
   ```

2. **验证输出**
   - 检查生成的DOCX文件
   - 确认图表正确渲染
   - 验证格式符合预期

3. **交付**
   - 向用户展示生成的文档
   - 提供下载链接或文件路径
   - 根据反馈进行调整

## 依赖检查

在执行文档转换前，请确认以下依赖已安装：

- **Pandoc**: 文档转换工具
  ```bash
  pandoc --version
  ```

- **Mermaid CLI (mmdc)**: Mermaid图表渲染
  ```bash
  mmdc --version
  ```

如果依赖缺失，请提示用户先安装：
- Pandoc: https://pandoc.org/installing.html
- Mermaid CLI: `npm install -g @mermaid-js/mermaid-cli`

## 资源文件

### 模板文件
- `references/technical-solution-template.md` - 技术解决方案文档模板
- `references/demo-prompt-template.md` - 交互式原型请求模板

### 脚本文件
- `scripts/mermaid-filter.lua` - Pandoc Lua过滤器，用于处理Mermaid图表
- `scripts/convert_doc.sh` - 文档转换辅助脚本

## 最佳实践

1. **信息收集要全面**：不要遗漏任何项目相关文档
2. **架构设计要合理**：考虑可扩展性、性能和可维护性
3. **图表要清晰**：使用Mermaid创建易于理解的架构图
4. **文档要专业**：遵循技术写作规范，语言准确、结构清晰
5. **与用户确认**：关键决策点和最终输出都要与用户确认

## 示例输出

生成的技术解决方案文档应类似于：
- `examples/系统解决方案示例.md` （如存在）

## 故障排除

**问题：Pandoc命令失败**
- 检查Pandoc是否已安装
- 确认脚本路径正确

**问题：Mermaid图表未渲染**
- 确认mmdc已安装并可访问
- 检查Mermaid语法是否正确

**问题：文档格式错乱**
- 检查Markdown语法
- 确认使用标准Markdown扩展
