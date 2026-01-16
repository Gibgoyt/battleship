type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (message: string, data?: any) => void
  info: (message: string, data?: any) => void
  warn: (message: string, data?: any) => void
  error: (message: string, error?: any) => void
}

// Create a simple logger that's safe for serialization
function createLogger(context: string): Logger {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined'
  
  // Safely check development environment
  let isDevelopment = false
  
  if (isBrowser) {
    // Browser environment - check hostname
    isDevelopment = typeof window !== 'undefined' && 
                   (window.location?.hostname === 'localhost' || 
                    window.location?.hostname === '127.0.0.1' ||
                    window.location?.hostname?.includes('192.168'))
  } else {
    // Server environment - check environment variables
    try {
      // Check process.env first (Node.js environment)
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        isDevelopment = true
      }
      // Check if we're in Vite/Astro dev mode
      else if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
        isDevelopment = true
      }
      else {
        isDevelopment = true // Default to development for server-side
      }
    } catch {
      isDevelopment = true // Default to development if we can't determine
    }
  }
  
  const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`
  }

  const shouldLog = (level: LogLevel): boolean => {
    // Always enable all logging levels
    return true;
  }

  // Return plain functions that don't create circular references
  const logger: Logger = {
    debug: (message: string, data?: any) => {
      if (shouldLog('debug') && typeof console !== 'undefined') {
        console.log(formatMessage('debug', message), data ? data : '')
      }
    },
    
    info: (message: string, data?: any) => {
      if (shouldLog('info') && typeof console !== 'undefined') {
        console.info(formatMessage('info', message), data ? data : '')
      }
    },
    
    warn: (message: string, data?: any) => {
      if (shouldLog('warn') && typeof console !== 'undefined') {
        console.warn(formatMessage('warn', message), data ? data : '')
      }
    },
    
    error: (message: string, error?: any) => {
      if (shouldLog('error') && typeof console !== 'undefined') {
        console.error(formatMessage('error', message), error ? error : '')
      }
    }
  }

  return logger
}

export { createLogger, type Logger }