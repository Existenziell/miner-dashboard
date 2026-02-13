import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App.jsx'
import { ThemeProvider } from '@/context/ThemeContext'
import { ConfigProvider } from '@/context/ConfigContext'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </ThemeProvider>
  </StrictMode>,
)
