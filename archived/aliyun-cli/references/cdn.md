# CDN 内容分发

产品名：`cdn`，API 版本：`2018-05-10`

## 加速域名管理

```bash
# 查询所有加速域名
aliyun cdn DescribeUserDomains

# 按业务类型过滤
aliyun cdn DescribeUserDomains --CdnType web

# 查看指定域名详情
aliyun cdn DescribeCdnDomainDetail --DomainName cdn.example.com

# 添加加速域名
aliyun cdn AddCdnDomain \
  --CdnType web \
  --DomainName cdn.example.com \
  --Sources '[{"content":"1.2.3.4","type":"ipaddr","priority":"20","port":80,"weight":"10"}]' \
  --Scope domestic

# 删除加速域名
aliyun cdn DeleteCdnDomain --DomainName cdn.example.com

# 批量启用域名
aliyun cdn BatchStartCdnDomain --DomainNames cdn.example.com,cdn2.example.com

# 批量停用域名
aliyun cdn BatchStopCdnDomain --DomainNames cdn.example.com
```

`--CdnType` 取值：`web`（图片小文件）| `download`（大文件）| `video`（视音频点播）

`--Scope` 取值：`domestic`（仅中国内地）| `overseas`（全球不含内地）| `global`（全球）

`--Sources` 回源地址 JSON 格式：

| 字段 | 说明 |
|------|------|
| `content` | 回源地址（IP 或域名） |
| `type` | `ipaddr`（IP）\| `domain`（域名）\| `oss`（OSS） |
| `priority` | 优先级，`20`（主）\| `30`（备） |
| `port` | 回源端口，默认 `80` |
| `weight` | 权重，`1`~`100` |

## 缓存刷新与预热

```bash
# 刷新单个 URL（立即删除节点缓存）
aliyun cdn RefreshObjectCaches \
  --ObjectPath "https://cdn.example.com/static/app.js"

# 刷新整个目录
aliyun cdn RefreshObjectCaches \
  --ObjectPath "https://cdn.example.com/static/" \
  --ObjectType Directory

# 批量刷新（多个 URL 用 \n 分隔）
aliyun cdn RefreshObjectCaches \
  --ObjectPath "https://cdn.example.com/a.js\nhttps://cdn.example.com/b.css"

# 预热 URL（提前将资源推送到 CDN 节点）
aliyun cdn PushObjectCache \
  --ObjectPath "https://cdn.example.com/static/app.js"

# 预热指定区域
aliyun cdn PushObjectCache \
  --ObjectPath "https://cdn.example.com/static/app.js" \
  --Area domestic

# 查询刷新/预热任务状态
aliyun cdn DescribeRefreshTaskById --TaskId 12345678,87654321
```

## HTTPS 证书配置

```bash
# 启用证书（使用证书中心已有证书）
aliyun cdn SetCdnDomainSSLCertificate \
  --DomainName cdn.example.com \
  --SSLProtocol on \
  --CertType cas \
  --CertId 123456

# 上传自定义证书
aliyun cdn SetCdnDomainSSLCertificate \
  --DomainName cdn.example.com \
  --SSLProtocol on \
  --CertType upload \
  --CertName my-cert \
  --SSLPub "$(cat cert.pem)" \
  --SSLPri "$(cat key.pem)"

# 关闭 HTTPS
aliyun cdn SetCdnDomainSSLCertificate \
  --DomainName cdn.example.com \
  --SSLProtocol off

# 查询域名证书列表
aliyun cdn DescribeCdnHttpsDomainList
```

## 流量与监控数据

```bash
# 查询带宽数据（最近 1 小时，5 分钟粒度）
aliyun cdn DescribeDomainBpsData \
  --DomainName cdn.example.com \
  --StartTime 2026-04-10T00:00:00Z \
  --EndTime 2026-04-10T01:00:00Z \
  --Interval 300

# 查询流量数据
aliyun cdn DescribeDomainTrafficData \
  --DomainName cdn.example.com \
  --StartTime 2026-04-10T00:00:00Z \
  --EndTime 2026-04-10T01:00:00Z

# 查询请求命中率
aliyun cdn DescribeDomainHitRateData \
  --DomainName cdn.example.com \
  --StartTime 2026-04-10T00:00:00Z \
  --EndTime 2026-04-10T01:00:00Z
```

## 典型工作流

```bash
# 1. 查询所有域名，拿到状态概览
aliyun cdn DescribeUserDomains \
  --cli-query 'Domains.PageData[].{Domain:DomainName,Status:DomainStatus,Cname:Cname}'

# 2. 发布新版本后刷新静态资源
aliyun cdn RefreshObjectCaches \
  --ObjectPath "https://cdn.example.com/static/"  \
  --ObjectType Directory

# 3. 查询刷新任务是否完成（Status 为 Complete 则结束）
aliyun cdn DescribeRefreshTaskById --TaskId <TaskId> \
  --cli-query 'Tasks.CDNTask[].{ID:TaskId,Status:Status,Path:ObjectPath}'
```
