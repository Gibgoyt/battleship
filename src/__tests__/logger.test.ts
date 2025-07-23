import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLogger } from 'src/lib/logger'

// Mock console methods to test logger output
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock import.meta.env for test environment
vi.stubGlobal('import.meta', {
  env: {
    DEV: true,
    NODE_ENV: 'test'
  }
})

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create logger with context', () => {
    const logger = createLogger('TestContext')
    
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('should format messages with timestamp and context', () => {
    const logger = createLogger('TestLogger')
    
    logger.debug('test message')
    
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[TestLogger]'),
      'test message'
    )
  })

  it('should call appropriate console methods for each log level', () => {
    const logger = createLogger('TestLogger')
    
    logger.debug('debug message')
    logger.info('info message')  
    logger.warn('warn message')
    logger.error('error message')
    
    expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'), 'debug message')
    expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('[INFO]'), 'info message')
    expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN]'), 'warn message')
    expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'), 'error message')
  })

  it('should handle data parameter', () => {
    const logger = createLogger('TestLogger')
    const testData = { key: 'value', number: 42 }
    
    logger.info('test with data', testData)
    
    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      'test with data', 
      testData
    )
  })
})