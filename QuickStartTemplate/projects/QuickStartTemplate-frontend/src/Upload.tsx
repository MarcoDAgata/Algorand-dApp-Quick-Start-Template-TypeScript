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
  const env = import.meta.env.VITE_API_URL?.trim()
  if (env) return env.replace(/\/$/, '')

  const host = window.location.host
  if (host.endsWith('.app.github.dev')) {
    const base = host.replace(/-\d+\.app\.github\.dev$/, '-3001.app.github.dev')
    return `https://${base}`
  }

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
    setStampApplied(false)

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
      const backendBase = resolveBackendBase()
      const backendApiUrl = `${backendBase.replace(/\/$/, '')}/api/pin-image`

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('note', note)
      formData.append('caseId', caseId)

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
      void data

      setSuccess('Your MedStamped photo/video has been sent to the hospital.')
      setBalance((prev) => (prev !== null ? prev - COST_PER_STAMP : prev))

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
    <div
      style={{
        ['--surface' as any]: '#0f172a',
        ['--surface-subtle' as any]: '#1e293b',
        ['--surface-elevated' as any]: '#111827',
        ['--text-primary' as any]: '#f8fafc',
        ['--text-secondary' as any]: '#cbd5e1',
        ['--text-muted' as any]: '#94a3b8',
        ['--accent-yellow' as any]: '#fbbf24',
        ['--accent-blue' as any]: '#38bdf8',
        ['--accent-green' as any]: '#10b981',
        ['--accent-red' as any]: '#ef4444',
        ['--outline' as any]: '#334155',
      }}
      className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)] flex flex-col"
    >
      {/* Top / brand bar */}
      <header className="border-b border-[var(--outline)]/60 bg-[var(--surface)]/80 backdrop-blur">
        <div className="mx-auto max-w-xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--accent-yellow)]" />
            <span className="font-semibold tracking-tight">PROOFLY</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Secure patient link
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(56,189,248,0.15),transparent),radial-gradient(40%_40%_at_120%_10%,rgba(251,191,36,0.15),transparent)]" />
        <div className="relative mx-auto max-w-xl px-4 py-8 sm:py-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Proofly
          </h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--accent-yellow)] mt-2">
            Capture Once. Prove Forever.
          </h2>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Use this secure page to share a short photo or video with your care team.
            It helps them follow your child’s recovery between hospital visits.
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-xl px-4 pb-16 space-y-6 flex-1">
        {/* Parent check-up card */}
        <section className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-subtle)] p-5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.30)] space-y-5">
          {/* Case + MedStamps progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>
                Case ID:{' '}
                <span className="font-mono text-[var(--text-primary)]">
                  {caseId}
                </span>
              </span>
              <span>
                {loadingBalance
                  ? 'Checking MedStamps…'
                  : `MedStamps left: ${balance ?? '--'}/${TOTAL_STAMPS}`}
              </span>
            </div>
            <div className="flex gap-1.5 mt-1">
              {Array.from({ length: TOTAL_STAMPS }).map((_, idx) => {
                const filled = idx < usedStamps
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-full ${
                      filled
                        ? 'bg-[var(--accent-green)]'
                        : 'bg-[var(--surface-elevated)]'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Step 1: Add today’s media */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-elevated)] border border-[var(--outline)] text-xs">
                1
              </span>
              <span>Add today&apos;s photo or video</span>
            </div>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleAddMediaClick}
              className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--outline)] px-4 py-3 text-sm font-medium hover:border-[var(--accent-blue)]"
            >
              {selectedFile ? 'Change photo or video' : 'Choose photo or video'}
            </button>

            {previewUrl && (
              <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-elevated)] p-2">
                <p className="text-[11px] text-[var(--text-muted)] mb-1">
                  Today&apos;s upload
                </p>
                <img
                  src={previewUrl}
                  alt="Selected preview"
                  className="max-h-64 w-full rounded-lg object-contain"
                />
              </div>
            )}
          </div>

          {/* Step 2: Attach MedStamp */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-elevated)] border border-[var(--outline)] text-xs">
                2
              </span>
              <span>Attach a MedStamp</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              This secures your upload so the hospital knows it is really from you and
              belongs to this case.
            </p>
            <button
              type="button"
              onClick={handleApplyStamp}
              className={`w-full h-16 rounded-xl border-2 flex items-center justify-center text-sm font-semibold transition
                ${
                  stampApplied
                    ? 'border-[var(--accent-green)] bg-[color:rgb(16_185_129_/_0.12)] text-[var(--accent-green)]'
                    : 'border-dashed border-[var(--outline)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]'
                }`}
            >
              {stampApplied ? 'MedStamp applied' : 'Tap the + box to apply MedStamp'}
            </button>
            <p className="text-[10px] text-[var(--text-muted)]">
              If you see an error saying “Tap the MedStamp + box”, first tap this area.
            </p>
          </div>

          {/* Step 3: Add note (optional) and send */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-elevated)] border border-[var(--outline)] text-xs">
                3
              </span>
              <span>Add a short note (optional)</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--outline)] bg-[var(--surface-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-blue)]"
              placeholder='For example: "Redness looks better than yesterday"'
            />
          </div>

          {/* Error / success messages */}
          {error && (
            <div className="text-xs rounded-md border border-[var(--accent-red)]/60 bg-[var(--accent-red)]/10 px-3 py-2 text-[var(--accent-red)]">
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs rounded-md border border-[var(--accent-green)]/60 bg-[var(--accent-green)]/10 px-3 py-2 text-[var(--accent-green)]">
              {success}
            </div>
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="w-full rounded-xl bg-[var(--accent-yellow)] px-4 py-3 text-sm font-semibold text-[var(--surface)] shadow hover:brightness-95 disabled:bg-[var(--surface-elevated)] disabled:text-[var(--text-muted)]"
          >
            {sending ? 'Sending…' : 'Send check-up to hospital'}
          </button>

          <p className="text-[10px] text-[var(--text-muted)] text-center mt-1">
            Your upload is encrypted in transit and can only be viewed by your care team.
          </p>
        </section>

        {/* Optional wallet panel (unchanged logic, just restyled) */}
        <section className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-subtle)] p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.30)] space-y-3 text-xs text-[var(--text-muted)]">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[var(--text-secondary)]">
              Wallet status (optional)
            </span>
            <button
              type="button"
              onClick={() => setOpenWalletModal(true)}
              className="rounded-md bg-[var(--accent-blue)] px-3 py-1 text-[11px] font-medium text-[var(--surface)] hover:brightness-110"
            >
              {activeAddress ? 'Wallet linked' : 'Connect wallet'}
            </button>
          </div>

          <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-elevated)] px-3 py-2 font-mono break-all">
            {activeAddress ? (
              <>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  Connected address
                </div>
                <div className="text-[11px] text-[var(--text-primary)]">
                  {activeAddress}
                </div>
              </>
            ) : (
              <span className="text-[11px] text-[var(--text-secondary)]">
                No wallet connected.
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span>{TOKEN_NAME} balance in wallet</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {activeAddress
                ? loadingWalletBalance
                  ? 'Loading…'
                  : walletBalance ?? '0'
                : '--'}
            </span>
          </div>

          {walletError && (
            <div className="text-[11px] text-[var(--accent-red)]">
              {walletError}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--outline)]">
        <div className="mx-auto max-w-xl px-4 py-6 text-center text-[11px] text-[var(--text-muted)]">
          © {new Date().getFullYear()} Proofly • MedStamp on Algorand
        </div>
      </footer>

      {/* Wallet modal */}
      <ConnectWallet
        openModal={openWalletModal}
        closeModal={() => setOpenWalletModal(false)}
      />
    </div>
  )
}

export default Home
