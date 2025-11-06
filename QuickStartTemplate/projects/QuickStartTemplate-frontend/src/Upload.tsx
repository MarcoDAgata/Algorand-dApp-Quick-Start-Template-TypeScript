import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useRef, useState } from 'react'

const TOKEN_NAME = 'MedStamp'      // display only
const TOKEN_ID = 749176800         // TODO: replace with your ASA ID
const COST_PER_STAMP = 1           // 1 MedStamp per submission
const TOTAL_STAMPS = 5             // 5 MedStamps in this case pack

const Home: React.FC = () => {
  const { activeAddress } = useWallet()

  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

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
  // Fetch remaining MedStamps for this link
  // ------------------------
  useEffect(() => {
    const fetchBalance = async () => {
      // In the real parent flow, this would probably come from the secure link / backend,
      // not from a wallet. For now, we mock it as "5 MedStamps remaining".
      if (!activeAddress) {
        // You may remove this dependency later and just rely on the link token.
        setBalance(TOTAL_STAMPS)
        return
      }

      setLoadingBalance(true)
      setError(null)

      try {
        // 🔴 TODO: Replace with real call:
        // - Either to Algorand (ASA balance)
        // - Or to your backend to get "remaining MedStamps for this case"
        const mockBalance = TOTAL_STAMPS
        setBalance(mockBalance)
      } catch (e: any) {
        console.error(e)
        setError('Failed to load MedStamp balance.')
      } finally {
        setLoadingBalance(false)
      }
    }

    fetchBalance()
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
      setError(
        `You have no MedStamps left for this case.`
      )
      return
    }

    // Here you’d normally:
    // - prepare metadata (creator, time, device, EXIF, caseId)
    // - perhaps request a signature / proof from the backend
    //
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
      // 🔴 TODO: Call your backend endpoint that:
      //  - Verifies the secure link / caseId
      //  - Cryptographically binds creator, time, device, EXIF, caseId
      //  - Consumes one MedStamp from this pack
      //  - Stores media + note for the hospital

      // Example (pseudo-code):
      //
      // const formData = new FormData()
      // formData.append('file', selectedFile)
      // formData.append('note', note)
      // formData.append('caseId', caseId)
      //
      // const res = await fetch('/api/cases/submit-evidence', {
      //   method: 'POST',
      //   body: formData,
      // })
      //
      // if (!res.ok) throw new Error('Failed to submit evidence')
      //
      await new Promise((r) => setTimeout(r, 1200)) // mock delay

      setSuccess('Your MedStamped photo/video has been sent to the hospital.')
      setBalance((prev) => (prev !== null ? prev - COST_PER_STAMP : prev))

      // Reset daily UI state
      setSelectedFile(null)
      setPreviewUrl(null)
      setNote('')
      setStampApplied(false)
    } catch (e: any) {
      console.error(e)
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const usedStamps =
    balance === null ? 0 : Math.max(0, TOTAL_STAMPS - balance)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-6">
        <h1 className="text-xl font-semibold text-center">
          Daily MedStamp Check-in
        </h1>

        {/* Case info */}
        <div className="text-xs text-slate-400">
          Case ID: <span className="font-mono text-slate-200">{caseId}</span>
        </div>

        {/* Simple 5-slot progress tracker */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            You have {balance ?? '--'} of {TOTAL_STAMPS} MedStamps remaining for this case.
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
          Each day, add one short photo or video, apply a MedStamp, optionally add a note, and send it to the hospital.
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
              {/* For videos you might want a <video> element instead */}
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
              Tap the MedStamp box to attach a secure MedStamp to today’s upload.
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

          {error && (
            <div className="text-xs text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-400">
              {success}
            </div>
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
  )
}

export default Home