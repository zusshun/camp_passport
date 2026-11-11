import { useEffect, useMemo, useRef, useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { useAccount, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { AlertTriangle, Check, ExternalLink, Loader2 } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { formatDateTime, type Passport, type SouvenirRecord } from '@/lib/passport'
import {
  FAUCET_URL,
  SOUVENIR_ADDRESS,
  SOUVENIR_CHAIN_ID,
  SOUVENIR_CHAIN_NAME,
  describeTxError,
  souvenirAbi,
  validatePayload,
} from '@/lib/souvenir'

interface SouvenirSheetProps {
  open: boolean
  passport: Passport
  completed: number
  onClose: () => void
  onRecorded: (record: SouvenirRecord) => void
}

const primaryBtn =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 font-display text-[15px] font-bold text-cream transition hover:bg-ink/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'

export function SouvenirSheet({ open, passport, completed, onClose, onRecorded }: SouvenirSheetProps) {
  const live = SOUVENIR_ADDRESS !== undefined
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { writeContract, data: hash, isPending: signing, error: writeError, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash, chainId: SOUVENIR_CHAIN_ID })
  const [agreed, setAgreed] = useState(false)
  const recordedFor = useRef<string | null>(null)

  const payload = useMemo(
    () => ({
      campName: passport.campName.trim(),
      nickname: passport.nickname.trim(),
      lessonsCompleted: completed,
    }),
    [passport.campName, passport.nickname, completed],
  )
  const problem = validatePayload(payload)

  const existing = useReadContract({
    address: SOUVENIR_ADDRESS,
    abi: souvenirAbi,
    functionName: 'hasSouvenir',
    args: address ? [address, payload.campName] : undefined,
    chainId: SOUVENIR_CHAIN_ID,
    query: { enabled: live && open && Boolean(address) && payload.campName.length > 0 },
  })
  const alreadyOnchain = existing.data === true && !passport.souvenir

  // Save the confirmed record locally so the explorer link survives a refresh.
  useEffect(() => {
    if (!hash || !address || recordedFor.current === hash) return
    if (receipt.data?.status === 'success') {
      recordedFor.current = hash
      onRecorded({ txHash: hash, chainId: SOUVENIR_CHAIN_ID, wallet: address, recordedAt: new Date().toISOString() })
    }
  }, [hash, address, receipt.data?.status, onRecorded])

  const reverted = receipt.data?.status === 'reverted'
  const confirming = Boolean(hash) && !reverted && !receipt.isError && receipt.data === undefined
  const busy = signing || confirming
  const writeProblem = writeError ? describeTxError(writeError) : null
  const txUrl = hash ? buildTxExplorerUrl(SOUVENIR_CHAIN_ID, hash) : null
  const wrongChain = isConnected && chainId !== SOUVENIR_CHAIN_ID

  const submit = () => {
    if (!SOUVENIR_ADDRESS || problem) return
    writeContract({
      address: SOUVENIR_ADDRESS,
      abi: souvenirAbi,
      functionName: 'collectSouvenir',
      args: [payload.campName, payload.nickname, payload.lessonsCompleted],
      chainId: SOUVENIR_CHAIN_ID,
    })
  }

  const close = () => {
    if (busy) return
    reset()
    onClose()
  }

  const record = passport.souvenir
  const done = Boolean(record)
  const failed = !done && (reverted || receipt.isError || (writeProblem !== null && writeProblem.kind !== 'rejected'))
  const rejected = !done && writeProblem?.kind === 'rejected'

  return (
    <Modal
      open={open}
      onClose={close}
      locked={busy}
      title={done ? 'Souvenir collected' : 'Collect my camp souvenir'}
      description={done ? undefined : 'A personal learning record on Arc Testnet. It is not an official certificate.'}
    >
      {done && record ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-lav-soft p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lav-deep text-paper">
              <Check size={20} strokeWidth={3} aria-hidden="true" />
            </span>
            <p className="text-sm text-ink text-pretty">
              Recorded on {SOUVENIR_CHAIN_NAME} on {formatDateTime(record.recordedAt)}. It is a personal learning
              record, not an official certificate.
            </p>
          </div>
          <a
            href={buildTxExplorerUrl(record.chainId, record.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className={primaryBtn}
          >
            View on explorer <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          {!live ? (
            <p className="rounded-2xl border border-dashed border-[#B8741A]/50 bg-[#FBEBCB]/60 px-4 py-3 text-sm text-[#7a4a0c] text-pretty">
              <strong className="font-bold">Demo.</strong> The onchain souvenir is not connected in this build, so
              nothing can be recorded. This preview shows what would be saved.
            </p>
          ) : null}

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
              Exactly what will be public
            </h3>
            <dl className="mt-2 divide-y divide-dashed divide-ink/15 rounded-2xl border-2 border-dashed border-ink/20 bg-paper text-sm">
              <Row label="Camp name" value={payload.campName || 'Not set'} />
              <Row label="Nickname" value={payload.nickname || 'None'} />
              <Row label="Lessons completed" value={String(payload.lessonsCompleted)} />
              <Row label="Your wallet address" value={address ?? 'Added when you connect'} mono />
              <Row label="Date" value="The network time when it is confirmed" />
            </dl>
            <p className="mt-2 text-xs text-ink-soft text-pretty">
              Your lesson titles, links, notes and starting date stay in this browser and are never sent. Anything
              recorded onchain is public and cannot be removed.
            </p>
          </div>

          {problem ? (
            <p role="alert" className="rounded-xl bg-[#B4412D]/10 px-3 py-2 text-sm text-[#8d3222]">
              {problem}
            </p>
          ) : null}

          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 accent-[#6A52CC]"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={busy}
            />
            <span className="text-pretty">
              I understand this information will be public and permanent, and that this is a personal record, not an
              official certificate.
            </span>
          </label>

          {signing ? (
            <Status icon="spin" text="Confirm in your wallet..." />
          ) : confirming ? (
            <div className="space-y-2">
              <Status icon="spin" text={`Confirming on ${SOUVENIR_CHAIN_NAME}...`} />
              {txUrl ? <ExplorerLink href={txUrl} label="Follow the transaction" /> : null}
            </div>
          ) : null}

          {rejected && writeProblem ? (
            <p role="status" className="rounded-xl bg-lav-soft px-3 py-2 text-sm text-lav-deep">
              {writeProblem.message}
            </p>
          ) : null}

          {failed ? (
            <div role="alert" className="space-y-2 rounded-xl bg-[#B4412D]/10 px-3 py-3 text-sm text-[#8d3222]">
              <p className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="text-pretty">
                  {reverted
                    ? 'The transaction was confirmed but failed, so nothing was recorded.'
                    : receipt.isError
                      ? 'We could not confirm the transaction. Check the explorer before trying again.'
                      : writeProblem?.message}
                </span>
              </p>
              {writeProblem?.kind === 'funds' ? (
                <a
                  href={FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 font-bold underline underline-offset-4"
                >
                  Get testnet USDC <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
              {txUrl ? <ExplorerLink href={txUrl} label="View the transaction" /> : null}
            </div>
          ) : null}

          {alreadyOnchain ? (
            <p role="status" className="rounded-xl bg-lav-soft px-3 py-2 text-sm text-lav-deep text-pretty">
              This wallet already recorded a souvenir for this camp name, so there is nothing more to collect.
            </p>
          ) : null}

          {!live ? (
            <button type="button" className={primaryBtn} disabled>
              Demo only: nothing is sent
            </button>
          ) : !isConnected ? (
            <ConnectKitButton.Custom>
              {({ show, isConnecting }) => (
                <button type="button" className={primaryBtn} onClick={show} disabled={isConnecting}>
                  {isConnecting ? 'Connecting...' : 'Connect wallet to continue'}
                </button>
              )}
            </ConnectKitButton.Custom>
          ) : wrongChain ? (
            <button
              type="button"
              className={primaryBtn}
              disabled={switching}
              onClick={() => switchChain({ chainId: SOUVENIR_CHAIN_ID })}
            >
              {switching ? 'Switching...' : `Switch to ${SOUVENIR_CHAIN_NAME}`}
            </button>
          ) : (
            <button
              type="button"
              className={primaryBtn}
              disabled={busy || !agreed || problem !== null || alreadyOnchain || existing.isLoading}
              onClick={() => {
                reset()
                submit()
              }}
            >
              {busy ? 'Working...' : failed || rejected ? 'Try again' : 'Confirm and collect'}
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className={`min-w-0 break-all font-medium text-ink sm:text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}

function Status({ text }: { icon: 'spin'; text: string }) {
  return (
    <p role="status" className="flex items-center gap-2 rounded-xl bg-lav-soft px-3 py-2.5 text-sm font-medium text-lav-deep">
      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      {text}
    </p>
  )
}

function ExplorerLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-lav-deep underline-offset-4 hover:underline"
    >
      {label} <ExternalLink size={14} aria-hidden="true" />
    </a>
  )
}
