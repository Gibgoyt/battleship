/**
 * Toast Notification Component
 * 
 * Professional toast notification system for user feedback during exchange operations.
 * Provides success, error, warning, and info notifications with auto-dismiss functionality.
 */

import { createSignal, onMount, onCleanup, Show, For, type Component, type Accessor } from 'solid-js';
import { createLogger } from 'src/lib/logger';

const logger = createLogger('[ToastNotification]');

// ================================
// TYPE DEFINITIONS
// ================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

export interface ToastManagerState {
  toasts: Accessor<Toast[]>;
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// ================================
// TOAST MANAGER
// ================================

// Global toast state
const [toasts, setToasts] = createSignal<Toast[]>([]);
const [nextId, setNextId] = createSignal(0);

// Auto-dismiss timers
const dismissTimers = new Map<string, NodeJS.Timeout>();

/**
 * Add a new toast notification
 */
const addToast = (toast: Omit<Toast, 'id' | 'timestamp'>): string => {
  const id = `toast-${nextId()}`;
  setNextId(prev => prev + 1);
  
  const newToast: Toast = {
    ...toast,
    id,
    timestamp: Date.now(),
    duration: toast.duration ?? (toast.type === 'error' ? 8000 : 5000) // Longer duration for errors
  };
  
  setToasts(prev => [...prev, newToast]);
  
  // Set auto-dismiss timer if duration is specified and > 0
  if (newToast.duration && newToast.duration > 0) {
    const timer = setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
    
    dismissTimers.set(id, timer);
  }
  
  logger.debug('Toast added:', { id, type: toast.type, title: toast.title });
  return id;
};

/**
 * Remove a specific toast notification
 */
const removeToast = (id: string): void => {
  setToasts(prev => prev.filter(toast => toast.id !== id));
  
  // Clear auto-dismiss timer
  const timer = dismissTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    dismissTimers.delete(id);
  }
  
  logger.debug('Toast removed:', id);
};

/**
 * Clear all toast notifications
 */
const clearAll = (): void => {
  // Clear all timers
  dismissTimers.forEach(timer => clearTimeout(timer));
  dismissTimers.clear();
  
  setToasts([]);
  logger.debug('All toasts cleared');
};

// Export toast manager
export const useToastManager = (): ToastManagerState => ({
  toasts,
  addToast,
  removeToast,
  clearAll
});

// ================================
// TOAST COMPONENT
// ================================

const ToastItem: Component<{ toast: Toast; onRemove: (id: string) => void }> = (props) => {
  const getToastStyles = () => {
    const baseStyles = 'relative p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 transform';
    
    switch (props.toast.type) {
      case 'success':
        return `${baseStyles} bg-green-900/80 border-green-500/50 text-green-100`;
      case 'error':
        return `${baseStyles} bg-red-900/80 border-red-500/50 text-red-100`;
      case 'warning':
        return `${baseStyles} bg-yellow-900/80 border-yellow-500/50 text-yellow-100`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-900/80 border-blue-500/50 text-blue-100`;
    }
  };

  const getIconEmoji = () => {
    switch (props.toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getProgressColor = () => {
    switch (props.toast.type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
    }
  };

  let progressRef: HTMLDivElement | undefined;

  onMount(() => {
    // Animate progress bar if duration is set
    if (props.toast.duration && props.toast.duration > 0 && progressRef) {
      progressRef.style.width = '100%';
      progressRef.style.transition = `width ${props.toast.duration}ms linear`;
      
      // Start animation after a brief delay
      setTimeout(() => {
        if (progressRef) {
          progressRef.style.width = '0%';
        }
      }, 100);
    }
  });

  return (
    <div class={getToastStyles()}>
      {/* Progress bar for auto-dismiss */}
      <Show when={props.toast.duration && props.toast.duration > 0}>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/30 rounded-b-lg overflow-hidden">
          <div
            ref={progressRef}
            class={`h-full ${getProgressColor()} transition-all`}
          />
        </div>
      </Show>

      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 flex-1">
          {/* Icon */}
          <span class="text-lg flex-shrink-0 mt-0.5">
            {getIconEmoji()}
          </span>

          {/* Content */}
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm mb-1">
              {props.toast.title}
            </div>
            <div class="text-sm opacity-90 break-words">
              {props.toast.message}
            </div>

            {/* Action button */}
            <Show when={props.toast.action}>
              <button
                onClick={props.toast.action!.onClick}
                class="mt-2 px-3 py-1 text-xs font-medium rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                {props.toast.action!.label}
              </button>
            </Show>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => props.onRemove(props.toast.id)}
          class="flex-shrink-0 text-lg opacity-60 hover:opacity-100 transition-opacity -mt-1 -mr-1 p-1"
          title="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ================================
// TOAST CONTAINER COMPONENT
// ================================

export const ToastContainer: Component<{ isDark?: boolean }> = (props) => {
  const toastManager = useToastManager();

  // Cleanup timers on unmount
  onCleanup(() => {
    dismissTimers.forEach(timer => clearTimeout(timer));
    dismissTimers.clear();
  });

  return (
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <For each={toastManager.toasts()}>
        {(toast) => (
          <div class="pointer-events-auto animate-in slide-in-from-right-full duration-300">
            <ToastItem
              toast={toast}
              onRemove={toastManager.removeToast}
            />
          </div>
        )}
      </For>
    </div>
  );
};

// ================================
// CONVENIENCE FUNCTIONS
// ================================

export const showSuccessToast = (title: string, message: string, options?: Partial<Toast>) => {
  return addToast({
    type: 'success',
    title,
    message,
    ...options
  });
};

export const showErrorToast = (title: string, message: string, options?: Partial<Toast>) => {
  return addToast({
    type: 'error',
    title,
    message,
    duration: 8000, // Longer duration for errors
    ...options
  });
};

export const showWarningToast = (title: string, message: string, options?: Partial<Toast>) => {
  return addToast({
    type: 'warning',
    title,
    message,
    ...options
  });
};

export const showInfoToast = (title: string, message: string, options?: Partial<Toast>) => {
  return addToast({
    type: 'info',
    title,
    message,
    ...options
  });
};

// Exchange-specific convenience functions
export const showExchangeSuccess = (solAmount: number, splitdoAmount: number, signature: string) => {
  return showSuccessToast(
    'Exchange Successful!',
    `Exchanged ${solAmount} SOL for ${splitdoAmount.toLocaleString()} SPLITDO tokens`,
    {
      action: signature ? {
        label: 'View Transaction',
        onClick: () => {
          window.open(`https://explorer.solana.com/tx/${signature}`, '_blank');
        }
      } : undefined
    }
  );
};

export const showExchangeError = (error: string, retryable: boolean = false, retryFn?: () => void) => {
  return showErrorToast(
    'Exchange Failed',
    error,
    {
      action: retryable && retryFn ? {
        label: 'Try Again',
        onClick: retryFn
      } : undefined
    }
  );
};

export const showExchangeProgress = (stage: string) => {
  return showInfoToast(
    'Exchange in Progress',
    stage,
    { duration: 0 } // Persistent until manually dismissed
  );
};

export default ToastContainer;