import { createSignal } from 'solid-js'
import type { Component } from 'solid-js'
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context'

const WalletStoreTest: Component = () => {
  const wallet = useUnifiedWallet();

  return (
    <div class="p-4 border border-gray-300 rounded">
      <h3 class="text-lg font-bold mb-2">Wallet Store Test (No Context)</h3>
      <p class="mb-2">Status: {wallet.connectionStatus()}</p>
      <div class="space-x-2">
        <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
          onClick={() => wallet.connectWallet('phantom')}
        >
          Connect
        </button>
        <button
          class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
          onClick={() => wallet.disconnectWallet()}
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

const StoreTestApp: Component<{ firebaseToken?: string }> = (props) => {
  const [count, setCount] = createSignal(0);

  return (
    <div class="p-8 bg-zinc-900 text-white min-h-screen">
      <h1 class="text-3xl font-bold mb-4">SolidJS + Wallet Store Test</h1>
      <p class="mb-4">Firebase Token: {props.firebaseToken ? 'Present' : 'Not provided'}</p>

      <div class="mb-6">
        <p class="mb-2">Count: {count()}</p>
        <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
          onClick={() => setCount(count() + 1)}
        >
          Increment Count
        </button>
      </div>

      <WalletStoreTest />

      <p class="mt-4 text-sm">Testing global store instead of context to avoid Provider JSX issues.</p>
    </div>
  )
}

export default StoreTestApp