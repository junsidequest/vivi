// 固定 45 度俯視鏡頭：世界中的箭頭下緣距螢幕底部保留 20px。
export function maxFollowZ(marker, targetY, halfHeight, viewportHeight) {
  const bottomInset = 32 + 20 // 箭頭按鈕高度與底部留白
  return marker[2] - marker[1] + targetY - Math.SQRT2 * halfHeight * (1 - 2 * bottomInset / Math.max(1, viewportHeight))
}
