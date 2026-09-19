// 小螢幕與以觸控為主的裝置採用輕量呈現，橫向手機也適用。
export const MOBILE_QUERY = '(max-width: 640px), (hover: none) and (pointer: coarse)'
export const isMobilePresentation = () => window.matchMedia(MOBILE_QUERY).matches
