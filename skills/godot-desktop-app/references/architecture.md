# 架构模式详解

## 目录

1. [中央事件调度器](#中央事件调度器)
2. [内部类封装模式](#内部类封装模式)
3. [项目数据结构](#项目数据结构)
4. [状态管理](#状态管理)
5. [配置生命周期](#配置生命周期)
6. [模块化插件系统](#模块化插件系统)
7. [剪贴板系统](#剪贴板系统)
8. [UID 生成策略](#uid-生成策略)

---

## 中央事件调度器

应用的核心通信机制。所有模块通过信号发射事件，由中央调度器路由到对应处理方法。

### 信号定义

```gdscript
# 所有需要与中央通信的模块都声明此信号
signal request_mind(request: StringName, args: Dictionary)
```

### 调度器实现

```gdscript
# central_mind.gd
class_name CentralMind
extends Node

signal request_mind(request: StringName, args: Dictionary)

class Mind:
    var _MAIN: Node
    var _PROJECT: Dictionary  # 当前项目数据（内存中）
    var _SNAPSHOTS: Array = []
    var _HISTORY: Array = []
    var _HISTORY_INDEX: int = -1

    func setup(main: Node, config: Configuration.ConfigHandler) -> Mind:
        _MAIN = main
        # 连接所有模块的 request_mind 信号
        _connect_all_request_minds(main)
        return self

    func _connect_all_request_minds(node: Node) -> void:
        # 递归连接所有子节点的 request_mind 信号
        for child in node.get_children():
            if child.has_signal("request_mind"):
                child.request_mind.connect(central_event_dispatcher)
            _connect_all_request_minds(child)

    func central_event_dispatcher(request: StringName, args: Dictionary) -> void:
        match request:
            # 项目操作
            &"create_project":
                _create_project(args)
            &"open_project":
                _open_project(args)
            &"save_project":
                _save_project()
            # 节点操作
            &"insert_node":
                _insert_node(args)
            &"remove_node":
                _remove_node(args)
            &"update_node_data":
                _update_node_data(args)
            # 场景操作
            &"create_scene":
                _create_scene(args)
            &"switch_scene":
                _switch_scene(args)
            # 历史操作
            &"undo":
                _undo()
            &"redo":
                _redo()
            _:
                push_warning("Unknown mind request: %s" % request)
```

### 模块如何发送事件

```gdscript
# editor.gd
extends Control

signal request_mind(request: StringName, args: Dictionary)

func _on_save_button_pressed() -> void:
    request_mind.emit(&"save_project", {})

func _on_node_created(type: String, position: Vector2) -> void:
    request_mind.emit(&"insert_node", {
        "type": type,
        "offset": { "x": position.x, "y": position.y }
    })
```

### 设计要点

- 使用 `StringName`（`&"..."` 语法）作为事件名，比 String 比较更快
- `match/case` 提供类型安全的事件路由
- 单向数据流：UI → signal → dispatcher → 修改数据 → 通知 UI 更新
- 未知事件用 `push_warning` 而非崩溃

---

## 内部类封装模式

核心模块统一使用 **外部类声明 class_name + 内部类实现逻辑** 的模式：

### 模式结构

```gdscript
# module_name.gd
class_name ModuleName  # 外部类：提供全局类名，附加到场景节点
extends Node

signal request_mind(request: StringName, args: Dictionary)

# 内部类：实际业务逻辑
class Handler:
    var _MAIN: Node
    var _internal_state: Dictionary = {}

    # setup 工厂方法（不是构造器）
    func setup(main: Node, ...) -> Handler:
        _MAIN = main
        _initialize()
        return self

    func _initialize() -> void:
        pass

    # 公开方法
    func do_something(args: Dictionary) -> void:
        pass
```

### 实际应用示例

```gdscript
# configuration_handler.gd
class_name Configuration
extends Node

class ConfigHandler:
    var _MAIN: Node
    var _DEFAULT: Dictionary = {}     # 默认值
    var _TEMPORARY: Dictionary = {}   # 运行时修改
    var _CONFIRMED: Dictionary = {}   # 已保存到磁盘

    func setup(main: Node) -> ConfigHandler:
        _MAIN = main
        _load_config_file()
        return self

    func get_value(key: String):
        if _TEMPORARY.has(key):
            return _TEMPORARY[key]
        if _CONFIRMED.has(key):
            return _CONFIRMED[key]
        return _DEFAULT.get(key)

    func set_temporary(key: String, value) -> void:
        _TEMPORARY[key] = value

    func confirm() -> void:
        _CONFIRMED.merge(_TEMPORARY, true)
        _TEMPORARY.clear()
        _save_config_file()
```

### 在 Main 中使用

```gdscript
# main.gd
var _CONFIGS: Configuration.ConfigHandler
var _MIND: CentralMind.Mind

func _ready() -> void:
    _CONFIGS = $Configs.setup(self)      # 返回内部类实例
    _MIND = $Mind.setup(self, _CONFIGS)  # 注入依赖
```

### 为什么用这个模式

| 优势 | 说明 |
|------|------|
| 全局类名 | `class_name` 使类型可在编辑器/代码中全局引用 |
| 封装实现 | 内部类对外不可直接实例化，必须通过 `setup()` |
| 依赖注入 | `setup()` 接收依赖，支持组合式初始化 |
| 节点绑定 | 外部类继承 Node 可附加到场景树，内部类是纯逻辑 |

---

## 项目数据结构

### 完整项目 Schema

```gdscript
var _PROJECT: Dictionary = {
    "title": "",            # 项目标题
    "entry": "",            # 入口场景 UID
    "meta": {
        "chapter": "",      # 章节标识
        "authors": [],      # 作者列表
        "last_save": -1,    # Unix 时间戳
        "editor": "",       # 编辑器版本
        "offline": false,   # 离线模式
        "remote": false     # 远程项目
    },
    "resources": {
        "scenes": {},       # { uid: SceneData }
        "nodes": {},        # { uid: NodeData }
        "variables": {},    # { uid: VariableData }
        "characters": {}    # { uid: CharacterData }
    }
}
```

### 场景数据

```gdscript
# SceneData
{
    "name": "主场景",
    "entry": node_uid,      # 入口节点
    "map": {                # 节点布局信息
        node_uid: {
            "offset": { "x": 0.0, "y": 0.0 },
            "io": { "inputs": [], "outputs": [] },  # 连接信息
            "skip": false
        }
    },
    "macro": false          # 是否为宏场景
}
```

### 节点数据

```gdscript
# NodeData
{
    "type": "interaction",  # 节点类型标识
    "name": "对话节点",
    "data": {               # 类型特有数据，由节点类型定义
        # ... 各类型自定义字段
    }
}
```

### 变量数据

```gdscript
# VariableData
{
    "name": "玩家血量",
    "type": 0,              # 0=String, 1=Integer, 2=Float, 3=Boolean
    "value": "100",         # 初始值（始终为字符串存储）
}
```

---

## 状态管理

### 快照系统

快照记录项目的完整状态，用于对比和恢复：

```gdscript
func _take_snapshot() -> void:
    var snapshot = _PROJECT.duplicate(true)  # deep copy
    _SNAPSHOTS.append(snapshot)

func _restore_snapshot(index: int) -> void:
    if index >= 0 and index < _SNAPSHOTS.size():
        _PROJECT = _SNAPSHOTS[index].duplicate(true)
        _notify_all_update()
```

### 历史记录（撤销/重做）

```gdscript
var _HISTORY: Array = []
var _HISTORY_INDEX: int = -1
var _HISTORY_SIZE_LIMIT: int = 100

func _record_history() -> void:
    # 截断当前位置之后的历史
    if _HISTORY_INDEX < _HISTORY.size() - 1:
        _HISTORY.resize(_HISTORY_INDEX + 1)
    # 添加当前状态
    _HISTORY.append(_PROJECT.duplicate(true))
    _HISTORY_INDEX = _HISTORY.size() - 1
    # 限制大小
    if _HISTORY.size() > _HISTORY_SIZE_LIMIT:
        _HISTORY.pop_front()
        _HISTORY_INDEX -= 1

func _undo() -> void:
    if _HISTORY_INDEX > 0:
        _HISTORY_INDEX -= 1
        _PROJECT = _HISTORY[_HISTORY_INDEX].duplicate(true)
        _notify_all_update()

func _redo() -> void:
    if _HISTORY_INDEX < _HISTORY.size() - 1:
        _HISTORY_INDEX += 1
        _PROJECT = _HISTORY[_HISTORY_INDEX].duplicate(true)
        _notify_all_update()
```

### 数据修改原则

- **始终通过 CentralMind 修改 `_PROJECT`**，不允许模块直接修改
- 每次修改后调用 `_record_history()` 记录状态
- 使用 `duplicate(true)` 深拷贝避免引用污染
- 修改后发信号通知 UI 刷新

---

## 配置生命周期

三阶段配置管理：DEFAULT → TEMPORARY → CONFIRMED

```
┌─────────────────────────────────────────────────────────┐
│ DEFAULT (代码硬编码)                                      │
│   ↓ 覆盖                                                │
│ CONFIRMED (磁盘文件加载)                                  │
│   ↓ 覆盖                                                │
│ TEMPORARY (运行时修改，未保存)                              │
└─────────────────────────────────────────────────────────┘

读取顺序: TEMPORARY → CONFIRMED → DEFAULT
保存时: TEMPORARY 合并到 CONFIRMED → 写入磁盘 → 清空 TEMPORARY
```

### 配置文件格式

```
# .arrow.config (INI 格式，使用 Godot ConfigFile)
[app]
appearance_theme = "dark"
language = "en"

[window]
screen = 0
maximized = false
size = [1200, 800]
position = [100, 100]

[panels]
inspector = true
console = false

[editor]
history_size = 100
```

### 快捷偏好

对高频配置提供直接 getter/setter：

```gdscript
func get_theme() -> String:
    return get_value("appearance_theme")

func set_theme(theme: String) -> void:
    set_temporary("appearance_theme", theme)
    _apply_theme(theme)
```

---

## 模块化插件系统

以"节点类型"为例，每个插件是一个自包含的文件夹：

### 目录结构

```
nodes/
├── entry/
│   ├── node.tscn         # GraphNode 场景
│   ├── node.gd           # 节点脚本
│   ├── inspector.tscn    # 属性面板场景
│   ├── inspector.gd      # 属性面板脚本
│   ├── console.tscn      # 控制台输出场景（可选）
│   ├── icon.svg          # 节点图标
│   └── translations/     # i18n 翻译文件
│       ├── en.translation
│       └── zh.translation
├── interaction/
│   ├── node.tscn
│   ├── node.gd
│   └── ...
└── variable_update/
    ├── sub_inspectors/    # 子检查器（可选，复杂类型用）
    │   ├── inspector_a.tscn
    │   └── inspector_a.gd
    └── ...
```

### 插件发现与加载

```gdscript
# node_types_handler.gd
class_name NodeTypes
extends Node

class NodeTypesHandler:
    var _NODE_TYPES_DIR := "res://nodes/"
    var _registered_types: Dictionary = {}

    func setup(main: Node) -> NodeTypesHandler:
        _discover_node_types()
        return self

    func _discover_node_types() -> void:
        var dir = DirAccess.open(_NODE_TYPES_DIR)
        if dir == null:
            push_error("Cannot open node types directory")
            return
        dir.list_dir_begin()
        var folder_name = dir.get_next()
        while folder_name != "":
            if dir.current_is_dir() and not folder_name.begins_with("."):
                _register_type(folder_name)
            folder_name = dir.get_next()

    func _register_type(type_name: String) -> void:
        var base_path = _NODE_TYPES_DIR + type_name + "/"
        var type_info = {
            "name": type_name,
            "node_scene": load(base_path + "node.tscn") if ResourceLoader.exists(base_path + "node.tscn") else null,
            "inspector_scene": load(base_path + "inspector.tscn") if ResourceLoader.exists(base_path + "inspector.tscn") else null,
            "console_scene": load(base_path + "console.tscn") if ResourceLoader.exists(base_path + "console.tscn") else null,
            "icon": load(base_path + "icon.svg") if ResourceLoader.exists(base_path + "icon.svg") else null,
        }
        _registered_types[type_name] = type_info

    func create_node_instance(type_name: String) -> GraphNode:
        if not _registered_types.has(type_name):
            push_error("Unknown node type: %s" % type_name)
            return null
        var scene = _registered_types[type_name].node_scene
        return scene.instantiate() if scene else null
```

### 插件节点脚本模板

```gdscript
# nodes/my_type/node.gd
extends GraphNode

var _node_id: int
var _node_resource: Dictionary
var _node_map: Dictionary

signal request_mind(request: StringName, args: Dictionary)

func _update_node(data: Dictionary) -> void:
    # 从数据刷新 UI 控件
    $Label.text = data.get("text", "")

func _read_node() -> Dictionary:
    # 从 UI 控件读取当前数据
    return { "text": $Label.text }
```

### 插件 Inspector 脚本模板

```gdscript
# nodes/my_type/inspector.gd
extends PanelContainer

var _node_id: int
var _node_resource: Dictionary

signal request_mind(request: StringName, args: Dictionary)

func _update_parameters() -> void:
    # 从 _node_resource 填充检查器 UI
    $TextEdit.text = _node_resource.data.get("text", "")

func _read_parameters() -> Dictionary:
    # 从检查器 UI 读取修改后的参数
    return { "text": $TextEdit.text }

func _create_new() -> Dictionary:
    # 返回此类型节点的默认数据
    return { "text": "" }

func _translate_internal_ref(old_to_new_map: Dictionary) -> void:
    # 当 UID 重映射时（粘贴、导入），更新内部引用
    pass
```

---

## 剪贴板系统

支持复制/粘贴节点及其连接关系：

### 模式

```gdscript
enum ClipboardMode { COPY, CUT }
```

### 实现要点

```gdscript
var _clipboard: Dictionary = {
    "mode": ClipboardMode.COPY,
    "nodes": {},     # { old_uid: NodeData }
    "maps": {},      # { old_uid: MapData（含连接信息）}
}

func _paste(offset: Vector2) -> void:
    var uid_remap: Dictionary = {}
    # 1. 为每个节点生成新 UID
    for old_uid in _clipboard.nodes:
        uid_remap[old_uid] = _generate_uid()
    # 2. 创建节点副本并应用新 UID
    for old_uid in _clipboard.nodes:
        var new_uid = uid_remap[old_uid]
        var node_data = _clipboard.nodes[old_uid].duplicate(true)
        _PROJECT.resources.nodes[new_uid] = node_data
    # 3. 重映射连接中的 UID 引用
    for old_uid in _clipboard.maps:
        var new_uid = uid_remap[old_uid]
        var map_data = _clipboard.maps[old_uid].duplicate(true)
        # 更新 io 中引用的 UID
        _remap_connections(map_data, uid_remap)
        _current_scene.map[new_uid] = map_data
    # 4. 通知 Inspector 更新内部引用
    for old_uid in _clipboard.nodes:
        var inspector = _get_inspector(uid_remap[old_uid])
        if inspector and inspector.has_method("_translate_internal_ref"):
            inspector._translate_internal_ref(uid_remap)
```

---

## UID 生成策略

使用 Snowflake/Flake 算法生成全局唯一 ID：

```gdscript
# 简化版 Flake ID 生成
var _last_timestamp: int = 0
var _sequence: int = 0

func _generate_uid() -> int:
    var timestamp = Time.get_unix_time_from_system() * 1000  # 毫秒
    if timestamp == _last_timestamp:
        _sequence += 1
    else:
        _sequence = 0
        _last_timestamp = timestamp
    # timestamp(41bit) + machine_id(10bit) + sequence(12bit)
    return (timestamp << 22) | (_machine_id << 12) | _sequence
```

### 为什么不用 UUID

| | Flake ID | UUID v4 |
|---|---------|---------|
| 大小 | 8 bytes (int) | 16 bytes (string) |
| 排序 | 时间有序 | 随机 |
| 性能 | int 比较 | 字符串比较 |
| 适用 | 节点数量有限的桌面应用 | 分布式系统 |
