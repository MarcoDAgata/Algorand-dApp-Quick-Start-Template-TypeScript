// Home.tsx
// MedStamp landing UI: modern Tailwind redesign with hero, CTA, and feature cards.
// NOTE: All logic, state, and modal wiring are preserved exactly as requested.

import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AiOutlineWallet, AiOutlineSend, AiOutlineStar, AiOutlineDeploymentUnit } from 'react-icons/ai'
import { BsArrowUpRightCircle, BsWallet2 } from 'react-icons/bs'

// Frontend modals
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import NFTmint from './components/NFTmint'
import Tokenmint from './components/Tokenmint'

// Smart contract demo modal (backend app calls)
import AppCalls from './components/AppCalls'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 flex flex-col relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-cyan-400/30" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl opacity-20 bg-teal-500/20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>

      {/* ---------------- Navbar ---------------- */}
      <nav className="w-full bg-neutral-900/70 backdrop-blur border-b border-neutral-800 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700">
            <AiOutlineWallet className="text-cyan-400 text-xl" />
          </span>
          <div className="flex flex-col leading-tight">
            <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
              MedStamp
            </h1>
            <span className="text-[11px] uppercase tracking-wide text-neutral-400">by neolook</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-300">
            TestNet
          </span>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-gray-100 transition border border-neutral-700"
            onClick={() => setOpenWalletModal(true)}
          >
            <BsWallet2 className="text-lg text-cyan-400" />
            <span>{activeAddress ? 'Wallet Connected' : 'Connect Wallet'}</span>
          </button>
        </div>
      </nav>

      {/* ---------------- Hero Section ---------------- */}
      <header className="relative px-4 sm:px-6">
        <div className="mx-auto max-w-6xl py-12 sm:py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-300">
              <span className="h-2 w-2 rounded-full bg-teal-400/80" /> On-chain authenticity for digital video
            </div>

            <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
                Stamp. Prove. Trust.
              </span>
            </h2>

            <p className="mt-4 text-neutral-300/90 text-base sm:text-lg max-w-xl">
              MedStamp turns any digital video into a verifiable evidence sample. Create an authentication
              stamp, anchor it to Algorand, and preserve a tamper-evident chain of custody for clinical,
              research, or audit use.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => (activeAddress ? null : setOpenWalletModal(true))}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition
                           bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-90 text-white shadow-lg shadow-teal-500/10"
              >
                {activeAddress ? 'You are connected' : 'Connect your wallet'}
              </button>

              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold
                           border border-neutral-800 bg-neutral-900 hover:bg-neutral-800/80 text-neutral-200"
              >
                Explore features
              </a>
            </div>

            <div className="mt-6 text-xs text-neutral-400">
              Secure • Verifiable • Interoperable • Built with Algorand
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-800 p-4">
              <div className="h-full w-full rounded-xl border border-neutral-800 bg-neutral-950/60 grid place-items-center">
                <div className="text-center px-6">
                  <div className="text-6xl mb-3">🎥</div>
                  <p className="text-neutral-300">
                    Drop a video, generate a proof hash, and anchor to chain.
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Demo flows below on TestNet.</p>
                </div>
              </div>
            </div>

            {/* Subtle glow */}
            <div className="pointer-events-none absolute -inset-3 rounded-3xl blur-2xl opacity-20 bg-gradient-to-r from-cyan-500 to-teal-500" />
          </div>
        </div>
      </header>

      {/* Divider */}
      <div className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>

      {/* ---------------- Features Grid ---------------- */}
      <main id="features" className="flex-1 px-4 sm:px-6 pb-16">
        {activeAddress ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto mt-10">
            {/* Fund / Send (kept as payment modal) */}
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 hover:border-cyan-500/60 transition group">
              <div className="flex items-start justify-between">
                <AiOutlineSend className="text-4xl mb-3 text-cyan-400" />
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">Step 1</span>
              </div>
              <h3 className="text-xl font-semibold">Fund & Send (Test Flow)</h3>
              <p className="text-sm text-neutral-400 mt-2">
                Send 1 ALGO on TestNet to experience wallet signing and fee handling. This simulates
                the funding step often used before stamping or anchoring proofs.
              </p>
              <button
                className="mt-4 w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
                onClick={() => setOpenPaymentModal(true)}
              >
                Open
              </button>
            </div>

            {/* Mint NFT (proof artifact) */}
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 hover:border-pink-500/60 transition group">
              <div className="flex items-start justify-between">
                <AiOutlineStar className="text-4xl mb-3 text-pink-400" />
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">Step 2</span>
              </div>
              <h3 className="text-xl font-semibold">Mint Proof NFT</h3>
              <p className="text-sm text-neutral-400 mt-2">
                Upload a poster frame or hash metadata to IPFS via Pinata and mint an NFT that represents
                your video’s authenticity stamp.
              </p>
              <button
                className="mt-4 w-full py-2.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold transition"
                onClick={() => setOpenMintModal(true)}
              >
                Open
              </button>
            </div>

            {/* Create Token (ASA) */}
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 hover:border-purple-500/60 transition group">
              <div className="flex items-start justify-between">
                <BsArrowUpRightCircle className="text-4xl mb-3 text-purple-400" />
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">Optional</span>
              </div>
              <h3 className="text-xl font-semibold">Create a Proof Token (ASA)</h3>
              <p className="text-sm text-neutral-400 mt-2">
                Spin up an Algorand Standard Asset to represent access rights, review states,
                or workflow credits in your MedStamp process.
              </p>
              <button
                className="mt-4 w-full py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold transition"
                onClick={() => setOpenTokenModal(true)}
              >
                Open
              </button>
            </div>

            {/* Contract Interactions (verification) */}
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 hover:border-amber-500/60 transition group">
              <div className="flex items-start justify-between">
                <AiOutlineDeploymentUnit className="text-4xl mb-3 text-amber-400" />
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">Verify</span>
              </div>
              <h3 className="text-xl font-semibold">On-chain Verification</h3>
              <p className="text-sm text-neutral-400 mt-2">
                Call a simple stateful smart contract to read or validate stored proof data.
                See how MedStamp attests integrity on chain.
              </p>
              <button
                className="mt-4 w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition"
                onClick={() => setOpenAppCallsModal(true)}
              >
                Open
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-neutral-400 mt-14">
            <p className="text-sm">⚡ Connect your wallet to unlock the MedStamp demo features below.</p>
            <button
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-gray-100 transition border border-neutral-700"
              onClick={() => setOpenWalletModal(true)}
            >
              <BsWallet2 className="text-lg text-cyan-400" />
              <span>Connect Wallet</span>
            </button>
          </div>
        )}
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="px-4 sm:px-6 py-8 border-t border-neutral-800 bg-neutral-900/50">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-400">
          <span>© {new Date().getFullYear()} neolook — MedStamp</span>
          <span className="text-neutral-500">
            Built on{' '}
            <span className="text-neutral-300">Algorand TestNet</span>
          </span>
        </div>
      </footer>

      {/* ---------------- Modals (unchanged logic) ---------------- */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
      <Transact openModal={openPaymentModal} setModalState={setOpenPaymentModal} />
      <NFTmint openModal={openMintModal} setModalState={setOpenMintModal} />
      <Tokenmint openModal={openTokenModal} setModalState={setOpenTokenModal} />
      <AppCalls openModal={openAppCallsModal} setModalState={setOpenAppCallsModal} />
    </div>
  )
}

export default Home
