import React from 'react'
import ReactDOM from 'react-dom/client'
import './content/registerSupplementalQuizzes'
import App from './app/App'
import './app/index.css'
import './app/print.css'

const SERVICE_WORKER_RELOAD_GUARD = 'kvs-service-worker-reload'
const SERVICE_WORKER_RELOAD_TIMEOUT_MS = 15_000

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register('/sw.js', {
    updateViaCache: 'none',
  })

  const activateWaitingWorker = () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }

  if (registration.waiting) activateWaitingWorker()

  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing
    if (!installingWorker) return

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        activateWaitingWorker()
      }
    })
  })

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (sessionStorage.getItem(SERVICE_WORKER_RELOAD_GUARD) === '1') return
    sessionStorage.setItem(SERVICE_WORKER_RELOAD_GUARD, '1')
    window.location.reload()
  })

  await registration.update()

  window.setTimeout(() => {
    sessionStorage.removeItem(SERVICE_WORKER_RELOAD_GUARD)
  }, SERVICE_WORKER_RELOAD_TIMEOUT_MS)
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    registerServiceWorker().catch((error: unknown) => {
      console.warn('[KirthiVerse] Offline support could not be enabled.', error)
    })
  })
}
