/**
 * Mobile Wallet Installation Component for SPLITDO
 * Displays platform-specific app store installation prompts
 */

import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { getWalletStoreUrl, getDirectStoreLink } from 'src/applications_solid/app/lib/wallet/app-store-urls';
import { getInstallationMessage } from 'src/applications_solid/app/lib/wallet/mobile-detection';

export interface MobileWalletInstallationProps {
  isDark: boolean;
  platform: 'ios' | 'android';
  walletName: string;
  onClose?: () => void;
}

export const MobileWalletInstallation: Component<MobileWalletInstallationProps> = (props) => {
  const handleInstallClick = () => {
    const storeUrl = getWalletStoreUrl(props.walletName.toLowerCase(), props.platform);

    // Open in new tab to avoid disrupting the current session
    window.open(storeUrl, '_blank', 'noopener,noreferrer');

    // Optional: Close the installation prompt after clicking
    if (props.onClose) {
      // Add a small delay to ensure the link opens first
      setTimeout(() => {
        props.onClose?.();
      }, 500);
    }
  };

  const getStoreButtonText = () => {
    switch (props.platform) {
      case 'ios':
        return 'Install from App Store';
      case 'android':
        return 'Install from Google Play';
      default:
        return 'Install App';
    }
  };

  const getStoreIcon = () => {
    switch (props.platform) {
      case 'ios':
        return '🍎'; // Apple icon
      case 'android':
        return '🤖'; // Android icon
      default:
        return '📱'; // Generic phone icon
    }
  };

  return (
    <div class={`p-4 rounded-lg border mt-4 ${
      props.isDark
        ? 'bg-zinc-700 border-zinc-600'
        : 'bg-blue-50 border-blue-200'
    }`}>
      {/* Header with wallet logo and message */}
      <div class="flex items-start gap-3 mb-3">
        <div class="w-8 h-8 flex items-center justify-center">
          {/* Phantom wallet logo - using same source as ExchangeModal */}
          <Show
            when={props.walletName.toLowerCase() === 'phantom'}
            fallback={
              <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                props.isDark ? 'bg-zinc-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {props.walletName.charAt(0).toUpperCase()}
              </div>
            }
          >
            <img
              src={props.isDark
                ? "https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/logo/phantom-light.svg?fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=c21a66db70347ca7a31053b98a0b5b0a"
                : "https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/logo/phantom-dark.svg?fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=af17fb78921412073a894ea97523898c"
              }
              alt={props.walletName}
              class="w-8 h-8"
            />
          </Show>
        </div>

        <div class="flex-1">
          <h4 class={`font-semibold text-sm ${
            props.isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {props.walletName} App Required
          </h4>
          <p class={`text-sm mt-1 ${
            props.isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {getInstallationMessage(props.walletName, props.platform)}
          </p>
        </div>

        {/* Close button */}
        <Show when={props.onClose}>
          <button
            onClick={props.onClose}
            class={`w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-gray-100 ${
              props.isDark
                ? 'hover:bg-zinc-600 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            ×
          </button>
        </Show>
      </div>

      {/* Installation button */}
      <button
        onClick={handleInstallClick}
        class={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
          props.platform === 'ios'
            ? props.isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
              : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400'
            : props.isDark
              ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
              : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400'
        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
      >
        <span class="text-lg">{getStoreIcon()}</span>
        <span>{getStoreButtonText()}</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
        </svg>
      </button>

      {/* Helper text */}
      <p class={`text-xs mt-2 text-center ${
        props.isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        After installation, refresh this page to connect your wallet
      </p>
    </div>
  );
};