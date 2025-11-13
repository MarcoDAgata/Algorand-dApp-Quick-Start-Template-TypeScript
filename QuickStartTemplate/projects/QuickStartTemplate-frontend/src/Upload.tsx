import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useRef, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

const TOKEN_NAME = 'MedStamp'      // display only
const TOKEN_ID = 749176800         // MedStamp ASA on TestNet
const COST_PER_STAMP = 1           // 1 MedStamp per submission
const TOTAL_STAMPS = 5             // 5 MedStamps in this case pack

// Shared Algorand client (same pattern as Transact.tsx / NFTmint.tsx)
const algodConfig = getAlgodConfigFromViteEnvironment()
const algorand = AlgorandClient.fromConfig({ algodConfig })

function resolveBackendBase(): string {
  // 1) Respect explicit env (Vercel or custom)
  const env = import.meta.env.VITE_API_URL?.trim()
  if (env) return env.replace(/\/$/, '')

  // 2) Codespaces: convert current host to port 3001
  // e.g. https://abc-5173.app.github.dev -> https://abc-3001.app.github.dev
  const host = window.location.host
  if (host.endsWith('.app.github.dev')) {
    const base = host.replace(/-\d+\.app\.github\.dev$/, '-3001.app.github.dev')
    return `https://${base}`
  }

  // 3) Plain local fallback
  return 'http://localhost:3001'
}

const Home: React.FC = () => {
  const { activeAddress } = useWallet()

  // Case-pack balance (per secure link) – mocked for now
  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Wallet MedStamp balance
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loadingWalletBalance, setLoadingWalletBalance] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)

  // Wallet modal
  const [openWalletModal, setOpenWalletModal] = useState(false)

  // Upload + stamping state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [stampApplied, setStampApplied] = useState(false)
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Optional: case ID from secure link (mock)
  const [caseId] = useState<string>('CASE-12345') // TODO: read from URL / token

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ------------------------
  // Case-pack MedStamps (still mocked as 5 → backend later)
  // ------------------------
  useEffect(() => {
    const fetchBalance = async () => {
      setLoadingBalance(true)
      setError(null)

      try {
        // For the parent flow this would come from backend / secure link.
        const mockBalance = TOTAL_STAMPS
        setBalance(mockBalance)
      } catch (e: any) {
        console.error(e)
        setError('Failed to load MedStamp balance for this case.')
      } finally {
        setLoadingBalance(false)
      }
    }

    fetchBalance()
  }, [])

  // ------------------------
  // Fetch MedStamp ASA balance for connected wallet
  // ------------------------
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!activeAddress) {
        setWalletBalance(null)
        setWalletError(null)
        return
      }

      setLoadingWalletBalance(true)
      setWalletError(null)

      try {
        const acctInfo: any = await algorand.client.algod
          .accountInformation(activeAddress)
          .do()

        const assets: any[] = Array.isArray(acctInfo?.assets)
          ? acctInfo.assets
          : []

        const medStampAsset = assets.find((a: any) => {
          const rawId = a?.['asset-id'] ?? a?.assetId ?? a?.asset?.id
          if (rawId === undefined || rawId === null) return false
          try {
            return BigInt(rawId) === BigInt(TOKEN_ID)
          } catch {
            return false
          }
        })

        const amount = medStampAsset?.amount ?? medStampAsset?.['amount']

        if (amount === undefined || amount === null) {
          setWalletBalance(0)
        } else if (typeof amount === 'bigint') {
          setWalletBalance(Number(amount))
        } else {
          setWalletBalance(amount)
        }
      } catch (e) {
        console.error('Failed to load wallet MedStamp balance:', e)
        setWalletError('Could not load wallet MedStamp balance.')
        setWalletBalance(null)
      } finally {
        setLoadingWalletBalance(false)
      }
    }

    fetchWalletBalance()
  }, [activeAddress])

  // ------------------------
  // Handle "Add media" → open native picker
  // ------------------------
  const handleAddMediaClick = () => {
    setError(null)
    setSuccess(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(null)
    setStampApplied(false) // reset stamp when changing media

    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)

    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  // Cleanup preview URL on unmount / file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // ------------------------
  // Handle tapping the MedStamp "+" placeholder
  // ------------------------
  const handleApplyStamp = () => {
    setError(null)
    setSuccess(null)

    if (!selectedFile) {
      setError('Please add a photo or video first.')
      return
    }

    if (balance === null || balance < COST_PER_STAMP) {
      setError(`You have no MedStamps left for this case.`)
      return
    }

    setStampApplied(true)
    setSuccess('MedStamp applied to this upload. You can add a note and send.')
  }

  // ------------------------
  // Handle "Send" – submit stamped evidence
  // ------------------------
 const handleSend = async () => {
  setError(null)
  setSuccess(null)

  if (!selectedFile) {
    setError('Please add a photo or video before sending.')
    return
  }

  if (!stampApplied) {
    setError('Tap the MedStamp "+" box to apply a stamp before sending.')
    return
  }

  if (balance === null || balance < COST_PER_STAMP) {
    setError(`You have no MedStamps left for this case.`)
    return
  }

  setSending(true)

  try {
    // 1️⃣ Build backend URL (same logic as NFTmint)
    const backendBase = resolveBackendBase()
    // You can choose the path:
    //  - reuse /api/pin-image
    //  - or create /api/pin-evidence specifically for parent uploads
    const backendApiUrl = `${backendBase.replace(/\/$/, '')}/api/pin-image`

    // 2️⃣ Prepare FormData with file + metadata
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('note', note)
    formData.append('caseId', caseId)

    // 3️⃣ Send to your backend → which pins to Pinata/IPFS
    const res = await fetch(backendApiUrl, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      throw new Error(
        `Backend request failed: ${res.status} ${
          errorText ? `- ${errorText}` : ''
        }`
      )
    }

    const data = await res.json().catch(() => ({} as any))

    // Optional: if your backend returns e.g. { evidenceUrl, cid, metadataUrl }
    // you can read/use it here:
    // const evidenceUrl = data.evidenceUrl || data.metadataUrl

    // 4️⃣ Locally consume one MedStamp from this case-pack
    setSuccess('Your MedStamped photo/video has been sent to the hospital.')
    setBalance((prev) => (prev !== null ? prev - COST_PER_STAMP : prev))

    // Reset daily UI state
    setSelectedFile(null)
    setPreviewUrl(null)
    setNote('')
    setStampApplied(false)
  } catch (e: any) {
    console.error(e)
    setError(
      e?.message
        ? `Failed to send: ${e.message}`
        : 'Failed to send. Please try again.'
    )
  } finally {
    setSending(false)
  }
}

  const usedStamps =
    balance === null ? 0 : Math.max(0, TOTAL_STAMPS - balance)

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-6">
          <h1 className="text-xl font-semibold text-center">
            Daily MedStamp Check-in
          </h1>

          {/* Case info */}
          <div className="text-xs text-slate-400">
            Case ID:{' '}
            <span className="font-mono text-slate-200">{caseId}</span>
          </div>

          {/* Wallet status + on-chain MedStamp balance */}
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Wallet status</span>
              <button
                type="button"
                onClick={() => setOpenWalletModal(true)}
                className="rounded-md bg-sky-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-sky-500"
              >
                {activeAddress ? 'Wallet linked' : 'Connect wallet'}
              </button>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 font-mono break-all">
              {activeAddress ? (
                <>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                    Connected address
                  </div>
                  <div className="text-[11px] text-slate-200">
                    {activeAddress}
                  </div>
                </>
              ) : (
                <span className="text-[11px] text-slate-400">
                  No wallet connected.
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span>{TOKEN_NAME} balance in wallet</span>
              <span className="font-semibold text-slate-100">
                {activeAddress
                  ? loadingWalletBalance
                    ? 'Loading…'
                    : walletBalance ?? '0'
                  : '--'}
              </span>
            </div>
            {walletError && (
              <div className="text-[11px] text-red-400">{walletError}</div>
            )}
          </div>

          {/* Simple 5-slot progress tracker */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              You have {loadingBalance ? '…' : balance ?? '--'} of{' '}
              {TOTAL_STAMPS} MedStamps remaining for this case.
            </p>
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_STAMPS }).map((_, idx) => {
                const filled = idx < usedStamps
                return (
                  <div
                    key={idx}
                    className={`h-4 flex-1 rounded-sm ${
                      filled ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Instructions */}
          <p className="text-xs text-slate-400">
            Each day, add one short photo or video, apply a MedStamp, optionally
            add a note, and send it to the hospital.
          </p>

          {/* Upload + stamp flow */}
          <div className="space-y-4">
            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Add media button */}
            <button
              type="button"
              onClick={handleAddMediaClick}
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700"
            >
              Add media
            </button>

            {previewUrl && (
              <div className="rounded-md border border-slate-800 bg-slate-900 p-2">
                <p className="text-xs text-slate-400 mb-1">Today’s media</p>
                <img
                  src={previewUrl}
                  alt="Selected preview"
                  className="max-h-64 w-full rounded-md object-contain"
                />
              </div>
            )}

            {/* MedStamp "+" placeholder */}
            <div className="space-y-1 text-sm">
              <p className="text-xs text-slate-400">
                Tap the MedStamp box to attach a secure MedStamp to today’s
                upload.
              </p>
              <button
                type="button"
                onClick={handleApplyStamp}
                className={`w-full h-16 border-2 rounded-md flex items-center justify-center text-lg font-semibold
                ${
                  stampApplied
                    ? 'border-emerald-400 bg-emerald-900/40 text-emerald-200'
                    : 'border-dashed border-slate-600 bg-slate-900 text-slate-300'
                }`}
              >
                {stampApplied ? 'MedStamp applied' : '+'}
              </button>
            </div>

            {/* Note field */}
            <div className="space-y-1 text-sm">
              <label className="block text-slate-300">
                Add a brief note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                placeholder='e.g. "feeding better", "redness improving"...'
              />
            </div>

            {error && <div className="text-xs text-red-400">{error}</div>}

            {success && (
              <div className="text-xs text-emerald-400">{success}</div>
            )}

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-medium disabled:bg-slate-700 disabled:text-slate-400"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* Wallet modal (same pattern as clinician console / Transact / NFTmint) */}
      <ConnectWallet
        openModal={openWalletModal}
        closeModal={() => setOpenWalletModal(false)}
      />
    </>
  )
}

export default Home