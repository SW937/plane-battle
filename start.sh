#!/bin/bash
# 飞机大战 - 一键启动脚本

cd "$(dirname "$0")"

PORT=8912
URL="http://127.0.0.1:${PORT}"

# 若端口被占用，先尝试结束旧进程
if lsof -i :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  OLD_PID=$(lsof -i :${PORT} -sTCP:LISTEN -t 2>/dev/null | head -1)
  echo "端口 ${PORT} 已被占用 (PID: ${OLD_PID})，正在重启..."
  kill "${OLD_PID}" 2>/dev/null
  sleep 0.5
fi

echo "================================"
echo "       ✈  飞机大战  ✈"
echo "================================"
echo ""
echo "正在启动本地服务器..."
echo "游戏地址: ${URL}"
echo ""
echo "关闭此窗口即可停止游戏服务器"
echo "================================"
echo ""

if ! command -v python3 &>/dev/null; then
  echo "错误: 未找到 Python3，请安装 Python 3 后重试"
  exit 1
fi

python3 -m http.server "${PORT}" --bind 127.0.0.1 &
SERVER_PID=$!

READY=0
for _ in $(seq 1 30); do
  if curl -s -o /dev/null --connect-timeout 1 "http://127.0.0.1:${PORT}/"; then
    READY=1
    break
  fi
  sleep 0.2
done

if [ "${READY}" -eq 1 ]; then
  open "${URL}"
  wait "${SERVER_PID}"
else
  echo "错误: 服务器启动失败"
  kill "${SERVER_PID}" 2>/dev/null
  exit 1
fi
