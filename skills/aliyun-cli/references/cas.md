# 数字证书管理服务（SSL 证书）

产品名：`cas`，API 版本：`2020-04-07`

## 证书查询

```bash
# 查询所有证书和订单（含签发、上传、过期）
aliyun cas ListUserCertificateOrder --OrderType CERT

# 只看已签发证书
aliyun cas ListUserCertificateOrder --OrderType CERT --Status ISSUED

# 只看即将过期的证书
aliyun cas ListUserCertificateOrder --OrderType CERT --Status WILLEXPIRED

# 只看已上传证书
aliyun cas ListUserCertificateOrder --OrderType UPLOAD

# 按域名关键字搜索
aliyun cas ListUserCertificateOrder --OrderType CERT --Keyword example.com

# 查看证书详情（含公钥/私钥内容，可用于下载）
aliyun cas GetUserCertificateDetail --CertId 123456
```

`--Status` 取值：`ISSUED`（已签发）| `WILLEXPIRED`（即将过期）| `EXPIRED`（已过期）| `CHECKING`（审核中）| `CHECKED_FAIL`（审核失败）

## 上传证书

将本地已有证书上传到阿里云证书管理，便于统一管理和部署：

```bash
aliyun cas UploadUserCertificate \
  --Name my-cert-2026 \
  --Cert "$(cat fullchain.pem)" \
  --Key "$(cat privkey.pem)"
```

> `--Cert` 为 PEM 格式证书内容（包含完整证书链）；`--Key` 为对应私钥。

## 删除证书

```bash
# 删除已过期或上传的证书（无法删除签发中/有效期内的订单证书）
aliyun cas DeleteUserCertificate --CertId 123456
```

## CSR 管理

CSR（证书签名请求）是向 CA 申请证书时提交的文件。

```bash
# 创建 CSR
aliyun cas CreateCsr \
  --Name my-csr \
  --CommonName example.com \
  --Algorithm RSA \
  --KeySize 2048 \
  --CountryCode CN \
  --Province Zhejiang \
  --Locality Hangzhou \
  --Sans "www.example.com,api.example.com"

# 查询 CSR 列表
aliyun cas ListCsr

# 获取 CSR 内容（用于提交给 CA）
aliyun cas GetCsrDetail --CsrId 123456

# 删除 CSR
aliyun cas DeleteCsr --CsrId 123456
```

`--Algorithm` 取值：`RSA`（2048/3072/4096）| `ECC`（256）| `SM2`（256，国密）

## 证书部署到云产品

```bash
# 查询可部署的云产品资源列表（如 CLB、CDN 等）
aliyun cas ListCloudResources

# 创建部署任务（立即执行）
aliyun cas CreateDeploymentJob \
  --Name deploy-to-cdn \
  --JobType cloud \
  --CertIds 123456 \
  --ResourceIds res-xxxxxx \
  --ContactIds contact-xxxxxx

# 查询部署任务列表
aliyun cas ListDeploymentJob

# 查询部署任务详情
aliyun cas DescribeDeploymentJob --JobId job-xxxxxx
```

## 吊销证书

```bash
aliyun cas RevokeCertificate --InstanceId cas-xxxxxx
```

## 典型工作流

```bash
# 1. 查找所有即将过期的证书
aliyun cas ListUserCertificateOrder \
  --OrderType CERT \
  --Status WILLEXPIRED \
  --cli-query 'CertificateOrderList[].{ID:CertificateId,Domain:CommonName,Expire:EndDate}'

# 2. 查看指定证书的公私钥内容（用于下载/更新部署）
aliyun cas GetUserCertificateDetail --CertId 123456 \
  --cli-query '{Cert:Cert,Key:Key}'

# 3. 上传新证书
aliyun cas UploadUserCertificate \
  --Name renewed-cert-2027 \
  --Cert "$(cat fullchain.pem)" \
  --Key "$(cat privkey.pem)"
```
