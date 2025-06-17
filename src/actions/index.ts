import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'

export const server = {
  // Demo 1: Standard SSR action
  getServerInfo: defineAction({
    handler: async () => {
      return {
        message: 'This is a standard SSR action',
        executedAt: new Date().toISOString(),
        serverType: 'Astro SSR',
        nodeVersion: process.version
      }
    }
  }),

  // Demo 2: Action that returns environment variable with timestamp
  getEnvWithTime: defineAction({
    handler: async () => {
      const testEnv = import.meta.env.TEST || 'Environment variable not found'
      
      return {
        environmentValue: testEnv,
        timestamp: new Date().toISOString(),
        unixTime: Date.now(),
        formattedTime: new Date().toLocaleString()
      }
    }
  }),

  // Demo 3: Delayed action with setTimeout
  delayedAction: defineAction({
    input: z.object({
      delay: z.number().min(100).max(5000).default(2000)
    }),
    handler: async ({ delay }) => {
      const startTime = Date.now()
      
      // Simulate processing with delay
      await new Promise(resolve => setTimeout(resolve, delay))
      
      const endTime = Date.now()
      
      return {
        message: 'Action completed after delay',
        requestedDelay: delay,
        actualDuration: endTime - startTime,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date(endTime).toISOString()
      }
    }
  }),

  // Simple action - no input validation
  getServerTime: defineAction({
    handler: async () => {
      // Server-side logic with access to server env vars
      const serverSecret = import.meta.env.SECRET_API_KEY

      return {
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hasSecret: !!serverSecret,
        serverMessage: 'Hello from Astro Action!'
      }
    }
  }),

  // Action with input validation
  updateUserProfile: defineAction({
    input: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(18).optional()
    }),
    handler: async ({ name, email, age }) => {
      // Simulate database operation
      console.log('Updating user profile:', { name, email, age })

      // You could save to database here
      // await db.users.update(userId, { name, email, age })

      return {
        success: true,
        message: `Profile updated for ${name}`,
        userData: { name, email, age },
        updatedAt: new Date().toISOString()
      }
    }
  }),

  // Action that might fail
  sendNotification: defineAction({
    input: z.object({
      message: z.string(),
      type: z.enum(['info', 'warning', 'error'])
    }),
    handler: async ({ message, type }) => {
      // Simulate some processing
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (message.includes('fail')) {
        throw new Error('Notification failed to send')
      }

      return {
        success: true,
        notificationId: Math.random().toString(36),
        message: `${type.toUpperCase()}: ${message}`,
        sentAt: new Date().toISOString()
      }
    }
  }),

  // Action with file upload (example)
  uploadFile: defineAction({
    input: z.object({
      fileName: z.string(),
      fileContent: z.string(), // In real app, you'd handle File objects
      fileType: z.string()
    }),
    handler: async ({ fileName, fileContent, fileType }) => {
      // Simulate file processing
      console.log(`Processing file: ${fileName} (${fileType})`)

      return {
        success: true,
        fileId: Math.random().toString(36),
        fileName,
        fileSize: fileContent.length,
        uploadedAt: new Date().toISOString()
      }
    }
  })
}