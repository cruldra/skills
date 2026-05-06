# 认证提供者 (Auth Provider)

`authProvider` 用于处理应用的认证逻辑，如登录、登出、权限检查等。

## 实现 Auth Provider
你需要实现以下接口：

```ts
// src/providers/auth-provider.ts
import { AuthProvider } from "@refinedev/core";

export const authProvider: AuthProvider = {
    login: async ({ username, password }) => {
        // 实现登录逻辑
        if (username === "admin" && password === "password") {
            localStorage.setItem("auth", "true");
            return { success: true, redirectTo: "/" };
        }
        return { success: false, error: { message: "Login failed", name: "Invalid credentials" } };
    },
    logout: async () => {
        localStorage.removeItem("auth");
        return { success: true, redirectTo: "/login" };
    },
    check: async () => {
        const auth = localStorage.getItem("auth");
        if (auth) return { authenticated: true };
        return { authenticated: false, redirectTo: "/login" };
    },
    getPermissions: async () => null,
    getIdentity: async () => ({ id: 1, name: "John Doe" }),
    onError: async (error) => {
        if (error.status === 401 || error.status === 403) {
            return { logout: true };
        }
        return { logout: false };
    },
};
```

## 认证相关 Hook 与组件
- `useLogin`: 触发表单登录。
- `useLogout`: 触发登出。
- `useIsAuthenticated`: 检查当前认证状态。
- `<Authenticated />`: 用于保护路由或组件，仅允许认证用户访问。

### 示例: 保护页面
```tsx
import { Authenticated } from "@refinedev/core";

<Authenticated fallback={<Login />}>
  <Dashboard />
</Authenticated>
```
