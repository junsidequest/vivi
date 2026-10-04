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
