import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unexpected application error' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[KirthiVerse] Uncaught render error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="grid min-h-screen place-items-center bg-[#071124] px-4 py-12 text-white">
        <section className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10" role="alert">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-300 text-slate-950">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-black">KirthiVerse needs a quick reset</h1>
          <p className="mt-4 leading-7 text-slate-200">
            Your saved learning progress remains on this device. Reload the page first; return home if the issue continues.
          </p>
          <details className="mt-5 rounded-xl bg-slate-950/40 p-4 text-left text-sm text-slate-300">
            <summary className="cursor-pointer font-bold text-white">Technical detail</summary>
            <code className="mt-3 block break-words">{this.state.message}</code>
          </details>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950">
              <RotateCcw className="h-4 w-4" /> Reload
            </button>
            <a href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 font-black text-white hover:bg-white/10">
              <Home className="h-4 w-4" /> Return home
            </a>
          </div>
        </section>
      </main>
    )
  }
}
