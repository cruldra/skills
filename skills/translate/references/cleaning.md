# 内容清理规则

本文档定义了从网页抓取的内容如何进行清理,以保留核心正文并移除导航元素。

## 面包屑导航识别

面包屑导航不仅用于清理,更重要的是用于提取文档的目录层级信息。

### 面包屑特征

1. **位置**: 通常出现在文档开头部分(前 10-20 行)
2. **格式**: 链接列表形式,用分隔符连接
3. **分隔符**: `>`, `/`, `›`, `→` 等
4. **示例**:
   - Markdown: `[Home](/) > [Docs](/docs) > [API](/docs/api) > Authentication`
   - 纯文本: `首页 / 文档 / API / 认证`
   - 英文: `Home › Documentation › Getting Started`

### 提取方法

1. 扫描文档开头(前 20 行)
2. 查找包含 2 个以上连续链接的行
3. 识别分隔符(`>`, `/`, `›`)
4. 提取层级结构:
   - `Home > Docs > API > Auth` → `["Home", "Docs", "API", "Auth"]`
   - 通常忽略第一个元素("Home"/"首页")
   - 结果: `docs/api/auth`

### 用途

- **主要用途**: 确定文档的目录层级,用于推荐保存路径
- **次要用途**: 作为导航元素,在清理阶段移除

## 头部导航识别

头部导航是页面顶部的主导航菜单,需要完全移除。

### 头部导航特征

1. **位置**: 文档开头(通常前 30 行)
2. **内容特征**:
   - 连续的链接列表
   - 链接文字简短(1-3 个词)
   - 链接数量密集(连续 5 个以上)
   - 包含导航关键词: "导航"、"搜索"、"菜单"、"Menu"、"Search"、"Navigation"

3. **常见模式**:
   ```
   [Skip to main content](#main)
   [Home](/) [Docs](/docs) [API](/api) [Blog](/blog) [GitHub](https://github.com)
   Search...
   ```

### 清理策略

从文档开头开始:
1. 跳过包含 "Skip to"、"跳转到" 的链接
2. 跳过连续的导航链接列表
3. 跳过搜索框提示文字
4. 直到遇到第一个实质性内容:
   - 段落长度 > 100 字符
   - 或代码块
   - 或文档标题(通常在面包屑之后)

## 尾部导航识别

尾部导航通常包含"下一页"、"相关链接"、"社交媒体"等内容。

### 尾部导航特征

1. **位置**: 文档末尾
2. **内容特征**:
   - 包含导航关键词: "下一页"、"相关文章"、"更多资源"
   - 英文关键词: "Next", "Previous", "Community", "More", "Social", "Follow us"
   - 链接列表格式(bullet points 或 numbered lists)

3. **常见模式**:
   ```
   ## Community
   - [Discord](...)
   - [Twitter](...)
   
   ## More Resources
   - [Tutorial](...)
   - [Examples](...)
   ```

### 清理策略

从文档末尾向上查找:
1. 识别包含导航关键词的标题
2. 移除这些标题及其后续内容
3. 保留核心正文结束位置之前的所有内容

## 保留内容

以下内容必须保留:

1. **正文段落**: 技术说明、解释性文字
2. **代码块**: 所有代码示例(包括 ```language 格式)
3. **图片**: 带 alt 文本的图片
4. **标题层级**: 文档的标题结构
5. **表格**: 数据表格和对比表格
6. **列表**: 说明性的 bullet points 或 numbered lists
7. **引用块**: blockquotes

## 清理流程

完整的清理流程:

1. **提取面包屑** (用于路径推荐,然后移除)
2. **移除头部导航** (Skip to、主菜单、搜索框)
3. **保留核心正文** (段落、代码、图片、表格)
4. **移除尾部导航** (Community、More、Social 等)
5. **验证结果** (确保没有误删重要内容)

## 特殊情况处理

### 1. 页面目录 (Table of Contents)

通常包含 "On this page"、"目录"、"Table of Contents" 等标题。

**处理方式**: 移除(Docusaurus 会自动生成目录)

### 2. 文档元信息

如 "Last updated"、"Edit this page"、"Contributors" 等。

**处理方式**: 移除(不属于正文内容)

### 3. 警告/提示框

如 "Note"、"Warning"、"Tip" 等标记的内容。

**处理方式**: 保留(属于正文的一部分)

### 4. 嵌入式演示

如 CodeSandbox、StackBlitz 嵌入链接。

**处理方式**: 保留(转换为普通链接或说明)

## 验证清理结果

清理后应检查:

1. ✓ 文档开头是否是正文第一段或第一个标题
2. ✓ 文档结尾是否是正文最后一段
3. ✓ 没有多余的导航链接列表
4. ✓ 代码块、图片、表格完整保留
5. ✓ 标题层级结构完整

## 示例

### 清理前

```markdown
[Skip to main content](#main)

[Home](/) [Docs](/docs) [API](/api) [Blog](/blog)

Search...

Home > Docs > Getting Started

# Getting Started

This guide will help you...

## Installation

Run the following command...

## Community

- [Discord](...)
- [Twitter](...)

## More

- [Examples](...)
```

### 清理后

```markdown
# Getting Started

This guide will help you...

## Installation

Run the following command...
```

**提取的层级信息**: `docs/getting-started` (来自面包屑 "Home > Docs > Getting Started")
