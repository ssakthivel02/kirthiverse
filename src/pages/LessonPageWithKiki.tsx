import { useState } from 'react'
import { useRoute } from 'wouter'
import { MessageCircle, X } from 'lucide-react'
import LessonPage from './LessonPage'
import KikiLessonCoach from '../components/KikiLessonCoach'
import { lessons } from '../content/lessons'

export default function LessonPageWithKiki() {
  const [, params] = useRoute('/lesson/:id')
  const [open, setOpen] = useState(false)
  const lessonId = params?.id ?? ''
  const lesson = lessons.find((item) => item.id === lessonId)

  return (
    <>
      <LessonPage />
      {lesson ? (
        <aside className="fixed bottom-4 right-4 z-40 w-[min(26rem,calc(100vw-2rem))]" aria-label="Kiki contextual lesson coach">
          {open ? (
            <div className="relative max-h-[min(78vh,44rem)] overflow-y-auto rounded-[1.75rem] shadow-2xl">
              <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white" aria-label="Close Kiki lesson coach"><X className="h-5 w-5" aria-hidden="true" /></button>
              <KikiLessonCoach lessonId={lesson.id} subject={lesson.subject} title={lesson.title} explanation={lesson.explanation} example={lesson.examples[0]} compact />
            </div>
          ) : (
            <button type="button" onClick={() => setOpen(true)} className="ml-auto flex min-h-14 items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 px-5 font-black text-white shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200" aria-label="Open Kiki lesson coach">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15" aria-hidden="true"><MessageCircle className="h-5 w-5" /></span>
              Ask Kiki about this lesson
            </button>
          )}
        </aside>
      ) : null}
    </>
  )
}
