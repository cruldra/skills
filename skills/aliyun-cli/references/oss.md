# OSS 对象存储

命令格式：`aliyun oss <子命令>`（内置 ossutil 兼容模式）

## Bucket 管理

```bash
# 列出所有 bucket
aliyun oss ls

# 创建 bucket
aliyun oss mb oss://my-bucket --region cn-hangzhou

# 查看 bucket 详情
aliyun oss stat oss://my-bucket

# 删除空 bucket
aliyun oss rm oss://my-bucket -b

# 强制删除 bucket（含所有文件）
aliyun oss rm oss://my-bucket -b -r -f
```

## 文件上传

```bash
# 上传单个文件
aliyun oss cp /local/file.txt oss://my-bucket/file.txt

# 递归上传目录
aliyun oss cp /local/dir/ oss://my-bucket/dir/ -r

# 强制覆盖
aliyun oss cp /local/file.txt oss://my-bucket/file.txt -f

# 大文件断点续传（超 100M 自动启用）
aliyun oss cp /local/bigfile.zip oss://my-bucket/ \
  --bigfile-threshold 104857600 \
  --checkpoint-dir /tmp/oss_checkpoint
```

## 文件下载

```bash
# 下载单个文件
aliyun oss cp oss://my-bucket/file.txt /local/file.txt

# 递归下载目录
aliyun oss cp oss://my-bucket/dir/ /local/dir/ -r

# 按范围下载（字节）
aliyun oss cp oss://my-bucket/file.txt /local/file.txt --range 0-1023
```

## 文件同步

```bash
# 本地 → OSS（增量，只传新/变更文件）
aliyun oss sync /local/dir/ oss://my-bucket/dir/

# OSS → 本地
aliyun oss sync oss://my-bucket/dir/ /local/dir/

# 按通配符过滤
aliyun oss sync /local/dir/ oss://my-bucket/dir/ --include "*.jpg" --exclude "*.tmp"
```

## 文件管理

```bash
# 列出 bucket 下所有文件
aliyun oss ls oss://my-bucket

# 列出指定前缀（目录）
aliyun oss ls oss://my-bucket/dir/

# 查看 object 详情
aliyun oss stat oss://my-bucket/path/to/file.txt

# 删除单个文件
aliyun oss rm oss://my-bucket/file.txt

# 递归删除目录
aliyun oss rm oss://my-bucket/dir/ -r -f

# 生成签名下载链接（默认 60 秒）
aliyun oss sign oss://my-bucket/file.txt

# 自定义有效期（秒）
aliyun oss sign oss://my-bucket/file.txt --timeout 3600
```

## 常用子命令速查

| 子命令 | 说明 |
|--------|------|
| `ls` | 列出 bucket 或 object |
| `mb` | 创建 bucket |
| `rm` | 删除 bucket 或 object |
| `cp` | 上传/下载/拷贝 object |
| `sync` | 增量同步目录 |
| `stat` | 查看详情 |
| `sign` | 生成签名 URL |
| `mkdir` | 创建目录（OSS 中以 `/` 结尾） |
| `du` | 统计存储空间大小 |
| `set-acl` | 设置访问权限 |
