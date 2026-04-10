# 认证配置

## 交互式配置

```bash
aliyun configure
```

## 非交互式配置

```bash
# AK 方式（最常用）
aliyun configure set \
  --profile myProfile \
  --mode AK \
  --access-key-id <AK_ID> \
  --access-key-secret <AK_SECRET> \
  --region cn-hangzhou \
  --language zh

# 查看所有配置
aliyun configure list
```

## 认证模式

| 模式 | 说明 |
|------|------|
| `AK` | AccessKey ID + Secret，最常用 |
| `StsToken` | 临时安全令牌 |
| `RamRoleArn` | 扮演 RAM 角色 |
| `EcsRamRole` | ECS 实例绑定的 RAM 角色，无需配置 AK |
| `CloudSSO` | 云 SSO 登录 |

## 切换配置集

```bash
# 执行命令时临时切换
aliyun ecs DescribeInstances --RegionId cn-hangzhou --profile prod
```
