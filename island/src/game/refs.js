// 座標單位：地圖像素（map.png 為 948×948，原點在左上角）
export const playerPos = {
  x: 475, y: 0, z: 500,   // 出生點：小屋門前、石板步道（370-745）上方 1/3 處，面向螢幕；
                          // z 取 25 的倍數：25px 格距下縱向格線與牆線對齊
  set(x, y, z) { this.x = x; this.y = y; this.z = z },
}
export const joyVec = { x: 0, z: 0, run: false }   // 手機搖桿寫入，鍵盤合併
