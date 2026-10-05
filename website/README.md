# Vivi 主網站

正式網域為 **https://vivichen.ai/**（尚未切換，見下方「正式網域上線待辦」）。目前測試站部署於 https://junsidequest.github.io/vivi/，固定使用粉紅色主題。

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

## 正式網域上線待辦（vivichen.ai）

> 狀態（2026-10-05）：程式裡的 SEO 設定已改成 vivichen.ai，但網域**還沒切過來**。
> 目前 `vivichen.ai` 的 DNS 指向 Zeabur 上的舊 WordPress 站，不是這個專案。

**已完成（在程式裡）**

- 主頁 `<title>`：Vivi 陳盈臻 - AI 陪跑教練
- `canonical`、`og:url` 指向 `https://vivichen.ai/`（`index.html`）；小島頁 canonical 指向 `/island/`
- `public/robots.txt`、`public/sitemap.xml`（列出 `/` 與 `/island/`）
- `island-app/404.html` 的「回到首頁」改連 `https://vivichen.ai/`
- 分享預覽圖 `public/og-image.jpg`（1200×630；換圖時用同檔名覆蓋即可）、`og:image`、`twitter:card=summary_large_image`
- 結構化資料 JSON-LD（`Person` + `WebSite`，在 `index.html` 的 head）
- `apple-touch-icon.png`（180×180，用 favicon 加白底，iPhone 加入主畫面時的圖示）
- 小島頁 `island-app/island/index.html` 的分享預覽設定（og／twitter，共用 `og-image.jpg`）
- 預先渲染：`npm run build` 會額外跑 SSR build 與 `scripts/prerender.mjs`，把主頁 HTML 寫進 `dist/index.html` 的 `#root`，不執行 JS 的爬蟲也讀得到內容；瀏覽器端用 `hydrateRoot` 接手（`src/main.jsx`）

**上線時要做的事（依順序）**

1. **決定主機並切 DNS**：要用 GitHub Pages，就在 repo 的 Settings → Pages → Custom domain 填 `vivichen.ai`，再到網域商把 DNS 從 Zeabur 改到 GitHub Pages（apex 用 A 記錄、`www` 用 CNAME），最後勾 Enforce HTTPS。如果改用其他主機，照該主機的說明做。
2. **確認舊站網址**：舊 WordPress 有被收錄的頁面只有 `/`、`/home-2/`、`/home-gemini/`、`/hello-world/`、`/category/uncategorized/`、`/author/vivichen/`。切換後除了首頁都會變 404，影響不大。主機支援轉址的話，建議把它們 301 轉到首頁。
3. **Google Search Console**（https://search.google.com/search-console）：
   - 新增「網域」資源 `vivichen.ai`，到網域商加 TXT 記錄完成驗證。如果舊 WordPress 已經驗證過，可以沿用。
   - 「Sitemap」提交 `https://vivichen.ai/sitemap.xml`。舊的 `sitemap_index.xml` 會失效，可以在那裡移除。
   - 「網址審查」輸入 `https://vivichen.ai/`，按「要求建立索引」。
4. **（建議）Bing Webmaster Tools**：可以直接從 Search Console 匯入，並提交同一份 sitemap。
5. **上線後檢查**：
   - `https://vivichen.ai/robots.txt`、`/sitemap.xml`、`/island/` 都要能開
   - 隨便打一個不存在的路徑，會出現 404 頁，按鈕會回首頁
   - 用 LINE 或 FB 分享首頁網址，看預覽是否正確

**之後要更新的**

- 新增頁面時，加進 `public/sitemap.xml`，並更新 `lastmod`
- 各 tab（口碑推薦、課程主題）的所有 panel 都會輸出到 HTML，沒選到的用 `hidden` 隱藏；新增 tab 時請沿用這個做法，不要改回只渲染選中的那一個，否則爬蟲讀不到
- 改元件時注意：render 階段（不在 `useEffect` 裡）不能用 `window`、`document`、`matchMedia`、`Math.random`、`Date`，否則 build 會失敗，或瀏覽器端 hydration 不一致；站內路徑一律用 `sitePath()`（輸出相對路徑）

## 未來的 /blog/（尚未建立）

之後會在 `https://vivichen.ai/blog/` 放文章。現在還沒有，所以**不要先放空的 /blog/ 頁面**：沒有內容的頁面對 SEO 是扣分。第一篇文章上線時，每篇都要做到：

- 每篇有獨立網址（例如 `/blog/文章-slug/`），網址建議用英文或拼音
- 內容要預先渲染或本來就是靜態 HTML，不能只靠 JS 產生（原因同主頁）
- 每篇有自己的 `<title>`、meta description、`canonical`、og:title／og:description／og:image（可以沿用 `og-image.jpg`，有專屬封面更好）
- 加 `BlogPosting` 結構化資料（JSON-LD），`author` 指向主頁的 `https://vivichen.ai/#person`
- 每篇都加進 `public/sitemap.xml`；`/blog/` 列表頁也要加
- 主頁導覽或頁尾加上「文章」連結，讓爬蟲找得到
- 部署：GitHub Actions 目前合併主頁和小島兩個產物。blog 不論用什麼工具產生，都要輸出到最終發布目錄的 `blog/` 底下，並修改根目錄的 `.github/workflows/pages.yml`
