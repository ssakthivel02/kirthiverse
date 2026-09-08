import { motion, useReducedMotion } from 'framer-motion'

export type KikiTeacherState = 'idle' | 'listening' | 'explaining' | 'celebrating'

type Props = {
  state?: KikiTeacherState
  compact?: boolean
}

const stateLabel: Record<KikiTeacherState, string> = {
  idle: 'Kiki is ready to learn with you',
  listening: 'Kiki is listening',
  explaining: 'Kiki is explaining',
  celebrating: 'Kiki is celebrating your progress',
}

export default function KikiTeacherCharacter({ state = 'idle', compact = false }: Props) {
  const reduceMotion = useReducedMotion()
  const isCelebrating = state === 'celebrating'
  const isListening = state === 'listening'
  const isExplaining = state === 'explaining'

  return (
    <div className="relative grid place-items-center" role="img" aria-label={stateLabel[state]}>
      {!reduceMotion && (
        <>
          <motion.span
            className="absolute h-28 w-28 rounded-full bg-cyan-300/25 blur-2xl sm:h-36 sm:w-36"
            animate={{ scale: isListening ? [1, 1.18, 1] : [1, 1.08, 1], opacity: [0.45, 0.75, 0.45] }}
            transition={{ duration: isListening ? 1.1 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          {isCelebrating && [0, 1, 2, 3].map((index) => (
            <motion.span
              key={index}
              className="absolute h-3 w-3 rounded-full bg-amber-300"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: [0, index % 2 === 0 ? 62 : -62],
                y: [0, index < 2 ? -70 : 68],
                opacity: [0, 1, 0],
                scale: [0.5, 1.15, 0.6],
              }}
              transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.18 }}
              aria-hidden="true"
            />
          ))}
        </>
      )}

      <motion.div
        className={`relative ${compact ? 'h-28 w-28' : 'h-44 w-44 sm:h-52 sm:w-52'}`}
        animate={reduceMotion ? undefined : {
          y: isExplaining ? [0, -5, 0] : [0, -8, 0],
          rotate: isCelebrating ? [0, -2, 2, 0] : [0, -1.5, 1.5, 0],
        }}
        transition={{ duration: isCelebrating ? 1.1 : 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 220 220" className="h-full w-full drop-shadow-2xl" aria-hidden="true">
          <defs>
            <linearGradient id="kiki-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="52%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="kiki-face" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
          </defs>

          <ellipse cx="110" cy="195" rx="57" ry="12" fill="#0f172a" opacity="0.12" />
          <path d="M58 70 L110 43 L162 70 L151 91 L69 91 Z" fill="#0f172a" />
          <path d="M110 43 L177 69 L110 94 L43 69 Z" fill="#1e293b" />
          <path d="M161 74 Q181 89 168 113" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
          <circle cx="168" cy="115" r="7" fill="#fbbf24" />

          <rect x="46" y="80" width="128" height="105" rx="50" fill="url(#kiki-body)" />
          <rect x="62" y="96" width="96" height="66" rx="30" fill="url(#kiki-face)" />

          <motion.g
            animate={reduceMotion ? undefined : isListening ? { scaleY: [1, 0.25, 1] } : { scaleY: [1, 1, 0.2, 1] }}
            transition={{ duration: isListening ? 1.25 : 3.8, repeat: Infinity }}
            style={{ transformOrigin: '110px 124px' }}
          >
            <circle cx="91" cy="123" r="7" fill="#0f172a" />
            <circle cx="129" cy="123" r="7" fill="#0f172a" />
          </motion.g>

          <path
            d={isExplaining ? 'M91 143 Q110 158 129 143' : isCelebrating ? 'M86 141 Q110 166 134 141' : 'M94 143 Q110 153 126 143'}
            fill="none"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinecap="round"
          />

          <circle cx="70" cy="134" r="7" fill="#fb7185" opacity="0.55" />
          <circle cx="150" cy="134" r="7" fill="#fb7185" opacity="0.55" />

          <path d="M48 139 Q23 145 28 165 Q35 181 57 169" fill="none" stroke="#34d399" strokeWidth="14" strokeLinecap="round" />
          <path d="M172 139 Q197 145 192 165 Q185 181 163 169" fill="none" stroke="#8b5cf6" strokeWidth="14" strokeLinecap="round" />

          <circle cx="110" cy="172" r="9" fill="#f8fafc" />
          <path d="M106 168 L110 160 L114 168 L122 172 L114 176 L110 184 L106 176 L98 172 Z" fill="#fbbf24" />
        </svg>
      </motion.div>
    </div>
  )
}
