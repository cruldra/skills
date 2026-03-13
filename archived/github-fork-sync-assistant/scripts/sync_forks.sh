#!/bin/bash

# Fork 仓库同步脚本
# 用法: sync_forks.sh [repos.txt 路径]
# 如果未指定路径，默认从脚本同目录的 ../assets/repos.txt 读取

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 支持通过参数指定 repos.txt 路径，否则使用默认位置
REPOS_FILE="${1:-$SCRIPT_DIR/../assets/repos.txt}"

if [ ! -f "$REPOS_FILE" ]; then
    echo "错误: 仓库列表文件不存在: $REPOS_FILE"
    exit 1
fi

# 日志文件放在脚本所在目录
SUCCESS_LOG="$SCRIPT_DIR/success.log"
FAILED_LOG="$SCRIPT_DIR/failed.log"
UPTODATE_LOG="$SCRIPT_DIR/uptodate.log"

# 清空日志文件
> "$SUCCESS_LOG"
> "$FAILED_LOG"
> "$UPTODATE_LOG"

TOTAL=0
SUCCESS=0
FAILED=0
UPTODATE=0

echo "使用仓库列表: $REPOS_FILE"
echo "仓库数量: $(grep -c -v '^\s*$' "$REPOS_FILE")"
echo ""

while IFS= read -r repo; do
    # 跳过空行和注释行
    [[ -z "$repo" || "$repo" =~ ^[[:space:]]*# ]] && continue

    # 去除首尾空白
    repo="$(echo "$repo" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$repo" ]] && continue

    TOTAL=$((TOTAL + 1))
    echo "[$TOTAL] 正在同步: $repo"

    # 执行同步命令
    output=$(gh repo sync "$repo" 2>&1)
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        # 检查是否已是最新
        if echo "$output" | grep -qi "already up to date"; then
            echo "$repo" >> "$UPTODATE_LOG"
            UPTODATE=$((UPTODATE + 1))
            echo "  ✓ 已是最新"
        else
            echo "$repo" >> "$SUCCESS_LOG"
            SUCCESS=$((SUCCESS + 1))
            echo "  ✓ 同步成功"
        fi
    else
        echo "$repo | $output" >> "$FAILED_LOG"
        FAILED=$((FAILED + 1))
        echo "  ✗ 同步失败: $output"
    fi

    # 每30个请求暂停2秒，避免触发速率限制
    if [ $((TOTAL % 30)) -eq 0 ]; then
        echo "暂停 2 秒以避免速率限制..."
        sleep 2
    fi
done < "$REPOS_FILE"

echo ""
echo "========== 同步完成 =========="
echo "总计: $TOTAL"
echo "成功更新: $SUCCESS"
echo "已是最新: $UPTODATE"
echo "同步失败: $FAILED"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "失败详情见: $FAILED_LOG"
fi
