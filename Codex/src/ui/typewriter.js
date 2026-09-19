export const sliceByTime = (text, elapsedMs, charMs = 45) =>
  text.slice(0, Math.floor(elapsedMs / charMs))
