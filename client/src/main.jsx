import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { MinerProvider } from './context/MinerContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <MinerProvider>
        <App />
      </MinerProvider>
    </ThemeProvider>
  </StrictMode>,
)
