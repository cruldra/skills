# 手动设置 Refine

如果你没有使用 `create-refine-app` 脚手架，或者需要更细粒度的控制，可以按照以下步骤手动配置。

## 1. 安装依赖
```bash
npm install @refinedev/core @refinedev/cli
```

## 2. 配置 package.json 脚本
将默认脚本替换为 `refine` 包装器，它会提供版本检查和 Refine 团队的通知：
```json
{
  "scripts": {
    "dev": "refine dev",
    "build": "refine build",
    "serve": "refine serve"
  }
}
```

## 3. 基础 App.tsx 配置
```tsx
import { Refine, WelcomePage } from "@refinedev/core";

function App() {
  return (
    <Refine>
      <WelcomePage />
    </Refine>
  );
}

export default App;
```

## 4. 路由配置 (推荐 React Router)
安装依赖：
```bash
npm install @refinedev/react-router-v6 react-router-dom
```
配置：
```tsx
import { Refine } from "@refinedev/core";
import routerBindings, { NavigateToResource } from "@refinedev/react-router-v6";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerBindings}
        // ...其他配置
      >
        <Routes>
           <Route element={<Outlet />}>
             <Route index element={<NavigateToResource resource="posts" />} />
             {/* 其他路由 */}
           </Route>
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}
```
