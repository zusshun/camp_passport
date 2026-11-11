import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { LIMITS, formatShortDay, type Lesson } from '@/lib/passport'
import { stampStyleFor } from '@/lib/stampArt'
import { Stamp } from '@/components/Stamp'

interface StampGridProps {
  lessons: Lesson[]
  /** Id of the lesson that was just completed, so only it plays the stamping animation. */
  justStampedId: string | null
  onOpen: (id: string) => void
  onAdd: () => void
}

export function StampGrid({ lessons, justStampedId, onOpen, onAdd }: StampGridProps) {
  const atLimit = lessons.length >= LIMITS.lessons
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {lessons.map((lesson, index) => {
        const style = stampStyleFor(lesson.id)
        const stamping = lesson.id === justStampedId
        const title = lesson.title.trim() || 'Untitled lesson'
        return (
          <li key={lesson.id}>
            <button
              type="button"
              onClick={() => onOpen(lesson.id)}
              aria-label={`Lesson ${index + 1}: ${title}. ${lesson.completed ? 'Completed' : 'Not completed yet'}. Open details`}
              className="group flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-ink/15 bg-paper/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-lav-deep/40 hover:bg-paper hover:shadow-paper active:scale-[0.98]"
            >
              <div className="relative aspect-square w-full max-w-[132px]">
                {lesson.completed ? (
                  <motion.div
                    key="stamped"
                    className="ink-blend absolute inset-0"
                    style={{ rotate: style.rotation }}
                    initial={stamping ? { scale: 2.1, opacity: 0, rotate: style.rotation - 14 } : false}
                    animate={{ scale: 1, opacity: 0.95, rotate: style.rotation }}
                    transition={{ type: 'spring', stiffness: 380, damping: 17, mass: 0.8 }}
                  >
                    {stamping ? (
                      <span
                        className="stamp-ripple pointer-events-none absolute inset-0 rounded-full border-2"
                        style={{ borderColor: style.color }}
                      />
                    ) : null}
                    <Stamp
                      number={index + 1}
                      style={style}
                      dateLabel={formatShortDay(lesson.completedAt)}
                      variant="filled"
                    />
                  </motion.div>
                ) : (
                  <div className="absolute inset-0 transition group-hover:scale-[1.03]">
                    <Stamp number={index + 1} style={style} variant="empty" />
                  </div>
                )}
              </div>
              <span className="mt-2 line-clamp-2 min-h-[2.5rem] w-full break-words text-sm font-medium leading-5 text-ink text-pretty">
                {title}
              </span>
              <span
                className={`mt-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                  lesson.completed ? 'text-lav-deep' : 'text-ink-faint'
                }`}
              >
                {lesson.completed ? 'Stamped' : 'Not yet'}
              </span>
            </button>
          </li>
        )
      })}
      <li>
        <button
          type="button"
          onClick={onAdd}
          disabled={atLimit}
          className="flex h-full min-h-[11.5rem] w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-lav-deep/35 bg-lav-soft/50 p-3 text-lav-deep transition hover:bg-lav-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-paper shadow-paper">
            <Plus size={22} aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-bold">{atLimit ? 'Lesson limit reached' : 'Add a lesson'}</span>
        </button>
      </li>
    </ul>
  )
}
