import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
export default defineConfig({base:'./',plugins:[react()],build:{rolldownOptions:{input:{main:fileURLToPath(new URL('./index.html',import.meta.url)),island:fileURLToPath(new URL('./island/index.html',import.meta.url)),about:fileURLToPath(new URL('./about/index.html',import.meta.url))}},cssTarget:['safari13','chrome87']},test:{environment:'node'}})
