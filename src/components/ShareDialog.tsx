import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { renderShareCard } from '@/lib/shareCard'
import type { Passport } from '@/lib/passport'

interface ShareDialogProps {
  open: boolean
  passport: Passport
  onClose: () => void
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'traveler'
}

export function ShareDialog({ open, passport, onClose }: ShareDialogProps) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    let objectUrl: string | null = null
    renderShareCard(passport)
      .then((b) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(b)
        setBlob(b)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setError('We could not draw your card. Please try again.')
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, passport])

  const download = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `camp-passport-${slug(passport.nickname)}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share my progress"
      description="Preview your card first. It shows your nickname, camp, stamps and count. Your notes, links and lesson titles are left out."
    >
      <div className="space-y-4">
        <div className="mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl border border-ink/15 bg-cream shadow-paper">
          {url ? (
            <img src={url} alt="Preview of your shareable progress card" className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-ink-soft">
              {error ? (
                <span className="px-6 text-center text-[#B4412D]">{error}</span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" /> Drawing your card
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={download}
          disabled={!blob}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 font-display text-[15px] font-bold text-cream transition hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
        >
          <Download size={18} aria-hidden="true" />
          Download PNG
        </button>
      </div>
    </Modal>
  )
}
