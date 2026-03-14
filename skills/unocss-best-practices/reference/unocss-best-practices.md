# UnoCSS 在 React 项目中的最佳实践指南

## 目录
- [1. 依赖配置 (package.json)](#1-依赖配置-packagejson)
- [2. 项目配置](#2-项目配置)
- [3. 样式引入](#3-样式引入)
- [4. 核心使用模式](#4-核心使用模式)
- [5. 常用工具类指南](#5-常用工具类指南)
- [6. 组件开发最佳实践](#6-组件开发最佳实践)
- [7. 常见场景示例](#7-常见场景示例)
- [8. 实践规范总结](#8-实践规范总结)

---

## 1. 依赖配置 (package.json)

在现代前端项目中，UnoCSS 以插件和预设的形式提供原子化 CSS 能力。以下是标准配置所需的依赖清单：

```json
{
  "devDependencies": {
    "unocss": "^66.1.0",
    "@unocss/preset-uno": "^66.1.0",
    "@unocss/preset-attributify": "^66.1.0",
    "@unocss/preset-icons": "^66.1.0",
    "@unocss/preset-typography": "^66.1.0",
    "@unocss/preset-web-fonts": "^66.1.0",
    "@unocss/reset": "^66.1.0",
    "vite": "^6.3.5"
  }
}
```

---

## 2. 项目配置

### 2.1 核心配置文件

**`uno.config.ts`** - UnoCSS 主配置，采用多预设组合模式：

```typescript
import { defineConfig, presetUno, presetAttributify, presetIcons, presetTypography, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),         // 核心预设，提供类似 Tailwind 的默认工具类
    presetAttributify(), // 属性化模式，支持 <div flex></div>
    presetIcons({        // 纯 CSS 图标预设
      scale: 1.2,
      warn: true,
    }),
    presetTypography(),  // 排版预设（文章、富文本样式）
    presetWebFonts({     // Web 字体按需加载预设
      provider: 'google',
      fonts: {
        sans: 'Roboto',
        serif: 'Merriweather',
        mono: 'Fira Code',
        custom: [
          {
            name: 'Open Sans',
            weights: ['400', '700'],
            italic: true,
          },
        ],
      },
    }),
  ],
  shortcuts: [
    // 将重复的原子类组合提炼为快捷方式
    // 示例: ['btn-primary', 'px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors']
  ],
  rules: [
    // 针对复杂或特殊需求的自定义正则规则
  ],
  theme: {
    // 可以在这里扩展颜色、断点等主题变量
    colors: {
      brand: {
        primary: '#4951EB', // 可以在项目中通过 text-brand-primary 或 bg-brand-primary 使用
      }
    }
  }
})
```

### 2.2 Vite 集成

**`vite.config.ts`** - 将 UnoCSS 作为 Vite 插件引入：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  plugins: [
    UnoCSS(), 
    react()
  ],
  // ...
});
```

### 2.3 TypeScript 支持 (针对 Attributify 模式)

**`src/uno.d.ts`** - 为 React 提供属性化写法的类型声明，防止 TS 报错：

```typescript
import type { AttributifyAttributes } from '@unocss/preset-attributify';

declare module 'react' {
  // 允许在所有 HTML 元素上使用 UnoCSS 属性
  interface HTMLAttributes<T> extends AttributifyAttributes {}
}
```

---

## 3. 样式引入

在应用的根入口（如 `main.tsx` 或 `App.tsx`）中引入 UnoCSS 基础样式和重置样式。

```typescript
// 引入 UnoCSS 生成的原子类
import 'uno.css';

// 引入 CSS Reset（本项目使用 Tailwind 风格的 reset 抹平浏览器差异）
import '@unocss/reset/tailwind.css';
```

---

## 4. 核心使用模式

### 4.1 className 方式（主要推荐）

最标准的原子类用法，与 Tailwind 完全兼容。适合大多数场景，便于复制粘贴和迁移：

```tsx
// 布局
<div className="flex justify-center my-8">...</div>

// 外观
<div className="rounded-[14px] bg-[#F3F5FF] shadow-sm">...</div>

// 交互与状态
<button className="hover:bg-blue-600 disabled:opacity-50 transition-all">...</button>

// 文本处理
<span className="line-clamp-2 text-[12px] font-medium text-gray-500">...</span>
```

### 4.2 Attributify 属性化模式（可选）

利用 `presetAttributify`，可以将类名按属性分组，减少 `className` 的冗长感：

```tsx
// 传统 className 写法
<div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">...</div>

// 属性化写法（代码更清爽，语义更强）
<div 
  flex="~ items-center justify-between" 
  p="4" 
  bg="white" 
  border="~ gray-200" 
  rounded="lg"
>
  ...
</div>

// 直接使用布尔属性
<div flex items-center justify-center w-full h-full>...</div>
```

---

## 5. 常用工具类指南

### 5.1 布局类 (Layout & Flexbox)

| 用法 | 示例类名 | 对应 CSS |
|------|---------|----------|
| **Flex 基础** | `flex`, `inline-flex` | `display: flex;` |
| **主轴对齐** | `justify-center`, `justify-between`, `justify-end` | `justify-content: ...;` |
| **交叉轴对齐**| `items-center`, `items-start`, `items-stretch` | `align-items: ...;` |
| **自适应分配**| `flex-1`, `flex-auto`, `flex-none` | `flex: 1 1 0%;` 等 |
| **间距 (Gap)** | `gap-4`, `gap-x-2`, `gap-y-4` | `gap: 1rem;` |
| **方向** | `flex-col`, `flex-row` | `flex-direction: ...;` |

### 5.2 尺寸与间距 (Sizing & Spacing)

支持任意值语法 `-[value]`，这在还原精确的设计稿时非常有用：

| 用法 | 示例类名 | 对应 CSS |
|------|---------|----------|
| **精确尺寸** | `w-[360px]`, `h-[130px]` | `width: 360px; height: 130px;` |
| **相对尺寸** | `w-full`, `h-screen`, `w-1/2` | `width: 100%; height: 100vh;` |
| **内外边距** | `px-4`, `py-8`, `mt-4`, `mb-[48px]` | `padding: ...; margin: ...;` |
| **极限尺寸** | `min-w-[280px]`, `max-h-[420px]` | `min-width: 280px;` |

### 5.3 外观与排版 (Typography & Styling)

| 用法 | 示例类名 | 对应 CSS |
|------|---------|----------|
| **文本截断** | `line-clamp-1`, `line-clamp-2` | 多行文本溢出省略 |
| **文本样式** | `text-[18px]`, `font-bold`, `leading-tight`| 字体大小、粗细、行高 |
| **圆角控制** | `rounded-md`, `rounded-[14px]`, `rounded-full`| `border-radius: ...;` |
| **定位** | `relative`, `absolute`, `top-0`, `left-4` | `position: ...;` |

---

## 6. 组件开发最佳实践

### 6.1 响应式设计

使用前缀处理不同屏幕尺寸：

```tsx
<div className="w-full md:w-1/2 lg:w-1/3 p-4 md:p-8">
  {/* 移动端默认宽度100%，平板50%，桌面33.3% */}
</div>
```

### 6.2 暗色模式 (Dark Mode)

基于标准的 `dark:` 变体实现暗黑模式切换，无需写繁琐的 JS 判断逻辑：

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
  <h2 className="text-brand-primary dark:text-blue-400">自适应主题标题</h2>
</div>
```
*(注：需在 HTML 根节点或父节点动态切换 `dark` 类名，或根据系统偏好自动响应。)*

### 6.3 抽象重复样式 (Shortcuts)

当一个组合在多处使用时（如按钮、卡片容器），尽量在 `uno.config.ts` 中提取 `shortcuts`，而不是在组件内复制长串类名：

```tsx
// ❌ 反例：每次都写一长串
<button className="px-6 py-2 rounded-full bg-[#4951EB] text-white font-medium hover:bg-blue-600 transition-colors">登录</button>

// ✅ 正确：在 config 配置 shortcuts: ['btn-primary', 'px-6 py-2...']
<button className="btn-primary">登录</button>
```

---

## 7. 常见场景示例

### 7.1 列表项 / 卡片组件

结合了精确尺寸、Flex 布局、文字截断和绝对定位的典型场景：

```tsx
<div className="rounded-[6px] flex items-start px-9 py-8 bg-[#F7F8FF] dark:bg-gray-800 flex-nowrap gap-[22px]">
  {/* 左侧封面 */}
  <img
    className="flex-none rounded-[4px] w-32 h-[130px] object-cover"
    src={imageUrl}
    alt="cover"
  />
  
  {/* 右侧内容 */}
  <div className="relative flex-auto h-[130px] flex flex-col justify-between">
    {/* 上半部分文本 */}
    <div>
      {/* 标题：单行截断 */}
      <h3 className="line-clamp-1 text-[18px] font-bold text-gray-800 dark:text-gray-200">
        最新AI系统教程：教你精准掌控世界！
      </h3>
      
      {/* 描述：双行截断 */}
      <p className="line-clamp-2 text-[12px] font-medium text-[#A6A6A6] mt-3">
        在前面我们学习了如果通过模型生成各风格的图像，今天开始我们将了解一种更高级的出图方式...
      </p>
    </div>
    
    {/* 价格：绝对定位到底部 */}
    <div className="absolute bottom-0 flex items-end">
      <span className="text-[18px] font-bold text-[#4951EB]">¥</span>
      <span className="text-[28px] font-bold text-[#4951EB] leading-none">200</span>
    </div>
  </div>
</div>
```

### 7.2 居中对齐容器（如登录/注册页）

```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
  <div className="w-full max-w-[400px] p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-6">
    <div className="text-center">
      <h1 className="text-[32px] font-normal text-gray-900 dark:text-gray-100">登录</h1>
      <p className="text-[16px] text-gray-500 mt-2">欢迎回来，请选择登录方式</p>
    </div>
    
    {/* 表单内容 */}
    <form className="flex flex-col gap-4">
      <input className="px-4 py-3 rounded-md border focus:ring-2 outline-none transition-all dark:bg-gray-700 dark:border-gray-600" placeholder="请输入账号" />
      <button className="w-full py-3 bg-[#4951EB] text-white rounded-full font-medium mt-4 hover:bg-blue-600 transition-colors">确认登录</button>
    </form>
  </div>
</div>
```

---

## 8. 实践规范总结

### ✅ 推荐做法 (DOs)

1. **充分利用任意值语法**：对于设计稿中非标准的尺寸（如 `w-[1176px]`, `text-[22px]`, `bg-[#F3F5FF]`），直接使用任意值语法，无需污染全局配置。
2. **使用语义化的结构类**：优先使用 `flex`、`grid`、`gap`、`items-center` 来构建布局结构，这比传统的 margin/padding hack 更健壮。
3. **拥抱 `dark:` 变体**：处理暗色模式时，直接在类名上加 `dark:`，保持逻辑层（JS）和表现层（CSS）的分离。
4. **统一命名约定**：如果使用自定义配置项，优先将其扩展在 `theme.colors` 中，保持与原子类语法的无缝结合（如 `text-brand-primary`）。

### ❌ 避免做法 (DON'Ts)

1. **避免在类名中使用复杂的 JS 动态字符串拼接**：
   - ❌ 错误：`className={`bg-${isActive ? 'blue' : 'gray'}-500`}` （UnoCSS 静态扫描无法识别拼接的类名）。
   - ✅ 正确：`className={isActive ? 'bg-blue-500' : 'bg-gray-500'}`。
2. **避免行内样式 (Inline Styles)**：除非涉及频繁变动的计算值（如鼠标坐标、进度条百分比），所有静态和响应式样式都应使用 UnoCSS 类名实现。
3. **不要滥用全局 CSS**：如果发现自己在写 `<style>` 或单独的 `.css` 文件来实现布局，先思考是否可以用 UnoCSS 的原子类组合实现。

---

*文档生成时间: 2026-03-02*