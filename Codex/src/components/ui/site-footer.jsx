import footer from '../../content/footer.html?raw'

// 兩種入口共用相同的品牌、社群連結與版權內容。
const markup = { __html: footer }
export default function SiteFooter() {
  return <div className="site-footer" dangerouslySetInnerHTML={markup}/>
}
