// Transact.tsx – styled like Home.tsx (Proofly dark theme, clinician persona)
import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineSend } from 'react-icons/ai'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const LORA = 'https://lora.algokit.io/testnet'
  const [loading, setLoading] = useState(false)
  const [receiverAddress, setReceiverAddress] = useState('')
  const [assetType, setAssetType] = useState<'ALGO' | 'USDC'>('ALGO')
  const [groupLoading, setGroupLoading] = useState(false)
  const [groupReceiverAddress, setGroupReceiverAddress] = useState('')
  const [optInLoading, setOptInLoading] = useState(false)
  const [alreadyOpted, setAlreadyOpted] = useState(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const usdcAssetId = 10458941n
  const usdcDecimals = 6

  useEffect(() => {
    const checkOptIn = async () => {
      try {
        if (!openModal || !activeAddress) return setAlreadyOpted(false)
        const acctInfo: any = await algorand.client.algod.accountInformation(activeAddress).do()
        const assets: any[] = Array.isArray(acctInfo?.assets) ? acctInfo.assets : []
        const opted = assets.some((a: any) => {
          const rawId = a?.['asset-id'] ?? a?.assetId ?? a?.asset?.id
          if (!rawId) return false
          try {
            return BigInt(rawId) === usdcAssetId
          } catch {
            return false
          }
        })
        setAlreadyOpted(opted)
      } catch (e) {
        console.error('Opt-in precheck failed:', e)
      }
    }
    checkOptIn()
  }, [openModal, activeAddress])

  const handleSubmit = async () => {
    setLoading(true)
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }
    try {
      enqueueSnackbar(`Sending ${assetType} transaction...`, { variant: 'info' })
      let txResult, msg
      if (assetType === 'ALGO') {
        txResult = await algorand.send.payment({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          amount: algo(1),
        })
        msg = '✅ 1 ALGO sent!'
      } else {
        const usdcAmount = 1n * 10n ** BigInt(usdcDecimals)
        txResult = await algorand.send.assetTransfer({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          assetId: usdcAssetId,
          amount: usdcAmount,
        })
        msg = '✅ 1 USDC sent!'
      }
      const txId = txResult?.txIds?.[0]
      enqueueSnackbar(`${msg} TxID: ${txId}`, {
        variant: 'success',
        action: () =>
          txId ? (
            <a
              href={`${LORA}/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })
      setReceiverAddress('')
    } catch (e) {
      console.error(e)
      enqueueSnackbar(`Failed to send ${assetType}`, { variant: 'error' })
    }
    setLoading(false)
  }

  const handleOptInUSDC = async () => {
    setOptInLoading(true)
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setOptInLoading(false)
      return
    }
    try {
      const acctInfo: any = await algorand.client.algod.accountInformation(activeAddress).do()
      const assets: any[] = Array.isArray(acctInfo?.assets) ? acctInfo.assets : []
      const alreadyOptedNow = assets.some((a: any) => {
        const rawId = a?.['asset-id'] ?? a?.assetId ?? a?.asset?.id
        if (!rawId) return false
        try {
          return BigInt(rawId) === usdcAssetId
        } catch {
          return false
        }
      })
      setAlreadyOpted(alreadyOptedNow)
      if (alreadyOptedNow) {
        enqueueSnackbar('Already opted in to USDC.', { variant: 'info' })
        setOptInLoading(false)
        return
      }
      const res = await algorand.send.assetOptIn({
        signer: transactionSigner,
        sender: activeAddress,
        assetId: usdcAssetId,
      })
      const txId = res?.txIds?.[0]
      enqueueSnackbar(`✅ Opt-in complete. TxID: ${txId}`, {
        variant: 'success',
        action: () =>
          txId ? (
            <a
              href={`${LORA}/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })
      setAlreadyOpted(true)
    } catch (e) {
      console.error(e)
      enqueueSnackbar('USDC opt-in failed.', { variant: 'error' })
    }
    setOptInLoading(false)
  }

  const handleAtomicGroup = async () => {
    setGroupLoading(true)
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setGroupLoading(false)
      return
    }
    if (groupReceiverAddress.length !== 58) {
      enqueueSnackbar('Enter a valid Algorand address.', { variant: 'warning' })
      setGroupLoading(false)
      return
    }
    try {
      enqueueSnackbar('Sending atomic transfer...', { variant: 'info' })
      const group = algorand.newGroup()
      group.addPayment({ signer: transactionSigner, sender: activeAddress, receiver: groupReceiverAddress, amount: algo(1) })
      const oneUSDC = 1n * 10n ** BigInt(usdcDecimals)
      group.addAssetTransfer({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: groupReceiverAddress,
        assetId: usdcAssetId,
        amount: oneUSDC,
      })
      const result = await group.send()
      const firstTx = result?.txIds?.[0]
      enqueueSnackbar(`✅ Atomic transfer complete!`, {
        variant: 'success',
        action: () =>
          firstTx ? (
            <a
              href={`${LORA}/transaction/${firstTx}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })
      setGroupReceiverAddress('')
    } catch (e) {
      console.error(e)
      enqueueSnackbar('Atomic transfer failed.', { variant: 'error' })
    }
    setGroupLoading(false)
  }

  return (
    <dialog
      id="transact_modal"
      className={`modal modal-bottom sm:modal-middle ${openModal ? 'modal-open' : ''}`}
    >
      <div
        // Local semantic color vars like in Home.tsx
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
        className="modal-box max-w-md rounded-2xl border border-[var(--outline)] bg-[var(--surface-subtle)] text-[var(--text-primary)] shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
      >
        {(loading || groupLoading || optInLoading) && (
          <div className="relative h-1 w-full mb-4 overflow-hidden rounded bg-[var(--surface-elevated)]">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-[var(--accent-blue)]" />
            <style>{`
              @keyframes loading {
                0% { transform: translateX(-120%); }
                50% { transform: translateX(60%); }
                100% { transform: translateX(220%); }
              }
            `}</style>
          </div>
        )}

        <h3 className="flex items-center gap-3 text-xl font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-yellow)]/10">
            <AiOutlineSend className="text-[var(--accent-yellow)] text-xl" />
          </span>
          Acquire New MedStamps
        </h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Send 1 ALGO or 1 USDC to the Proofly registry address to mint a new pack of MedStamps.
        </p>

        {/* Receiver input */}
        <div className="mt-5 space-y-1">
          <label className="text-sm text-[var(--text-secondary)]">Receiver’s Address</label>
          <input
            type="text"
            className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-blue)] outline-none"
            placeholder="e.g. KPLX..."
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
          />
          <div className="flex justify-between text-xs mt-1 text-[var(--text-muted)]">
            <span>Amount: 1 {assetType}</span>
            <span
              className={`font-mono ${
                receiverAddress.length === 58 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
              }`}
            >
              {receiverAddress.length}/58
            </span>
          </div>
        </div>

        {/* Toggle ALGO / USDC */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            className={`px-4 py-2 rounded-lg font-medium border ${
              assetType === 'ALGO'
                ? 'bg-[var(--accent-blue)] text-[var(--surface)]'
                : 'bg-[var(--surface-elevated)] border-[var(--outline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setAssetType('ALGO')}
          >
            ALGO
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium border ${
              assetType === 'USDC'
                ? 'bg-[var(--accent-blue)] text-[var(--surface)]'
                : 'bg-[var(--surface-elevated)] border-[var(--outline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setAssetType('USDC')}
          >
            USDC
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row-reverse gap-3">
          <button
            type="button"
            disabled={loading || receiverAddress.length !== 58}
            onClick={handleSubmit}
            className={`w-full sm:w-auto rounded-lg font-semibold px-5 py-3 transition ${
              receiverAddress.length === 58
                ? 'bg-[var(--accent-yellow)] text-[var(--surface)] hover:brightness-95'
                : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" /> Sending…
              </span>
            ) : (
              `Send 1 ${assetType}`
            )}
          </button>
          <button
            onClick={() => setModalState(false)}
            className="w-full sm:w-auto rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-5 py-3 text-[var(--text-secondary)] hover:bg-[var(--surface)]"
          >
            Close
          </button>
        </div>

        {/* Atomic Group Section */}
        <div className="mt-8 border-t border-[var(--outline)] pt-5 space-y-3">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Atomic Transfer (2-in-1)</h4>
          <p className="text-xs text-[var(--text-muted)]">
            Send <span className="text-[var(--text-primary)] font-medium">1 ALGO</span> +{' '}
            <span className="text-[var(--text-primary)] font-medium">1 USDC</span> together in one atomic group.
          </p>

          <button
            onClick={handleOptInUSDC}
            disabled={optInLoading || alreadyOpted}
            className={`w-full rounded-lg font-medium px-4 py-2 ${
              alreadyOpted
                ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--accent-green)] text-[var(--surface)] hover:brightness-95'
            }`}
          >
            {optInLoading ? (
              <span className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" /> Opting In…
              </span>
            ) : alreadyOpted ? (
              'Already Opted In'
            ) : (
              'Opt In USDC (Wallet)'
            )}
          </button>

          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)]">Receiver’s Address</label>
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-blue)] outline-none"
              placeholder="e.g. KPLX..."
              value={groupReceiverAddress}
              onChange={(e) => setGroupReceiverAddress(e.target.value)}
            />
            <div className="flex justify-between text-xs mt-1 text-[var(--text-muted)]">
              <span>Bundle: 1 ALGO + 1 USDC</span>
              <span
                className={`font-mono ${
                  groupReceiverAddress.length === 58 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                }`}
              >
                {groupReceiverAddress.length}/58
              </span>
            </div>
          </div>

          <button
            onClick={handleAtomicGroup}
            disabled={groupReceiverAddress.length !== 58}
            className={`w-full rounded-lg font-semibold px-5 py-3 transition ${
              groupReceiverAddress.length === 58
                ? 'bg-[var(--accent-yellow)] text-[var(--surface)] hover:brightness-95'
                : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed'
            }`}
          >
            {groupLoading ? (
              <span className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" /> Sending…
              </span>
            ) : (
              'Send Atomic: 1 ALGO + 1 USDC'
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default Transact
