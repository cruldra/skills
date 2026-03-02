# GDScript 4.x 编码模式

## 目录

1. [类型标注](#类型标注)
2. [Signal 模式](#signal-模式)
3. [装饰器用法](#装饰器用法)
4. [Deferred 调用](#deferred-调用)
5. [match/case 分发](#matchcase-分发)
6. [静态工具类](#静态工具类)
7. [资源路径管理](#资源路径管理)
8. [文件操作](#文件操作)
9. [错误处理](#错误处理)
10. [常量与枚举集中管理](#常量与枚举集中管理)

---

## 类型标注

GDScript 4.x 支持完整的静态类型标注，桌面应用应始终使用：

```gdscript
# 变量声明
var _name: String = ""
var _count: int = 0
var _nodes: Dictionary = {}
var _items: Array[String] = []

# 函数签名
func calculate(value: int, factor: float = 1.0) -> float:
    return value * factor

# 可空类型用 Variant
var _optional_data  # 不标注类型 = Variant（可为 null）

# 常量
const VERSION: String = "1.0.0"
const MAX_HISTORY: int = 100
```

### 类型标注原则

- **所有公开/私有变量**: 必须标注类型
- **函数参数和返回值**: 必须标注
- **局部变量**: 推荐标注，可省略（编译器推断）
- **Variant 类型**: 当值可能为多种类型时不标注

---

## Signal 模式

### 声明

```gdscript
# 无参数信号
signal updated

# 带参数信号
signal request_mind(request: StringName, args: Dictionary)
signal node_selected(node_id: int)
signal value_changed(old_value, new_value)
```

### 连接

```gdscript
# 方式 1: 代码连接（推荐，更显式）
func _ready() -> void:
    $Button.pressed.connect(_on_button_pressed)
    $LineEdit.text_changed.connect(_on_text_changed)

# 方式 2: 带参数绑定
$Button.pressed.connect(_on_action.bind("save"))

# 方式 3: 一次性连接
$Timer.timeout.connect(_on_timeout, CONNECT_ONE_SHOT)
```

### 发射

```gdscript
# 简单发射
updated.emit()

# 带参数发射
request_mind.emit(&"save_project", {})
node_selected.emit(_current_node_id)
```

### StringName 优化

事件名使用 `StringName` 而非 `String`：

```gdscript
# 推荐: StringName 字面量（编译时确定，比较快）
request_mind.emit(&"insert_node", args)

# 不推荐: 普通 String
request_mind.emit("insert_node", args)
```

---

## 装饰器用法

### @onready

在 `_ready()` 执行时自动初始化节点引用：

```gdscript
# 推荐: 文件顶部集中声明
@onready var Mind = $Mind
@onready var Configs = $Configs
@onready var editor: Control = $Editor
@onready var graph: GraphEdit = $Editor/GridGraphEdit
```

### @export

暴露变量到 Godot 编辑器 Inspector：

```gdscript
@export var title: String = "Default"
@export var max_connections: int = 4
@export_range(0.0, 1.0, 0.1) var opacity: float = 1.0
@export_file("*.json") var config_path: String
@export_enum("Small", "Medium", "Large") var size: int = 0
@export_group("Advanced")
@export var debug_mode: bool = false
```

### @warning_ignore

抑制特定编译器警告：

```gdscript
@warning_ignore("unused_variable")
var _reserved_for_future: int = 0

@warning_ignore("return_value_discarded")
some_function_with_unused_return()

# 常用场景: setup() 返回值被忽略
@warning_ignore("return_value_discarded")
Mind.setup(self)
```

---

## Deferred 调用

桌面应用中 **所有 UI 操作必须 deferred**，避免在信号处理/物理帧中直接修改节点树：

### call_deferred

```gdscript
# 延迟到下一帧执行方法
func _on_data_loaded() -> void:
    call_deferred("_refresh_ui")

func _refresh_ui() -> void:
    $Panel.visible = true
    $Label.text = _data.title
```

### set_deferred

```gdscript
# 延迟设置属性
func _on_panel_toggle() -> void:
    $Panel.set_deferred("visible", true)
    $ScrollContainer.set_deferred("scroll_vertical", 0)
```

### queue_free vs free

```gdscript
# 推荐: 安全删除（下一帧执行）
node.queue_free()

# 危险: 立即删除（可能崩溃）
node.free()
```

### 常见 Deferred 场景

```gdscript
# 创建节点后立即操作需要 deferred
func _add_node_to_graph(node: GraphNode) -> void:
    graph.add_child(node)
    # 节点刚添加，位置还没生效，需要 deferred
    node.set_deferred("position_offset", target_position)

# 在信号回调中修改触发信号的节点
func _on_item_selected(item: Control) -> void:
    # 不能在 signal 回调中直接删除发信号的节点
    item.call_deferred("queue_free")
```

---

## match/case 分发

GDScript 4.x 的 `match` 比 if-elif 链更清晰，适合事件分发：

```gdscript
func central_event_dispatcher(request: StringName, args: Dictionary) -> void:
    match request:
        &"create_project":
            _create_project(args)
        &"open_project":
            _open_project(args)
        &"save_project":
            _save_project()
        &"insert_node":
            _insert_node(args)
        &"remove_node":
            _remove_node(args)
        _:
            push_warning("Unknown request: %s" % request)
```

### match 高级用法

```gdscript
# 匹配类型
match typeof(value):
    TYPE_STRING:
        handle_string(value)
    TYPE_INT, TYPE_FLOAT:
        handle_number(value)

# 匹配数组解构
match command:
    ["move", var x, var y]:
        move_to(x, y)
    ["resize", var w, var h]:
        resize(w, h)
```

---

## 静态工具类

将通用工具函数集中到静态类中：

```gdscript
# shared_helpers.gd
class_name Helpers

class Utils:
    # 路径工具
    static func normalize_path(path: String) -> String:
        return path.replace("\\", "/").simplify_path()

    static func ensure_dir_exists(path: String) -> bool:
        if not DirAccess.dir_exists_absolute(path):
            return DirAccess.make_dir_recursive_absolute(path) == OK
        return true

    # JSON 工具
    static func load_json(path: String) -> Variant:
        if not FileAccess.file_exists(path):
            return null
        var file = FileAccess.open(path, FileAccess.READ)
        if file == null:
            return null
        var content = file.get_as_text()
        var json = JSON.new()
        if json.parse(content) != OK:
            push_error("JSON parse error at %s: %s" % [path, json.get_error_message()])
            return null
        return json.data

    static func save_json(path: String, data: Variant) -> bool:
        var file = FileAccess.open(path, FileAccess.WRITE)
        if file == null:
            push_error("Cannot write to: %s" % path)
            return false
        file.store_string(JSON.stringify(data, "\t"))
        return true

    # 数组/字典工具
    static func dict_deep_merge(base: Dictionary, override: Dictionary) -> Dictionary:
        var result = base.duplicate(true)
        for key in override:
            if result.has(key) and result[key] is Dictionary and override[key] is Dictionary:
                result[key] = dict_deep_merge(result[key], override[key])
            else:
                result[key] = override[key]
        return result
```

### 使用

```gdscript
# 任何地方直接调用
var data = Helpers.Utils.load_json("user://project.json")
Helpers.Utils.ensure_dir_exists("user://backups")
```

---

## 资源路径管理

### 路径前缀

| 前缀 | 说明 | 示例 |
|------|------|------|
| `res://` | 项目资源目录（只读，导出后打包） | `res://nodes/entry/node.tscn` |
| `user://` | 用户数据目录（可读写） | `user://config.json` |
| 绝对路径 | 文件系统绝对路径 | `C:/Users/xxx/project.json` |

### 集中管理路径常量

```gdscript
# settings.gd
class_name Settings

# 资源路径
const NODE_TYPES_DIR := "res://nodes/"
const TEMPLATES_DIR := "res://templates/"
const THEMES_DIR := "res://themes/"

# 用户数据路径
const CONFIG_FILE_NAME := ".arrow.config"
const PROJECT_LIST_FILE := "projects.json"

# 运行时解析
static func get_config_path() -> String:
    return OS.get_user_data_dir() + "/" + CONFIG_FILE_NAME

static func get_project_list_path() -> String:
    return OS.get_user_data_dir() + "/" + PROJECT_LIST_FILE
```

---

## 文件操作

### 读写文本文件

```gdscript
# 读取
func _read_file(path: String) -> String:
    var file = FileAccess.open(path, FileAccess.READ)
    if file == null:
        push_error("Cannot read: %s (error: %s)" % [path, FileAccess.get_open_error()])
        return ""
    return file.get_as_text()

# 写入
func _write_file(path: String, content: String) -> bool:
    var file = FileAccess.open(path, FileAccess.WRITE)
    if file == null:
        push_error("Cannot write: %s" % path)
        return false
    file.store_string(content)
    return true
```

### 目录遍历

```gdscript
func _list_subdirectories(path: String) -> PackedStringArray:
    var dirs: PackedStringArray = []
    var dir = DirAccess.open(path)
    if dir == null:
        return dirs
    dir.list_dir_begin()
    var name = dir.get_next()
    while name != "":
        if dir.current_is_dir() and not name.begins_with("."):
            dirs.append(name)
        name = dir.get_next()
    return dirs
```

### ConfigFile（INI 格式）

```gdscript
# 读取配置
func _load_config(path: String) -> ConfigFile:
    var config = ConfigFile.new()
    var err = config.load(path)
    if err != OK:
        push_warning("Config load failed: %s" % path)
    return config

# 保存配置
func _save_config(path: String, data: Dictionary) -> void:
    var config = ConfigFile.new()
    for section in data:
        for key in data[section]:
            config.set_value(section, key, data[section][key])
    config.save(path)
```

---

## 错误处理

### 错误输出层级

```gdscript
push_error("严重错误：文件损坏")      # 红色，必须处理
push_warning("警告：配置项缺失")      # 黄色，可恢复
print("信息：项目已加载")              # 白色，日志

# 断言（仅调试模式）
assert(node != null, "Node must not be null")
```

### 防御性编程

```gdscript
func _get_node_data(uid: int) -> Dictionary:
    if not _PROJECT.resources.nodes.has(uid):
        push_error("Node not found: %d" % uid)
        return {}
    return _PROJECT.resources.nodes[uid]

func _safe_load_scene(path: String) -> PackedScene:
    if not ResourceLoader.exists(path):
        push_warning("Scene not found: %s" % path)
        return null
    return load(path) as PackedScene
```

---

## 常量与枚举集中管理

使用 `class_name Settings` 集中管理所有应用常量：

```gdscript
# settings.gd
class_name Settings

# 版本
const VERSION := "1.0.0"

# 变量类型枚举
const VARIABLE_TYPES := {
    0: { "name": "String", "default": "" },
    1: { "name": "Integer", "default": "0" },
    2: { "name": "Float", "default": "0.0" },
    3: { "name": "Boolean", "default": "true" },
}

# 节点类型配置
const NODE_TYPES_CONFIG := {
    "entry": { "color": Color.DARK_OLIVE_GREEN, "slots": { "out": 1 } },
    "hub": { "color": Color.DARK_SLATE_BLUE, "slots": { "in": -1, "out": -1 } },
    "interaction": { "color": Color.DARK_GOLDENROD, "slots": { "in": 1, "out": -1 } },
}

# 主题定义
const THEMES := {
    "light": { "base": Color.WHITE, "text": Color.BLACK },
    "dark": { "base": Color(0.18, 0.18, 0.2), "text": Color.WHITE },
}

# 剪贴板模式
const CLIPBOARD_MODE_COPY := 0
const CLIPBOARD_MODE_CUT := 1

# 面板类型
const PANEL_BLOCKING := 0    # 模态
const PANEL_STATEFUL := 1    # 记忆状态
const PANEL_DEFAULT_OPEN := 2  # 默认打开
```

### 使用

```gdscript
# 任何脚本中直接引用
var color = Settings.NODE_TYPES_CONFIG["entry"]["color"]
var theme = Settings.THEMES["dark"]
var version = Settings.VERSION
```
