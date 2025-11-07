// Home.tsx – Clinician console (single-column; semantic tokens via CSS vars in this file)
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
    <div
      // Semantic tokens injected here (kept local to this file)
      style={{
        // Surfaces
        ['--surface' as any]: '#0f172a',
        ['--surface-subtle' as any]: '#1e293b',
        ['--surface-elevated' as any]: '#111827',
        // Text
        ['--text-primary' as any]: '#f8fafc',
        ['--text-secondary' as any]: '#cbd5e1',
        ['--text-muted' as any]: '#94a3b8',
        // Accent
        ['--accent-yellow' as any]: '#fbbf24',
        ['--accent-blue' as any]: '#38bdf8',
        ['--accent-green' as any]: '#10b981',
        ['--accent-red' as any]: '#ef4444',
        // Borders
        ['--outline' as any]: '#334155',
      }}
      className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]"
    >
      {/* Top / brand bar */}
      <header className="border-b border-[var(--outline)]/60 bg-[var(--surface)]/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--accent-yellow)]" />
            <span className="font-semibold tracking-tight">PROOFLY</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {activeAddress ? 'Wallet connected' : 'No wallet connected'}
          </div>
        </div>
      </header>

      {/* HERO */}
       <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(56,189,248,0.15),transparent),radial-gradient(40%_40%_at_120%_10%,rgba(251,191,36,0.15),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 lg:py-20 text-center">
          <h1 className="text-4xl/tight font-semibold tracking-tight sm:text-5xl">
            Proofly —  <span className="text-[var(--accent-yellow)]">Capture Once.<br /></span> Prove Forever.
          </h1>
          <p className="mt-4 text-[var(--text-secondary)]">
            Turn moments of care into verifiable proof — instantly and securely.<br />
             Designed for Patients and Clinicians. Powered by MedStamp.
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href="#issue"
              className="rounded-lg bg-[var(--accent-yellow)] px-6 py-3 text-[var(--surface)] font-medium shadow hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/70"
            >
              Issue MedStamps
            </a>
          </div>
        </div>
      </section>

      {/* MAIN single-column */}
      <main id="issue" className="mx-auto max-w-3xl px-4 pb-20 space-y-8">
        {/* Issue MedStamps panel */}
        <div className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-subtle)] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.30)] space-y-6">
          <h2 className="text-2xl font-semibold">Issue New MedStamps</h2>

          {/* Wallet status */}
          <div className="text-xs font-mono break-all rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] p-3">
            {activeAddress ? (
              <>
                <span className="text-[var(--text-muted)] block mb-1">Connected wallet:</span>
                <span>{activeAddress}</span>
              </>
            ) : (
              <span className="text-[var(--accent-red)]">
                No wallet connected. Open the wallet modal in your main app to connect.
              </span>
            )}
          </div>

          {/* Balance */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1 text-[var(--text-muted)]">
              <span>Token</span>
              <span>Balance</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
              <span>
                {TOKEN_NAME}{' '}
                <span className="text-[var(--text-muted)] text-xs">(ID: {TOKEN_ID})</span>
              </span>
              <span>{loadingBalance ? 'Loading...' : balance ?? '--'}</span>
            </div>
          </div>

          {/* Patient selection + issue form */}
          <form onSubmit={handleIssueMedStamps} className="space-y-4">
            <div className="space-y-1 text-sm">
              <label className="block text-[var(--text-secondary)]">Select patient / case</label>
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) =>
                  setSelectedPatient(
                    MOCK_PATIENTS.find((p) => p.id === e.target.value) || null
                  )
                }
                className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-blue)]"
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
              <div className="text-xs text-[var(--text-secondary)] border border-[var(--outline)] rounded-lg p-3 bg-[var(--surface-elevated)]">
                <div className="font-semibold text-[var(--text-primary)]">
                  {selectedPatient.name} ({selectedPatient.id})
                </div>
                <div>DOB: {selectedPatient.dob}</div>
                <div>Status: {selectedPatient.status}</div>
              </div>
            )}

            <p className="text-xs text-[var(--text-muted)]">
              Generate{' '}
              <span className="font-semibold">{STAMPS_PER_PACK} single-use MedStamps</span> valid for <span className="font-semibold">{VALIDITY_DAYS} days</span>.

            </p>

            {error && (
              <div className="text-xs border border-[var(--accent-red)]/50 bg-[var(--accent-red)]/10 px-3 py-2 rounded-md text-[var(--accent-red)]">
                {error}
              </div>
            )}
            {success && (
              <div className="text-xs border border-[var(--accent-green)]/50 bg-[var(--accent-green)]/10 px-3 py-2 rounded-md text-[var(--accent-green)]">
                {success}
              </div>
            )}

            {secureLink && (
              <div className="text-xs text-[var(--text-primary)] break-all rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-3 py-2">
                <span className="text-[var(--text-muted)] block mb-1">
                  Debug (secure link preview – not for production display):
                </span>
                {secureLink}
              </div>
            )}

            <button
              type="submit"
              disabled={!activeAddress || issuing}
              className="mt-2 w-full rounded-lg bg-[var(--accent-yellow)] px-4 py-3 text-sm font-medium text-[var(--surface)] shadow hover:brightness-95 disabled:bg-[var(--surface-elevated)] disabled:text-[var(--text-muted)]"
            >
              {issuing ? 'Issuing…' : 'Issue MedStamps'}
            </button>
          </form>
        </div>

        {/* Clinician Inbox */}
        <section id="inbox" className="w-full rounded-2xl border border-[var(--outline)] bg-[var(--surface-subtle)] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.30)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Clinician Inbox</h2>
            <span className="text-xs text-[var(--text-muted)]">
              New entries: {inboxEntries.filter((e) => e.status === 'new').length}
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
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
                  className="rounded-xl border border-[var(--outline)] bg-[var(--surface-elevated)] p-4 flex flex-col gap-3"
                >
                  <div className="flex gap-3 flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="w-full sm:w-28 h-20 rounded-md overflow-hidden bg-[var(--surface-subtle)] flex items-center justify-center">
                      <img
                        src={entry.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {entry.patientName}{' '}
                          <span className="text-[var(--text-muted)] font-normal">
                            ({entry.caseId})
                          </span>
                        </span>
                        <span className="text-[var(--text-muted)]">{entry.timestamp}</span>
                      </div>
                      <div className="text-[var(--text-secondary)]">
                        Parent note: <span className="italic">“{entry.parentNote}”</span>
                      </div>

                      {/* Verify banner */}
                      <div
                        className={`mt-1 inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-medium border ${
                          entry.verified
                            ? 'border-[var(--accent-green)] text-[var(--accent-green)] bg-[color:rgb(16_185_129_/_0.12)]'
                            : 'border-[var(--accent-yellow)] text-[var(--accent-yellow)] bg-[color:rgb(251_191_36_/_0.12)]'
                        }`}
                      >
                        <span>Verify MedStamp</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--accent-green)]" />
                        <span>{entry.verified ? 'Authentic • Bound to case & device' : 'Verification pending'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleLooksOk(entry)}
                      className="rounded-md bg-[color:rgb(16_185_129_/_0.80)] px-3 py-1 hover:bg-[color:rgb(16_185_129_/_0.90)]"
                    >
                      Looks OK
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestNewMedia(entry)}
                      className="rounded-md bg-[color:rgb(251_191_36_/_0.85)] px-3 py-1 hover:bg-[color:rgb(251_191_36_/_0.95)] text-[var(--surface)]"
                    >
                      Ask for new photo/video
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallFollowUp(entry)}
                      className="rounded-md bg-[color:rgb(56_189_248_/_0.80)] px-3 py-1 hover:bg-[color:rgb(56_189_248_/_0.90)]"
                    >
                      Call / Book follow-up
                    </button>
                  </div>

                  {/* Template info */}
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Templated request that will appear to the parent next time they open the link:
                    <br />
                    <span className="text-[var(--text-primary)]">
                      “{entry.pendingRequestTemplate ||
                        'Please show the incision from ~30 cm in good light.'}
                      ”
                    </span>
                  </div>

                  {/* Timeline for this entry */}
                  {entryTimeline.length > 0 && (
                    <div className="mt-2 border-t border-[var(--outline)] pt-2">
                      <div className="text-[11px] text-[var(--text-muted)] mb-1">
                        Case timeline (latest first):
                      </div>
                      <ul className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                        {entryTimeline.map((t) => (
                          <li key={t.id} className="flex gap-2">
                            <span className="text-[var(--text-muted)] min-w-[90px]">
                              {t.timestamp}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">{t.action}:</span>
                            <span>{t.details}</span>
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
                          ? 'bg-[color:rgb(76_29_149_/_0.50)] text-[color:rgb(224_231_255)]'
                          : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {entry.status === 'new' ? 'New' : 'Reviewed'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--outline)]">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} Proofly • MedStamp on Algorand
        </div>
      </footer>
    </div>
  )
}

export default Home
