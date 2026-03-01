import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SyncProvider } from './SyncContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SyncProvider>
      <App />
    </SyncProvider>
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {})
  })
}
