# 部署與交接說明

## 可重現範圍

目前網站是兩個 React / Vite 靜態前端專案，主頁與 Three.js 小島共用一個部署站台。正式使用的圖片、媒體封面、Logo、模型與材質已納入 Git。沒有需設定的私密 API 金鑰或資料庫；LINE、表單、課程、媒體報導是外部連結，Email 使用郵件連結。

取得 GitHub 最新 main，使用 Node.js 22 與兩份 package-lock.json 執行 npm ci，可重建相同程式與素材。主頁已無 Google Fonts 載入依賴；小島的外部字體宣告、作業系統字型渲染、瀏覽器及 WebGL 裝置差異仍可能影響外觀；這不是完全離線、逐像素一致的封裝。

## 目錄與修改入口

- `src/Professional.jsx`：主頁架構、服務課程與引言。
- `src/professional.css`：主頁樣式及主題變數。
- `src/content/reviews.json`：推薦原文、署名、highlight 片段。
- `src/content/media-coverage.json`：媒體連結、日期、圖片與排序（依陣列順序顯示）。
- `src/components/ui/media-coverflow.*`：媒體輪播與樣式。
- `src/components/ui/marquee-01.*`：推薦 tab、卡片與合作 Logo。
- `public/img/`：主頁部署素材；`media/` 是媒體圖片。
- `island-app/src/`：小島互動、路由、3D 場景；`ui/iris.js` 是圓圈轉場。
- `island-app/public/`：小島的模型、圖片與材質。
- `island-app/src/assets/fonts/`：粉圓體與 OFL 授權。
- `island-app/about/index.html`：舊介紹頁轉回主頁。
- `island-app/404.html`：找不到頁面時的畫面。
- 儲存庫根目錄 `.github/workflows/pages.yml`：正式部署流程，不在 website 目錄內。

兩個專案各有 package.json 與 lockfile。`node_modules/`、`dist/` 是安裝／建置產物，不需要交接。舊版、草稿、截圖、原始 PDF 不影響目前網站執行；請以 GitHub 追蹤的檔案為交接基準。

## 字體來源

| 區域 | 字體 | 提供方式 |
| --- | --- | --- |
| 主頁 | Noto Sans TC、Noto Serif TC、Inter Tight、Instrument Serif | `public/fonts/fonts.css` 與本地 WOFF2 分片，附各字體 OFL 授權 |
| 小島 | jf open 粉圓 2.1 | `island-app/src/assets/fonts/jf-openhuninn-2.1.woff2`，由 Vite 打包 |
| 小島 HTML 額外宣告 | Baloo 2、Mochiy Pop One、Press Start 2P、Noto Sans TC | Google Fonts；實際使用依各元件 CSS |

保留 `jf-openhuninn-OFL.txt` 與 `public/fonts/` 中四份 OFL 授權。主頁已改用本地 @font-face，保留原有字重與 unicode-range 分片，使用者無需安裝字體。部署時須完整保留 public/fonts；小島 HTML 的 Google Fonts 宣告尚未轉換，若無法載入會使用 fallback。

## 本機開發

以下指令從 website 目錄執行：

```sh
npm ci
npm ci --prefix island-app
```

分兩個終端機啟動：

```sh
npm run dev
```

```sh
npm run dev --prefix island-app
```

主頁 http://127.0.0.1:8796/，小島 http://127.0.0.1:8795/island/。開發模式互連使用固定 8796 / 8795，應保持兩個 port 可用；Vite 若改用其他 port，跨頁連結也需同步調整。

## 完整正式建置

從 website 目錄執行，順序與 GitHub Actions 相同：

```sh
npm ci --prefix island-app
npm run build --prefix island-app
npm ci
npm run build
cp -R dist/. island-app/dist/
```

**最終發布目錄是 `website/island-app/dist/`**，不要只發布 website/dist。合併時小島產物先建立，主頁覆蓋根 index.html；保留 island/、about/、404.html 及兩邊 assets。

上述 cp 是 macOS/Linux 指令；Windows 可用 WSL 執行，或以檔案複製工具把 dist 全部內容覆蓋合併至 island-app/dist（不是再建立一層 dist）。

可在合併後用 Python 預覽：

```sh
python3 -m http.server 8800 --directory island-app/dist
```

開啟 http://127.0.0.1:8800/ 與 /island/。不要直接雙擊 HTML 使用 file:// 預覽。

## GitHub Pages 與其他主機

GitHub Pages 設定應選 GitHub Actions 作為發布來源；push main 會觸發根目錄 workflow。完整搬移 GitHub 部署時，除了 website，還要帶上 `.github/workflows/pages.yml`。目前不需自訂 repository secret。

其他靜態主機請發布合併產物，支援目錄 index.html；主頁根路徑及 /island/ 應加尾端斜線。不要把所有請求都強制改寫成主頁 index.html，否則小島入口可能失效。自訂主機的 404 規則需指向提供的 404.html。

換網域或 repository 名稱前，尤其檢查 `island-app/404.html`：回首頁連結目前固定為 https://junsidequest.github.io/vivi/。主要站內互連使用相對根路徑，但仍應逐一實測新部署前綴。也請檢查網站標題、Email、LINE、表單與課程連結是否符合新站需求。

## 上線檢查

1. 主頁與小島可以互相進出，刷新 /island/ 不會錯誤。
2. /about/ 舊連結回主頁；不存在路徑的 404 回到正確網域。
3. 媒體輪播圖片、Logo、認證、小島模型沒有 404。
4. 推薦展開、鈴鐺定位、LINE、Email、外連按鈕可使用。
5. 桌面與手機均確認文字換行、tab、手勢及小島控制。
6. 等待 GitHub Actions 部署成功，再確認正式網址；本機成功不等於已發布。

維護提醒：今周刊現有報導連結曾觀察到轉回官網首頁，需取得正確文章連結後更新。學員 Eric 等既有產業／職位為先前展示用資料，正式對外交接時應與站主確認真實對應。
