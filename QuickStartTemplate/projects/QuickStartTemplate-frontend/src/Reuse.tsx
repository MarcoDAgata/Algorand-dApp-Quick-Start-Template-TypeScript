// Reuse.tsx – MedStamp Reuse view (single-column; same semantic tokens as Home)
import React, { useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { BsWallet2 } from 'react-icons/bs'
import ConnectWallet from './components/ConnectWallet'

type EvidenceType = 'video' | 'photo' | 'audio'
type SampleStatus = 'originated' | 'validated' | 'reusable' | 'high-value'

interface ReuseSample {
  id: string
  caseId: string
  patientCode: string
  evidenceType: EvidenceType
  thumbnailUrl: string
  createdAt: string
  lastUsedAt: string
  originatorWallet: string
  validatorName: string
  validatorRole: string
  homeHospital: string
  tags: string[]
  status: SampleStatus
  reuseCount: number
  hospitalsReusedIn: string[]
  reusePurposes: string[] // e.g. ['Education', 'Triage', 'Research', 'AI training']
  medStampAssetId: number
}

// ----------------------
// Mock reuse content
// ----------------------
const MOCK_REUSE_SAMPLES: ReuseSample[] = [
  {
    id: 'R-2024-001',
    caseId: 'CASE-12345',
    patientCode: 'P-2024-001',
    evidenceType: 'video',
    thumbnailUrl: 'https://via.placeholder.com/160x100.png?text=GMA+Day+3',
    createdAt: '2025-11-02 09:15',
    lastUsedAt: '2025-11-06 13:04',
    originatorWallet: 'JNBRI4QXSUYYGWXI5RWCJJHZEH55AWXJHNV26XASCAGBAWAVV4D7GF46LA',
    validatorName: 'Dr. K. Vermeer',
    validatorRole: 'Neonatologist',
    homeHospital: 'UMCU NICU',
    tags: ['GMA', 'Preterm', 'Movement', 'Home video'],
    status: 'high-value',
    reuseCount: 18,
    hospitalsReusedIn: ['UMCU', 'LUMC', 'Máxima MC', 'Alder Hey'],
    reusePurposes: ['Education', 'Research', 'AI training'],
    medStampAssetId: 749176800,
  },
  {
    id: 'R-2024-002',
    caseId: 'CASE-67890',
    patientCode: 'P-2024-003',
    evidenceType: 'video',
    thumbnailUrl: 'https://via.placeholder.com/160x100.png?text=Cry+Clip',
    createdAt: '2025-11-03 19:22',
    lastUsedAt: '2025-11-05 08:40',
    originatorWallet: 'JNBRI4QXSUYYGWXI5RWCJJHZEH55AWXJHNV26XASCAGBAWAVV4D7GF46LA',
    validatorName: 'Nurse specialist J. de Vries',
    validatorRole: 'NICU nurse specialist',
    homeHospital: 'LUMC NICU',
    tags: ['Cry', 'Evening', 'Feeding', 'Home video'],
    status: 'reusable',
    reuseCount: 6,
    hospitalsReusedIn: ['LUMC', 'UMCG'],
    reusePurposes: ['Triage', 'Education'],
    medStampAssetId: 749176800,
  },
  {
    id: 'R-2024-003',
    caseId: 'CASE-55555',
    patientCode: 'P-2024-004',
    evidenceType: 'photo',
    thumbnailUrl: 'https://via.placeholder.com/160x100.png?text=Wound+Check',
    createdAt: '2025-11-01 11:03',
    lastUsedAt: '2025-11-04 16:12',
    originatorWallet: 'JNBRI4QXSUYYGWXI5RWCJJHZEH55AWXJHNV26XASCAGBAWAVV4D7GF46LA',
    validatorName: 'Dr. M. van Leeuwen',
    validatorRole: 'Pediatric surgeon',
    homeHospital: 'Radboudumc',
    tags: ['Post-op', 'Skin', 'Wound healing'],
    status: 'validated',
    reuseCount: 2,
    hospitalsReusedIn: ['Radboudumc'],
    reusePurposes: ['Education'],
    medStampAssetId: 749176800,
  },
  {
    id: 'R-2024-004',
    caseId: 'CASE-77777',
    patientCode: 'P-2024-005',
    evidenceType: 'audio',
    thumbnailUrl: 'https://via.placeholder.com/160x100.png?text=Audio',
    createdAt: '2025-10-28 07:45',
    lastUsedAt: '2025-11-03 10:01',
    originatorWallet: 'JNBRI4QXSUYYGWXI5RWCJJHZEH55AWXJHNV26XASCAGBAWAVV4D7GF46LA',
    validatorName: 'Dr. S. Rossi',
    validatorRole: 'Pediatric cardiologist',
    homeHospital: 'Erasmus MC – Sophia',
    tags: ['Heart', 'Murmur', 'Follow-up'],
    status: 'originated',
    reuseCount: 0,
    hospitalsReusedIn: [],
    reusePurposes: [],
    medStampAssetId: 749176800,
  },
]

// Helper for “compounded value” visualisation (0–100)
const getCompoundedScore = (reuseCount: number, hospitals: number, purposes: number) => {
  const cappedReuse = Math.min(reuseCount, 25)
  const reuseComponent = (cappedReuse / 25) * 60
  const hospitalComponent = Math.min(hospitals * 8, 24)
  const purposeComponent = Math.min(purposes * 5, 16)
  return Math.round(reuseComponent + hospitalComponent + purposeComponent)
}

const Reuse: React.FC = () => {
  const { activeAddress } = useWallet()
  const [openWalletModal, setOpenWalletModal] = useState(false)

  const [statusFilter, setStatusFilter] = useState<SampleStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<EvidenceType | 'all'>('all')
  const [minReuseFilter, setMinReuseFilter] = useState<number>(0)
  const [search, setSearch] = useState<string>('')

  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)

  const selectedSample = useMemo(
    () => MOCK_REUSE_SAMPLES.find((s) => s.id === selectedSampleId) || null,
    [selectedSampleId]
  )

  const filteredSamples = useMemo(
    () =>
      MOCK_REUSE_SAMPLES.filter((sample) => {
        if (statusFilter !== 'all' && sample.status !== statusFilter) return false
        if (typeFilter !== 'all' && sample.evidenceType !== typeFilter) return false
        if (sample.reuseCount < minReuseFilter) return false

        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const haystack = [
            sample.caseId,
            sample.patientCode,
            sample.validatorName,
            sample.homeHospital,
            ...sample.tags,
          ]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }

        return true
      }),
    [statusFilter, typeFilter, minReuseFilter, search]
  )

  const totalSamples = MOCK_REUSE_SAMPLES.length
  const totalValidated = MOCK_REUSE_SAMPLES.filter(
    (s) => s.status === 'validated' || s.status === 'high-value'
  ).length
  const totalReuseEvents = MOCK_REUSE_SAMPLES.reduce((acc, s) => acc + s.reuseCount, 0)
  const avgReuse = totalSamples > 0 ? (totalReuseEvents / totalSamples).toFixed(1) : '0.0'
  const contributingHospitals = Array.from(
    new Set(MOCK_REUSE_SAMPLES.map((s) => s.homeHospital))
  ).length

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
      className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]"
    >
      {/* Top / brand bar */}
      <header className="border-b border-[var(--outline)]/60 bg-[var(--surface)]/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--accent-yellow)]" />
            <span className="font-semibold tracking-tight">PROOFLY</span>
          </div>

          <button
            onClick={() => setOpenWalletModal(true)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition
              ${
                activeAddress
                  ? 'bg-[var(--accent-yellow)] text-[var(--surface)] hover:brightness-95'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
          >
            <BsWallet2 className="text-current" />
            {activeAddress ? 'Wallet linked' : 'Connect wallet'}
          </button>
        </div>
      </header>

      {/* HERO / intro */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(56,189,248,0.15),transparent),radial-gradient(40%_40%_at_120%_10%,rgba(251,191,36,0.15),transparent)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-10 lg:py-14">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            MedStamp Reuse
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl">
            Where validated patient-born evidence grows in value.
          </p>
          <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
            This view shows all MedStamp-verified samples that can be reused for clinical
            assessment, education, research and AI training. Each additional reuse compounds the
            trust and impact of the shared evidence base.
          </p>

          {/* High-level metrics */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-subtle)] px-4 py-3">
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Total samples
              </div>
              <div className="mt-1 text-xl font-semibold">{totalSamples}</div>
            </div>
            <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-subtle)] px-4 py-3">
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Validated / high-value
              </div>
              <div className="mt-1 text-xl font-semibold">{totalValidated}</div>
            </div>
            <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-subtle)] px-4 py-3">
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Total reuse events
              </div>
              <div className="mt-1 text-xl font-semibold">{totalReuseEvents}</div>
            </div>
            <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-subtle)] px-4 py-3">
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Contributing hospitals
              </div>
              <div className="mt-1 text-xl font-semibold">{contributingHospitals}</div>
              <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                Avg reuse / sample: {avgReuse}×
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <main className="mx-auto max-w-5xl px-4 pb-16 space-y-6">
        {/* Filters */}
        <section className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-subtle)] p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.30)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-semibold">Filter reusable samples</h2>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setTypeFilter('all')
                setMinReuseFilter(0)
                setSearch('')
              }}
              className="self-start sm:self-auto text-xs rounded-full border border-[var(--outline)] px-3 py-1 text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
            >
              Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="block text-[var(--text-secondary)]">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SampleStatus | 'all')}
                className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-2 py-1.5 outline-none focus:border-[var(--accent-blue)]"
              >
                <option value="all">All</option>
                <option value="originated">Originated only</option>
                <option value="validated">Validated</option>
                <option value="reusable">Reusable</option>
                <option value="high-value">High-value</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[var(--text-secondary)]">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as EvidenceType | 'all')}
                className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-2 py-1.5 outline-none focus:border-[var(--accent-blue)]"
              >
                <option value="all">All</option>
                <option value="video">Video</option>
                <option value="photo">Photo</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[var(--text-secondary)]">Minimum reuse</label>
              <select
                value={minReuseFilter}
                onChange={(e) => setMinReuseFilter(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-2 py-1.5 outline-none focus:border-[var(--accent-blue)]"
              >
                <option value={0}>Any</option>
                <option value={1}>1+ reuse</option>
                <option value={3}>3+ reuse</option>
                <option value={5}>5+ reuse</option>
                <option value={10}>10+ reuse</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[var(--text-secondary)]">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Case, hospital, tag…"
                className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-2 py-1.5 text-xs sm:text-sm outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>
        </section>

        {/* List + details */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
          {/* List */}
          <div className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-subtle)] p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.30)] space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Reusable samples</h2>
              <span className="text-[10px] text-[var(--text-muted)]">
                Showing {filteredSamples.length} of {totalSamples}
              </span>
            </div>

            <div className="space-y-3">
              {filteredSamples.map((sample) => {
                const score = getCompoundedScore(
                  sample.reuseCount,
                  sample.hospitalsReusedIn.length,
                  sample.reusePurposes.length
                )
                const isActive = selectedSampleId === sample.id

                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => setSelectedSampleId(sample.id)}
                    className={`w-full text-left rounded-2xl border px-3 py-3 sm:px-4 sm:py-4 transition ${
                      isActive
                        ? 'border-[var(--accent-blue)] bg-[color:rgb(15_23_42)]'
                        : 'border-[var(--outline)] bg-[var(--surface-elevated)] hover:border-[var(--accent-blue)]/70'
                    }`}
                  >
                    <div className="grid grid-cols-[auto,minmax(0,1fr)] gap-3 sm:gap-4 items-stretch">
                      {/* Thumbnail */}
                      <div className="w-32 sm:w-40 rounded-xl overflow-hidden border border-[var(--outline)] bg-[var(--surface-subtle)] min-h-[80px] flex items-center justify-center">
                        <img
                          src={sample.thumbnailUrl}
                          alt={sample.caseId}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-2">
                        {/* Top row: IDs */}
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div>
                            <div className="text-xs text-[var(--text-muted)]">
                              Case {sample.caseId}
                            </div>
                            <div className="text-sm sm:text-base font-semibold">
                              {sample.homeHospital}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                              Reuse count
                            </div>
                            <div className="text-sm sm:text-base font-semibold">
                              {sample.reuseCount}×
                            </div>
                          </div>
                        </div>

                        {/* Lifecycle bar */}
                        <div className="mt-1">
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
                            <span>Lifecycle</span>
                            <span>
                              {sample.createdAt} → {sample.lastUsedAt}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="px-2 py-0.5 rounded-full bg-[color:rgb(55_65_81)] text-[var(--text-secondary)]">
                                O
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[color:rgb(55_65_81)] text-[var(--text-secondary)]">
                                V
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[color:rgb(8_47_73)] text-[var(--accent-blue)]">
                                R {sample.reuseCount}
                              </span>
                            </div>
                            <div className="flex-1 h-1.5 rounded-full bg-[color:rgb(30_64_175)]/40 overflow-hidden">
                              <div
                                className="h-full bg-[var(--accent-yellow)]"
                                style={{ width: `${Math.max(6, score)}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              Score {score}
                            </div>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] text-[var(--text-secondary)]">
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">
                              {sample.validatorName}
                            </div>
                            <div>{sample.validatorRole}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {sample.hospitalsReusedIn.length} hospitals
                            </div>
                            <div>
                              Uses:{' '}
                              {sample.reusePurposes.length > 0
                                ? sample.reusePurposes.join(', ')
                                : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Tags + status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                          <div className="flex flex-wrap gap-1">
                            <span className="inline-flex items-center rounded-full border border-[var(--outline)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                              {sample.evidenceType.toUpperCase()}
                            </span>
                            {sample.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-[color:rgb(31_41_55)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                              >
                                {tag}
                              </span>
                            ))}
                            {sample.tags.length > 3 && (
                              <span className="text-[10px] text-[var(--text-muted)]">
                                +{sample.tags.length - 3} more
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              sample.status === 'high-value'
                                ? 'border-[var(--accent-green)] text-[var(--accent-green)]'
                                : sample.status === 'reusable'
                                ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]'
                                : sample.status === 'validated'
                                ? 'border-[var(--accent-yellow)] text-[var(--accent-yellow)]'
                                : 'border-[var(--outline)] text-[var(--text-muted)]'
                            }`}
                          >
                            {sample.status === 'high-value'
                              ? 'High-value evidence'
                              : sample.status === 'reusable'
                              ? 'Reusable'
                              : sample.status === 'validated'
                              ? 'Validated'
                              : 'Originated only'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}

              {filteredSamples.length === 0 && (
                <div className="text-xs text-[var(--text-muted)] text-center py-4">
                  No samples match these filters yet.
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-subtle)] p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.30)]">
            <h2 className="text-lg font-semibold mb-3">Reuse details</h2>

            {!selectedSample && (
              <p className="text-xs text-[var(--text-secondary)]">
                Select a sample on the left to see its full provenance and reuse map. This view
                explains how a single patient-born clip can create value across hospitals, use
                cases and AI models.
              </p>
            )}

            {selectedSample && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-elevated)] p-3 flex gap-3">
                  <div className="w-24 rounded-lg overflow-hidden border border-[var(--outline)] bg-[var(--surface-subtle)] min-h-[60px] flex items-center justify-center">
                    <img
                      src={selectedSample.thumbnailUrl}
                      alt={selectedSample.caseId}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Case {selectedSample.caseId} • {selectedSample.patientCode}
                    </div>
                    <div className="font-semibold">{selectedSample.homeHospital}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                      Created {selectedSample.createdAt} • Last reused {selectedSample.lastUsedAt}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="inline-flex items-center rounded-full border border-[var(--outline)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                        {selectedSample.evidenceType.toUpperCase()}
                      </span>
                      {selectedSample.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-[color:rgb(31_41_55)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Provenance */}
                <div className="space-y-1">
                  <h3 className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Provenance
                  </h3>
                  <div className="rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] p-3 space-y-1.5">
                    <div>
                      <span className="text-[var(--text-muted)]">Originator wallet:</span>
                      <div className="mt-0.5 font-mono text-[11px] break-all">
                        {selectedSample.originatorWallet}
                      </div>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Validator:</span>{' '}
                      <span className="font-semibold">{selectedSample.validatorName}</span>
                      <span className="text-[var(--text-muted)]">
                        {' '}
                        ({selectedSample.validatorRole})
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">MedStamp ASA ID:</span>{' '}
                      <span className="font-mono">{selectedSample.medStampAssetId}</span>
                    </div>
                  </div>
                </div>

                {/* Reuse map */}
                <div className="space-y-1">
                  <h3 className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Reuse map
                  </h3>
                  <div className="rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Total reuse</div>
                        <div className="text-base font-semibold">
                          {selectedSample.reuseCount}×
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Hospitals using this
                        </div>
                        <div className="text-base font-semibold">
                          {selectedSample.hospitalsReusedIn.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Compounded score
                        </div>
                        <div className="text-base font-semibold">
                          {getCompoundedScore(
                            selectedSample.reuseCount,
                            selectedSample.hospitalsReusedIn.length,
                            selectedSample.reusePurposes.length
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-1">
                      <div className="text-[10px] text-[var(--text-muted)] mb-1">
                        Hospitals that reused this sample:
                      </div>
                      {selectedSample.hospitalsReusedIn.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedSample.hospitalsReusedIn.map((h) => (
                            <span
                              key={h}
                              className="inline-flex items-center rounded-full bg-[color:rgb(30_64_175_/_0.45)] px-2 py-0.5 text-[10px]"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)]">
                          Not yet reused outside the origin hospital.
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] mb-1">
                        Reuse purposes:
                      </div>
                      {selectedSample.reusePurposes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedSample.reusePurposes.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center rounded-full bg-[color:rgb(22_101_52_/_0.45)] px-2 py-0.5 text-[10px]"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)]">
                          No downstream reuse registered yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call to reuse */}
                <div className="pt-1 border-t border-[var(--outline)] mt-2">
                  <p className="text-[11px] text-[var(--text-secondary)] mb-2">
                    When you reuse this sample for assessment, teaching, research or AI training,
                    you add another layer of confirmation on top of the original patient effort and
                    clinical validation. That is where MedStamp creates compounded value.
                  </p>
                  <button
                    type="button"
                    className="w-full rounded-lg bg-[var(--accent-yellow)] px-4 py-2.5 text-xs sm:text-sm font-medium text-[var(--surface)] hover:brightness-95"
                  >
                    Reuse this sample in a new case set
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--outline)]">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-[10px] text-[var(--text-muted)]">
          © {new Date().getFullYear()} Proofly • MedStamp on Algorand • MedStamp Reuse
        </div>
      </footer>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
    </div>
  )
}

export default Reuse
