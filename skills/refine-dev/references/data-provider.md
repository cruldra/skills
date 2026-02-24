# 数据提供者 (Data Providers)

`dataProvider` 是 Refine 与 API 通信的接口。它将 API 请求抽象化，使得逻辑层无需关心后端具体实现。

## 实现 Data Provider
你需要实现以下接口中的全部或部分方法：

```ts
// src/providers/data-provider.ts
import { DataProvider } from "@refinedev/core";

export const dataProvider: DataProvider = {
    getList: async ({ resource, pagination, sorters, filters }) => {
        // 实现获取列表逻辑
    },
    getOne: async ({ resource, id }) => {
        // 实现获取单个记录逻辑
    },
    create: async ({ resource, variables }) => {
        // 实现创建记录逻辑
    },
    update: async ({ resource, id, variables }) => {
        // 实现更新记录逻辑
    },
    deleteOne: async ({ resource, id, variables }) => {
        // 实现删除记录逻辑
    },
    getApiUrl: () => "https://api.example.com",
    // ... 其他方法如 getMany, patch, custom 等
};
```

## 使用内置 Data Provider
Refine 官方提供了许多现成的数据提供者：
- **REST API**: `@refinedev/simple-rest`
- **GraphQL**: `@refinedev/hasura`, `@refinedev/strapi-graphql`
- **Backend as a Service**: `@refinedev/supabase`, `@refinedev/appwrite`, `@refinedev/firebase`

### 示例: 使用 Simple REST
```bash
npm install @refinedev/simple-rest
```
```tsx
import dataProvider from "@refinedev/simple-rest";

const API_URL = "https://api.fake-rest.refine.dev";

<Refine dataProvider={dataProvider(API_URL)} />
```

## 数据相关 Hook
- `useList`: 获取资源列表
- `useOne`: 获取单个资源
- `useTable`: 与 UI 库集成的高级 Table Hook
- `useForm`: 处理表单提交
