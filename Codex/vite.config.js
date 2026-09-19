import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({base:'./',plugins:[react()],build:{cssTarget:['safari13','chrome87']},test:{environment:'node'}})
