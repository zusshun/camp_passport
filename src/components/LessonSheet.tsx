import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ExternalLink, Trash2 } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { Stamp } from '@/components/Stamp'
import { LIMITS, formatDateTime, formatShortDay, safeHref, type Lesson } from '@/lib/passport'
import { stampStyleFor } from '@/lib/stampArt'

interface LessonSheetProps {
  open: boolean
  lesson: Lesson | null
  index: number
  total: number
  autoFocusTitle: boolean
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Pick<Lesson, 'title' | 'link' | 'note'>>) => void
  onComplete: (id: string, completed: boolean) => void
  onMove: (id: string, direction: -1 | 1) => void
  onDelete: (id: string) => void
}

export function LessonSheet({
  open,
  lesson,
  index,
  total,
  autoFocusTitle,
  onClose,
  onUpdate,
  onComplete,
  onMove,
  onDelete,
}: LessonSheetProps) {
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !autoFocusTitle) return
    const t = window.setTimeout(() => {
      titleRef.current?.focus()
      titleRef.current?.select()
    }, 80)
    return () => window.clearTimeout(t)
  }, [open, autoFocusTitle])

  const current = lesson
  const style = current ? stampStyleFor(current.id) : null
  const href = current ? safeHref(current.link) : null
  const linkInvalid = current ? current.link.trim().length > 0 && !href : false

  return (
    <Modal open={open && lesson !== null} onClose={onClose} title={`Lesson ${index + 1}`}>
      {current && style ? (
        <div key={current.id} className="space-y-5">
          {current.isSample ? (
            <p className="rounded-2xl bg-lav-soft px-4 py-3 text-sm text-lav-deep text-pretty">
              This is a sample lesson, not part of the official Arc 101 curriculum. Rename it to match your camp.
            </p>
          ) : null}

          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0">
              <div className={current.completed ? 'ink-blend h-full w-full' : 'h-full w-full'} style={{ transform: `rotate(${style.rotation}deg)` }}>
                <Stamp
                  number={index + 1}
                  style={style}
                  dateLabel={formatShortDay(current.completedAt)}
                  variant={current.completed ? 'filled' : 'empty'}
                />
              </div>
            </div>
            <label className="block min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">Lesson title</span>
              <input
                ref={titleRef}
                className="field font-display text-lg font-bold tracking-tight"
                value={current.title}
                maxLength={LIMITS.title}
                placeholder="Name this lesson"
                onChange={(e) => onUpdate(current.id, { title: e.target.value })}
              />
            </label>
          </div>

          <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-ink/20 bg-paper px-4 py-3 transition hover:border-lav-deep/50 has-[:checked]:border-lav-deep/50 has-[:checked]:bg-lav-soft/60">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={current.completed}
              onChange={(e) => onComplete(current.id, e.target.checked)}
            />
            <span
              aria-hidden="true"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-ink/40 bg-paper text-paper transition peer-checked:border-lav-deep peer-checked:bg-lav-deep peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lav-deep"
            >
              {current.completed ? <Check size={18} strokeWidth={3} className="check-pop" /> : null}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[15px] font-bold text-ink">
                {current.completed ? 'Lesson completed' : 'Mark this lesson as completed'}
              </span>
              <span className="block text-sm text-ink-soft">
                {current.completed
                  ? `Stamped on ${formatDateTime(current.completedAt)}. Uncheck to undo.`
                  : 'You will get a stamp, dated today.'}
              </span>
            </span>
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
              Reference link (optional)
            </span>
            <input
              className="box-field mt-1"
              inputMode="url"
              autoComplete="off"
              value={current.link}
              maxLength={LIMITS.link}
              placeholder="https://example.com/lesson"
              onChange={(e) => onUpdate(current.id, { link: e.target.value })}
              aria-invalid={linkInvalid}
            />
            {linkInvalid ? (
              <span className="mt-1 block text-sm text-[#B4412D]">Enter a web address that starts with https://</span>
            ) : null}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-lav-deep underline-offset-4 hover:underline"
              >
                Open reference <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
              What clicked for you? (optional)
            </span>
            <textarea
              className="box-field mt-1 min-h-24 resize-y"
              rows={3}
              value={current.note}
              maxLength={LIMITS.note}
              placeholder="A sentence or two, just for you."
              onChange={(e) => onUpdate(current.id, { note: e.target.value })}
            />
            <span className="mt-1 flex justify-between text-xs text-ink-faint">
              <span>Notes stay in this browser and are never shared.</span>
              <span className="tabular-nums">
                {current.note.length}/{LIMITS.note}
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2 border-t-2 border-dashed border-ink/15 pt-4">
            <button
              type="button"
              onClick={() => onMove(current.id, -1)}
              disabled={index === 0}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/20 px-4 text-sm font-bold transition hover:bg-ink/5 disabled:opacity-40"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Move earlier
            </button>
            <button
              type="button"
              onClick={() => onMove(current.id, 1)}
              disabled={index >= total - 1}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/20 px-4 text-sm font-bold transition hover:bg-ink/5 disabled:opacity-40"
            >
              Move later <ArrowRight size={16} aria-hidden="true" />
            </button>
            <DeleteControl onConfirm={() => onDelete(current.id)} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-12 w-full rounded-full bg-ink px-5 font-display text-[15px] font-bold text-cream transition hover:bg-ink/90 active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      ) : null}
    </Modal>
  )
}

/** Two-step delete. Mounted inside the dialog, so it resets whenever the sheet closes. */
function DeleteControl({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="ml-auto">
      {confirming ? (
        <span className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-full bg-[#B4412D] px-4 text-sm font-bold text-white transition hover:bg-[#9c3624]"
          >
            Delete lesson
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-11 rounded-full px-3 text-sm font-bold text-ink-soft hover:bg-ink/5"
          >
            Keep
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-[#B4412D] transition hover:bg-[#B4412D]/10"
        >
          <Trash2 size={16} aria-hidden="true" /> Delete
        </button>
      )}
    </div>
  )
}
