# Tauri v2 CLI 项目管理指南

本指南介绍如何使用 Tauri CLI 管理项目，包括创建、开发、构建和分发应用。

## 安装与初始化

### 前置要求

1. **Rust 工具链**: 必须安装 Rust (https://rustup.rs/)
2. **系统依赖**:
   - **Windows**: WebView2 运行时
   - **macOS**: Xcode Command Line Tools
   - **Linux**: webkit2gtk 等系统依赖

### 创建新项目

#### 方式 1: 使用 create-tauri-app (推荐)

快速创建预配置的项目模板。**注意：自动化或 Agent 运行时，请务必使用非交互式命令，因为交互式的 CLI 会导致自动化任务阻塞或失败。**

在自动化运行前，请向用户收集以下参数：
1. **项目名称** (`<PROJECTNAME>`)
2. **包管理器** (`--manager`: `pnpm`, `npm`, `yarn`, `cargo`, `bun` 等)
3. **UI 模板** (`--template`: `vanilla-ts`, `vue-ts`, `svelte-ts`, `react-ts`, `solid-ts` 等)
4. **唯一标识符** (`--identifier`: 例如 `com.example.app`)

**非交互式创建命令示例：**

```bash
# pnpm
pnpm create tauri-app@latest my-app --manager pnpm --template react-ts --identifier com.example.app -y

# npm
npm create tauri-app@latest my-app --manager npm --template vue-ts --identifier com.example.app -y

# yarn
yarn create tauri-app my-app --manager yarn --template svelte-ts --identifier com.example.app -y

# Cargo
cargo create-tauri-app my-app --manager cargo --template vanilla-ts --identifier com.example.app -y
```

支持的模板 (`--template`): `vanilla`, `vanilla-ts`, `vue`, `vue-ts`, `svelte`, `svelte-ts`, `react`, `react-ts`, `solid`, `solid-ts`, `yew`, `leptos`, `sycamore`, `angular`, `preact`, `preact-ts`, `blazor`, `dioxus`

## CLI 命令详解

### 开发命令

#### `tauri dev`
启动开发服务器并监视文件变更。

```bash
# 基础用法
npm run tauri dev

# 常用选项
--no-watch           # 禁用文件监视
--release            # 以 Release 模式运行
--target <TARGET>    # 指定目标平台
```

#### `tauri android dev`
在 Android 设备或模拟器上运行。

```bash
npm run tauri android dev

# 指定设备
npm run tauri android dev 'Pixel 7'

# 使用 Android Studio
npm run tauri android dev --open
```

#### `tauri ios dev`
在 iOS 设备或模拟器上运行。

```bash
npm run tauri ios dev

# 指定设备
npm run tauri ios dev 'iPhone 15'

# 使用 Xcode
npm run tauri ios dev --open

# iOS 真机调试 - 需配置 TAURI_DEV_HOST
export TAURI_DEV_HOST=true
npm run tauri ios dev --force-ip-prompt
```

### 构建命令

#### `tauri build`
构建桌面应用。

```bash
# 开发构建
npm run tauri build

# 仅构建，不打包
npm run tauri build -- --no-bundle

# Release 构建 (默认)
npm run tauri build -- --release

# Debug 构建
npm run tauri build -- --debug

# 指定目标
npm run tauri build -- --target x86_64-pc-windows-msvc
```

#### `tauri android build`
构建 Android APK/AAB。

```bash
# 调试 APK
npm run tauri android build

# Release APK
npm run tauri android build -- --release

# AAB (Google Play)
npm run tauri android build -- --aab
```

#### `tauri ios build`
构建 iOS 应用。

```bash
# 调试构建
npm run tauri ios build

# Release 构建
npm run tauri ios build -- --release

# 导出 IPA
npm run tauri ios build -- --export-method ad-hoc
```

### 打包命令

#### `tauri bundle`
单独打包应用（需在 build 后使用）。

```bash
# 打包指定格式
npm run tauri bundle -- --bundles app,dmg

# macOS App Store
npm run tauri bundle -- --bundles app --config src-tauri/tauri.appstore.conf.json

# 支持的 bundle 格式:
# - deb (Debian)
# - rpm (RPM)
# - appimage (AppImage)
# - dmg (macOS DMG)
# - app (macOS App Bundle)
# - msi (Windows MSI)
# - nsis (Windows NSIS)
# - appxbundle (Windows Store)
```

### 其他重要命令

#### `tauri icon`
生成应用图标。

```bash
# 从源图片生成所有平台图标
npx tauri icon /path/to/icon.png

# 指定输出目录
npx tauri icon icon.png --output ./src-tauri/icons
```

#### `tauri info`
显示环境和依赖信息。

```bash
npx tauri info
```

用于诊断环境问题和报告 bug。

#### `tauri add`
添加插件。

```bash
# 添加官方插件
npx tauri add fs
npx tauri add dialog
npx tauri add notification
npx tauri add shell
npx tauri add http
npx tauri add sql
npx tauri add store
npx tauri add stronghold

# 添加社区插件
npx tauri add tauri-plugin-xxx
```

## 配置管理

### tauri.conf.json 结构

```json
{
  "productName": "MyApp",
  "identifier": "com.example.myapp",
  "version": "0.1.0",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{
      "title": "My App",
      "width": 800,
      "height": 600
    }],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "appimage"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"],
    "resources": [],
    "externalBin": [],
    "copyright": "© 2024",
    "category": "DeveloperTool",
    "shortDescription": "My awesome app",
    "longDescription": "A longer description"
  }
}
```

### 多配置环境

使用 `--config` 指定不同的配置文件：

```bash
# 生产构建
npm run tauri build -- --config src-tauri/tauri.conf.json

# App Store 构建
npm run tauri build -- --config src-tauri/tauri.appstore.conf.json
```

### Cargo.toml 配置

```toml
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

## 常见工作流

### 1. 新项目完整流程

```bash
# 1. 创建项目 (非交互式)
pnpm create tauri-app@latest my-app --manager pnpm --template react-ts --identifier com.example.app -y
cd my-app

# 2. 安装依赖
npm install

# 3. 开发
npm run tauri dev

# 4. 构建生产版本
npm run tauri build
```

### 2. 前端框架集成

#### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  clearScreen: false,
  server: {
    host: host || false,
    port: 1420,
    strictPort: true,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
```

### 3. 调试工作流

```bash
# 桌面开发调试
npm run tauri dev

# 在浏览器中打开 DevTools
Ctrl + Shift + I (Windows/Linux)
Cmd + Option + I (macOS)

# iOS 调试 (Safari)
# 1. Safari > 设置 > 高级 > 启用"在菜单栏中显示开发菜单"
# 2. Develop > [设备名] > localhost

# Android 调试 (Chrome)
# 1. 启用设备开发者模式和 USB 调试
# 2. Chrome 访问 chrome://inspect
```

### 4. 多平台构建

```bash
# 使用 GitHub Actions 自动构建多平台
# 配置 .github/workflows/build.yml
```

## 故障排除

### 构建失败

1. **Rust 编译错误**:
   - 更新 Rust: `rustup update`
   - 清理缓存: `cargo clean`

2. **前端构建失败**:
   - 检查 `beforeBuildCommand` 配置
   - 验证前端资源路径

3. **权限问题** (macOS/Linux):
   - 检查文件权限
   - 使用 `sudo` 仅用于系统依赖安装

### 运行时问题

1. **WebView 无法启动**:
   - Windows: 确保 WebView2 已安装
   - Linux: 安装 webkit2gtk 依赖

2. **移动设备无法连接**:
   - iOS: 确保设备和电脑在同一网络
   - Android: 启用 USB 调试

### 版本兼容性

```bash
# 检查依赖版本
npm list @tauri-apps/cli @tauri-apps/api

# 更新到最新版本
npm update @tauri-apps/cli @tauri-apps/api

# 查看 Tauri CLI 版本
npx tauri --version
```

## 常用环境变量

| 变量 | 用途 |
|------|------|
| `TAURI_DEBUG` | 启用调试模式 |
| `TAURI_DEV_HOST` | 移动开发时指定主机 |
| `TAURI_PLATFORM` | 目标平台 (windows, macos, linux) |
| `TAURI_ARCH` | 目标架构 (x86_64, aarch64) |
| `CARGO_TARGET_DIR` | 自定义 Rust 构建目录 |

## 参考资源

- [Tauri CLI 文档](https://v2.tauri.app/reference/cli/)
- [配置文件参考](https://v2.tauri.app/reference/config/)
- [GitHub Actions 构建](https://github.com/tauri-apps/tauri-action)
