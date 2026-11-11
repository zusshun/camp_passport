import { useState } from 'react'
import { ExternalLink, Lock, Ticket } from 'lucide-react'
import { SouvenirSheet } from '@/components/SouvenirSheet'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { formatDateTime, type Passport, type SouvenirRecord } from '@/lib/passport'
import { SOUVENIR_ADDRESS, SOUVENIR_CHAIN_NAME } from '@/lib/souvenir'

interface SouvenirPanelProps {
  passport: Passport
  completed: number
  onRecorded: (record: SouvenirRecord) => void
}

export function SouvenirPanel({ passport, completed, onRecorded }: SouvenirPanelProps) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(0)
  const total = passport.lessons.length
  const allDone = total > 0 && completed === total
  const record = passport.souvenir
  const demo = SOUVENIR_ADDRESS === undefined

  if (!allDone && !record) {
    return (
      <section className="flex items-start gap-3 rounded-3xl border-2 border-dashed border-ink/15 bg-paper/50 p-4 sm:p-5">
        <Lock size={18} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
        <div>
          <h2 className="font-display text-base font-bold text-ink">Camp souvenir</h2>
          <p className="mt-1 text-sm text-ink-soft text-pretty">
            Finish every lesson to unlock an optional souvenir: a personal learning record you can save on{' '}
            {SOUVENIR_CHAIN_NAME}. Your passport works fully without it.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border-2 border-dashed border-lav-deep/40 bg-lav-soft/60 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper text-lav-deep shadow-paper">
          <Ticket size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-bold text-ink">Camp souvenir</h2>
            <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-lav-deep">
              Optional
            </span>
            {demo ? (
              <span className="rounded-full bg-[#FBEBCB] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a4a0c]">
                Demo
              </span>
            ) : null}
          </div>
          {record ? (
            <p className="mt-1 text-sm text-ink-soft text-pretty">
              Collected on {formatDateTime(record.recordedAt)}. A personal learning record, not an official
              certificate.
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-soft text-pretty">
              You finished every lesson. Save a personal learning record on {SOUVENIR_CHAIN_NAME}. It is not an
              official certificate, and your notes stay private.
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {record ? (
          <a
            href={buildTxExplorerUrl(record.chainId, record.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-cream transition hover:bg-ink/90"
          >
            View on explorer <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSession((n) => n + 1)
              setOpen(true)
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-cream transition hover:bg-ink/90 active:scale-[0.98]"
          >
            Collect my camp souvenir
          </button>
        )}
      </div>
      <SouvenirSheet
        key={session}
        open={open}
        passport={passport}
        completed={completed}
        onClose={() => setOpen(false)}
        onRecorded={onRecorded}
      />
    </section>
  )
}
