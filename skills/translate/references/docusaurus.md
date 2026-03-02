# Docusaurus 翻译规范

本文档定义了针对 Docusaurus 站点的翻译格式规范。

## 标题层级规范

Docusaurus 不允许在 Markdown 文档正文中使用一级标题 (`#`)。

### 标题转换规则

翻译时必须将所有标题下降一级:

| 原文标题 | 翻译后标题 | 说明 |
|---------|----------|------|
| `# Heading` | `## 标题` | 一级标题转为二级 |
| `## Subheading` | `### 子标题` | 二级标题转为三级 |
| `### Section` | `#### 章节` | 三级标题转为四级 |
| 以此类推 | 以此类推 | 保持相对层级关系 |

### 示例对比

**原文:**
```markdown
# Getting Started

Welcome to the documentation.

## Installation

Follow these steps...

### Prerequisites

You need...
```

**翻译后 (正确):**
```markdown
## 快速开始

欢迎阅读文档。

### 安装

按照以下步骤...

#### 前置条件

你需要...
```

**翻译后 (错误 - 不要这样做):**
```markdown
# 快速开始

欢迎阅读文档。

## 安装

按照以下步骤...

### 前置条件

你需要...
```

## Frontmatter 元数据

每个 Docusaurus 文档都需要在文件开头添加 YAML frontmatter。

### 基本格式

```markdown
---
sidebar_position: N
---

## 文档标题

正文内容...
```

### sidebar_position 确定规则

1. **检查目标目录**: 读取目标目录下所有 `.md` 和 `.mdx` 文件
2. **提取现有位置**: 读取每个文件的 frontmatter,提取 `sidebar_position` 值
3. **推荐新位置**: 
   - 通常使用 `最大值 + 1`
   - 如果有特殊语义顺序(如"介绍"应该在前),可以调整
4. **用户确认**: 向用户展示推荐值并允许自定义

### 示例交互

```
目标目录 docs/Tools/Remotion/ 下已有以下文件:
- 简介.md (sidebar_position: 1)
- 在现有项目中安装.md (sidebar_position: 2)

推荐 sidebar_position: 3

是否使用此位置? (回车确认 / 输入其他数字)
```

### 处理冲突

如果用户指定的 `sidebar_position` 与现有文件冲突:
1. 警告用户存在冲突
2. 说明可能导致的问题(两个文件位置相同)
3. 建议替代值
4. 让用户决定是否继续

## 文件命名规范

### 基本规则

1. **使用中文命名**: 文件名应该是中文,简洁且描述性强
2. **避免过长**: 通常不超过 10 个汉字
3. **使用有意义的词汇**: 直观反映文档内容

### 常见命名示例

| 内容类型 | 推荐文件名 | 说明 |
|---------|----------|------|
| Introduction | `介绍.md` | 简洁直观 |
| Getting Started | `快速开始.md` | 常用术语 |
| Installation | `安装.md` | 简短明确 |
| API Reference | `API参考.md` | 保留技术术语 |
| Configuration | `配置.md` | 简洁 |
| Troubleshooting | `故障排除.md` | 描述性 |
| Advanced Usage | `高级用法.md` | 清晰分类 |

### 目录结构

保持目录结构清晰,使用有意义的文件夹名称(也使用中文):

```
docs/
├── Tools/
│   └── Remotion/
│       ├── 简介.md
│       ├── 安装.md
│       ├── 变换.md
│       └── 播放器/
│           ├── 简介.md
│           └── 控制.md
```

## 完整示例

### 输入 (原始英文文档)

```markdown
# Transforms

Animation occurs when visual properties change over time.

## Opacity

The opacity determines visibility...

## Scale

Scale determines size...
```

### 输出 (翻译后的 Docusaurus 文档)

```markdown
---
sidebar_position: 3
---

## 变换

动画的产生是视觉属性随时间变化的结果。

### 不透明度

不透明度决定了可见性...

### 缩放

缩放决定了大小...
```

## 注意事项

1. **frontmatter 后必须空一行**: YAML frontmatter 和正文之间必须有空行
2. **第一个标题必须是二级**: frontmatter 后的第一个标题必须是 `##`
3. **保持层级一致性**: 确保标题层级关系正确,不要跳级
4. **sidebar_position 必须是整数**: 不能使用小数或字符串
5. **检查现有文件**: 保存前务必检查目标目录下已有文件,避免位置冲突
