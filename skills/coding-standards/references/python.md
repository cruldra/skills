# Python 代码规范事实文档

记录用户认可的 Python 编码规范事实；每条只保留反例、规范写法和一句话理由，避免占用过多上下文。

追加新规范时使用：

````markdown
## PYN-编号：简短标题

**反例**：

```python
# 反例
```

**规范**：

```python
# 推荐写法
```

**理由**：一句话说明为什么不能这么做或为什么要这么做。
````

## PYN-001：稳定路径推导应定义为模块常量

**反例**：

```python
backend_dir = Path(__file__).resolve().parent.parent.parent
config_path = backend_dir / "config" / "settings.yaml"
```

**规范**：

```python
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = BACKEND_DIR / "config" / "settings.yaml"
```

**理由**：稳定路径是模块级事实，集中定义能避免重复推导和层级不一致。

## PYN-002：只记录日志不处理的异常不要捕获

**反例**：

```python
try:
    if not minio_client.bucket_exists(bucket):
        minio_client.make_bucket(bucket)
        logger.info("MinIO bucket 已创建", bucket=bucket)
except Exception as exc:
    logger.warning(
        "MinIO bucket 检查失败，依赖对象存储的工具可能不可用",
        bucket=bucket,
        error_type=exc.__class__.__name__,
    )
```

**规范**：

```python
if not minio_client.bucket_exists(bucket):
    minio_client.make_bucket(bucket)
    logger.info("MinIO bucket 已创建", bucket=bucket)
```

需要补充上下文时也要重新抛出：

```python
try:
    if not minio_client.bucket_exists(bucket):
        minio_client.make_bucket(bucket)
        logger.info("MinIO bucket 已创建", bucket=bucket)
except MinioError:
    logger.exception("MinIO bucket 初始化失败", bucket=bucket)
    raise
```

**理由**：日志不是恢复策略，只记录不处理会把失败伪装成程序还能继续运行。

## PYN-003：Python 包名可用 snake_case，模块名只使用单个单词

**反例**：

```text
agent_compiler_deepagents/
  compile_context.py
  model_loader.py
  node_translators.py
  placeholder_expand.py
  tool_loader.py
```

**规范**：

```text
agent_compiler_deepagents/
  compile_context/
    context.py
  model/
    loader.py
  node/
    translators.py
  placeholder/
    expand.py
  tool/
    loader.py
```

**理由**：公司 Python 命名风格允许包名用 snake_case 承载领域语义，但模块名仍应保持单词化并通过目录层级表达组合语义。
