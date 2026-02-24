# shadcn/ui 集成

Refine 的 Headless 特性使其能够完美适配 shadcn/ui。你可以使用 Refine 提供的逻辑 Hooks，并将 Props 注入 shadcn 的 UI 组件中。

## 1. 安装与初始化

### 快速初始化 (推荐)
使用官方预设直接创建集成 shadcn/ui 的项目：
```bash
npm create refine-app@latest my-app -- --preset vite-shadcn
```

### 手动接入
1. 按照 [shadcn/ui 官网](https://ui.shadcn.com/) 完成基础设置。
2. 使用 Refine 提供的 Registry 添加适配组件：
```bash
# 添加视图组件 (List, Create, Edit, Show)
npx shadcn@latest add https://ui.refine.dev/r/views.json

# 添加自动保存指示器
npx shadcn@latest add https://ui.refine.dev/r/auto-save-indicator.json
```

## 2. 与 Refine Hooks 配合使用

### useTable 与 DataTable
`useTable` 处理逻辑，shadcn `DataTable` 处理渲染。

```tsx
import { useTable } from "@refinedev/core";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<any>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "title", header: "标题" },
];

export const PostList = () => {
  const { tableProps } = useTable();

  return <DataTable {...tableProps} columns={columns} />;
};
```

### useForm 与 Form 组件
将 `formProps` 绑定到 shadcn 组件：

```tsx
import { useForm } from "@refinedev/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const PostCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <form onSubmit={formProps.onSubmit}>
      <Input {...formProps.register("title")} placeholder="标题" />
      <Button {...saveButtonProps}>保存</Button>
    </form>
  );
};
```

## 3. Tailwind 配置
确保 `tailwind.config.js` 包含 shadcn 的 HSL 变量定义和动画插件：

```js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... 其他变量
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## 4. 优势
- **完全控制**: 你拥有 UI 组件的所有代码。
- **高性能**: 无需加载大型 UI 库。
- **现代化设计**: 默认具备极佳的视觉表现。
