import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  /** Prevent closing via backdrop / Escape (for example while a transaction is pending). */
  locked?: boolean
}

/** Bottom sheet on mobile, centered card on larger screens. */
export function Modal({ open, onClose, title, description, children, locked }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open, locked])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!locked) onClose()
            }}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="paper relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[28px] border-2 border-dashed border-ink/25 shadow-lift outline-none sm:rounded-[28px]"
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4 sm:px-6 sm:pt-5">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-xl font-bold tracking-tight text-ink text-balance">
                  {title}
                </h2>
                {description ? <p className="mt-1 text-sm text-ink-soft text-pretty">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={locked}
                aria-label="Close"
                className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-6 sm:px-6">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
