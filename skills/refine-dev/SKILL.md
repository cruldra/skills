---
name: refine-dev
description: 协助开发基于 Refine 框架的 React 应用。提供项目初始化、核心配置、数据提供者（Data Providers）、认证（Auth Provider）以及 UI 库集成的指导。适用于创建后台管理系统、仪表盘和数据密集型应用。
---

# Refine Dev Skill

Refine 是一个基于 React 的框架，用于快速构建数据密集型应用。它通过解耦业务逻辑与 UI 层，提供了极高的开发效率。

## 何时使用此技能
- **构建后台管理系统**: 当你需要快速搭建功能完善的 Admin 面板或仪表盘时。
- **数据密集型应用**: 应用涉及大量的表格、表单、CRUD 操作以及复杂的数据流管理。
- **追求 UI 自由度**: 默认推荐使用 **shadcn/ui**（基于 Tailwind CSS），适合需要高度自定义设计且不希望被大型 UI 框架绑定的项目。
- **多端/多框架支持**: 需要在 React 环境下保持业务逻辑一致，同时灵活切换 UI 表现层。

## 快速开始

### 推荐初始化方式
使用官方脚手架创建项目：
```bash
npm create refine-app@latest
```

### 基础项目结构 (Vite + React + TS)
1. 创建项目：`npm create vite@latest my-app -- --template react-ts`
2. 安装核心：`npm install @refinedev/core @refinedev/cli`
3. 配置脚本：参见 [setup.md](references/setup.md)

## 核心工作流

### 1. 配置 Refine 组件
在 `App.tsx` 中挂载 `<Refine />` 组件：
```tsx
import { Refine } from "@refinedev/core";

function App() {
  return (
    <Refine
      dataProvider={dataProvider}
      authProvider={authProvider}
      routerProvider={routerProvider}
      resources={[
        {
          name: "posts",
          list: "/posts",
          create: "/posts/create",
          edit: "/posts/edit/:id",
          show: "/posts/show/:id",
        },
      ]}
    >
      {/* 路由和页面 */}
    </Refine>
  );
}
```

### 2. 集成参考文档
根据你的开发需求，查看以下详细指南：
- **手动设置与脚本**: [setup.md](./references/setup.md)
- **数据提供者 (Data Providers)**: [data-provider.md](./references/data-provider.md)
- **认证提供者 (Auth Provider)**: [auth-provider.md](./references/auth-provider.md)
- **shadcn/ui 集成**: [shadcn-ui.md](references/shadcn-ui.md)

## 进阶主题
- **UI 库集成**: 推荐使用 **shadcn/ui** 作为默认 UI 库。同时也支持 Ant Design, Material UI, Mantine 等。
- **自定义 Hook**: 使用 `useTable`, `useForm`, `useList` 等高效处理数据。
- **国际化 (i18n)**: 内置对多种 i18n 库的支持。
