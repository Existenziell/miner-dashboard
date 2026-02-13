import '@/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from '@/context/ConfigContext'
import { ThemeProvider } from '@/context/ThemeContext'
import App from '@/App.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </ThemeProvider>
  </StrictMode>,
)
