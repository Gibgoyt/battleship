import type { Component } from 'solid-js';
import { Show, createSignal, createEffect, onCleanup } from 'solid-js';
import { createLogger } from 'src/lib/logger';

const logger = createLogger('[SessionExpiryNotification]');

export interface SessionExpiryNotificationProps {
  isVisible: boolean;
  countdown: number;
  message: string;
  onRedirect: () => void;
  onDismiss: () => void;
  isDark?: boolean;
}

export const SessionExpiryNotification: Component<SessionExpiryNotificationProps> = (props) => {
  let countdownInterval: number | null = null;

  // Create local countdown state that syncs with props
  const [localCountdown, setLocalCountdown] = createSignal(props.countdown);

  // Update local countdown when props change
  createEffect(() => {
    setLocalCountdown(props.countdown);
  });

  // Start countdown when notification becomes visible
  createEffect(() => {
    if (props.isVisible && localCountdown() > 0) {
      // Clear any existing interval
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      // Start new countdown
      countdownInterval = setInterval(() => {
        setLocalCountdown(prev => {
          if (prev <= 1) {
            if (countdownInterval) {
              clearInterval(countdownInterval);
              countdownInterval = null;
            }

            logger.warn('Session expiry countdown completed, auto-redirecting');

            // Auto-redirect after countdown
            setTimeout(() => {
              props.onRedirect();
            }, 100);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!props.isVisible && countdownInterval) {
      // Clean up interval if notification is hidden
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  });

  const handleRedirect = () => {
    logger.info('User manually triggered redirect from session expiry notification');
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    props.onRedirect();
  };

  const handleDismiss = () => {
    logger.info('User dismissed session expiry notification');
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    props.onDismiss();
  };

  const progressPercentage = () => {
    const total = Math.max(props.countdown, 5); // Default to 5 if props.countdown is 0
    const remaining = localCountdown();
    return ((total - remaining) / total) * 100;
  };

  return (
    <Show when={props.isVisible}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div class={`absolute inset-0 transition-all duration-300 ${
          props.isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-gray-900/50 backdrop-blur-sm'
        }`} />

        {/* Notification Modal */}
        <div
          class={`relative max-w-md w-full mx-4 rounded-xl shadow-2xl z-10 overflow-hidden transition-all duration-300 ${
            props.isDark
              ? 'bg-crypto-bg-primary border border-crypto-border'
              : 'bg-white/95 border border-gray-200/50 shadow-xl backdrop-blur-sm'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 flex items-center justify-center">
                  <span class="text-2xl">⚠️</span>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-white">
                    Session Expired
                  </h2>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                class="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 transition-colors text-xl font-light"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div class="p-6 space-y-6">
            {/* Message */}
            <div class="text-center">
              <p class={`text-lg ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {props.message}
              </p>
            </div>

            {/* Countdown Display */}
            <div class="text-center space-y-4">
              <div class={`text-3xl font-bold ${props.isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {localCountdown()}
              </div>

              {/* Progress Bar */}
              <div class={`w-full h-2 rounded-full overflow-hidden ${
                props.isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  class="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${progressPercentage()}%`
                  }}
                />
              </div>

              <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Automatically redirecting in {localCountdown()} seconds...
              </p>
            </div>

            {/* Action Buttons */}
            <div class="flex gap-3">
              <button
                onClick={handleRedirect}
                class="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-30"
              >
                Go to Login
              </button>

              <button
                onClick={handleDismiss}
                class={`px-4 py-3 border-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-30 ${
                  props.isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Wait
              </button>
            </div>

            {/* Info Text */}
            <div class={`text-center text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Your authentication session has expired. Please log in again to continue.
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};