# Tauri v2 最佳实践

本文档介绍 Tauri v2 项目的架构模式、安全实践、性能优化和部署策略。

## 项目架构

### 目录结构规范

```
my-tauri-app/
├── src/                     # 前端代码
│   ├── components/          # UI 组件
│   ├── pages/               # 页面
│   ├── lib/                 # 工具函数
│   └── App.tsx              # 主应用
├── src-tauri/               # Tauri 后端代码
│   ├── src/
│   │   ├── main.rs          # 入口点
│   │   ├── lib.rs           # 库代码 (可选)
│   │   ├── commands.rs      # Tauri 命令
│   │   ├── state.rs         # 状态管理
│   │   ├── error.rs         # 错误处理
│   │   └── utils.rs         # 工具函数
│   ├── capabilities/        # 权限配置
│   │   └── default.json
│   ├── Cargo.toml
│   └── tauri.conf.json
├── tests/                   # 集成测试
└── docs/                    # 文档
```

### 模块化架构

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod error;
mod state;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::read_file,
            commands::write_file,
        ])
        .setup(|app| {
            // 初始化应用状态
            app.manage(state::AppState::default());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 命令设计模式

### 命令函数规范

```rust
// src-tauri/src/commands.rs
use tauri::State;
use serde::{Deserialize, Serialize};
use crate::{error::AppError, state::AppState};

#[derive(Serialize, Deserialize)]
pub struct GreetRequest {
    name: String,
}

#[derive(Serialize)]
pub struct GreetResponse {
    message: String,
    timestamp: i64,
}

#[tauri::command]
pub async fn greet(
    request: GreetRequest,
    state: State<'_, AppState>,
) -> Result<GreetResponse, AppError> {
    let message = format!("Hello, {}! You've been greeted from Rust.", request.name);
    
    Ok(GreetResponse {
        message,
        timestamp: chrono::Utc::now().timestamp(),
    })
}
```

### 前端调用模式

```typescript
// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';

interface GreetRequest {
  name: string;
}

interface GreetResponse {
  message: string;
  timestamp: number;
}

export async function greet(name: string): Promise<GreetResponse> {
  return invoke<GreetResponse>('greet', { name });
}

// 错误处理封装
export async function invokeWithErrorHandling<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    console.error(`Command ${cmd} failed:`, error);
    throw new Error(`操作失败: ${error}`);
  }
}
```

### 批量命令与事件

```rust
// 使用 channels 进行流式数据传输
#[tauri::command]
pub async fn stream_data(
    window: tauri::Window,
) -> Result<String, AppError> {
    let id = uuid::Uuid::new_v4().to_string();
    
    tauri::async_runtime::spawn(async move {
        for i in 0..100 {
            window.emit(
                "stream-progress",
                json!({ "id": id, "progress": i, "total": 100 }),
            ).ok();
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    });
    
    Ok(id)
}
```

```typescript
// 前端监听事件
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('stream-progress', (event) => {
  const { id, progress, total } = event.payload;
  updateProgress(id, progress, total);
});

// 清理监听器
onUnmounted(() => {
  unlisten();
});
```

## 状态管理

### 应用状态

```rust
// src-tauri/src/state.rs
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub cache: Arc<Mutex<Cache>>,
    pub db_pool: Option<sqlx::Pool<sqlx::Sqlite>>,
}

#[derive(Default)]
pub struct AppConfig {
    pub theme: String,
    pub language: String,
}

#[derive(Default)]
pub struct Cache {
    pub data: HashMap<String, String>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            config: Mutex::new(AppConfig::default()),
            cache: Arc::new(Mutex::new(Cache::default())),
            db_pool: None,
        }
    }
}

// 在命令中使用状态
#[tauri::command]
pub fn get_config(state: State<'_, AppState>) -> Result<AppConfig, AppError> {
    let config = state.config.lock().map_err(|_| AppError::LockError)?;
    Ok(AppConfig {
        theme: config.theme.clone(),
        language: config.language.clone(),
    })
}
```

### 持久化存储

```rust
// 使用 tauri-plugin-store
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub async fn save_settings(
    app: AppHandle,
    settings: Settings,
) -> Result<(), AppError> {
    let store = app.store("settings.json")?;
    store.set("theme", json!(settings.theme));
    store.set("language", json!(settings.language));
    store.save()?;
    Ok(())
}

#[tauri::command]
pub async fn load_settings(app: AppHandle) -> Result<Settings, AppError> {
    let store = app.store("settings.json")?;
    
    Ok(Settings {
        theme: store.get("theme").and_then(|v| v.as_str().map(String::from)),
        language: store.get("language").and_then(|v| v.as_str().map(String::from)),
    })
}
```

## 安全实践

### 最小权限原则

```json
// src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "默认能力配置",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    {
      "identifier": "fs:allow-read",
      "allow": [{"path": "$APPDATA/*"}]
    },
    {
      "identifier": "fs:allow-write",
      "allow": [{"path": "$APPDATA/*"}]
    },
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

### 输入验证

```rust
// src-tauri/src/validation.rs
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct FileOperationRequest {
    #[validate(length(min = 1, max = 260, message = "路径长度必须在 1-260 字符之间"))]
    pub path: String,
    
    #[validate(length(max = 10000, message = "内容过大"))]
    pub content: Option<String>,
}

#[tauri::command]
pub fn validate_and_read_file(
    request: FileOperationRequest,
) -> Result<String, AppError> {
    request.validate()?;
    
    // 路径安全检查 - 防止目录遍历
    let path = sanitize_path(&request.path)?;
    
    // 检查是否在允许目录内
    if !is_path_allowed(&path) {
        return Err(AppError::PermissionDenied);
    }
    
    std::fs::read_to_string(&path).map_err(|e| AppError::IoError(e.to_string()))
}
```

### CSP 配置

```json
// tauri.conf.json
{
  "app": {
    "security": {
      "csp": {
        "default-src": "'self'",
        "connect-src": "'self' https: ws:",
        "img-src": "'self' data: https:",
        "script-src": "'self'",
        "style-src": "'self' 'unsafe-inline'"
      },
      "dangerousDisableAssetCspModification": false
    }
  }
}
```

### 命令白名单

```rust
// 显式列出所有可用的命令
pub fn get_allowed_commands() -> Vec<&'static str> {
    vec![
        "greet",
        "read_file",
        "write_file",
        "get_config",
        "save_settings",
    ]
}
```

## 错误处理

### 自定义错误类型

```rust
// src-tauri/src/error.rs
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum AppError {
    #[error("IO 错误: {0}")]
    IoError(String),
    
    #[error("权限被拒绝")]
    PermissionDenied,
    
    #[error("无效的输入: {0}")]
    ValidationError(String),
    
    #[error("资源未找到")]
    NotFound,
    
    #[error("内部错误: {0}")]
    InternalError(String),
    
    #[error("锁获取失败")]
    LockError,
}

// 自动转换错误
impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::IoError(e.to_string())
    }
}

impl From<validator::ValidationErrors> for AppError {
    fn from(e: validator::ValidationErrors) -> Self {
        AppError::ValidationError(e.to_string())
    }
}

impl From<tauri_plugin_store::Error> for AppError {
    fn from(e: tauri_plugin_store::Error) -> Self {
        AppError::InternalError(e.to_string())
    }
}
```

### 全局错误处理

```rust
// main.rs
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![...])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // 保存状态
            }
        })
        .run(tauri::generate_context!())
        .expect("应用启动失败");
}
```

## 性能优化

### 前端优化

```typescript
// 1. 按需加载 Tauri API
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

// 2. 懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 3. 防抖/节流命令调用
import { debounce } from 'lodash-es';

const debouncedSave = debounce(async (content: string) => {
  await invoke('save_content', { content });
}, 500);

// 4. 虚拟列表处理大量数据
import { VirtualList } from 'react-virtualized';
```

### 后端优化

```rust
// 1. 使用连接池
use sqlx::sqlite::SqlitePoolOptions;

let pool = SqlitePoolOptions::new()
    .max_connections(5)
    .connect("sqlite:app.db")
    .await?;

// 2. 异步文件操作
use tokio::fs;

let content = fs::read_to_string(path).await?;

// 3. 缓存策略
use cached::proc_macro::cached;

#[cached(size = 100, time = 60)]
async fn expensive_operation(input: String) -> Result<String, AppError> {
    // 耗时操作
}

// 4. 资源清理
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct ResourceManager {
    resources: Arc<RwLock<HashMap<String, Resource>>>,
}

impl Drop for ResourceManager {
    fn drop(&mut self) {
        // 清理资源
    }
}
```

### 构建优化

```toml
# Cargo.toml - Release 优化
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"     # 或 "z" 最小体积
strip = true

# 增量编译 (开发)
[profile.dev]
opt-level = 0
debug = true
```

## 测试策略

### 单元测试

```rust
// src-tauri/src/commands.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet() {
        let request = GreetRequest {
            name: "World".to_string(),
        };
        // 测试逻辑
    }
}
```

### 集成测试

```rust
// tests/integration_test.rs
use tauri::test::MockBuilder;

#[test]
fn test_app_startup() {
    let app = MockBuilder::new()
        .invoke_handler(tauri::generate_handler![greet])
        .build();
    
    let response = app.invoke("greet", &GreetRequest {
        name: "Test".to_string(),
    });
    
    assert!(response.is_ok());
}
```

### 前端测试

```typescript
// src/lib/tauri.test.ts
import { greet } from './tauri';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('tauri commands', () => {
  it('should call greet command', async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({ message: 'Hello!' });
    
    const result = await greet('World');
    
    expect(mockInvoke).toHaveBeenCalledWith('greet', { name: 'World' });
    expect(result.message).toBe('Hello!');
  });
});
```

## 日志与监控

### 日志配置

```rust
// main.rs
use tauri_plugin_log::{Target, TargetKind};

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .level(log::LevelFilter::Info)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```typescript
// 前端日志
import { trace, info, error, attachConsole } from '@tauri-apps/plugin-log';

await attachConsole();

info('应用启动');
error('发生错误: {message}', { message: errorMessage });
```

## 部署与分发

### CI/CD 配置

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-20.04, windows-latest]
    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Setup Rust
        uses: dtolnay/rust-action@stable
        
      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-20.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev
          
      - name: Install frontend dependencies
        run: npm install
        
      - name: Build Tauri
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'App ${{ github.ref_name }}'
          releaseBody: 'See the assets to download this version.'
          releaseDraft: true
          prerelease: false
```

### 自动更新

```rust
// main.rs - 添加更新插件
.plugin(tauri_plugin_updater::Builder::new().build())

// 检查更新命令
#[tauri::command]
pub async fn check_update(
    app: AppHandle,
) -> Result<Option<Update>, AppError> {
    let updater = app.updater()?;
    let update = updater.check().await?;
    Ok(update)
}
```

```typescript
// 前端更新逻辑
import { check } from '@tauri-apps/plugin-updater';
import { ask, message } from '@tauri-apps/plugin-dialog';

async function checkForUpdates() {
  const update = await check();
  
  if (update) {
    const yes = await ask(
      `发现新版本 ${update.version}，是否更新?`,
      { title: '应用更新', kind: 'info' }
    );
    
    if (yes) {
      await update.downloadAndInstall();
    }
  }
}
```

## 平台特定处理

### 条件编译

```rust
// 平台特定代码
#[cfg(target_os = "macos")]
pub fn setup_macos(app: &mut tauri::App) {
    app.set_activation_policy(tauri::ActivationPolicy::Regular);
}

#[cfg(target_os = "windows")]
pub fn setup_windows(app: &mut tauri::App) {
    // Windows 特定设置
}

#[cfg(target_os = "linux")]
pub fn setup_linux(app: &mut tauri::App) {
    // Linux 特定设置
}
```

### 平台特定资源

```json
// tauri.conf.json
{
  "bundle": {
    "resources": {
      "resources/platform/macos/*": "",
      "resources/platform/windows/*": "",
      "resources/platform/linux/*": ""
    },
    "macOS": {
      "entitlements": "Entitlements.plist",
      "exceptionDomain": "",
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": null
    },
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    }
  }
}
```

## 参考资源

- [Tauri 安全最佳实践](https://v2.tauri.app/concept/security/)
- [Tauri 架构文档](https://v2.tauri.app/concept/architecture/)
- [Tauri 插件开发](https://v2.tauri.app/develop/plugins/)
- [Rust 异步编程](https://rust-lang.github.io/async-book/)
