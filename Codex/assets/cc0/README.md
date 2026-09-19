# 場景 CC0 模型

來源：[Kenney Nature Kit](https://kenney.nl/assets/nature-kit)，下載包版本 2.1。
授權：CC0 1.0，原始授權隨附於 `kenney-nature/License.txt`。

先前試用模型：`tree_detailed`、`tree_oak`、`ground_grass`、`fence_planks`。
現行樹木恢復使用 `tree_detailed`、`tree_oak`，維持上一版的比例、位置與配色；圍欄、地面及木棧道使用自製圓角模型。`scripts/cc0-island.mjs` 負責組裝輸出，其餘原始 GLB 留作參考。
`npm run model:export` 產生網站載入、Blender 可匯入的 `public/3d/vivi-island.glb`。

木板步道頂面高度約 0.105，霧面草地高度 0.065；碰撞與踩踏均由替換後網格建立。

木棧道現改為自製直邊木板，板縫 0.008，避免原 CC0 木板的梯形缺口；原始 path_wood 檔僅保留供參考。
