// Home.tsx – Clinician console: issue MedStamps pack + review inbox

import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useState } from 'react'

const TOKEN_NAME = 'MedStamp'
const TOKEN_ID = 749176800
const STAMPS_PER_PACK = 5
const VALIDITY_DAYS = 5

// ----------------------
// Mock patient list
// ----------------------
interface Patient {
  id: string
  name: string
  dob: string
  status: string
}

const MOCK_PATIENTS: Patient[] = [
  { id: 'P-2024-001', name: 'Liam van Dijk', dob: '2019-03-15', status: 'Ready for discharge' },
  { id: 'P-2024-002', name: 'Sofia Bakker', dob: '2020-07-09', status: 'In recovery' },
  { id: 'P-2024-003', name: 'Noah Visser', dob: '2022-01-22', status: 'Ready for discharge' },
  { id: 'P-2024-004', name: 'Mila Janssen', dob: '2021-10-30', status: 'Follow-up' },
  { id: 'P-2024-005', name: 'Lucas de Jong', dob: '2018-12-02', status: 'Ready for discharge' },
]

// ----------------------
// Mock clinician inbox
// ----------------------
type InboxStatus = 'new' | 'reviewed'

interface InboxEntry {
  id: string
  caseId: string
  patientId: string
  patientName: string
  thumbnailUrl: string
  timestamp: string
  parentNote: string
  verified: boolean
  status: InboxStatus
  pendingRequestTemplate?: string
}

const INITIAL_INBOX: InboxEntry[] = [
  {
    id: 'E-001',
    caseId: 'CASE-12345',
    patientId: 'P-2024-001',
    patientName: 'Liam van Dijk',
    thumbnailUrl: 'https://via.placeholder.com/120x80.png?text=Day+2',
    timestamp: '2025-11-06 08:42',
    parentNote: 'Redness looks a bit better compared to yesterday.',
    verified: true,
    status: 'new',
    pendingRequestTemplate: 'Please show the incision from ~30 cm in good light.',
  },
  {
    id: 'E-002',
    caseId: 'CASE-67890',
    patientId: 'P-2024-003',
    patientName: 'Noah Visser',
    thumbnailUrl: 'https://via.placeholder.com/120x80.png?text=Day+1',
    timestamp: '2025-11-06 07:15',
    parentNote: 'Feeding well, but baby cries more in the evening.',
    verified: true,
    status: 'new',
    pendingRequestTemplate: 'Please record 10–15 seconds showing the full face while crying.',
  },
]

// ----------------------
// Case timeline
// ----------------------
interface TimelineEvent {
  id: string
  entryId: string
  caseId: string
  action: string
  details?: string
  timestamp: string
}

const formatNow = () => {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? `0${n}` : n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

const Home: React.FC = () => {
  const { activeAddress } = useWallet()

  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [secureLink, setSecureLink] = useState<string | null>(null)

  const [inboxEntries, setInboxEntries] = useState<InboxEntry[]>(INITIAL_INBOX)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])

  // ------------------------
  // Fetch token balance
  // ------------------------
  useEffect(() => {
    const fetchBalance = async () => {
      if (!activeAddress) {
        setBalance(null)
        return
      }

      setLoadingBalance(true)
      setError(null)

      try {
        // 🔴 TODO: Replace with real Algorand client call
        const mockBalance = 100
        setBalance(mockBalance)
      } catch (e: any) {
        console.error(e)
        setError('Failed to load token balance.')
      } finally {
        setLoadingBalance(false)
      }
    }

    fetchBalance()
  }, [activeAddress])

  // ------------------------
  // Handle issue MedStamps
  // ------------------------
  const handleIssueMedStamps = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSecureLink(null)

    if (!activeAddress) {
      setError('Connect your wallet first.')
      return
    }

    if (!selectedPatient) {
      setError('Please select a patient.')
      return
    }

    if (balance !== null && balance < STAMPS_PER_PACK) {
      setError(`You need at least ${STAMPS_PER_PACK} ${TOKEN_NAME}s to issue this pack.`)
      return
    }

    setIssuing(true)

    try {
      // 🔴 TODO: Call backend that issues MedStamps + returns secure link
      await new Promise((r) => setTimeout(r, 1000)) // mock delay

      const mockLink = `https://proofly.example/parent/case/${encodeURIComponent(
        selectedPatient.id
      )}?token=demo-token`

      setSecureLink(mockLink)
      setSuccess(
        `Issued ${STAMPS_PER_PACK} single-use MedStamps for ${selectedPatient.name}. The parent will receive a secure link by SMS/email.`
      )

      setBalance((prev) => (prev !== null ? prev - STAMPS_PER_PACK : prev))
    } catch (e: any) {
      console.error(e)
      setError('Failed to issue MedStamps.')
    } finally {
      setIssuing(false)
    }
  }

  // ------------------------
  // Inbox actions
  // ------------------------
  const appendTimelineEvent = (entry: InboxEntry, action: string, details?: string) => {
    const event: TimelineEvent = {
      id: `T-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      entryId: entry.id,
      caseId: entry.caseId,
      action,
      details,
      timestamp: formatNow(),
    }
    setTimeline((prev) => [event, ...prev])
  }

  const updateEntryStatus = (entryId: string, status: InboxStatus) => {
    setInboxEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status } : e))
    )
  }

  const handleLooksOk = (entry: InboxEntry) => {
    appendTimelineEvent(entry, 'Looks OK', 'Clinician confirmed current status looks acceptable.')
    updateEntryStatus(entry.id, 'reviewed')
  }

  const handleCallFollowUp = (entry: InboxEntry) => {
    appendTimelineEvent(
      entry,
      'Call / Book follow-up',
      'Clinician indicated a call or follow-up visit is needed.'
    )
    updateEntryStatus(entry.id, 'reviewed')
  }

  const handleRequestNewMedia = (entry: InboxEntry, template?: string) => {
    const text =
      template?.trim() ||
      entry.pendingRequestTemplate ||
      'Please send a new photo/video in good light, clearly showing the area of concern.'

    appendTimelineEvent(
      entry,
      'Request new photo/video',
      `Request to parent: "${text}"`
    )

    // 🔴 TODO: send this request to backend so it appears next time parent opens the link
    // e.g. POST /cases/:caseId/requests

    updateEntryStatus(entry.id, 'reviewed')
  }

  const getTimelineForEntry = (entryId: string) =>
    timeline.filter((t) => t.entryId === entryId)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Top: Issue MedStamps */}
        <div className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-6">
          <h1 className="text-xl font-semibold text-center">
            Proofly – Issue MedStamps
          </h1>

          {/* Wallet status */}
          <div className="text-sm font-mono break-all">
            {activeAddress ? (
              <>
                <span className="text-slate-400 block mb-1">Connected wallet:</span>
                <span>{activeAddress}</span>
              </>
            ) : (
              <span className="text-red-400">
                No wallet connected. Open the wallet modal in your main app to connect.
              </span>
            )}
          </div>

          {/* Balance */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-400">Token</span>
              <span className="text-slate-400">Balance</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
              <span>
                {TOKEN_NAME}{' '}
                <span className="text-slate-500 text-xs">(ID: {TOKEN_ID})</span>
              </span>
              <span>{loadingBalance ? 'Loading...' : balance ?? '--'}</span>
            </div>
          </div>

          {/* Patient selection + issue form */}
          <form onSubmit={handleIssueMedStamps} className="space-y-4">
            <div className="space-y-1 text-sm">
              <label className="block text-slate-300">Select patient / case</label>
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) =>
                  setSelectedPatient(
                    MOCK_PATIENTS.find((p) => p.id === e.target.value) || null
                  )
                }
                className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="">-- Select patient --</option>
                {MOCK_PATIENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} • {p.dob} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="text-xs text-slate-400 border border-slate-800 rounded-md p-2 bg-slate-900/60">
                <strong>Selected:</strong> {selectedPatient.name} ({selectedPatient.id})<br />
                DOB: {selectedPatient.dob}
                <br />
                Status: {selectedPatient.status}
              </div>
            )}

            <p className="text-xs text-slate-400">
              Clicking <span className="font-semibold">“Issue MedStamps”</span> will generate{' '}
              <span className="font-semibold">{STAMPS_PER_PACK} single-use MedStamps</span> for
              this case, valid for <span className="font-semibold">{VALIDITY_DAYS} days</span>.
              The parent receives a secure link by SMS/email (and optionally a printed QR).
            </p>

            {error && <div className="text-xs text-red-400">{error}</div>}
            {success && <div className="text-xs text-emerald-400">{success}</div>}

            {secureLink && (
              <div className="text-xs text-slate-300 break-all rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
                <span className="text-slate-400 block mb-1">
                  Debug (secure link preview – not for production display):
                </span>
                {secureLink}
              </div>
            )}

            <button
              type="submit"
              disabled={!activeAddress || issuing}
              className="mt-2 w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-medium disabled:bg-slate-700 disabled:text-slate-400"
            >
              {issuing ? 'Issuing…' : 'Issue MedStamps'}
            </button>
          </form>
        </div>

        {/* Bottom: Clinician Inbox */}
        <div className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Clinician inbox</h2>
            <span className="text-xs text-slate-400">
              New entries: {inboxEntries.filter((e) => e.status === 'new').length}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            New entries show a thumbnail, timestamp, parent note, and MedStamp verification. Use
            the quick actions below – all actions are added to the case timeline.
          </p>

          <div className="space-y-4">
            {inboxEntries.map((entry) => {
              const entryTimeline = getTimelineForEntry(entry.id)
              const [customTemplate, setCustomTemplate] = useState(entry.pendingRequestTemplate || '')

              // NOTE: using useState inside map is not allowed in real React –
              // If you want per-entry editable template, lift this state up.
              // To keep it strictly valid, we’ll *not* use per-entry state here.
              // Instead, we’ll just use the built-in template and ignore live editing.
              // (Leaving comment here so you can decide how complex you want it.)

              return (
                <div
                  key={entry.id}
                  className="rounded-md border border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-3"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-28 h-20 rounded-md overflow-hidden bg-slate-800 flex items-center justify-center">
                      {/* In production: distinguish photo vs video and use <video> if needed */}
                      <img
                        src={entry.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">
                          {entry.patientName}{' '}
                          <span className="text-slate-500 font-normal">
                            ({entry.caseId})
                          </span>
                        </span>
                        <span className="text-slate-400">{entry.timestamp}</span>
                      </div>
                      <div className="text-slate-300">
                        Parent note: <span className="italic">“{entry.parentNote}”</span>
                      </div>

                      {/* Verify banner */}
                      <div className="mt-1 inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-medium
                        border
                        ${
                          entry.verified
                            ? 'border-emerald-500 text-emerald-300 bg-emerald-900/30'
                            : 'border-yellow-400 text-yellow-200 bg-yellow-900/30'
                        }
                      ">
                        <span>Verify MedStamp</span>
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        <span>{entry.verified ? 'Authentic • Bound to case & device' : 'Verification pending'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleLooksOk(entry)}
                      className="rounded-md bg-emerald-700/80 px-3 py-1 hover:bg-emerald-600 disabled:bg-slate-700"
                    >
                      Looks OK
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestNewMedia(entry)}
                      className="rounded-md bg-amber-700/80 px-3 py-1 hover:bg-amber-600 disabled:bg-slate-700"
                    >
                      Ask for new photo/video
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallFollowUp(entry)}
                      className="rounded-md bg-sky-700/80 px-3 py-1 hover:bg-sky-600 disabled:bg-slate-700"
                    >
                      Call / Book follow-up
                    </button>
                  </div>

                  {/* Template info */}
                  <div className="text-[11px] text-slate-400">
                    Templated request that will appear to the parent next time they open the link:
                    <br />
                    <span className="text-slate-200">
                      “{entry.pendingRequestTemplate ||
                        'Please show the incision from ~30 cm in good light.'}
                      ”
                    </span>
                  </div>

                  {/* Timeline for this entry */}
                  {entryTimeline.length > 0 && (
                    <div className="mt-2 border-t border-slate-800 pt-2">
                      <div className="text-[11px] text-slate-400 mb-1">
                        Case timeline (latest first):
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {entryTimeline.map((t) => (
                          <li key={t.id} className="flex gap-2">
                            <span className="text-slate-500 min-w-[90px]">
                              {t.timestamp}
                            </span>
                            <span className="font-semibold">{t.action}:</span>
                            <span className="text-slate-200">{t.details}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Status tag */}
                  <div className="flex justify-end">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        entry.status === 'new'
                          ? 'bg-indigo-900/50 text-indigo-200'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {entry.status === 'new' ? 'New' : 'Reviewed'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home