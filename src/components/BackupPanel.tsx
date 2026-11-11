import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Download, HardDrive, Upload } from 'lucide-react'
import { Modal } from '@/components/Modal'
import {
  buildExport,
  countCompleted,
  parseImport,
  progressLabel,
  todayLocal,
  type Passport,
} from '@/lib/passport'

interface BackupPanelProps {
  passport: Passport
  onReplace: (next: Passport) => void
}

const MAX_IMPORT_BYTES = 1_000_000

function summary(p: Passport): string {
  return `${p.nickname.trim() || 'Unnamed traveler'}, ${p.campName.trim() || 'no camp name'}: ${progressLabel(countCompleted(p), p.lessons.length)}`
}

export function BackupPanel({ passport, onReplace }: BackupPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [incoming, setIncoming] = useState<Passport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exportJson = () => {
    const blob = new Blob([buildExport(passport)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `camp-passport-backup-${todayLocal()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Backup downloaded.')
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (file.size > MAX_IMPORT_BYTES) {
      setError('That file is too large to be a Camp Passport backup.')
      return
    }
    const result = parseImport(await file.text())
    if (result.ok) setIncoming(result.passport)
    else setError(result.error)
  }

  return (
    <section aria-label="Your data" className="rounded-3xl border-2 border-dashed border-ink/15 bg-paper/60 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <HardDrive size={20} className="mt-0.5 shrink-0 text-lav-deep" aria-hidden="true" />
        <div>
          <h2 className="font-display text-base font-bold text-ink">Saved in this browser</h2>
          <p className="mt-1 text-sm text-ink-soft text-pretty">
            Your progress and notes are stored on this device only. Clearing site data or switching browsers will
            remove them, so export a backup now and then.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportJson}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/25 bg-paper px-4 text-sm font-bold transition hover:bg-ink/5 active:scale-[0.98]"
        >
          <Download size={16} aria-hidden="true" /> Export JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/25 bg-paper px-4 text-sm font-bold transition hover:bg-ink/5 active:scale-[0.98]"
        >
          <Upload size={16} aria-hidden="true" /> Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a backup file to import"
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <p className="mt-3 text-xs text-ink-faint">The backup file includes your private notes. Keep it to yourself.</p>
      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-[#B4412D]/10 px-3 py-2 text-sm text-[#8d3222]">
          {error}
        </p>
      ) : null}

      <Modal
        open={incoming !== null}
        onClose={() => setIncoming(null)}
        title="Replace your current progress?"
        description="Importing swaps everything in this browser for the contents of the file. This cannot be undone."
      >
        {incoming ? (
          <div className="space-y-4">
            <dl className="space-y-3 rounded-2xl bg-cream-deep/50 p-4 text-sm">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">Currently here</dt>
                <dd className="mt-0.5 text-ink">{summary(passport)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">From the file</dt>
                <dd className="mt-0.5 text-ink">{summary(incoming)}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => {
                  onReplace(incoming)
                  setIncoming(null)
                  toast.success('Progress restored from your backup.')
                }}
                className="min-h-12 flex-1 rounded-full bg-ink px-5 font-display text-[15px] font-bold text-cream transition hover:bg-ink/90 active:scale-[0.98]"
              >
                Replace my progress
              </button>
              <button
                type="button"
                onClick={() => setIncoming(null)}
                className="min-h-12 flex-1 rounded-full border border-ink/25 px-5 font-display text-[15px] font-bold transition hover:bg-ink/5"
              >
                Keep what I have
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
