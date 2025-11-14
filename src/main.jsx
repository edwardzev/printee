import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import { ActionLoggerProvider } from '@/hooks/useActionLogger'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ActionLoggerProvider>
      <App />
    </ActionLoggerProvider>
  </React.StrictMode>
);