/**
 * WalletConnect QR Code Modal for SPLITDO
 *
 * Displays QR codes for WalletConnect pairing, handles mobile wallet links,
 * shows connection status, and manages session lifecycle.
 */

import type { Component, Accessor } from 'solid-js';
import { Show, createSignal, createEffect, onCleanup, For, createMemo } from 'solid-js';
import { SUPPORTED_WALLETS, WALLETCONNECT_CONFIG, ERROR_MESSAGES } from '../lib/wallet/walletconnect-config';
import { detectMobilePlatform, openAppStoreForWallet, getDetailedMobileInfo } from '../lib/wallet/mobile-detection';

// Props interface following established pattern
export interface WalletConnectQRModalProps {
  isDark: boolean;
  isOpen: Accessor<boolean>;
  onClose: () => void;
  qrData: Accessor<{ uri: string; qrCodeDataURL: string; expired: boolean } | null>;
  connectionStatus: Accessor<'idle' | 'connecting' | 'connected' | 'error'>;
  error: Accessor<string | null>;
  onRefreshQR: () => void;
  onMobileWalletClick: (walletId: string) => void;
}

export const WalletConnectQRModal: Component<WalletConnectQRModalProps> = (props) => {
  // Local component signals
  const [timeRemaining, setTimeRemaining] = createSignal<number | null>(null);
  const [showExpiryWarning, setShowExpiryWarning] = createSignal(false);
  const [copiedToClipboard, setCopiedToClipboard] = createSignal(false);

  // Enhanced platform detection
  const mobilePlatform = detectMobilePlatform();
  const detailedPlatformInfo = getDetailedMobileInfo();
  const isMobile = createMemo(() => mobilePlatform.platform !== 'desktop');

  // Platform-specific optimizations
  const isInAppBrowser = createMemo(() => detailedPlatformInfo.isInApp);
  const browserName = createMemo(() => detailedPlatformInfo.browserName);
  const supportsDeepLinks = createMemo(() => !isInAppBrowser() && isMobile());

  // Mobile wallets for display (prioritized based on platform)
  const mobileWallets = createMemo(() => {
    const wallets = SUPPORTED_WALLETS.filter(wallet => wallet.deepLink && wallet.universalLink);

    // Sort wallets based on platform preference
    return wallets.sort((a, b) => {
      // Prioritize Phantom for iOS, other wallets for Android
      if (mobilePlatform.platform === 'ios') {
        if (a.id === 'phantom') return -1;
        if (b.id === 'phantom') return 1;
      }

      // Keep original order for other cases
      return 0;
    });
  });

  // QR expiry timer effect
  createEffect(() => {
    if (props.isOpen() && props.qrData() && !props.qrData()!.expired) {
      const startTime = Date.now();
      const expiryTime = startTime + WALLETCONNECT_CONFIG.connectionConfig.pairingTimeout;

      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

        setTimeRemaining(remaining);

        if (remaining <= 30 && remaining > 0) {
          setShowExpiryWarning(true);
        }

        if (remaining <= 0) {
          setShowExpiryWarning(false);
          clearInterval(timer);
        }
      }, 1000);

      onCleanup(() => clearInterval(timer));
      return () => clearInterval(timer);
    }
  });

  // Auto-close on successful connection
  createEffect(() => {
    if (props.connectionStatus() === 'connected') {
      setTimeout(() => {
        props.onClose();
      }, 1500); // Brief delay to show success state
    }
  });

  // Event handlers
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const handleRefreshQR = () => {
    setShowExpiryWarning(false);
    setTimeRemaining(null);
    props.onRefreshQR();
  };

  const handleCopyURI = async () => {
    const qrData = props.qrData();
    if (qrData?.uri) {
      try {
        await navigator.clipboard.writeText(qrData.uri);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (error) {
        console.warn('Failed to copy to clipboard:', error);
      }
    }
  };

  const handleMobileWalletClick = (walletId: string) => {
    props.onMobileWalletClick(walletId);
  };

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Show when={props.isOpen()}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center"
        onClick={handleBackdropClick}
      >
        {/* Backdrop with blur effect */}
        <div class={`absolute inset-0 transition-all duration-300 ${
          props.isDark
            ? 'modal-backdrop-dark'
            : 'modal-backdrop-light'
        }`} />

        {/* Modal Content */}
        <div
          class={`relative w-full max-w-lg mx-4 p-0 rounded-xl shadow-2xl z-10 ${
            props.isDark
              ? 'bg-crypto-bg-secondary border border-crypto-border'
              : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="bg-gradient-to-r from-crypto-primary-blue to-crypto-primary-cyan px-6 py-6 rounded-t-xl">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl sm:text-2xl font-bold text-white mb-1">
                  Connect Mobile Wallet
                </h2>
                <p class="text-blue-100 opacity-90">
                  Scan QR code with your mobile wallet
                </p>
              </div>
              <button
                onClick={props.onClose}
                class="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div class="p-6">
            {/* Connection Status */}
            <Show when={props.connectionStatus() === 'connected'}>
              <div class={`p-4 border-2 border-crypto-accent-green rounded-xl mb-6 ${
                props.isDark
                  ? 'bg-green-900/20 text-green-100'
                  : 'bg-green-50 text-green-900'
              }`}>
                <div class="flex items-center gap-3">
                  <span class="text-crypto-accent-green text-xl">✅</span>
                  <div>
                    <div class="font-semibold text-crypto-accent-green mb-1">Connected!</div>
                    <p class={`text-sm ${props.isDark ? 'text-green-200' : 'text-green-700'}`}>
                      Your mobile wallet is connected and ready to use
                    </p>
                  </div>
                </div>
              </div>
            </Show>

            {/* Error State */}
            <Show when={props.error()}>
              <div class={`p-4 border-2 border-crypto-accent-red rounded-xl mb-6 ${
                props.isDark
                  ? 'bg-red-900/20 text-red-100'
                  : 'bg-red-50 text-red-900'
              }`}>
                <div class="flex items-center gap-3">
                  <span class="text-crypto-accent-red text-xl">⚠️</span>
                  <div>
                    <div class="font-semibold text-crypto-accent-red mb-1">Connection Failed</div>
                    <p class={`text-sm ${props.isDark ? 'text-red-200' : 'text-red-700'}`}>
                      {props.error()}
                    </p>
                  </div>
                </div>
              </div>
            </Show>

            {/* Main Content - QR Code or Mobile Links */}
            <Show when={!isMobile()} fallback={
              // Mobile View - Show wallet links with smart platform detection
              <div class="text-center">
                {/* Platform-specific information */}
                <div class={`p-4 rounded-xl mb-6 ${
                  props.isDark
                    ? 'bg-crypto-bg-tertiary text-crypto-text-primary'
                    : 'bg-gray-50 text-gray-900'
                }`}>
                  <div class="text-4xl mb-2">📱</div>
                  <Show when={isInAppBrowser()} fallback={
                    <p class={`text-sm ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-600'}`}>
                      Choose your preferred mobile wallet to connect:
                    </p>
                  }>
                    <div class="space-y-2">
                      <p class={`text-sm font-semibold ${props.isDark ? 'text-yellow-200' : 'text-yellow-700'}`}>
                        ⚠️ In-app Browser Detected
                      </p>
                      <p class={`text-xs ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-600'}`}>
                        For best results, open this page in your main browser ({mobilePlatform.platform === 'ios' ? 'Safari' : 'Chrome'})
                        instead of {browserName() || 'this in-app browser'}.
                      </p>
                      <p class={`text-xs ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-600'}`}>
                        Choose your wallet below:
                      </p>
                    </div>
                  </Show>
                </div>

                <div class="space-y-3">
                  <For each={mobileWallets()}>
                    {(wallet) => (
                      <button
                        onClick={() => handleMobileWalletClick(wallet.id)}
                        class={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          props.isDark
                            ? 'border-crypto-border bg-crypto-bg-tertiary hover:border-crypto-primary-cyan text-crypto-text-primary'
                            : 'border-gray-200 bg-white hover:border-crypto-primary-cyan text-gray-900'
                        }`}
                      >
                        <span class="text-2xl">{wallet.icon}</span>
                        <div class="text-left flex-1">
                          <div class="font-semibold">{wallet.name}</div>
                          <div class={`text-sm ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-500'}`}>
                            {wallet.description}
                          </div>
                        </div>
                        <span class={`text-sm ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-400'}`}>
                          →
                        </span>
                      </button>
                    )}
                  </For>
                </div>

                {/* Help section for users without wallets */}
                <div class="mt-6 pt-6 border-t border-crypto-border">
                  <div class={`text-xs text-center mb-3 ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-500'}`}>
                    Don't have a wallet yet?
                  </div>
                  <div class={`text-xs text-center mb-3 ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-500'}`}>
                    {mobilePlatform.platform === 'ios' ? 'Download from App Store' : 'Download from Google Play'}:
                  </div>
                  <div class="flex justify-center gap-2 flex-wrap">
                    <For each={mobileWallets().slice(0, 3)}>
                      {(wallet) => (
                        <button
                          onClick={() => openAppStoreForWallet(wallet.id)}
                          class={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            props.isDark
                              ? 'border-crypto-border bg-crypto-bg-tertiary hover:bg-crypto-border text-crypto-text-secondary'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
                          }`}
                        >
                          {wallet.icon} Get {wallet.name}
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            }>
              {/* Desktop View - Show QR Code */}
              <div class="text-center">
                <Show when={props.qrData() && !props.qrData()!.expired} fallback={
                  // QR Expired State
                  <div class="py-8">
                    <div class={`p-4 rounded-xl mb-6 ${
                      props.isDark
                        ? 'bg-yellow-900/20 text-yellow-100 border border-yellow-700'
                        : 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                    }`}>
                      <div class="text-4xl mb-2">⏰</div>
                      <p class="font-semibold mb-1">QR Code Expired</p>
                      <p class="text-sm">Please refresh to generate a new QR code</p>
                    </div>

                    <button
                      onClick={handleRefreshQR}
                      class="px-6 py-3 bg-gradient-button-primary text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      Generate New QR Code
                    </button>
                  </div>
                }>
                  {/* Active QR Code */}
                  <div>
                    {/* QR Code Image */}
                    <div class={`inline-block p-4 rounded-2xl mb-4 ${
                      props.isDark ? 'bg-white' : 'bg-white shadow-lg'
                    }`}>
                      <img
                        src={props.qrData()?.qrCodeDataURL}
                        alt="WalletConnect QR Code"
                        class="w-64 h-64 block"
                      />
                    </div>

                    {/* Instructions */}
                    <div class={`text-sm mb-4 ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-600'}`}>
                      <p class="mb-2">1. Open your mobile wallet app</p>
                      <p class="mb-2">2. Look for "WalletConnect" or "Scan QR" option</p>
                      <p>3. Scan the QR code above</p>
                    </div>

                    {/* Timer and Actions */}
                    <div class="flex items-center justify-center gap-4 mb-4">
                      <Show when={timeRemaining()}>
                        <div class={`text-sm ${
                          showExpiryWarning()
                            ? 'text-crypto-accent-red font-semibold'
                            : props.isDark
                              ? 'text-crypto-text-secondary'
                              : 'text-gray-500'
                        }`}>
                          Expires in {formatTimeRemaining(timeRemaining()!)}
                        </div>
                      </Show>
                    </div>

                    {/* Action Buttons */}
                    <div class="flex gap-3 justify-center">
                      <button
                        onClick={handleRefreshQR}
                        class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          props.isDark
                            ? 'bg-crypto-bg-tertiary text-crypto-text-primary hover:bg-crypto-border'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Refresh QR
                      </button>

                      <button
                        onClick={handleCopyURI}
                        class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          copiedToClipboard()
                            ? 'bg-crypto-accent-green text-white'
                            : props.isDark
                              ? 'bg-crypto-bg-tertiary text-crypto-text-primary hover:bg-crypto-border'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {copiedToClipboard() ? 'Copied!' : 'Copy URI'}
                      </button>
                    </div>
                  </div>
                </Show>

                {/* Connection Status */}
                <Show when={props.connectionStatus() === 'connecting'}>
                  <div class="mt-6 flex items-center justify-center gap-3">
                    <div class={`w-4 h-4 rounded-full border-2 border-t-2 border-crypto-primary-cyan animate-spin ${
                      props.isDark ? 'border-gray-600' : 'border-gray-300'
                    }`} style="border-top-color: var(--crypto-primary-cyan);" />
                    <span class={`text-sm ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-600'}`}>
                      Waiting for wallet connection...
                    </span>
                  </div>
                </Show>

                {/* Mobile Wallet List for Reference */}
                <div class="mt-8 pt-6 border-t border-crypto-border">
                  <div class={`text-xs text-center mb-3 ${props.isDark ? 'text-crypto-text-secondary' : 'text-gray-500'}`}>
                    Compatible wallets:
                  </div>
                  <div class="flex justify-center gap-2 flex-wrap">
                    <For each={mobileWallets()}>
                      {(wallet) => (
                        <span class={`text-xs px-2 py-1 rounded ${
                          props.isDark
                            ? 'bg-crypto-bg-tertiary text-crypto-text-secondary'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {wallet.icon} {wallet.name}
                        </span>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};