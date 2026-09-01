import { useEffect, useState } from 'react'
import { CloudOff, Wifi } from 'lucide-react'

interface ConnectivityState {
  offlineRecoveryActive?: boolean
}

function hasOfflineRecoveryMarker() {
  return typeof document !== 'undefined' && Boolean(document.querySelector('meta[name="kvs-offline-recovery"][content="true"]'))
}

function offlineDocumentBanner() {
  return typeof document === 'undefined' ? null : document.getElementById('kvs-offline-document-banner')
}

export default function ConnectivityBanner() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine && !hasOfflineRecoveryMarker())
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    let restoredTimer: number | undefined
    let stateTimer: number | undefined
    let disposed = false
    const markOnline = () => {
      if (disposed) return
      offlineDocumentBanner()?.remove()
      setOnline(true)
      setShowRestored(true)
      restoredTimer = window.setTimeout(() => setShowRestored(false), 3500)
    }
    const markOffline = () => {
      if (disposed) return
      setOnline(false)
      setShowRestored(false)
      if (restoredTimer) window.clearTimeout(restoredTimer)
    }
    const onServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'KVS_OFFLINE_RECOVERY') markOffline()
      if (event.data?.type === 'KVS_CONNECTION_AVAILABLE') markOnline()
    }

    async function readServiceWorkerState() {
      if (!navigator.serviceWorker?.controller || disposed) return false
      try {
        const response = await fetch('/__kvs_connectivity__', { cache: 'no-store' })
        if (!response.ok) return false
        const state = await response.json() as ConnectivityState
        if (state.offlineRecoveryActive) markOffline()
        return Boolean(state.offlineRecoveryActive)
      } catch {
        if (!navigator.onLine || hasOfflineRecoveryMarker()) markOffline()
        return false
      }
    }

    const onControllerChange = () => {
      void readServiceWorkerState()
    }

    if (!navigator.onLine || hasOfflineRecoveryMarker()) markOffline()
    void readServiceWorkerState()
    void navigator.serviceWorker?.ready.then(() => readServiceWorkerState()).catch(() => undefined)
    stateTimer = window.setTimeout(() => void readServiceWorkerState(), 350)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    navigator.serviceWorker?.addEventListener('message', onServiceWorkerMessage)
    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange)
    return () => {
      disposed = true
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
      navigator.serviceWorker?.removeEventListener('message', onServiceWorkerMessage)
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange)
      if (restoredTimer) window.clearTimeout(restoredTimer)
      if (stateTimer) window.clearTimeout(stateTimer)
    }
  }, [])

  if (!online && offlineDocumentBanner()) return null
  if (online && !showRestored) return null

  return (
    <div role="status" aria-live="polite" data-connectivity={online ? 'restored' : 'offline'} className={`px-4 py-2 text-center text-sm font-bold ${online ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-950'}`}>
      <span className="inline-flex items-center gap-2">
        {online ? <Wifi className="h-4 w-4" aria-hidden="true" /> : <CloudOff className="h-4 w-4" aria-hidden="true" />}
        {online ? 'Connection restored. The latest saved learning files are available.' : 'You are offline. Installed lessons and progress saved on this device remain available; cloud services are not in use in this release.'}
      </span>
    </div>
  )
}
