# 云解析 DNS

产品名：`alidns`（需已安装插件：`aliyun plugin install --names aliyun-cli-alidns`）

## 域名管理

```bash
# 查询域名列表
aliyun alidns describe-domains

# 按关键字搜索
aliyun alidns describe-domains --key-word example

# 添加域名
aliyun alidns add-domain --domain-name example.com

# 删除域名
aliyun alidns delete-domain --domain-name example.com
```

## 解析记录管理

### 添加记录

```bash
# A 记录（域名 → IPv4）
aliyun alidns add-domain-record \
  --domain-name example.com \
  --rr www \
  --type A \
  --value 1.2.3.4

# CNAME 记录
aliyun alidns add-domain-record \
  --domain-name example.com \
  --rr blog \
  --type CNAME \
  --value target.example.com

# MX 记录（需指定优先级）
aliyun alidns add-domain-record \
  --domain-name example.com \
  --rr @ \
  --type MX \
  --value mail.example.com \
  --priority 10

# TXT 记录（根域名用 @）
aliyun alidns add-domain-record \
  --domain-name example.com \
  --rr @ \
  --type TXT \
  --value "v=spf1 include:spf.example.com ~all"
```

> `--rr` 主机记录说明：`www` 对应 `www.example.com`；`@` 对应根域名 `example.com`；`*` 为泛解析

### 查询记录

```bash
# 列出域名所有解析记录
aliyun alidns describe-domain-records --domain-name example.com

# 按主机记录过滤
aliyun alidns describe-domain-records \
  --domain-name example.com \
  --rr-key-word www

# 按记录类型过滤
aliyun alidns describe-domain-records \
  --domain-name example.com \
  --type A
```

### 修改记录

```bash
# 修改解析记录（需先查询获取 RecordId）
aliyun alidns update-domain-record \
  --record-id 1234567890 \
  --rr www \
  --type A \
  --value 5.6.7.8

# 修改 TTL（默认 600 秒）
aliyun alidns update-domain-record \
  --record-id 1234567890 \
  --rr www \
  --type A \
  --value 5.6.7.8 \
  --ttl 300
```

### 启停 / 删除记录

```bash
# 暂停解析记录
aliyun alidns set-domain-record-status \
  --record-id 1234567890 \
  --status Disable

# 启用解析记录
aliyun alidns set-domain-record-status \
  --record-id 1234567890 \
  --status Enable

# 删除解析记录
aliyun alidns delete-domain-record --record-id 1234567890
```

## 记录类型速查

| 类型 | 用途 |
|------|------|
| `A` | 域名 → IPv4 地址 |
| `AAAA` | 域名 → IPv6 地址 |
| `CNAME` | 域名 → 另一个域名 |
| `MX` | 邮件服务器，需指定 `--priority` |
| `TXT` | 文本记录，用于 SPF、域名验证等 |
| `NS` | 指定子域名的 DNS 服务器 |
| `SRV` | 服务记录 |

## 典型工作流

```bash
# 1. 查询域名下所有记录，拿到 RecordId
aliyun alidns describe-domain-records --domain-name example.com \
  --cli-query 'DomainRecords.Record[].{ID:RecordId,RR:RR,Type:Type,Value:Value}'

# 2. 根据 RecordId 修改或删除
aliyun alidns update-domain-record --record-id <RecordId> ...
```
