import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/island/',
  plugins: [react()],
  build: {
    // 預設會把 max-width:720px 壓成 Media Queries Level 4 的 (width<=720px)。
    // 那個語法要 Safari 16.4+／Chrome 104+，較舊的手機瀏覽器會整段忽略，
    // 於是收合選單的漢堡鈕在手機上永遠不出現。指定較舊的目標就會保留原語法。
    cssTarget: ['safari13', 'chrome87'],
  },
  test: { environment: 'node' },
})
