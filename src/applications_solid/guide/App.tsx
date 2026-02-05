import { createSignal, onMount, Show, For } from 'solid-js'
import type { Component } from 'solid-js'
import "src/styles/global.css"

/**
 * SPLITDO Guide App - Public guides for Web, Android, iOS
 * NO AUTHENTICATION REQUIRED
 */

type Platform = 'web' | 'android' | 'ios'

interface Step {
  title: string
  description: string
  image?: string
}

const webSteps: Step[] = [
  {
    title: "1. Create an Account",
    description: "Visit splitdo.app and click 'Sign Up'. Enter your email address and create a secure password. You'll receive a verification email - click the link to verify your account."
  },
  {
    title: "2. Install Phantom Wallet",
    description: "Go to phantom.app and install the Phantom browser extension for Chrome, Firefox, Brave, or Edge. Create a new wallet or import an existing one. Make sure to securely store your recovery phrase!"
  },
  {
    title: "3. Fund Your Wallet with SOL",
    description: "You'll need SOL (Solana) to exchange for SPLITDO tokens. Buy SOL from an exchange like Coinbase, Binance, or Kraken, then send it to your Phantom wallet address."
  },
  {
    title: "4. Connect Your Wallet",
    description: "Go to the Exchange page in SPLITDO. Click 'Connect Wallet' and select Phantom. Approve the connection request in the Phantom popup."
  },
  {
    title: "5. Exchange SOL for SPLITDO",
    description: "Enter the amount of SOL you want to exchange. Review the SPLITDO amount you'll receive, then click 'Exchange Tokens'. Approve the transaction in Phantom."
  },
  {
    title: "6. View Your Balance",
    description: "After the transaction confirms (usually within seconds), you'll see your SPLITDO tokens in your dashboard. You can now use them within the SPLITDO ecosystem!"
  }
]

const androidSteps: Step[] = [
  {
    title: "1. Download the Phantom App",
    description: "Open the Google Play Store and search for 'Phantom Wallet'. Download and install the official Phantom app. Create a new wallet or import an existing one."
  },
  {
    title: "2. Create Your SPLITDO Account",
    description: "Open your mobile browser (Chrome recommended) and visit splitdo.app. Tap 'Sign Up', enter your email and password. Verify your email by clicking the link sent to you."
  },
  {
    title: "3. Fund Your Phantom Wallet",
    description: "In the Phantom app, tap 'Receive' to see your wallet address. Buy SOL from an exchange and send it to this address. Wait for the transaction to confirm."
  },
  {
    title: "4. Connect Wallet on Mobile",
    description: "In your mobile browser, go to splitdo.app and sign in. Navigate to the Exchange page and tap 'Connect Wallet'. Select Phantom - this will open the Phantom app to approve the connection."
  },
  {
    title: "5. Exchange SOL for SPLITDO",
    description: "Back in the browser, enter your SOL amount. Tap 'Exchange Tokens'. The Phantom app will open for you to approve the transaction. Confirm the transaction details and approve."
  },
  {
    title: "6. Check Your Tokens",
    description: "Return to the SPLITDO app in your browser. Your SPLITDO balance will update once the blockchain confirms the transaction (usually 5-30 seconds)."
  }
]

const iosSteps: Step[] = [
  {
    title: "1. Download Phantom from App Store",
    description: "Open the App Store and search for 'Phantom - Crypto Wallet'. Download the official app. Set up a new wallet or import your existing wallet using your recovery phrase."
  },
  {
    title: "2. Create Your SPLITDO Account",
    description: "Open Safari and go to splitdo.app. Tap 'Sign Up' and enter your email and password. Check your email for the verification link and tap it to verify your account."
  },
  {
    title: "3. Add SOL to Your Wallet",
    description: "In the Phantom app, tap your SOL balance, then 'Receive' to see your wallet address. Purchase SOL from Coinbase, Binance, or another exchange and send it to your Phantom address."
  },
  {
    title: "4. Connect to SPLITDO",
    description: "In Safari, visit splitdo.app and sign in. Go to the Exchange page and tap 'Connect Wallet'. Choose Phantom - Safari will ask to open the Phantom app. Tap 'Open' and approve the connection in Phantom."
  },
  {
    title: "5. Make the Exchange",
    description: "After connecting, enter how much SOL you want to exchange. Tap 'Exchange Tokens'. Phantom will open again - review the transaction and tap 'Approve' to confirm."
  },
  {
    title: "6. View Your SPLITDO Tokens",
    description: "Switch back to Safari. Your SPLITDO balance will appear in your dashboard once the transaction confirms on the Solana blockchain. This usually takes just a few seconds!"
  }
]

const GuideApp: Component = () => {
  const [platform, setPlatform] = createSignal<Platform>('web')
  
  onMount(() => {
    // Check URL for platform param
    const pathname = window.location.pathname
    const segments = pathname.split('/').filter(Boolean)
    if (segments[1] === 'android') setPlatform('android')
    else if (segments[1] === 'ios') setPlatform('ios')
    else setPlatform('web')
    
    // Force dark mode
    document.documentElement.classList.add('dark')
  })
  
  const handlePlatformChange = (newPlatform: Platform) => {
    setPlatform(newPlatform)
    const newPath = `/guide/${newPlatform === 'web' ? '' : newPlatform}`
    window.history.pushState({}, '', newPath)
  }
  
  const getSteps = () => {
    switch (platform()) {
      case 'android': return androidSteps
      case 'ios': return iosSteps
      default: return webSteps
    }
  }
  
  return (
    <div class="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header class="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-50">
        <div class="max-w-4xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <a href="/" class="flex items-center gap-3">
              <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-8 h-8" />
              <span class="text-xl font-bold">SPLITDO Guide</span>
            </a>
            <a 
              href="/auth/sign-up" 
              class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors"
            >
              Sign Up
            </a>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section class="py-12 px-4 border-b border-zinc-800">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl sm:text-5xl font-black mb-4">
            How to Get Started with <span class="text-cyan-400">SPLITDO</span>
          </h1>
          <p class="text-lg text-zinc-400 max-w-2xl mx-auto">
            Follow this step-by-step guide to create your account, connect your wallet, and exchange SOL for SPLITDO tokens.
          </p>
        </div>
      </section>
      
      {/* Platform Tabs */}
      <div class="border-b border-zinc-800 sticky top-[73px] bg-zinc-950/95 backdrop-blur-sm z-40">
        <div class="max-w-4xl mx-auto px-4">
          <div class="flex gap-1">
            <button
              onClick={() => handlePlatformChange('web')}
              class={`px-6 py-4 font-semibold transition-all border-b-2 ${
                platform() === 'web' 
                  ? 'border-cyan-400 text-cyan-400' 
                  : 'border-transparent text-zinc-500 hover:text-white'
              }`}
            >
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Web
              </div>
            </button>
            <button
              onClick={() => handlePlatformChange('android')}
              class={`px-6 py-4 font-semibold transition-all border-b-2 ${
                platform() === 'android' 
                  ? 'border-cyan-400 text-cyan-400' 
                  : 'border-transparent text-zinc-500 hover:text-white'
              }`}
            >
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.341c-.5 0-.91.41-.91.91s.41.91.91.91.91-.41.91-.91-.41-.91-.91-.91zm-11.046 0c-.5 0-.91.41-.91.91s.41.91.91.91.91-.41.91-.91-.41-.91-.91-.91zm11.405-6.02l1.97-3.41c.11-.19.05-.44-.14-.55-.19-.11-.44-.05-.55.14l-2 3.46c-1.53-.7-3.24-1.08-5.16-1.08s-3.63.39-5.16 1.08l-2-3.46c-.11-.19-.36-.25-.55-.14-.19.11-.25.36-.14.55l1.97 3.41C2.79 11.17.5 14.54.5 18.5h23c0-3.96-2.29-7.33-5.57-9.18zM6.477 15.34c-.5 0-.91.41-.91.91s.41.91.91.91.91-.41.91-.91-.41-.91-.91-.91zm11.046 0c-.5 0-.91.41-.91.91s.41.91.91.91.91-.41.91-.91-.41-.91-.91-.91z"/>
                </svg>
                Android
              </div>
            </button>
            <button
              onClick={() => handlePlatformChange('ios')}
              class={`px-6 py-4 font-semibold transition-all border-b-2 ${
                platform() === 'ios' 
                  ? 'border-cyan-400 text-cyan-400' 
                  : 'border-transparent text-zinc-500 hover:text-white'
              }`}
            >
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                iOS
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Steps */}
      <section class="py-12 px-4">
        <div class="max-w-4xl mx-auto">
          <div class="space-y-8">
            <For each={getSteps()}>
              {(step, index) => (
                <div class="flex gap-6">
                  {/* Step number */}
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                      {index() + 1}
                    </div>
                  </div>
                  
                  {/* Step content */}
                  <div class="flex-1 pb-8 border-b border-zinc-800 last:border-0">
                    <h3 class="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p class="text-zinc-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>
      
      {/* Troubleshooting */}
      <section class="py-12 px-4 bg-zinc-900/50 border-t border-zinc-800">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-2xl font-black mb-8">Common Issues</h2>
          
          <div class="space-y-6">
            <div class="p-6 bg-zinc-800/50 rounded-xl">
              <h3 class="font-bold text-white mb-2">Wallet not connecting?</h3>
              <p class="text-zinc-400">Make sure Phantom is unlocked and you're on the correct network (Solana Mainnet). Try refreshing the page and connecting again.</p>
            </div>
            
            <div class="p-6 bg-zinc-800/50 rounded-xl">
              <h3 class="font-bold text-white mb-2">Transaction not showing?</h3>
              <p class="text-zinc-400">Blockchain transactions can take a few seconds to confirm. If it's been more than a minute, try refreshing your dashboard. Check your wallet for the transaction status.</p>
            </div>
            
            <div class="p-6 bg-zinc-800/50 rounded-xl">
              <h3 class="font-bold text-white mb-2">Not enough SOL?</h3>
              <p class="text-zinc-400">You need a small amount of SOL for transaction fees (usually less than 0.01 SOL). Make sure you have enough SOL to cover both your exchange amount and the network fee.</p>
            </div>
            
            <div class="p-6 bg-zinc-800/50 rounded-xl">
              <h3 class="font-bold text-white mb-2">Mobile wallet issues?</h3>
              <p class="text-zinc-400">On mobile, make sure you have the Phantom app installed. When prompted to connect, allow the browser to open Phantom. After approving, return to your browser.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section class="py-16 px-4 border-t border-zinc-800">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-3xl font-black mb-4">Ready to Get Started?</h2>
          <p class="text-zinc-400 mb-8">Create your account and start using SPLITDO today.</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/sign-up" 
              class="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-colors"
            >
              Create Account
            </a>
            <a 
              href="/app/splitdo-exchange" 
              class="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
            >
              Go to Exchange
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer class="py-8 px-4 border-t border-zinc-800">
        <div class="max-w-4xl mx-auto text-center text-zinc-500 text-sm">
          <p>Need more help? Contact us at <a href="mailto:support@splitdo.app" class="text-cyan-400 hover:underline">support@splitdo.app</a></p>
        </div>
      </footer>
    </div>
  )
}

export default GuideApp
