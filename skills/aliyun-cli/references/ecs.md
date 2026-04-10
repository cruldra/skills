# ECS 云服务器

产品名：`ecs`，API 版本：`2014-05-26`

## 查询实例

```bash
# 列出指定地域所有实例
aliyun ecs DescribeInstances --RegionId cn-hangzhou

# 按实例 ID 精确查询
aliyun ecs DescribeInstances \
  --RegionId cn-hangzhou \
  --InstanceIds '["i-bp1xxxxxx"]'

# JMESPath 只取 ID 和状态
aliyun ecs DescribeInstances \
  --RegionId cn-hangzhou \
  --cli-query 'Instances.Instance[].{ID:InstanceId,Status:Status}'
```

## 实例生命周期

```bash
# 启动
aliyun ecs StartInstance --InstanceId i-bp1xxxxxx

# 正常关机
aliyun ecs StopInstance --InstanceId i-bp1xxxxxx

# 强制断电
aliyun ecs StopInstance --InstanceId i-bp1xxxxxx --ForceStop true

# 重启
aliyun ecs RebootInstance --InstanceId i-bp1xxxxxx

# 释放（按量付费实例）
aliyun ecs DeleteInstance --InstanceId i-bp1xxxxxx

# 强制释放运行中的实例
aliyun ecs DeleteInstance --InstanceId i-bp1xxxxxx --Force true
```

## 创建实例

```bash
aliyun ecs RunInstances \
  --RegionId cn-hangzhou \
  --ImageId ubuntu_22_04_x64_20G_alibase_20240730.vhd \
  --InstanceType ecs.c6.large \
  --SecurityGroupId sg-xxxxxx \
  --VSwitchId vsw-xxxxxx \
  --InstanceName my-server \
  --InstanceChargeType PostPaid \
  --Amount 1
```

## 安全组

```bash
# 开放入方向端口
aliyun ecs AuthorizeSecurityGroup \
  --RegionId cn-hangzhou \
  --SecurityGroupId sg-xxxxxx \
  --IpProtocol tcp \
  --PortRange 80/80 \
  --SourceCidrIp 0.0.0.0/0

# 查看安全组列表
aliyun ecs DescribeSecurityGroups --RegionId cn-hangzhou
```

## 常用查询

| 操作 | 命令 |
|------|------|
| 查地域列表 | `aliyun ecs DescribeRegions` |
| 查实例规格 | `aliyun ecs DescribeInstanceTypes --RegionId cn-hangzhou` |
| 查镜像列表 | `aliyun ecs DescribeImages --RegionId cn-hangzhou --OSType linux` |
| 查磁盘 | `aliyun ecs DescribeDisks --RegionId cn-hangzhou` |
| 创建快照 | `aliyun ecs CreateSnapshot --DiskId d-xxxxxx` |
| 查快照列表 | `aliyun ecs DescribeSnapshots --RegionId cn-hangzhou` |
