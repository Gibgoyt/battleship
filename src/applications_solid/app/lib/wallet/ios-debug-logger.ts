/**
 * iOS Phantom Wallet Debug Logger
 * 
 * Comprehensive logging utilities for troubleshooting iOS wallet flows.
 * Provides structured logging, error tracking, and debugging information.
 */

import { createLogger } from 'src/lib/logger';

const logger = createLogger('[iOS-Phantom]');

export interface iOSDebugContext {
  sessionId: string;
  userAgent: string;
  deviceInfo: any;
  timestamp: string;
  stage: 'connection' | 'transaction' | 'encryption' | 'deeplink' | 'error';
}

export interface iOSConnectionEvent {
  type: 'connection_start' | 'connection_success' | 'connection_failed';
  deepLinkUrl?: string;
  publicKey?: string;
  error?: string;
  duration?: number;
}

export interface iOSTransactionEvent {
  type: 'transaction_start' | 'transaction_signed' | 'transaction_submitted' | 'transaction_failed';
  transactionData?: any;
  signature?: string;
  error?: string;
  duration?: number;
}

export interface iOSEncryptionEvent {
  type: 'encryption_start' | 'encryption_success' | 'encryption_failed' | 'decryption_start' | 'decryption_success' | 'decryption_failed';
  keyPairGenerated?: boolean;
  payloadSize?: number;
  error?: string;
}

export interface iOSDeepLinkEvent {
  type: 'deeplink_generated' | 'deeplink_opened' | 'deeplink_response' | 'deeplink_timeout';
  url?: string;
  method?: string;
  timeout?: number;
  response?: any;
  error?: string;
}

export class iOSDebugLogger {
  private sessionId: string;
  private startTime: number;
  private events: Array<{
    timestamp: number;
    event: iOSConnectionEvent | iOSTransactionEvent | iOSEncryptionEvent | iOSDeepLinkEvent;
    context: Partial<iOSDebugContext>;
  }> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.logSessionStart();
  }

  private generateSessionId(): string {
    return `ios-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logSessionStart(): void {
    const deviceInfo = this.getDeviceInfo();
    logger.info('iOS Phantom session started', {
      sessionId: this.sessionId,
      deviceInfo,
      userAgent: navigator.userAgent
    });
  }

  private getDeviceInfo(): any {
    if (typeof window === 'undefined') return {};
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      isPhantomApp: navigator.userAgent.toLowerCase().includes('phantom'),
      isIOS: /iphone|ipad|ipod/i.test(navigator.userAgent),
      timestamp: new Date().toISOString()
    };
  }

  private logEvent(
    event: iOSConnectionEvent | iOSTransactionEvent | iOSEncryptionEvent | iOSDeepLinkEvent,
    context: Partial<iOSDebugContext> = {}
  ): void {
    const logEntry = {
      timestamp: Date.now(),
      event,
      context: {
        sessionId: this.sessionId,
        ...context
      }
    };

    this.events.push(logEntry);

    // Log to console with appropriate level
    if (event.type.includes('failed') || event.type.includes('error')) {
      logger.error('iOS Phantom event', logEntry);
    } else if (event.type.includes('start')) {
      logger.info('iOS Phantom event', logEntry);
    } else {
      logger.debug('iOS Phantom event', logEntry);
    }
  }

  // Connection Events
  logConnectionStart(deepLinkUrl: string): void {
    this.logEvent({
      type: 'connection_start',
      deepLinkUrl
    }, { stage: 'connection' });
  }

  logConnectionSuccess(publicKey: string, duration: number): void {
    this.logEvent({
      type: 'connection_success',
      publicKey,
      duration
    }, { stage: 'connection' });
  }

  logConnectionFailed(error: string, duration: number): void {
    this.logEvent({
      type: 'connection_failed',
      error,
      duration
    }, { stage: 'error' });
  }

  // Transaction Events
  logTransactionStart(transactionData: any): void {
    this.logEvent({
      type: 'transaction_start',
      transactionData: this.sanitizeTransactionData(transactionData)
    }, { stage: 'transaction' });
  }

  logTransactionSigned(signature: string, duration: number): void {
    this.logEvent({
      type: 'transaction_signed',
      signature,
      duration
    }, { stage: 'transaction' });
  }

  logTransactionSubmitted(signature: string): void {
    this.logEvent({
      type: 'transaction_submitted',
      signature
    }, { stage: 'transaction' });
  }

  logTransactionFailed(error: string, duration: number): void {
    this.logEvent({
      type: 'transaction_failed',
      error,
      duration
    }, { stage: 'error' });
  }

  // Encryption Events
  logEncryptionStart(): void {
    this.logEvent({
      type: 'encryption_start'
    }, { stage: 'encryption' });
  }

  logEncryptionSuccess(keyPairGenerated: boolean, payloadSize: number): void {
    this.logEvent({
      type: 'encryption_success',
      keyPairGenerated,
      payloadSize
    }, { stage: 'encryption' });
  }

  logEncryptionFailed(error: string): void {
    this.logEvent({
      type: 'encryption_failed',
      error
    }, { stage: 'error' });
  }

  logDecryptionStart(payloadSize: number): void {
    this.logEvent({
      type: 'decryption_start',
      payloadSize
    }, { stage: 'encryption' });
  }

  logDecryptionSuccess(): void {
    this.logEvent({
      type: 'decryption_success'
    }, { stage: 'encryption' });
  }

  logDecryptionFailed(error: string): void {
    this.logEvent({
      type: 'decryption_failed',
      error
    }, { stage: 'error' });
  }

  // Deep Link Events
  logDeepLinkGenerated(url: string, method: string): void {
    this.logEvent({
      type: 'deeplink_generated',
      url: this.sanitizeDeepLink(url),
      method
    }, { stage: 'deeplink' });
  }

  logDeepLinkOpened(url: string): void {
    this.logEvent({
      type: 'deeplink_opened',
      url: this.sanitizeDeepLink(url)
    }, { stage: 'deeplink' });
  }

  logDeepLinkResponse(response: any): void {
    this.logEvent({
      type: 'deeplink_response',
      response: this.sanitizeResponse(response)
    }, { stage: 'deeplink' });
  }

  logDeepLinkTimeout(timeout: number): void {
    this.logEvent({
      type: 'deeplink_timeout',
      timeout
    }, { stage: 'error' });
  }

  // Utility Methods
  private sanitizeTransactionData(data: any): any {
    if (!data) return null;
    
    return {
      type: data.type || 'unknown',
      feePayer: data.feePayer?.toString() || 'unknown',
      instructionCount: data.instructions?.length || 0,
      signerCount: data.signers?.length || 0,
      hasBlockhash: !!data.recentBlockhash
    };
  }

  private sanitizeDeepLink(url: string): string {
    if (!url) return '';
    
    // Remove sensitive data from deep link URLs
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.delete('payload'); // Remove encrypted payload
      return urlObj.toString();
    } catch {
      return url.substring(0, 100) + '...[truncated]';
    }
  }

  private sanitizeResponse(response: any): any {
    if (!response) return null;
    
    if (typeof response === 'string') {
      return response.length > 200 ? response.substring(0, 200) + '...[truncated]' : response;
    }
    
    return {
      type: typeof response,
      hasData: !!response.data,
      hasError: !!response.error,
      keys: Object.keys(response).slice(0, 10) // Show first 10 keys
    };
  }

  // Session Summary
  getSessionSummary(): {
    sessionId: string;
    duration: number;
    eventCount: number;
    errorCount: number;
    lastActivity: number;
    deviceInfo: any;
  } {
    const errorEvents = this.events.filter(e => 
      e.event.type.includes('failed') || e.event.type.includes('error') || e.event.type.includes('timeout')
    );

    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      eventCount: this.events.length,
      errorCount: errorEvents.length,
      lastActivity: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : this.startTime,
      deviceInfo: this.getDeviceInfo()
    };
  }

  // Export session data for debugging
  exportSessionData(): string {
    const summary = this.getSessionSummary();
    const exportData = {
      summary,
      events: this.events,
      generatedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Log session end
  endSession(): void {
    const summary = this.getSessionSummary();
    logger.info('iOS Phantom session ended', summary);
  }
}

// Global instance
export const iOSDebugger = new iOSDebugLogger();

// Convenience functions for quick logging
export const logConnection = {
  start: (url: string) => iOSDebugger.logConnectionStart(url),
  success: (publicKey: string, duration: number) => iOSDebugger.logConnectionSuccess(publicKey, duration),
  failed: (error: string, duration: number) => iOSDebugger.logConnectionFailed(error, duration)
};

export const logTransaction = {
  start: (data: any) => iOSDebugger.logTransactionStart(data),
  signed: (signature: string, duration: number) => iOSDebugger.logTransactionSigned(signature, duration),
  submitted: (signature: string) => iOSDebugger.logTransactionSubmitted(signature),
  failed: (error: string, duration: number) => iOSDebugger.logTransactionFailed(error, duration)
};

export const logEncryption = {
  start: () => iOSDebugger.logEncryptionStart(),
  success: (keyPair: boolean, size: number) => iOSDebugger.logEncryptionSuccess(keyPair, size),
  failed: (error: string) => iOSDebugger.logEncryptionFailed(error)
};

export const logDeepLink = {
  generated: (url: string, method: string) => iOSDebugger.logDeepLinkGenerated(url, method),
  opened: (url: string) => iOSDebugger.logDeepLinkOpened(url),
  response: (response: any) => iOSDebugger.logDeepLinkResponse(response),
  timeout: (timeout: number) => iOSDebugger.logDeepLinkTimeout(timeout)
};