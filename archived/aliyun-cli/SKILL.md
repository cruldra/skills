---
name: aliyun-cli
description: Use when managing Alibaba Cloud resources via the aliyun CLI — ECS instances, OSS buckets/objects, or SMS messaging (dysmsapi).
---

# aliyun-cli

通过 `aliyun` 命令行工具管理阿里云 ECS、OSS、短信服务（dysmsapi）。

## 命令结构

```
aliyun <产品> <操作> [--参数名 参数值 ...]
```

通用选项：

| 选项 | 说明 |
|------|------|
| `--profile <名称>` | 指定配置集 |
| `--region <地域>` | 覆盖默认地域（如 `cn-hangzhou`） |
| `--cli-dry-run` | 模拟运行，不实际调用 API |
| `--cli-query <jmespath>` | JMESPath 过滤输出字段 |
| `--output json/text/table` | 输出格式 |

查看任意命令的参数：

```bash
aliyun <产品> <操作> --help
```

## 详细参考

- [认证配置](references/configure.md) — AK/StsToken/RamRoleArn 等认证方式配置
- [ECS 云服务器](references/ecs.md) — 实例查询、启停、创建、安全组等
- [OSS 对象存储](references/oss.md) — Bucket 管理、文件上传/下载/同步
- [SMS 短信服务](references/sms.md) — 内地模板发送、境外发送、查询记录
- [语音通知服务](references/dyvmsapi.md) — 语音验证码/通知、批量任务、机器人外呼、IVR、通话查询
- [云解析 DNS](references/alidns.md) — 域名管理、A/CNAME/MX/TXT 解析记录增删改查
- [CDN 内容分发](references/cdn.md) — 加速域名管理、缓存刷新/预热、HTTPS 证书、流量监控
- [SSL 证书管理](references/cas.md) — 证书查询/上传/删除、CSR 管理、部署到云产品、吊销
