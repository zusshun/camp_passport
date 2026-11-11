import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  LIMITS,
  loadPassport,
  newLesson,
  savePassport,
  type Lesson,
  type Passport,
  type SouvenirRecord,
} from '@/lib/passport'

type LessonPatch = Partial<Pick<Lesson, 'title' | 'link' | 'note'>>

export function usePassport() {
  const [passport, setPassport] = useState<Passport>(loadPassport)
  const warned = useRef(false)

  useEffect(() => {
    const ok = savePassport(passport)
    if (!ok && !warned.current) {
      warned.current = true
      toast.error('This browser could not save your progress. Export a backup to be safe.')
    }
  }, [passport])

  const updateProfile = useCallback(
    (patch: Partial<Pick<Passport, 'nickname' | 'campName' | 'startDate'>>) => {
      setPassport((p) => ({ ...p, ...patch }))
    },
    [],
  )

  /** Callers disable the add control at LIMITS.lessons; the guard here is a backstop. */
  const addLesson = useCallback((): string => {
    const lesson = newLesson()
    setPassport((p) =>
      p.lessons.length >= LIMITS.lessons ? p : { ...p, lessons: [...p.lessons, lesson] },
    )
    return lesson.id
  }, [])

  const updateLesson = useCallback((id: string, patch: LessonPatch) => {
    setPassport((p) => ({
      ...p,
      lessons: p.lessons.map((l) =>
        l.id === id
          ? { ...l, ...patch, isSample: patch.title !== undefined ? false : l.isSample }
          : l,
      ),
    }))
  }, [])

  const setCompleted = useCallback((id: string, completed: boolean) => {
    setPassport((p) => ({
      ...p,
      lessons: p.lessons.map((l) =>
        l.id === id
          ? {
              ...l,
              completed,
              completedAt: completed ? (l.completedAt ?? new Date().toISOString()) : null,
            }
          : l,
      ),
    }))
  }, [])

  const moveLesson = useCallback((id: string, direction: -1 | 1) => {
    setPassport((p) => {
      const from = p.lessons.findIndex((l) => l.id === id)
      const to = from + direction
      if (from < 0 || to < 0 || to >= p.lessons.length) return p
      const lessons = [...p.lessons]
      const [item] = lessons.splice(from, 1)
      lessons.splice(to, 0, item)
      return { ...p, lessons }
    })
  }, [])

  const deleteLesson = useCallback((id: string) => {
    setPassport((p) => ({ ...p, lessons: p.lessons.filter((l) => l.id !== id) }))
  }, [])

  const replaceAll = useCallback((next: Passport) => setPassport(next), [])

  const setSouvenir = useCallback((souvenir: SouvenirRecord | null) => {
    setPassport((p) => ({ ...p, souvenir }))
  }, [])

  return {
    passport,
    updateProfile,
    addLesson,
    updateLesson,
    setCompleted,
    moveLesson,
    deleteLesson,
    replaceAll,
    setSouvenir,
  }
}
