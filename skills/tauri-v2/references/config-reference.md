# Tauri v2 配置文件指南 (tauri.conf.json)

本文档提供 Tauri v2 配置文件 `tauri.conf.json` 的详细解析，用于指导项目级配置、应用行为、权限和打包选项。参考官方文档: [Tauri v2 Config Reference](https://v2.tauri.app/reference/config/)

## 1. 基础信息配置 (Basic Information)

定义应用程序的核心属性。

```json
{
  "productName": "MyApp",          // 应用程序的名称，用于显示给用户
  "version": "1.0.0",              // 应用程序版本号 (需符合 SemVer 格式)
  "identifier": "com.example.app"  // 应用程序的唯一标识符 (非常重要，用于区分不同应用)
}
```

## 2. 构建配置 (Build Configuration)

`build` 节点决定了 Tauri 如何与前端框架进行集成。

```json
"build": {
  "beforeDevCommand": "npm run dev",    // `tauri dev` 运行前执行的前端开发命令
  "beforeBuildCommand": "npm run build",// `tauri build` 运行前执行的前端构建命令
  "devUrl": "http://localhost:5173",    // 开发模式下 WebView 加载的 URL (通常是 Vite 或 Webpack dev server)
  "frontendDist": "../dist"             // 生产构建时 Tauri 需要打包的前端静态资源目录
}
```
**注意**: 在 Tauri v2 中，`distDir` 被重命名为 `frontendDist`，`devPath` 被重命名为 `devUrl`。

## 3. 应用配置 (App Configuration)

`app` 节点控制应用程序窗口行为、安全机制以及托盘图标等。

```json
"app": {
  "windows": [
    {
      "label": "main",                  // 窗口的唯一标识
      "title": "My Tauri v2 App",       // 窗口标题
      "width": 800,                     // 初始宽度
      "height": 600,                    // 初始高度
      "minWidth": 400,                  // 最小宽度
      "center": true,                   // 启动时是否在屏幕中央显示
      "resizable": true,                // 窗口是否可调整大小
      "fullscreen": false,              // 是否全屏启动
      "transparent": false,             // 背景是否透明
      "decorations": true               // 是否显示系统原生窗口边框和控制按钮
    }
  ],
  "security": {
    "csp": "default-src 'self'; img-src 'self' asset: https://asset.localhost" // 内容安全策略
  },
  "trayIcon": {
    "iconPath": "icons/icon.png",       // 系统托盘图标路径
    "tooltip": "My App Tooltip"         // 鼠标悬停在托盘图标上时显示的提示文本
  },
  "macOSPrivateApi": false              // 是否使用 macOS 的私有 API（App Store 上架要求为 false）
}
```

## 4. 打包配置 (Bundle Configuration)

`bundle` 节点决定了生成安装包和可执行文件的方式。

```json
"bundle": {
  "active": true,                       // 是否启用打包 (默认启用)
  "targets": "all",                     // 要构建的目标格式: "all" 或数组 (如 ["msi", "dmg", "appimage", "apk"])
  "icon": [                             // 应用程序图标的不同尺寸
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ],
  "resources": [                        // 随应用程序一起打包的额外文件或文件夹
    "assets/*",
    "database.sqlite"
  ],
  "externalBin": [                      // 需要被 Tauri 打包的外部二进制可执行文件路径（会自动加上目标平台后缀）
    "binaries/my-cli"
  ],
  "copyright": "© 2024 My Company",     // 版权信息
  "category": "DeveloperTool",          // 应用程序所属类别（主要影响 macOS）
  "shortDescription": "A cool app",     // 简短描述
  "longDescription": "This is a detailed description of the cool app.", // 详细描述
  "publisher": "My Company Inc.",       // 发布者信息
  
  // 平台特有配置
  "macOS": {
    "entitlements": "entitlements.mac.plist",
    "exceptionDomain": "localhost"
  },
  "windows": {
    "certificateThumbprint": "...",     // 代码签名证书指纹
    "timestampUrl": "http://timestamp.digicert.com", // 时间戳服务器
    "webviewInstallMode": "downloadBootstrapper" // WebView2 安装策略 ("downloadBootstrapper", "offlineInstaller", "fixedRuntime", "skip")
  },
  "linux": {
    "deb": {
      "depends": ["libwebkit2gtk-4.1-0"] // Linux 特有的依赖包
    }
  }
}
```

## 5. 插件配置 (Plugins Configuration)

`plugins` 节点用于配置 Tauri 官方或第三方插件的行为参数。

```json
"plugins": {
  "fs": {                               // tauri-plugin-fs 插件配置
    "scope": ["$APPDATA/my-app/**", "$DOWNLOAD/**"] // 允许访问的文件系统路径
  },
  "updater": {                          // 自动更新器配置
    "endpoints": [
      "https://releases.myapp.com/update/{{target}}/{{current_version}}"
    ],
    "pubkey": "...",                    // 用于验证更新包的 Ed25519 公钥
    "windows": {
      "installMode": "passive"          // 更新包安装模式
    }
  },
  "log": {                              // 日志插件配置
    "level": "info",
    "targets": ["stdout", "logDir"]
  }
}
```

## 6. 环境区分配置

Tauri 允许根据特定环境（开发或构建）重写配置：

```json
// tauri.conf.json
{
  // 基础配置
}

// tauri.linux.conf.json - 仅在 linux 构建时生效
// tauri.windows.conf.json - 仅在 windows 构建时生效
// tauri.macos.conf.json - 仅在 macos 构建时生效
```

你可以通过 `--config` 标志直接使用自定义配置文件：
```bash
npm run tauri build -- --config src-tauri/tauri.appstore.conf.json
```

## 7. 从 v1 迁移至 v2 的主要变化

- `tauri.conf.json` 不再具有顶层的 `tauri` 对象。
- `tauri > allowlist` (白名单) 系统已彻底移除。Tauri v2 引入了 **Capabilities** 和 **Permissions** 系统（存储在 `src-tauri/capabilities/` 目录中）。
- `build > devPath` 改为 `build > devUrl`。
- `build > distDir` 改为 `build > frontendDist`。
- 窗口创建配置转移至 `app > windows`。
- 安全策略配置移至 `app > security`。
- 插件配置现在必须在 `plugins > [plugin-name]` 下进行配置，而不是顶层配置。
