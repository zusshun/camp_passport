import { BaseError, ContractFunctionRevertedError, InsufficientFundsError, UserRejectedRequestError, isAddress, parseAbi } from 'viem'
import { arcTestnet } from 'viem/chains'
import { byteLength } from '@/lib/passport'

export const SOUVENIR_CHAIN_ID = arcTestnet.id
export const SOUVENIR_CHAIN_NAME = 'Arc Testnet'
export const FAUCET_URL = 'https://faucet.circle.com'

export const CAMP_NAME_MAX_BYTES = 64
export const NICKNAME_MAX_BYTES = 32

const configured = import.meta.env.VITE_CAMP_SOUVENIR_ADDRESS as string | undefined

/** The deployed souvenir registry. Undefined means the feature runs as a labeled demo. */
export const SOUVENIR_ADDRESS: `0x${string}` | undefined =
  configured && isAddress(configured) ? configured : undefined

export const souvenirAbi = parseAbi([
  'function collectSouvenir(string campName, string nickname, uint16 lessonsCompleted)',
  'function hasSouvenir(address learner, string campName) view returns (bool)',
  'error EmptyCampName()',
  'error CampNameTooLong()',
  'error NicknameTooLong()',
  'error NoLessonsCompleted()',
  'error AlreadyCollected()',
])

export interface SouvenirPayload {
  campName: string
  nickname: string
  lessonsCompleted: number
}

/** Returns a plain-English problem with the payload, or null when it can be recorded. */
export function validatePayload(p: SouvenirPayload): string | null {
  if (p.campName.length === 0) return 'Give your camp a name on the passport first.'
  if (byteLength(p.campName) > CAMP_NAME_MAX_BYTES) return 'The camp name is too long to record. Shorten it on the passport.'
  if (byteLength(p.nickname) > NICKNAME_MAX_BYTES) return 'The nickname is too long to record. Shorten it on the passport.'
  if (p.lessonsCompleted < 1 || p.lessonsCompleted > 65535) return 'Complete at least one lesson first.'
  return null
}

export type TxErrorKind = 'rejected' | 'funds' | 'already' | 'other'

export function describeTxError(err: unknown): { kind: TxErrorKind; message: string } {
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) {
      return { kind: 'rejected', message: 'You closed the wallet request, so nothing was recorded. You can try again any time.' }
    }
    if (err.walk((e) => e instanceof InsufficientFundsError)) {
      return { kind: 'funds', message: 'Your wallet does not have enough testnet USDC to cover the network fee.' }
    }
    const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      if (reverted.data?.errorName === 'AlreadyCollected') {
        return { kind: 'already', message: 'This wallet has already recorded a souvenir for this camp name.' }
      }
      return { kind: 'other', message: 'The network rejected the record. Check your camp name and nickname, then try again.' }
    }
  }
  const text = err instanceof Error ? err.message.toLowerCase() : ''
  if (text.includes('user rejected') || text.includes('user denied') || text.includes('rejected the request')) {
    return { kind: 'rejected', message: 'You closed the wallet request, so nothing was recorded. You can try again any time.' }
  }
  if (text.includes('insufficient funds')) {
    return { kind: 'funds', message: 'Your wallet does not have enough testnet USDC to cover the network fee.' }
  }
  return { kind: 'other', message: 'Something went wrong before the record was confirmed. Nothing was saved. Please try again.' }
}
