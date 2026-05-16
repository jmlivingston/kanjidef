import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const hasRefreshed = sessionStorage.getItem('pwa-refreshed')
      if (!hasRefreshed) {
        sessionStorage.setItem('pwa-updated', 'true')
        sessionStorage.setItem('pwa-refreshed', 'true')
        window.location.reload()
      }
    })

    let checkForUpdates
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true)
      },
      onRegisteredSW(swUrl, registration) {
        if (!registration) {
          return
        }

        checkForUpdates = () => registration.update()

        // Check periodically so installed PWAs pick up new builds without manual reinstall.
        window.setInterval(checkForUpdates, 60 * 60 * 1000)
      },
      onRegisterError(error) {
        console.error('Service worker registration failed:', error)
      },
    })

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && checkForUpdates) {
        checkForUpdates()
      }
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
