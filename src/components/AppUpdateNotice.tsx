import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function AppUpdateNotice() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [available, setAvailable] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let active = true

    navigator.serviceWorker.ready.then((current) => {
      if (!active) return
      setRegistration(current)
      if (current.waiting) setAvailable(true)
      current.addEventListener('updatefound', () => {
        const worker = current.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) setAvailable(true)
        })
      })
      current.update().catch(() => undefined)
    }).catch(() => undefined)

    const onControllerChange = () => window.location.reload()
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => {
      active = false
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  if (!available || dismissed) return null

  function applyUpdate() {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[80] mx-auto max-w-xl rounded-2xl border border-cyan-200 bg-slate-950 p-4 text-white shadow-2xl" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <RefreshCw className="mt-1 h-5 w-5 shrink-0 text-cyan-300" />
        <div className="flex-1"><p className="font-black">A newer KirthiVerse version is ready</p><p className="mt-1 text-sm leading-6 text-slate-300">Refresh when convenient. Local learner progress will remain on this device.</p><button type="button" onClick={applyUpdate} className="mt-3 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">Update now</button></div>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss update notice" className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20"><X className="h-4 w-4" /></button>
      </div>
    </aside>
  )
}
