# 项目结构

## 标准目录布局

```
project_root/
├── project.godot              # Godot 项目配置
├── icon.svg                   # 应用图标
├── readme.md                  # 项目说明
│
├── scripts/                   # 核心脚本
│   ├── main.gd               # 根节点脚本（初始化、CLI、退出）
│   ├── settings.gd            # class_name Settings，全局常量
│   │
│   ├── core/                  # 核心模块（内部类模式）
│   │   ├── central_mind.gd    # CentralMind - 事件调度器
│   │   ├── configuration_handler.gd  # Configuration - 配置管理
│   │   ├── project_management.gd     # ProjectManagement - 项目 CRUD
│   │   ├── main_ui_management.gd     # MainUserInterface - UI/面板/主题
│   │   └── node_types_handler.gd     # NodeTypes - 插件发现与加载
│   │
│   ├── editor/                # 编辑器 UI 脚本
│   │   ├── editor.gd          # 编辑器主控制器
│   │   ├── grid_graph_edit.gd # GraphEdit 扩展
│   │   └── toolbar.gd         # 工具栏
│   │
│   └── shared/                # 共享工具
│       ├── shared_helpers.gd  # class_name Helpers，静态工具
│       └── embedded_data.gd   # class_name Embedded，内嵌数据模板
│
├── scenes/                    # 场景文件（.tscn）
│   ├── main.tscn              # 根场景
│   ├── editor/
│   │   ├── editor.tscn
│   │   └── grid_graph_edit.tscn
│   └── ui/
│       ├── project_picker.tscn
│       ├── settings_panel.tscn
│       └── about_dialog.tscn
│
├── nodes/                     # 模块化插件目录（自动发现）
│   ├── entry/
│   │   ├── node.tscn
│   │   ├── node.gd
│   │   ├── inspector.tscn
│   │   ├── inspector.gd
│   │   ├── icon.svg
│   │   └── translations/
│   ├── interaction/
│   │   └── ...
│   └── variable_update/
│       ├── node.tscn
│       ├── node.gd
│       ├── inspector.tscn
│       ├── inspector.gd
│       ├── sub_inspectors/    # 子检查器（复杂类型可选）
│       │   ├── update_inspector.tscn
│       │   └── update_inspector.gd
│       └── icon.svg
│
├── resources/                 # 静态资源
│   ├── fonts/
│   │   └── NotoSansSC.ttf    # 中文字体
│   ├── icons/
│   │   └── app_icon.svg
│   ├── themes/
│   │   ├── dark.tres
│   │   └── light.tres
│   └── templates/
│       └── playable.html      # HTML 导出模板
│
└── addons/                    # Godot 插件（可选）
    └── ...
```

## 目录职责

### scripts/

| 子目录 | 职责 | class_name |
|--------|------|-----------|
| `scripts/main.gd` | 根节点，初始化所有模块引用 | 无（直接 extends Node） |
| `scripts/settings.gd` | 全局常量、配置、类型定义 | `Settings` |
| `scripts/core/` | 核心业务模块，每个文件一个 `class_name` | 各自定义 |
| `scripts/editor/` | 编辑器相关 UI 逻辑 | 无（extends 具体控件） |
| `scripts/shared/` | 跨模块共享工具 | `Helpers`, `Embedded` |

### scenes/

场景文件与脚本 **不在同一目录**。场景在 `scenes/`，脚本在 `scripts/`：

```
scenes/editor/editor.tscn  →  脚本引用: scripts/editor/editor.gd
scenes/main.tscn           →  脚本引用: scripts/main.gd
```

### nodes/

模块化插件目录。每个子文件夹是一个自注册的插件类型：

**必需文件:**
- `node.tscn` + `node.gd` — GraphNode 场景和脚本
- `icon.svg` — 节点图标

**可选文件:**
- `inspector.tscn` + `inspector.gd` — 属性检查器
- `console.tscn` — 控制台输出面板
- `translations/` — i18n 翻译
- `sub_inspectors/` — 子检查器（复杂类型用）

**发现规则:** `NodeTypes` 模块在启动时扫描 `res://nodes/` 下所有子目录。

---

## project.godot 关键配置

```ini
[application]
config/name="MyDesktopApp"
run/main_scene="res://scenes/main.tscn"
config/custom_user_dir_name="my-app"    # 隔离用户数据

[display]
window/size/viewport_width=1200
window/size/viewport_height=800
window/subwindows/embed_subwindows=false  # 独立子窗口

[application]
run/low_processor_mode=true              # 省电模式

[rendering]
renderer/rendering_method="gl_compatibility"  # 无需 Vulkan

[gui]
theme/default_font_multichannel_signed_distance_field=true

[input]
# 自定义快捷键
save={
    "events": [Object(InputEventKey,"ctrl_pressed":true,"keycode":83)]
}
undo={
    "events": [Object(InputEventKey,"ctrl_pressed":true,"keycode":90)]
}
redo={
    "events": [Object(InputEventKey,"ctrl_pressed":true,"shift_pressed":true,"keycode":90)]
}
```

---

## 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| GDScript | snake_case | `central_mind.gd` |
| 场景 | snake_case | `grid_graph_edit.tscn` |
| 资源 | snake_case | `dark_theme.tres` |
| 目录 | snake_case | `node_types/` |
| 插件类型目录 | snake_case | `variable_update/` |
| class_name | PascalCase | `CentralMind`, `Settings` |
| 常量 | UPPER_SNAKE_CASE | `VERSION`, `MAX_HISTORY` |
| 私有变量 | _snake_case | `_node_id`, `_PROJECT` |
| 信号 | snake_case | `request_mind`, `node_selected` |

---

## 场景树结构

```
Main (Node)                           # scripts/main.gd
├── Mind (Node)                       # scripts/core/central_mind.gd
├── Configs (Node)                    # scripts/core/configuration_handler.gd
├── Projects (Node)                   # scripts/core/project_management.gd
├── NodeTypes (Node)                  # scripts/core/node_types_handler.gd
├── UserInterface (Control)           # scripts/core/main_ui_management.gd
│   ├── TopMenu (MenuBar)
│   ├── Toolbar (HBoxContainer)
│   ├── MainSplit (HSplitContainer)
│   │   ├── LeftPanel (VBoxContainer)
│   │   │   └── SceneList (ItemList)
│   │   ├── CenterPanel (VBoxContainer)
│   │   │   └── Editor (Control)      # scripts/editor/editor.gd
│   │   │       └── GridGraphEdit     # scripts/editor/grid_graph_edit.gd
│   │   └── RightPanel (VBoxContainer)
│   │       └── Inspector (ScrollContainer)
│   └── StatusBar (HBoxContainer)
├── Dialogs (Node)                    # 弹窗容器
│   ├── ProjectPicker (Window)
│   ├── SettingsDialog (Window)
│   └── AboutDialog (AcceptDialog)
└── Popups (Node)                     # 上下文菜单等
    └── NodeContextMenu (PopupMenu)
```

---

## 新增模块清单

添加新的核心模块时：

1. **创建脚本**: `scripts/core/my_module.gd`
2. **定义 class_name**: `class_name MyModule`
3. **实现内部类**: `class Handler` with `setup()` 方法
4. **添加场景节点**: 在 `main.tscn` 中添加 Node
5. **关联脚本**: 将脚本附加到新节点
6. **注册到 Main**: 在 `main.gd` 的 `_ready()` 中调用 `setup()`
7. **连接信号**: 如需与 CentralMind 通信，声明 `request_mind` 信号

添加新的插件类型时：

1. **创建目录**: `nodes/my_type/`
2. **创建 node.tscn**: 继承 GraphNode 的场景
3. **创建 node.gd**: 实现 `_update_node()` 和 `_read_node()`
4. **创建 icon.svg**: 节点图标
5. **（可选）创建 inspector**: `inspector.tscn` + `inspector.gd`
6. **在 Settings 中注册**: 添加到 `NODE_TYPES_CONFIG` 常量
7. **自动发现**: `NodeTypes` 模块会在启动时自动扫描并注册
