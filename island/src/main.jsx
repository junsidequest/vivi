import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { Fallback } from './ui/Fallback.jsx'
import './styles.css'

// 渲染期間拋錯（素材載入失敗等）時退回靜態提示頁
class ErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error) {
    console.error('[island] render error, falling back:', error)
  }
  render() {
    return this.state.hasError ? <Fallback /> : this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
