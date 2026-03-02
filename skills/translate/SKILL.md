---
name: translate
description: 需要翻译文本、文档或网页内容时使用此技能。
---

# 智能翻译技能

这个技能提供了完整的翻译工作流，包括内容获取、翻译、格式化和保存。

## 核心能力

1. **自动识别来源类型**
   - URL（使用 Firecrawl MCP 抓取）
   - 本地文件路径（直接读取）
   - 纯文本（直接翻译）

2. **智能内容清理**
   - 自动识别并移除页面头部导航链接
   - 自动识别并移除页面尾部相关链接
   - 保留正文核心内容
   - 保持 Markdown 格式和代码片段完整

3. **Docusaurus 集成**
   - 自动添加 `sidebar_position` 元数据
   - 保持与项目结构一致的命名规范
   - 智能推荐存放路径
   - 遵循 Docusaurus 格式规范(详见 [references/docusaurus.md](references/docusaurus.md))

4. **目录层级智能识别**
   - 从 URL 路径中提取目录结构信息
   - 从文档内容的面包屑导航中提取层级信息
   - 自动创建多层目录结构
   - 保持文档的原始组织方式

5. **交互式路径选择**
   - 仅提供 URL 时,翻译后询问保存位置
   - 提供基于 URL 层级的智能推荐
   - 支持用户自定义路径

6. **文件命名规范**
   - 所有文件名使用中文
   - 符合 Docusaurus 文件命名约定

## 使用方式

当用户请求翻译时，执行以下工作流：

### 阶段 1: 内容获取

#### 步骤 1: 识别来源类型

检查输入内容,判断类型:

```typescript
// URL 模式
- 包含 http:// 或 https://
- 使用 Firecrawl MCP 的 firecrawl_scrape 工具抓取
- 参数: { url: string, formats: ["markdown"], onlyMainContent: true }
- 如果用户只提供了 URL,没有指定保存位置,则需要在翻译后询问保存位置

// 本地文件路径模式
- 以 / 或盘符开头（如 C:\ 或 D:\）
- 或者相对路径（如 ./docs/file.md）
- 使用 read 工具读取文件内容

// 纯文本模式
- 其他所有情况
- 直接作为翻译内容
```

#### 步骤 2: 获取内容

**如果是 URL:**

使用 Firecrawl MCP 抓取内容：

```typescript
firecrawl_scrape({
  url: userInput,
  formats: ["markdown"],
  onlyMainContent: true,
  removeBase64Images: false
})
```

提取 markdown 内容后，进入内容清理阶段。

**如果是本地文件:**

```typescript
read({ filePath: userInput })
```

直接使用文件内容，跳过清理阶段（假设本地文件已经是清理过的）。

**如果是纯文本:**

直接使用输入内容作为翻译源。

### 阶段 2: 内容清理（仅针对 URL 来源）

执行智能内容清理,移除导航元素并提取层级信息。详细规则见 [references/cleaning.md](references/cleaning.md)。

**关键步骤:**

1. **提取面包屑导航**: 识别并保存层级信息(如 `Docs > API > Auth` → `docs/api/auth`)
2. **移除头部导航**: 清理页面顶部的菜单、搜索框等
3. **保留核心正文**: 保留段落、代码块、图片、表格、标题结构
4. **移除尾部导航**: 清理底部的 Community、More、Social 等链接

### 阶段 3: 翻译

#### 翻译原则

1. **地道的技术中文**
   - 使用专业的技术术语
   - 保持语句流畅自然
   - 符合中文技术文档的表达习惯

2. **保持格式完整**
   - Markdown 标题、列表、引用保持原有层级
   - **Docusaurus 标题规范**: 遵循 [references/docusaurus.md](references/docusaurus.md) 中的标题转换规则
   - 代码块不翻译,保持原样
   - 行内代码标记保持不变
   - 链接结构保持不变(只翻译链接文字,不改URL)

3. **术语处理**
   - 常见技术术语保留英文（如 API、SDK、React、TypeScript）
   - 首次出现的术语可以采用"中文术语（English Term）"的格式
   - 专有名词（产品名、公司名）保持原文

4. **代码注释**
   - 代码块内的注释翻译成中文
   - 变量名、函数名保持原样

#### 示例翻译对比

原文标题 `# Getting Started` → 译文标题 `## 快速开始`

详见 [references/docusaurus.md](references/docusaurus.md)

### 阶段 4: 确定保存路径和元数据

#### 步骤 1: 分析内容类型和主题

基于翻译后的内容，识别：
- 主题类别（AI、前端、工具、Python 等）
- 内容类型（教程、API 文档、概念介绍等）

#### 步骤 2: 确定保存路径

**如果用户只提供了 URL(没有指定保存位置):**

1. **从多个来源提取目录层级信息**:
   
   a. **URL 路径分析**:
   - `https://example.com/docs/api/authentication` → 可能对应 `api/authentication`
   - `https://www.remotion.dev/docs/transforms` → 可能对应 `Remotion/transforms`
   - `https://docs.library.com/guide/advanced/caching` → 可能对应 `Library/guide/advanced/caching`
   
   b. **面包屑导航分析**:
   - 检查抓取的内容中是否包含面包屑导航(Breadcrumbs)
   - 常见格式: `Home > Docs > API > Authentication` 或 `首页 / 文档 / API / 认证`
   - 面包屑通常出现在文档开头,链接列表形式
   - 提取层级: `Docs > API > Authentication` → `docs/api/authentication`
   
   c. **优先级规则**:
   - 如果面包屑和 URL 路径都存在,优先使用面包屑(更准确反映文档结构)
   - 如果两者冲突,向用户展示两个选项供选择
   - 如果都不存在,仅基于内容主题推荐

2. 分析翻译后的内容主题,结合层级信息

3. 向用户询问保存位置,提供智能推荐:

```
基于面包屑导航和 URL 路径分析,推荐保存路径:
1. docs/Tools/Remotion/API/认证.md (推荐 - 基于面包屑)
2. docs/Tools/Remotion/认证.md (基于 URL 路径)
3. 自定义路径

请选择或输入自定义路径:
```

**如果用户已指定保存位置:**

直接使用用户指定的路径。

**创建目录层级:**

无论哪种情况,如果目标路径包含多层目录,在保存文件前必须使用 `bash` 工具创建所有缺失的目录层级:

```bash
mkdir -p "docs/Tools/Remotion/player"
```

**目录结构参考:**

```
docs/
├── AI/              # AI 相关
├── FrontEnd/        # 前端相关
├── Tools/           # 工具相关
├── Python/          # Python 相关
├── JVM/             # JVM 生态
├── Rust/            # Rust 相关
├── Go/              # Go 相关
├── Games/           # 游戏相关
├── Hardware/        # 硬件相关
├── Personal/        # 个人笔记
└── SoftwareEngineering/  # 软件工程
```
docs/
├── AI/              # AI 相关
├── FrontEnd/        # 前端相关
├── Tools/           # 工具相关
├── Python/          # Python 相关
├── JVM/             # JVM 生态
├── Rust/            # Rust 相关
├── Go/              # Go 相关
├── Games/           # 游戏相关
├── Hardware/        # 硬件相关
├── Personal/        # 个人笔记
└── SoftwareEngineering/  # 软件工程
```

**推荐格式:**

向用户展示推荐路径：

```
基于内容分析，推荐保存路径：
1. docs/AI/Agno/工具.md （推荐）
2. docs/AI/通用/工具使用指南.md
3. 自定义路径

请选择或输入自定义路径：
```

#### 步骤 3: 生成文件名

**文件命名规则:**
- 使用中文命名,简洁且描述性强
- 示例: `介绍.md`, `快速开始.md`, `API参考.md`
- 详见 [references/docusaurus.md](references/docusaurus.md)

#### 步骤 4: 添加 Docusaurus 元数据

添加 frontmatter,检查目标目录下已有文件的 `sidebar_position`,推荐合适的位置并向用户确认。

格式规范详见 [references/docusaurus.md](references/docusaurus.md)

### 阶段 5: 保存文件

#### 步骤 1: 构建最终内容

```markdown
---
sidebar_position: ${position}
---

${translatedContent}
```

#### 步骤 2: 写入文件

使用 `write` 工具保存文件。

#### 步骤 3: 确认完成

向用户展示：

```
✓ 翻译完成
  来源: ${sourceType} (${sourceUrl or sourceFile})
  保存至: ${savedPath}
  元数据: sidebar_position = ${position}
  
文件已准备就绪！
```

## 错误处理

- **URL 抓取失败**: 提示用户检查 URL,提供手动复制内容的备用方案
- **文件读取失败**: 检查路径和权限,提示用户提供正确路径
- **翻译质量问题**: 允许用户反馈并针对特定段落重新翻译

## 高级功能

- **批量翻译**: 支持一次翻译多个 URL 或文件
- **翻译记忆**: 维护术语表确保一致性(如 hook、props 保持不变)
- **自定义清理**: 允许用户指定忽略特定关键词的段落

## 工具使用清单

本技能依赖以下工具：

**必需工具:**
- `firecrawl_scrape` (Firecrawl MCP) - URL 内容抓取
- `read` - 本地文件读取
- `write` - 保存翻译结果
- `glob` - 查找目录下已有文件

**可选工具:**
- `question` - 与用户交互确认
- `bash` - 文件系统操作(必需,用于创建多层目录结构)

## 示例使用场景

### 场景 1: 翻译官方文档页面

**用户输入:**
```
/translate https://docs.agno.com/introduction
```

**执行流程:**
1. 识别为 URL
2. 使用 Firecrawl 抓取 Markdown 内容
3. 提取面包屑导航: `Home > Docs > Introduction` → 层级 `docs/introduction`
4. 清理头部导航(搜索框、菜单链接)
5. 清理尾部导航(Community、More 链接)
6. 翻译正文内容(遵循 Docusaurus 标题规范)
7. 结合面包屑和 URL 路径推荐保存位置
8. 询问用户保存位置,推荐: `docs/Tools/Remotion/介绍.md`
9. 创建目录: `mkdir -p "docs/Tools/Remotion"`
10. 检查已有文件,建议 sidebar_position: 1
11. 保存文件

### 场景 2: 翻译本地文件

**用户输入:**
```
/translate ./drafts/react-hooks.md
```

**执行流程:**
1. 识别为本地文件
2. 读取文件内容
3. 直接翻译（跳过清理）
4. 询问保存路径
5. 添加 Docusaurus 元数据
6. 保存文件

### 场景 3: 翻译多层级 URL(保留目录结构)

**用户输入:**
```
/translate https://www.remotion.dev/docs/player/controls
```

**抓取内容包含面包屑:**
```
Home > Docs > Player > Controls
```

**执行流程:**
1. 识别为 URL
2. 使用 Firecrawl 抓取内容
3. 提取面包屑: `Docs > Player > Controls` → `docs/player/controls`
4. 提取 URL 路径: `/docs/player/controls` → `player/controls`
5. 清理并翻译(遵循 Docusaurus 规范)
6. 向用户询问,提供两个推荐:
   - 选项 1: `docs/Tools/Remotion/player/控制.md` (基于面包屑)
   - 选项 2: `docs/Tools/Remotion/player/控制.md` (基于 URL - 本例中相同)
7. 用户选择推荐路径
8. 创建多层目录: `mkdir -p "docs/Tools/Remotion/player"`
9. 检查 `docs/Tools/Remotion/player/` 下已有文件的 sidebar_position
10. 建议合适的 sidebar_position
11. 保存到 `docs/Tools/Remotion/player/控制.md`

### 场景 4: 快速翻译一段文本

**用户输入:**
```
/translate React is a JavaScript library for building user interfaces.
```

**执行流程:**
1. 识别为纯文本
2. 直接翻译
3. 询问是否需要保存
4. 如需保存，执行路径推荐和元数据添加流程

## 最佳实践

1. **内容清理要谨慎**
   - 不要过度清理导致正文内容丢失
   - 对不确定的部分保留原样
   - 清理后向用户展示预览，允许调整

2. **路径推荐要智能**
   - 优先从面包屑导航提取目录层级信息
   - 其次从 URL 路径提取层级信息
   - 如果两者冲突,向用户展示两个选项
   - 基于内容主题推荐合适的顶层目录(Tools、FrontEnd 等)
   - 保留文档的原始子路径结构
   - 检查是否已有相似内容(避免重复)
   - 提供多个选项,给用户选择权
   - 在保存前必须创建所有缺失的目录层级

3. **元数据要规范**
   - sidebar_position 必须是整数
   - 检查是否与现有文件冲突
   - 保持目录内文件的序号连续性

4. **翻译要专业**
   - 使用行业标准术语
   - 保持技术准确性
   - 语句流畅自然,符合中文习惯
   - 严格遵守 [references/docusaurus.md](references/docusaurus.md) 中的格式规范

## 注意事项

1. **Firecrawl 限制**
   - 某些网站可能有反爬虫机制
   - 抓取速度受限于网络和服务端性能
   - 需要有效的 Firecrawl API 配置

2. **内容清理风险**
   - 自动清理可能误删有用内容
   - 建议在清理后让用户确认
   - 对于重要文档，建议保留原始抓取内容作为备份

3. **文件覆盖风险**
   - 在覆盖现有文件前务必确认
   - 建议提供备份选项
   - 对于重要文件，使用版本控制

4. **sidebar_position 冲突**
   - 检查并避免与现有文件的 position 冲突
   - 如有冲突,提示用户调整
   - 必要时重新排列整个目录的序号

5. **目录创建要求**
   - 保存文件前必须确保目标目录存在
   - 使用 `mkdir -p` 创建多层目录结构
   - 如果用户只提供 URL,必须在翻译后询问保存位置

6. **Docusaurus 格式规范**
   - 遵循 [references/docusaurus.md](references/docusaurus.md) 中的所有规范
   - 标题转换、frontmatter、文件命名等详细要求见该文件
