---
name: godot-desktop-app
description: Godot 4.x 桌面应用开发模板技能。当用户使用 Godot 引擎开发桌面应用（非游戏）时使用此技能，涵盖架构设计、GDScript 编码模式、UI 管理、状态持久化、模块化插件系统等。触发场景包括：(1) 新建 Godot 桌面应用项目 (2) 设计 Godot 应用架构 (3) 实现 GraphEdit/GraphNode 可视化编辑器 (4) GDScript 4.x 编码模式参考 (5) 桌面应用 UI/窗口/面板管理 (6) 项目状态持久化和配置管理。
---

# Godot 4.x 桌面应用开发模板

基于 Arrow（叙事设计工具）项目提炼的 Godot 4.x 桌面应用开发最佳实践。

## 核心架构概览

Godot 桌面应用采用 **中央事件调度 + 模块化核心 + 可扩展插件** 三层架构：

```
Main (根节点)
├── CentralMind      # 中央事件调度器，应用的"大脑"
├── Configuration     # 配置生命周期管理
├── MainUserInterface # UI/面板/主题管理
├── ProjectManagement # 项目 CRUD 和持久化
├── NodeTypes         # 模块化插件发现与加载
└── Editor            # 业务 UI（GraphEdit 编辑器等）
```

### 关键设计原则

1. **Signal 事件总线**: 所有模块通过 `request_mind` 信号 → `central_event_dispatcher` 路由通信
2. **内部类封装**: 核心模块用 `class_name Module` + `class Handler` 模式，外部类做声明，内部类做实现
3. **模块化插件目录**: 插件以文件夹形式自注册（每个文件夹 = 一个插件类型）
4. **配置生命周期**: DEFAULT → TEMPORARY → CONFIRMED 三阶段
5. **Deferred 线程安全**: UI 操作一律用 `call_deferred()` / `set_deferred()`

## 快速开始

### 新项目初始化

1. 创建 Godot 4.x 项目，渲染器选 `gl_compatibility`（桌面应用无需高级渲染）
2. 在 `project.godot` 中配置：
   - `application/run/low_processor_mode = true`（降低空闲 CPU 占用）
   - `display/window/subwindows/embed_subwindows = false`（允许独立子窗口）
   - 自定义 `application/config/custom_user_dir_name`
3. 按架构概览创建核心模块脚本
4. 在 `Main` 根节点的 `_ready()` 中初始化所有核心引用

### 根节点初始化模式

```gdscript
# main.gd
extends Node

@onready var Mind = $Mind
@onready var Configs = $Configs
@onready var UI = $UserInterface

var _MIND: CentralMind.Mind
var _CONFIGS: Configuration.ConfigHandler
var _UI: MainUserInterface.UiManager

func _ready() -> void:
    _CONFIGS = Configs.setup(self)
    _UI = UI.setup(self, _CONFIGS)
    _MIND = Mind.setup(self, _CONFIGS)
    # 解析 CLI 参数
    _handle_cli_args()
```

## 架构模式详解

详细的架构模式、数据结构和实现指南，见 [references/architecture.md](references/architecture.md)。

包含：
- 中央事件调度器完整实现
- 内部类封装模式
- 项目数据结构定义
- 状态管理（快照/历史/撤销重做）
- 配置生命周期管理
- 模块化插件系统
- 剪贴板系统
- UID 生成策略

## GDScript 4.x 编码模式

GDScript 4.x 特有的编码模式和最佳实践，见 [references/gdscript-patterns.md](references/gdscript-patterns.md)。

包含：
- 类型标注规范
- Signal 声明与连接模式
- @onready / @export 用法
- Deferred 调用模式
- match/case 分发
- 静态工具类
- 资源路径管理
- 错误处理模式

## 项目结构

标准的 Godot 桌面应用项目目录结构，见 [references/project-structure.md](references/project-structure.md)。

包含：
- 目录组织规范
- 场景/脚本对应关系
- 模块化插件目录结构
- 资源文件组织
- 配置文件格式

## UI/面板管理

### 面板分类系统

```gdscript
# 三种面板类型
enum PanelType { BLOCKING, STATEFUL, DEFAULT_OPEN }

# BLOCKING: 模态面板，打开时阻止其他操作（如项目选择器）
# STATEFUL: 可记忆开关状态的面板（如属性检查器）
# DEFAULT_OPEN: 默认打开的面板
```

### 窗口状态持久化

```gdscript
func _save_window_state() -> void:
    var config = {
        "window": {
            "screen": get_window().current_screen,
            "maximized": (get_window().mode == Window.MODE_MAXIMIZED),
            "size": [get_window().size.x, get_window().size.y],
            "position": [get_window().position.x, get_window().position.y]
        },
        "panels": _panel_visibility_map
    }
    _config_handler.save(config)

func _restore_window_state(config: Dictionary) -> void:
    var win = config.get("window", {})
    if win.has("screen"):
        get_window().current_screen = win.screen
    if win.get("maximized", false):
        get_window().mode = Window.MODE_MAXIMIZED
    else:
        get_window().size = Vector2i(win.size[0], win.size[1])
        get_window().position = Vector2i(win.position[0], win.position[1])
```

### 安全退出

```gdscript
func _notification(what: int) -> void:
    if what == NOTIFICATION_WM_CLOSE_REQUEST:
        _save_all_state()
        get_tree().quit()

func _save_all_state() -> void:
    _UI._save_window_state()
    _CONFIGS.confirm()  # TEMPORARY → CONFIRMED
    if _has_unsaved_changes:
        _auto_save_project()
```

## 项目持久化

### 文件格式选择

| 格式 | 适用场景 | 方法 |
|------|---------|------|
| JSON | 项目数据、可人读 | `JSON.stringify()` / `JSON.parse_string()` |
| Variant | 内部缓存、高性能 | `var_to_str()` / `str_to_var()` |
| ConfigFile | INI 风格配置 | `ConfigFile.save()` / `.load()` |

### 项目列表管理

```gdscript
# 项目列表文件结构 (project_list.json)
{
    "projects": [
        { "title": "项目A", "last_save": 1706000000, "path": "/path/to/project.json" }
    ]
}

# 单个项目文件结构
{
    "title": "我的项目",
    "entry": "scene_001",
    "meta": { "authors": [], "last_save": 0, "editor": "1.0.0" },
    "resources": {
        "scenes": {},
        "nodes": {},
        "variables": {},
        "characters": {}
    }
}
```

## GraphEdit 可视化编辑器

GraphEdit 是 Godot 桌面应用中实现节点图编辑器的核心控件。

### 基础设置

```gdscript
# grid_graph_edit.gd
extends GraphEdit

func _ready() -> void:
    # 连接信号
    connection_request.connect(_on_connection_request)
    disconnection_request.connect(_on_disconnection_request)
    node_selected.connect(_on_node_selected)
    node_deselected.connect(_on_node_deselected)
    delete_nodes_request.connect(_on_delete_nodes_request)

func _on_connection_request(from_node, from_port, to_node, to_port) -> void:
    connect_node(from_node, from_port, to_node, to_port)
    _notify_mind("node_connected", { ... })
```

### 自定义 GraphNode

```gdscript
# 每个节点类型继承 GraphNode
extends GraphNode

var _node_id: int
var _node_resource: Dictionary
var _node_map: Dictionary  # 引用中央数据

func _update_node(data: Dictionary) -> void:
    # 从数据更新 UI
    pass

func _read_node() -> Dictionary:
    # 从 UI 读取数据
    return {}
```

## 导出功能

### 可播放 HTML 导出

将项目数据嵌入 HTML 模板实现独立运行的导出：

```gdscript
func export_as_html(project: Dictionary, template_path: String, output_path: String) -> void:
    var template = FileAccess.get_file_as_string(template_path)
    var data_json = JSON.stringify(project)
    var html = template.replace("{{PROJECT_DATA}}", data_json)
    var file = FileAccess.open(output_path, FileAccess.WRITE)
    file.store_string(html)
```

### CSV/i18n 导出

遍历节点提取可翻译文本：

```gdscript
func export_csv(project: Dictionary) -> PackedStringArray:
    var lines: PackedStringArray = ["key,original,translation"]
    for node_id in project.resources.nodes:
        var node = project.resources.nodes[node_id]
        # 提取含文本的字段
        for field in _get_translatable_fields(node):
            lines.append("%s,%s," % [field.key, field.value])
    return lines
```

## 注意事项

1. **低处理器模式**: 桌面应用必须启用 `low_processor_mode`，否则空闲时 CPU 占用过高
2. **GL Compatibility 渲染器**: 桌面应用不需要 Vulkan，兼容性渲染器更稳定
3. **嵌入子窗口**: 设为 `false` 允许独立弹窗（文件对话框等）
4. **Deferred 调用**: 所有 UI 修改必须用 `call_deferred()` 或 `set_deferred()` 避免竞态
5. **@warning_ignore**: 合理使用 `@warning_ignore("unused_variable")` 等抑制已知警告
6. **自定义用户目录**: 通过 `custom_user_dir_name` 隔离应用数据，避免污染默认 Godot 目录
7. **CLI 参数**: 通过 `OS.get_cmdline_args()` 支持 `--sandbox`、`--config-dir` 等启动参数
