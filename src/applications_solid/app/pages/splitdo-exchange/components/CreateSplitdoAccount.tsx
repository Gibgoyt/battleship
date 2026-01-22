import { Component, Show, createSignal } from 'solid-js';
import { useUnifiedWallet } from '../../../lib/wallet/unified-wallet-context';

const CreateSplitdoAccount: Component = () => {
  const wallet = useUnifiedWallet();

  const [isCreating, setIsCreating] = createSignal(false);
  const [creationError, setCreationError] = createSignal<string | null>(null);
  const [creationSuccess, setCreationSuccess] = createSignal(false);

  const handleCreateAccount = async () => {
    const currentWallet = wallet.wallet();
    if (!currentWallet) {
      setCreationError('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    setCreationError(null);
    setCreationSuccess(false);

    try {
      console.log('[CreateSplitdoAccount] Creating SPLITDO token account...');
      const result = await wallet.createSplitdoATA();

      if (result.success) {
        console.log('[CreateSplitdoAccount] Account created successfully:', result.signature);
        setCreationSuccess(true);
        setCreationError(null);

        // Auto-hide success message after 3 seconds
        setTimeout(() => setCreationSuccess(false), 3000);
      } else {
        console.error('[CreateSplitdoAccount] Account creation failed:', result.error);
        setCreationError(result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('[CreateSplitdoAccount] Unexpected error:', error);
      setCreationError(error instanceof Error ? error.message : 'Unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectWallet = () => {
    wallet.openWalletModal(); // Open wallet selection modal
  };

  return (
    <div class="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div class="p-8 text-center">
        {/* Header */}
        <div class="mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden p-2">
            <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create SPLITDO Account
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            You need a SPLITDO token account to start trading and using the exchange features.
          </p>
        </div>

        {/* Connection Status */}
        <Show when={wallet.connectionStatus() !== 'connected'}>
          <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-blue-700 dark:text-blue-300 mb-3">
              First, connect your Solana wallet:
            </p>
            <button
              onClick={handleConnectWallet}
              class="btn-crypto-primary w-full py-3 text-lg"
              disabled={wallet.connectionStatus() === 'connecting'}
            >
              <Show when={wallet.connectionStatus() === 'connecting'} fallback="Connect Wallet">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </div>
              </Show>
            </button>
          </div>
        </Show>

        {/* Account Creation */}
        <Show when={wallet.connectionStatus() === 'connected'}>
          <div class="mb-6">
            <div class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div class="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 mb-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Wallet Connected
              </div>
              <p class="text-sm text-green-600 dark:text-green-400">
                {wallet.wallet()?.address.slice(0, 4)}...{wallet.wallet()?.address.slice(-4)}
              </p>
            </div>

            <button
              onClick={handleCreateAccount}
              disabled={isCreating() || wallet.splitdoATA().status === 'creating'}
              class="btn-crypto-primary w-full py-4 text-lg mb-4"
            >
              <Show when={isCreating() || wallet.splitdoATA().status === 'creating'} fallback="Create SPLITDO Account">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              </Show>
            </button>

            <p class="text-xs text-gray-500 dark:text-gray-400">
              This will create your Associated Token Account for SPLITDO tokens.
              A small amount of SOL (~0.002) will be used for the transaction fee.
            </p>
          </div>
        </Show>

        {/* Success Message */}
        <Show when={creationSuccess()}>
          <div class="mb-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
            <div class="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span class="font-semibold">Account Created Successfully!</span>
            </div>
            <p class="text-sm text-green-600 dark:text-green-400 mt-1">
              Your SPLITDO token account is now ready. You can start trading!
            </p>
          </div>
        </Show>

        {/* Error Message */}
        <Show when={creationError()}>
          <div class="mb-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
            <div class="flex items-center justify-center gap-2 text-red-700 dark:text-red-300 mb-1">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <span class="font-semibold">Creation Failed</span>
            </div>
            <p class="text-sm text-red-600 dark:text-red-400">
              {creationError()}
            </p>
            <button
              onClick={() => setCreationError(null)}
              class="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-2 underline"
            >
              Try Again
            </button>
          </div>
        </Show>

        {/* Info Section */}
        <div class="text-left">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-3">What is a SPLITDO Account?</h3>
          <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Your personal account for holding SPLITDO tokens</span>
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Required to participate in the exchange and earn rewards</span>
            </li>
            <li class="flex items-start gap-2">
              <div class="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Completely controlled by your wallet - you own the keys</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateSplitdoAccount;