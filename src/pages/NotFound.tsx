import { AlertCircle } from 'lucide-react'
import { Link } from 'wouter'

export default function NotFound() {
  return (
    <main className="container flex min-h-[65vh] flex-col items-center justify-center py-20 text-center" aria-labelledby="not-found-title">
      <AlertCircle className="mb-6 h-24 w-24 text-accent" aria-hidden="true" />
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Error 404</p>
      <h1 id="not-found-title" className="mb-4 text-4xl font-bold sm:text-5xl">Page not found</h1>
      <p className="mb-10 max-w-md text-lg text-muted-foreground">
        This address is not part of the current KirthiVerse experience. Return to the homepage or continue with Learning Worlds.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary min-h-12 px-8 py-3">
          Back to Home
        </Link>
        <Link href="/learning-worlds" className="btn btn-secondary min-h-12 px-8 py-3">
          Open Learning Worlds
        </Link>
      </div>
    </main>
  )
}
