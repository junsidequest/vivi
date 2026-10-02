import { sitePath } from '../../routes.js'
import footer from '../../content/footer.html?raw'

// 兩種入口共用相同的品牌、社群連結與版權內容。
const markup = { __html: footer.replace('__FOOTER_LOGO_URL__', sitePath('img/logo-black.png')) }
export default function SiteFooter() {
  return <div className="site-footer" dangerouslySetInnerHTML={markup}/>
}
