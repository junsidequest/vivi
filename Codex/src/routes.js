export function resolveRoute(href) {
  const url = new URL(href)
  const path = url.pathname.replace(/index\.html$/, '')
  const match = path.match(/\/(island|about)\/?$/)
  const base = match ? path.slice(0, match.index + 1) : path.endsWith('/') ? path : `${path}/`
  const legacy = url.searchParams.get('view')
  const view = legacy === 'island' || legacy === 'professional' ? legacy : match?.[1] === 'island' ? 'island' : match?.[1] === 'about' ? 'professional' : 'welcome'
  const target = `${base}${view === 'island' ? 'island/' : view === 'professional' ? 'about/' : ''}`
  url.searchParams.delete('view')
  const search = url.searchParams.toString()
  const canonical = target + (search ? `?${search}` : '') + url.hash
  return {base, view, canonical, redirect: url.pathname + new URL(href).search + url.hash !== canonical}
}
const route = typeof window === 'undefined' ? null : resolveRoute(window.location.href)
export const sitePath = path => `${route.base}${path}`
export const currentRoute = route
