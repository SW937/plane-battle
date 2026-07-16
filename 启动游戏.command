#!/bin/bash
# 飞机大战 - 双击启动（macOS .command 文件）

cd "$(dirname "$0")"

PORT=8912
URL="http://127.0.0.1:${PORT}"

clear
echo "================================"
echo "       ✈  飞机大战  ✈"
echo "================================"
echo ""

# 若端口被占用，先尝试结束旧进程
if lsof -i :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  OLD_PID=$(lsof -i :${PORT} -sTCP:LISTEN -t 2>/dev/null | head -1)
  echo "检测到端口 ${PORT} 已被占用 (PID: ${OLD_PID})，正在重启..."
  kill "${OLD_PID}" 2>/dev/null
  sleep 0.5
fi

echo "正在启动游戏服务器..."
echo "地址: ${URL}"
echo ""
echo "提示: 关闭此窗口将停止游戏"
echo "================================"
echo ""

if ! command -v python3 &>/dev/null; then
  echo "错误: 未找到 Python3，请先安装 Python 3"
  read -r -p "按回车键关闭..."
  exit 1
fi

# 后台启动服务器
python3 -m http.server "${PORT}" --bind 127.0.0.1 &
SERVER_PID=$!

# 等待服务器就绪后再打开浏览器
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
  echo "游戏已在浏览器中打开！"
  echo ""
  wait "${SERVER_PID}"
else
  echo "错误: 服务器启动失败，请检查 Python 环境"
  kill "${SERVER_PID}" 2>/dev/null
  read -r -p "按回车键关闭..."
  exit 1
fi
