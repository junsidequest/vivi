# Vivi 主網站

主站部署於 https://junsidequest.github.io/vivi/，固定使用粉紅色主題。

## 開發

在此目錄執行 `npm ci`、`npm run dev`，預覽位址為 http://127.0.0.1:8796/。
`npm run build` 產生 `dist/`。

## 結構

- `src/Professional.jsx`：主要頁面與課程資料
- `src/professional.css`：樣式與響應式版面
- `src/components/`：情境卡片、推薦與導覽
- `public/`：網站使用的圖片與圖示

GitHub Actions 先建置 `island-app/` 中保留的小島與舊連結，再以本目錄的建置結果覆蓋首頁。選角色頁不再作為正式首頁。

主頁原始碼位於 `src/`，小島原始碼位於 `island-app/src/`；小島使用 `npm run dev --prefix island-app` 啟動於 8795，主頁使用 8796。

## 完整交接與部署

請先閱讀 [部署與交接說明](docs/DEPLOYMENT.md)。**只建置本目錄不會包含小島**；正式網站必須合併兩個 Vite 專案的產物。

主頁四種字體已本地託管於 `public/fonts/`（含授權文件），小島粉圓體也有本地檔案；小島 HTML 的其他 Google Fonts 宣告仍保留。原始素材、舊版備份與本機實驗不屬於部署必需檔案；交接建議從 GitHub 最新 `main` 重新 clone，避免把本機歷史資料一起複製。
