# 云通信语音服务（中国内地）

产品名：`dyvmsapi`（需已安装插件：`aliyun plugin install --names aliyun-cli-dyvmsapi`）

仅支持中国内地号码。使用前需在控制台完成资质认证并创建语音模板/语音文件。

## 语音验证码 / 语音通知（TTS 模板）

使用文本转语音模板发起单次呼叫：

```bash
# 发送语音验证码（公共模式，系统随机分配主叫号码）
aliyun dyvmsapi single-call-by-tts \
  --called-number 13800138000 \
  --tts-code TTS_123456789

# 带模板变量（如验证码内容）
aliyun dyvmsapi single-call-by-tts \
  --called-number 13800138000 \
  --tts-code TTS_123456789 \
  --tts-param '{"code":"6688"}'

# 专属模式（指定主叫显号）
aliyun dyvmsapi single-call-by-tts \
  --called-number 13800138000 \
  --tts-code TTS_123456789 \
  --tts-param '{"code":"6688"}' \
  --called-show-number 05718888888
```

> `--tts-code` 在控制台「语音消息 → 语音验证码/语音通知」页面获取已审核通过的模板 ID

## 语音通知（语音文件）

使用预录语音文件发起单次呼叫：

```bash
aliyun dyvmsapi single-call-by-voice \
  --called-number 13800138000 \
  --voice-code voice_file_id_xxxxxx \
  --called-show-number 05718888888
```

> `--voice-code` 在控制台「语音文件管理 → 语音通知文件」页面获取语音 ID

## 批量语音任务

向多个号码批量发送语音通知（TTS 模板）：

```bash
# 无变量模板，LIST 格式传号码
aliyun dyvmsapi create-call-task \
  --task-name my-notify-task \
  --template-code TTS_123456789 \
  --biz-type VMS_VOICE_TTS \
  --data "13800138000,13900139000,13700137000" \
  --data-type LIST \
  --resource sip_instance_id_xxxxxx \
  --resource-type LIST

# 带变量模板，JSON 格式传号码和参数
aliyun dyvmsapi create-call-task \
  --task-name my-notify-task \
  --template-code TTS_123456789 \
  --biz-type VMS_VOICE_TTS \
  --data-type JSON \
  --data '{"paramNames":["name"],"calleelist":[{"callee":"13800138000","params":["张三"]},{"callee":"13900139000","params":["李四"]}]}' \
  --resource sip_instance_id_xxxxxx \
  --resource-type LIST
```

`--biz-type` 取值：`VMS_VOICE_TTS`（TTS 模板）| `VMS_VOICE_CODE`（语音文件）| `VMS_TTS`（语音验证码）

## 智能机器人外呼

使用配置好话术的机器人批量外呼（1~1000 个号码）：

```bash
# 立即外呼
aliyun dyvmsapi batch-robot-smart-call \
  --task-name robot-task-01 \
  --called-number "13800138000,13900139000" \
  --called-show-number 05718888888 \
  --dialog-id 123456 \
  --corp-name "某某科技有限公司"

# 定时外呼（Unix 毫秒时间戳）
aliyun dyvmsapi batch-robot-smart-call \
  --task-name robot-task-01 \
  --called-number "13800138000,13900139000" \
  --called-show-number 05718888888 \
  --dialog-id 123456 \
  --corp-name "某某科技有限公司" \
  --schedule-call true \
  --schedule-time 1744300800000
```

> `--dialog-id` 在控制台「话术管理」页面获取话术 ID

## IVR 交互式语音（按键导航）

```bash
aliyun dyvmsapi ivr-call \
  --called-number 13800138000 \
  --called-show-number 05718888888 \
  --start-code TTS_ivr_start_template
```

## 任务管理

```bash
# 查询批量任务列表
aliyun dyvmsapi list-call-task

# 查询任务详情
aliyun dyvmsapi list-call-task-detail --task-id 12345678

# 终止机器人外呼任务
aliyun dyvmsapi cancel-robot-task --task-id 12345678
```

## 查询通话记录

```bash
# 按 CallId 查询单次通话详情
aliyun dyvmsapi query-call-detail-by-call-id \
  --call-id "116014079923^10281xxxx" \
  --prod-id 11000000300006 \
  --query-date 1744300800000
```

`--prod-id` 产品 ID 对照：

| 产品 ID | 类型 |
|---------|------|
| `11000000300006` | 语音通知 |
| `11010000138001` | 语音验证码 |
| `11000000300005` | 语音 IVR |
| `11030000180001` | 智能外呼 |

> `--query-date` 必须与 CallId 生成日期为同一天，格式为 Unix 毫秒时间戳

## 流控限制

同一资质 + 号码用途对同一被叫号码的限制：
- 1 次 / 分钟
- 5 次 / 小时
- 20 次 / 24 小时
