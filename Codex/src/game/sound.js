// 音訊整組暫時停用（2026-08-08）：保留介面、顯式 no-op，
// 呼叫端（step/pop/quack/bgm）一律不需改；日後要恢復，從 git 歷史還原本檔即可。
export const sound = {
  unlocked: false,
  unlock() {},
  play() {},
}
