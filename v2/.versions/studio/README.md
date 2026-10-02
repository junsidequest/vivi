# Vivi 黑白版 v2

以「把 AI 用進每天的工作中」為主軸的獨立品牌網站。由 Codex 黑白版複製後重新設計，原站未修改。

## 本機預覽

在此目錄執行 `npm ci` 與 `npm run dev`，開啟 http://127.0.0.1:8796/ 。

`npm run build` 產生正式檔案至 `dist`；`npm run preview` 可檢查正式建置。若開發預覽仍在執行，可用 `npm run preview -- --port 8797`。

## 設計與內容

- 混合字體主標、彩色真人構圖、淡色材質與深色工作情境面板。
- 三種可操作的工作情境示範，明確標示為應用示範。
- 保留原有經歷、認證、課程、完整推薦及媒體連結。
- 響應式導覽、公開課程分頁、推薦分頁、文字式橫向瀏覽按鈕。
- 鍵盤操作、焦點移交、減少動態效果偏好。
- 本頁的服務諮詢使用既有表單，未加入無連結的預約入口或模型版連結。

## 主要檔案

- `src/Professional.jsx`：主頁與頁面互動。
- `src/professional.css`：基礎樣式。
- `src/studio.css`：本輪視覺、材質與響應式設計。
- `src/components/Services.jsx`、`services.css`：合作方式與公開課程分頁。
- `src/components/WorkSketch.jsx`：工作情境互動示範。
- `src/components/ui/navigation-menu-05.jsx`：導覽及手機選單。
- `src/components/ui/marquee-01.jsx`：推薦、媒體及橫向瀏覽。
- `src/content/`：原有內容、推薦與媒體資料。
- `docs/design-direction.md`：設計方向及驗收要求。
- `docs/quality-review.md`：實際驗證紀錄與範圍。

v2 不使用 3D、遊戲狀態或原版載入畫面。部分複製的備用元件與素材仍保留，但不由新入口載入。
