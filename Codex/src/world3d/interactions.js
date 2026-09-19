export function nearbyPlace(places,position){
  let result=null,nearest=Infinity
  for(const [id,place] of Object.entries(places)){
    const d=Math.hypot(position.x-place.stand.x,position.z-place.stand.z)
    const bounds=place.interactionBounds
    const inside=bounds
      ? position.x>=bounds.minX&&position.x<=bounds.maxX&&position.z>=bounds.minZ&&position.z<=bounds.maxZ
      : d<(place.range??1.35)
    if(inside&&d<nearest){nearest=d;result=id}
  }
  return result
}
export function isTextInput(target){
  return Boolean(target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName))
}
