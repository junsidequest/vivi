#!/bin/zsh
# 雙擊啟動 Vivi 網站（主頁 + 2D 小島正式版）
# port 從 8787 起往上找第一個沒人用的，被別的專案佔走也不會卡住
cd "$(dirname "$0")"

SERVE=/tmp/vivi-serve
PIDFILE=/tmp/vivi-serve.pid

# 只關掉「上一次這支腳本啟動的」伺服器——不碰其他人佔用的 port
# （舊版是 lsof -ti:8787 | xargs kill，會誤殺剛好用同一個 port 的別的服務）
if [[ -f "$PIDFILE" ]]; then
  OLD=$(cat "$PIDFILE")
  if [[ -n "$OLD" ]] && ps -p "$OLD" -o comm= 2>/dev/null | grep -qi python; then
    kill "$OLD" 2>/dev/null
    sleep 0.3
  fi
  rm -f "$PIDFILE"
fi

# 找第一個可用 port
PORT=8787
while lsof -ti:$PORT >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  if (( PORT > 8810 )); then
    echo "8787-8810 都被佔用了，先關掉一些服務再試。"
    read "?按 Enter 關閉視窗"
    exit 1
  fi
done

# 組出服務目錄（island 指向打包好的 dist）
rm -rf "$SERVE" && mkdir -p "$SERVE"
ln -s "$PWD/index.html" "$SERVE/index.html"
ln -s "$PWD/index_v1.html" "$SERVE/index_v1.html"   # 小島「關於我」空間以 iframe 嵌入此頁
ln -s "$PWD/img" "$SERVE/img"
ln -s "$PWD/island/dist" "$SERVE/island"

# 一律送 no-store：重新打包後瀏覽器才不會沿用舊的 index.html / 資產快取
cd "$SERVE" && PORT=$PORT nohup python3 -c '
import http.server, os
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
http.server.ThreadingHTTPServer(("", int(os.environ["PORT"])), H).serve_forever()
' >/dev/null 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PIDFILE"
disown
sleep 1

open "http://localhost:$PORT/island/"
echo "Vivi 網站已啟動：http://localhost:$PORT/"
echo "（關掉：kill \$(cat $PIDFILE)）"
