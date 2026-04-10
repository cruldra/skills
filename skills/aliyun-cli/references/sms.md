# SMS 短信服务

产品名：`dysmsapi`（需已安装插件：`aliyun plugin install --names aliyun-cli-dysmsapi`）

## 重要：API 版本说明

`dysmsapi` 插件默认版本为 `2018-05-01`（仅含境外发送命令）。国内短信的发送、模板、签名管理等完整功能在 `2017-05-25` 版本，**必须加 `--api-version 2017-05-25`**。

---

## 发送短信（中国内地）

```bash
# 单发（支持逗号分隔多个号码，上限 1000 个）
aliyun dysmsapi send-sms --api-version 2017-05-25 \
  --phone-numbers 13800138000 \
  --sign-name "签名名称" \
  --template-code SMS_123456789

# 带模板变量
aliyun dysmsapi send-sms --api-version 2017-05-25 \
  --phone-numbers 13800138000 \
  --sign-name "签名名称" \
  --template-code SMS_123456789 \
  --template-param '{"code":"6688","name":"张三"}'

# 批量发送（不同号码使用不同签名，同一模板）
aliyun dysmsapi send-batch-sms --api-version 2017-05-25 \
  --phone-number-json '["13800138000","13900139000"]' \
  --sign-name-json '["签名A","签名B"]' \
  --template-code SMS_123456789 \
  --template-param-json '[{"code":"1234"},{"code":"5678"}]'
```

> 验证码类短信建议用 `send-sms` 单发，批量发送有延迟

## 发送短信（境外/港澳台）

```bash
# 单发境外（直接发文本内容，无需模板）
aliyun dysmsapi send-message-to-globe \
  --to 8521234567890 \
  --message "Your verification code is 123456" \
  --type OTP

# 批量发境外
aliyun dysmsapi batch-send-message-to-globe \
  --to "8521234567890,8523456789012" \
  --message "Your order has been shipped" \
  --type NOTIFY
```

`--type` 取值：`OTP`（验证码）| `NOTIFY`（通知）| `MKT`（推广）

---

## 查询发送记录

```bash
# 查询指定号码某天的发送记录
aliyun dysmsapi query-send-details --api-version 2017-05-25 \
  --phone-number 13800138000 \
  --send-date 20260410 \
  --page-size 20 \
  --current-page 1

# 按 BizId（发送流水号）精确查询
aliyun dysmsapi query-send-details --api-version 2017-05-25 \
  --phone-number 13800138000 \
  --send-date 20260410 \
  --page-size 10 \
  --current-page 1 \
  --biz-id "519440173782^0"

# 按 MessageId 查询（境外短信）
aliyun dysmsapi query-message --message-id <MessageId>
```

> `--send-date` 格式 `yyyyMMdd`，最多查询近 30 天记录

---

## 模板管理

```bash
# 查询模板列表
aliyun dysmsapi query-sms-template-list --api-version 2017-05-25 \
  --page-index 1 --page-size 50

# 查询单个模板详情
aliyun dysmsapi query-sms-template --api-version 2017-05-25 \
  --template-code SMS_123456789

# 创建模板
aliyun dysmsapi create-sms-template --api-version 2017-05-25 \
  --template-name "登录验证码" \
  --template-type 0 \
  --template-content "您的验证码为：\${code}，5分钟内有效，请勿泄露。"

# 修改模板（审核失败/已撤回的模板才可修改）
aliyun dysmsapi modify-sms-template --api-version 2017-05-25 \
  --template-code SMS_123456789 \
  --template-name "登录验证码" \
  --template-type 0 \
  --template-content "您的验证码：\${code}，有效期5分钟。"

# 删除模板
aliyun dysmsapi delete-sms-template --api-version 2017-05-25 \
  --template-code SMS_123456789
```

`--template-type` 取值：`0`（验证码）| `1`（短信通知）| `2`（推广短信）| `3`（国际/港澳台）

---

## 签名管理

```bash
# 查询签名列表
aliyun dysmsapi query-sms-sign-list --api-version 2017-05-25 \
  --page-index 1 --page-size 50

# 查询单个签名详情
aliyun dysmsapi query-sms-sign --api-version 2017-05-25 \
  --sign-name "签名名称"

# 创建签名（需先完成资质认证，获取 qualification-id）
aliyun dysmsapi create-sms-sign --api-version 2017-05-25 \
  --sign-name "某某科技" \
  --sign-source 0 \
  --qualification-id 123456

# 修改签名
aliyun dysmsapi update-sms-sign --api-version 2017-05-25 \
  --sign-name "某某科技" \
  --sign-source 0 \
  --qualification-id 123456

# 删除签名（不可恢复，谨慎操作）
aliyun dysmsapi delete-sms-sign --api-version 2017-05-25 \
  --sign-name "某某科技"
```

`--sign-source` 取值：`0`（企事业单位全称/简称，推荐）| `2`（App 名称）| `5`（商标名）

---

## 快速速查

| 操作 | 命令 | 需要 `--api-version` |
|------|------|---------------------|
| 内地单发 | `send-sms` | `2017-05-25` |
| 内地批量发 | `send-batch-sms` | `2017-05-25` |
| 境外单发 | `send-message-to-globe` | 否（默认版本） |
| 境外批量发 | `batch-send-message-to-globe` | 否（默认版本） |
| 查发送记录 | `query-send-details` | `2017-05-25` |
| 查模板列表 | `query-sms-template-list` | `2017-05-25` |
| 创建模板 | `create-sms-template` | `2017-05-25` |
| 删除模板 | `delete-sms-template` | `2017-05-25` |
| 查签名列表 | `query-sms-sign-list` | `2017-05-25` |
| 创建签名 | `create-sms-sign` | `2017-05-25` |
| 删除签名 | `delete-sms-sign` | `2017-05-25` |
