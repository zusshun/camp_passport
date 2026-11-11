import { motion } from 'framer-motion'
import { Share2 } from 'lucide-react'
import { LIMITS, countCompleted, formatDayString, progressLabel, type Passport } from '@/lib/passport'

interface PassportCardProps {
  passport: Passport
  onChange: (patch: Partial<Pick<Passport, 'nickname' | 'campName' | 'startDate'>>) => void
  onShare: () => void
}

function mrz(nickname: string): string {
  const clean = (nickname || 'TRAVELER').toUpperCase().replace(/[^A-Z0-9]+/g, '<').replace(/^<|<$/g, '')
  return `P<CAMP<${clean}`.padEnd(32, '<').slice(0, 32)
}

export function PassportCard({ passport, onChange, onShare }: PassportCardProps) {
  const total = passport.lessons.length
  const done = countCompleted(passport)
  const ratio = total === 0 ? 0 : done / total
  const initial = (passport.nickname.trim()[0] ?? '?').toUpperCase()

  return (
    <section
      aria-label="Your passport"
      className="paper relative overflow-hidden rounded-[28px] shadow-paper"
    >
      <div className="m-2.5 rounded-[20px] border-2 border-dashed border-ink/25 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-lav-soft px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-lav-deep">
            Camp Passport
          </span>
          <span className="font-mono text-[11px] tracking-[0.08em] text-ink-faint">No. 0001</span>
        </div>

        <div className="mt-5 flex items-start gap-4">
          <div
            aria-hidden="true"
            className="grid h-20 w-16 shrink-0 place-items-center rounded-xl border-2 border-dashed border-lav-deep/40 bg-lav-soft font-display text-3xl font-bold text-lav-deep sm:h-24 sm:w-20"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">Nickname</span>
              <input
                className="field font-display text-xl font-bold tracking-tight"
                value={passport.nickname}
                maxLength={LIMITS.nickname}
                placeholder="Your nickname"
                onChange={(e) => onChange({ nickname: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">Camp</span>
              <input
                className="field text-[15px] font-medium"
                value={passport.campName}
                maxLength={LIMITS.camp}
                placeholder="Camp name"
                onChange={(e) => onChange({ campName: e.target.value })}
              />
            </label>
          </div>
        </div>

        <label className="mt-3 block">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">Starting date</span>
          <input
            type="date"
            className="field text-[15px] tabular-nums"
            value={passport.startDate}
            onChange={(e) => {
              if (e.target.value) onChange({ startDate: e.target.value })
            }}
            aria-describedby="start-date-readable"
          />
          <span id="start-date-readable" className="sr-only">
            {formatDayString(passport.startDate)}
          </span>
        </label>

        <div className="mt-6">
          <p className="font-display text-lg font-bold tracking-tight text-ink tabular-nums" aria-live="polite">
            {progressLabel(done, total)}
          </p>
          <div
            role="progressbar"
            aria-label="Lessons completed"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            className="mt-2 h-3 overflow-hidden rounded-full border border-ink/15 bg-cream-deep/70"
          >
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-lav to-lav-deep"
              style={{ width: '100%' }}
              initial={false}
              animate={{ scaleX: ratio }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onShare}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 font-display text-[15px] font-bold text-cream shadow-paper transition hover:bg-ink/90 active:scale-[0.98]"
        >
          <Share2 size={18} aria-hidden="true" />
          Share my progress
        </button>

        <p
          aria-hidden="true"
          className="mt-5 overflow-hidden whitespace-nowrap font-mono text-[11px] tracking-[0.18em] text-ink/30"
        >
          {mrz(passport.nickname)}
        </p>
      </div>
    </section>
  )
}
