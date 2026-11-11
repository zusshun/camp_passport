/** Passport data model, local storage, and JSON backup helpers. */

export const STORAGE_KEY = 'camp-passport:v1'
export const EXPORT_APP_ID = 'camp-passport'
export const EXPORT_VERSION = 1

export const LIMITS = {
  nickname: 24,
  camp: 40,
  title: 80,
  link: 300,
  note: 280,
  lessons: 60,
} as const

export interface Lesson {
  id: string
  title: string
  link: string
  completed: boolean
  /** ISO timestamp, recorded automatically when the lesson is completed. */
  completedAt: string | null
  note: string
  /** True while the lesson is one of the placeholder samples. */
  isSample: boolean
}

export interface SouvenirRecord {
  txHash: `0x${string}`
  chainId: number
  wallet: `0x${string}`
  recordedAt: string
}

export interface Passport {
  nickname: string
  campName: string
  /** YYYY-MM-DD in local time. */
  startDate: string
  lessons: Lesson[]
  souvenir: SouvenirRecord | null
}

export function newId(): string {
  return crypto.randomUUID()
}

export function todayLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function createDefaultPassport(): Passport {
  const sample = (n: number): Lesson => ({
    id: newId(),
    title: `Sample lesson ${n}`,
    link: '',
    completed: false,
    completedAt: null,
    note: '',
    isSample: true,
  })
  return {
    nickname: 'Explorer',
    campName: 'Arc 101 Camp',
    startDate: todayLocal(),
    lessons: [sample(1), sample(2), sample(3)],
    souvenir: null,
  }
}

export function newLesson(): Lesson {
  return {
    id: newId(),
    title: 'New lesson',
    link: '',
    completed: false,
    completedAt: null,
    note: '',
    isSample: false,
  }
}

/** Returns an http(s) URL that is safe to put in an href, or null. */
export function safeHref(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!url.hostname.includes('.')) return null
    return url.href
  } catch {
    return null
  }
}

export function countCompleted(p: Pick<Passport, 'lessons'>): number {
  return p.lessons.filter((l) => l.completed).length
}

export function progressLabel(done: number, total: number): string {
  if (total === 0) return 'No lessons yet'
  return `${done} of ${total} ${total === 1 ? 'lesson' : 'lessons'} completed`
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatShortDay(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

export function formatDayString(day: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!m) return ''
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

// ---------------------------------------------------------------------------
// Validation (used for both localStorage and imported files)
// ---------------------------------------------------------------------------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown, max: number, fallback = ''): string =>
  typeof v === 'string' ? v.slice(0, max) : fallback

const validIso = (v: unknown): string | null => {
  if (typeof v !== 'string') return null
  return Number.isNaN(new Date(v).getTime()) ? null : v
}

function sanitizeLesson(raw: unknown): Lesson | null {
  if (!isRecord(raw)) return null
  const completed = raw.completed === true
  const completedAt = completed ? (validIso(raw.completedAt) ?? new Date().toISOString()) : null
  return {
    id: typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 64 ? raw.id : newId(),
    title: str(raw.title, LIMITS.title),
    link: str(raw.link, LIMITS.link),
    completed,
    completedAt,
    note: str(raw.note, LIMITS.note),
    isSample: raw.isSample === true,
  }
}

function sanitizeSouvenir(raw: unknown): SouvenirRecord | null {
  if (!isRecord(raw)) return null
  const { txHash, wallet, chainId } = raw
  if (typeof txHash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) return null
  if (typeof wallet !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) return null
  if (typeof chainId !== 'number' || !Number.isInteger(chainId)) return null
  return {
    txHash: txHash as `0x${string}`,
    wallet: wallet as `0x${string}`,
    chainId,
    recordedAt: validIso(raw.recordedAt) ?? new Date().toISOString(),
  }
}

export function sanitizePassport(raw: unknown): Passport | null {
  if (!isRecord(raw) || !Array.isArray(raw.lessons)) return null
  const seen = new Set<string>()
  const lessons: Lesson[] = []
  for (const item of raw.lessons.slice(0, LIMITS.lessons)) {
    const lesson = sanitizeLesson(item)
    if (!lesson) continue
    if (seen.has(lesson.id)) lesson.id = newId()
    seen.add(lesson.id)
    lessons.push(lesson)
  }
  const startDate =
    typeof raw.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate)
      ? raw.startDate
      : todayLocal()
  return {
    nickname: str(raw.nickname, LIMITS.nickname),
    campName: str(raw.campName, LIMITS.camp),
    startDate,
    lessons,
    souvenir: sanitizeSouvenir(raw.souvenir),
  }
}

// ---------------------------------------------------------------------------
// Local storage
// ---------------------------------------------------------------------------

export function loadPassport(): Passport {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = sanitizePassport(JSON.parse(stored))
      if (parsed) return parsed
    }
  } catch {
    // Fall through to a fresh passport.
  }
  return createDefaultPassport()
}

export function savePassport(passport: Passport): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passport))
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// JSON backup
// ---------------------------------------------------------------------------

export function buildExport(passport: Passport): string {
  return JSON.stringify(
    { app: EXPORT_APP_ID, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), passport },
    null,
    2,
  )
}

export type ImportResult = { ok: true; passport: Passport } | { ok: false; error: string }

export function parseImport(text: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (!isRecord(data) || data.app !== EXPORT_APP_ID) {
    return { ok: false, error: 'This does not look like a Camp Passport backup.' }
  }
  if (typeof data.version !== 'number' || data.version > EXPORT_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of Camp Passport.' }
  }
  const passport = sanitizePassport(data.passport)
  if (!passport) return { ok: false, error: 'The backup is missing passport data.' }
  return { ok: true, passport }
}
