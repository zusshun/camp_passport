import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BackupPanel } from '@/components/BackupPanel'
import { LessonSheet } from '@/components/LessonSheet'
import { PassportCard } from '@/components/PassportCard'
import { ShareDialog } from '@/components/ShareDialog'
import { SouvenirPanel } from '@/components/SouvenirPanel'
import { StampDefs } from '@/components/Stamp'
import { StampGrid } from '@/components/StampGrid'
import { usePassport } from '@/hooks/usePassport'
import { countCompleted } from '@/lib/passport'

export default function App() {
  const {
    passport,
    updateProfile,
    addLesson,
    updateLesson,
    setCompleted,
    moveLesson,
    deleteLesson,
    replaceAll,
    setSouvenir,
  } = usePassport()
  const [openId, setOpenId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [focusTitle, setFocusTitle] = useState(false)
  const [justStampedId, setJustStampedId] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareSession, setShareSession] = useState(0)

  const completed = countCompleted(passport)
  const openIndex = passport.lessons.findIndex((l) => l.id === openId)
  const openLesson = openIndex >= 0 ? passport.lessons[openIndex] : null
  const hasSamples = passport.lessons.some((l) => l.isSample)

  // The stamping animation plays once per completion, then is cleared.
  useEffect(() => {
    if (!justStampedId) return
    const t = window.setTimeout(() => setJustStampedId(null), 1200)
    return () => window.clearTimeout(t)
  }, [justStampedId])

  const open = useCallback((id: string, focus = false) => {
    setFocusTitle(focus)
    setOpenId(id)
    setSheetOpen(true)
  }, [])

  const handleComplete = (id: string, done: boolean) => {
    setCompleted(id, done)
    setJustStampedId(done ? id : null)
  }

  return (
    <div className="min-h-dvh px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <StampDefs />
      <main className="mx-auto max-w-5xl">
        <motion.header
          className="mb-8 max-w-xl sm:mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-ink text-balance sm:text-5xl">
            Little lessons. Big journey.
          </h1>
          <p className="mt-3 text-base text-ink-soft text-pretty">
            Collect a stamp in your passport for every lesson you finish.
          </p>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="lg:sticky lg:top-6">
            <PassportCard passport={passport} onChange={updateProfile} onShare={() => {
                setShareSession((n) => n + 1)
                setShareOpen(true)
              }} />
          </div>

          <div className="space-y-6">
            <section aria-labelledby="stamps-heading">
              <h2 id="stamps-heading" className="mb-3 font-display text-xl font-bold tracking-tight text-ink">
                Your stamps
              </h2>
              {hasSamples ? (
                <p className="mb-4 rounded-2xl bg-lav-soft px-4 py-3 text-sm text-lav-deep text-pretty">
                  These are sample lessons to get you started. They are not the official Arc 101 curriculum, so
                  rename them, reorder them or add your own.
                </p>
              ) : null}
              <StampGrid
                lessons={passport.lessons}
                justStampedId={justStampedId}
                onOpen={(id) => open(id)}
                onAdd={() => open(addLesson(), true)}
              />
            </section>

            <SouvenirPanel passport={passport} completed={completed} onRecorded={setSouvenir} />
            <BackupPanel passport={passport} onReplace={replaceAll} />
          </div>
        </div>
      </main>

      <LessonSheet
        open={sheetOpen}
        lesson={openLesson}
        index={Math.max(openIndex, 0)}
        total={passport.lessons.length}
        autoFocusTitle={focusTitle}
        onClose={() => setSheetOpen(false)}
        onUpdate={updateLesson}
        onComplete={handleComplete}
        onMove={moveLesson}
        onDelete={(id) => {
          setSheetOpen(false)
          deleteLesson(id)
        }}
      />
      <ShareDialog key={shareSession} open={shareOpen} passport={passport} onClose={() => setShareOpen(false)} />
    </div>
  )
}
