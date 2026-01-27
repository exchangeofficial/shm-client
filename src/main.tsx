import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import App from './App.tsx'
import { config } from './config'

document.title = config.APP_NAME;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
