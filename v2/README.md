# Vivi 黑白版 v2

以「把 AI 用進每天的工作中」為主軸的獨立品牌網站。由 Codex 黑白版複製後重新設計，原站未修改。

## 本機預覽

在此目錄執行 `npm ci` 與 `npm run dev`，開啟 http://127.0.0.1:8796/ 。

`npm run build` 產生正式檔案至 `dist`；`npm run preview` 可檢查正式建置。若開發預覽仍在執行，可用 `npm run preview -- --port 8797`。

## 設計與內容

設計方向見 `docs/design-direction.md`，驗證紀錄見 `docs/quality-review.md`。

- 編輯式版面：章節編號、大字標、細線分隔；彩色人像是唯一色彩。
- 招牌段落「翻成人話」：捲動驅動的術語翻譯舞台。
- 工作情境示範、公開課程分頁（線上／實體）、推薦分頁與可展開的長推薦。
- 鍵盤操作、焦點樣式、減少動態效果時改為靜態呈現。

## 主要檔案

- `src/Professional.jsx`：整頁結構、資料與捲動互動。
- `src/professional.css`：設計系統與全部版面樣式。
- `src/components/WorkSketch.jsx`：工作情境互動示範。
- `src/components/ui/navigation-menu-05.jsx`：導覽及手機全螢幕選單。
- `src/components/ui/marquee-01.jsx`、`marquee-01.css`：推薦、媒體報導與合作 logo。
- `src/ui/useProcessNumbers.js`：服務流程編號隨捲動亮起。
- `src/content/`：推薦、媒體與頁尾資料。
- `public/img/vivichen-700.webp`、`vivichen-1100.webp`：首屏人像的響應式版本。

v2 不使用 3D、遊戲狀態或原版載入畫面。部分複製的備用元件與素材仍保留，但不由新入口載入。
