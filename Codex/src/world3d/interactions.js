export function nearbyPlace(places,position){
  let result=null,nearest=Infinity
  for(const [id,place] of Object.entries(places)){
    const d=Math.hypot(position.x-place.stand.x,position.z-place.stand.z)
    const bounds=place.interactionBounds
    const circle=place.interactionCircle
    const inside=bounds
      ? position.x>=bounds.minX&&position.x<=bounds.maxX&&position.z>=bounds.minZ&&position.z<=bounds.maxZ
      : circle
        ? Math.hypot(position.x-circle.x,position.z-circle.z)<circle.radius
        : d<(place.range??1.35)
    if(inside&&d<nearest){nearest=d;result=id}
  }
  return result
}
export function isTextInput(target){
  return Boolean(target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName))
}
