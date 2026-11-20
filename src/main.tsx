import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
try {
  const t = localStorage.getItem('odoo20-theme')
  document.documentElement.dataset.theme = t === 'dark' || t === 'light' ? t : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
} catch { document.documentElement.dataset.theme = 'light' }
createRoot(document.getElementById('root')!).render(<App />)
