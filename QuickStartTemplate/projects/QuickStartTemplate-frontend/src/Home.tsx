// Home.tsx - Simple token balance + send page

import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useState } from 'react'

const TOKEN_NAME = 'MyToken'      // just for display
const TOKEN_ID = 123456           // TODO: replace with your ASA ID

const Home: React.FC = () => {
  const { activeAddress /*, signTransactions, sendTransactions, ... */ } = useWallet()

  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
        // 🔴 TODO:
        // Here you should call your Algorand client to get the ASA balance for TOKEN_ID.
        //
        // Example (pseudo-code):
        // const accountInfo = await algodClient.accountInformation(activeAddress).do()
        // const asset = accountInfo['assets'].find((a: any) => a['asset-id'] === TOKEN_ID)
        // const rawAmount = asset ? asset.amount : 0
        // const decimals = 0 // or your ASA decimals
        // setBalance(rawAmount / 10 ** decimals)
        //
        // For now, just mock something:
        const mockBalance = 1000
        setBalance(mockBalance)
      } catch (e: any) {
        setError('Failed to load token balance.')
        console.error(e)
      } finally {
        setLoadingBalance(false)
      }
    }

    fetchBalance()
  }, [activeAddress])

  // ------------------------
  // Handle send
  // ------------------------
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!activeAddress) {
      setError('Connect your wallet first.')
      return
    }

    if (!recipient || !amount) {
      setError('Please fill in recipient and amount.')
      return
    }

    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Amount must be a positive number.')
      return
    }

    if (balance !== null && numericAmount > balance) {
      setError('You do not have enough tokens.')
      return
    }

    setSending(true)

    try {
      // 🔴 TODO:
      // Build and send an Algorand ASA transfer transaction here.
      //
      // 1. Create asset transfer txn for TOKEN_ID
      // 2. Sign with wallet (e.g. signTransactions from useWallet)
      // 3. Submit using algod client
      //
      // After success, refetch balance.

      console.log('Sending', numericAmount, TOKEN_NAME, 'to', recipient)
      // Simulate success:
      await new Promise((r) => setTimeout(r, 1000))
      setSuccess(`Sent ${numericAmount} ${TOKEN_NAME} to ${recipient}.`)
      setAmount('')
      // Optionally: trigger balance reload
      // setBalance((prev) => prev !== null ? prev - numericAmount : prev)
    } catch (e: any) {
      console.error(e)
      setError('Failed to send tokens.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
        <h1 className="text-xl font-semibold mb-4 text-center">
          {TOKEN_NAME} Dashboard
        </h1>

        {/* Wallet status */}
        <div className="mb-4 text-sm">
          <div className="font-mono break-all">
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
        </div>

        {/* Balance */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-400">Token</span>
            <span className="text-slate-400">Balance</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
            <span>
              {TOKEN_NAME} <span className="text-slate-500 text-xs">(ID: {TOKEN_ID})</span>
            </span>
            <span>
              {loadingBalance
                ? 'Loading...'
                : balance !== null
                ? balance
                : '--'}
            </span>
          </div>
        </div>

        {/* Send form */}
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1 text-sm">
            <label className="block text-slate-300">Recipient address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="ALGOS address"
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-300">
              Amount ({TOKEN_NAME})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="0"
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

          <button
            type="submit"
            disabled={!activeAddress || sending}
            className="mt-2 w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-medium disabled:bg-slate-700 disabled:text-slate-400"
          >
            {sending ? 'Sending…' : 'Send tokens'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Home