import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'

export const server = {
  // Claude API proxy action
  claudeProxy: defineAction({
    input: z.object({
      message: z.string()
        .min(1, "Field 'message' cannot be empty")
        .max(10000, "Field 'message' must be less than 10,000 characters")
    }),
    handler: async ({ message }, context) => {
      // Get environment variables
      // TODO!!: Document that when running 'import.meta.env.' on CloudFlare's server, you **need** to add it to the 'vite.define.' inside astro.config.mjs please
      const claudeApiKey = import.meta.env.CLAUDE_API_KEY
      const claudeModel = import.meta.env.CLAUDE_MODEL
      const claudeMaxTokens = import.meta.env.CLAUDE_MAX_TOKENS
      const anthropicVersion = import.meta.env.ANTHROPIC_VERSION

      // Validate environment variables
      if (!claudeApiKey || !claudeModel || !claudeMaxTokens || !anthropicVersion) {
        throw new Error("Missing required environment variables: CLAUDE_API_KEY, CLAUDE_MODEL, CLAUDE_MAX_TOKENS, or ANTHROPIC_VERSION")
      }

      // Access D1 database through context.locals.runtime
      const runtime = context.locals.runtime

      // TODO!!: Document that when CloudFlare resources are needed they need to be binded on the CF Page's project please
      const db = runtime?.env?.DB

      if (!db) {
        throw new Error("Database not configured - D1 binding not found")
      }

      const startTime = Date.now()

      try {
        // Prepare Claude API request
        const claudeRequestBody = {
          model: claudeModel,
          max_tokens: parseInt(claudeMaxTokens),
          messages: [
            {
              role: "user",
              content: message.trim()
            }
          ]
        }

        // Make request to Claude API
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': claudeApiKey,
            'Content-Type': 'application/json',
            'anthropic-version': anthropicVersion
          },
          body: JSON.stringify(claudeRequestBody)
        })

        const endTime = Date.now()
        const responseTime = endTime - startTime
        const logMessage = `Response time: ${responseTime}ms`

        if (!claudeResponse.ok) {
          const errorResponse = await claudeResponse.text()

          // Log the failed request
          await db.prepare(
            "INSERT INTO `claude-testing` (input, output, log) VALUES (?, ?, ?)"
          ).bind(
            message.trim(),
            `Error: ${claudeResponse.status} - ${errorResponse}`,
            logMessage
          ).run()

          throw new Error(`Claude API Error: ${claudeResponse.status} - Failed to get response from Claude API`)
        }

        const claudeData = await claudeResponse.json()

        // Extract the text content from Claude's response
        const outputMessage = (claudeData as any).content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text)
          .join("")

        // Insert into database
        await db.prepare(
          "INSERT INTO `claude-testing` (input, output, log) VALUES (?, ?, ?)"
        ).bind(
          message.trim(),
          outputMessage,
          logMessage
        ).run()

        // Return simplified response
        return {
          message: outputMessage,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        }

      } catch (error: any) {
        const endTime = Date.now()
        const responseTime = endTime - startTime
        const logMessage = `Response time: ${responseTime}ms (Error)`
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        // Log the error
        try {
          await db.prepare(
            "INSERT INTO `claude-testing` (input, output, log) VALUES (?, ?, ?)"
          ).bind(
            message.trim(),
            `System Error: ${errorMessage}`,
            logMessage
          ).run()
        } catch (dbError) {
          console.error("Failed to log to database:", dbError)
        }

        // Re-throw the error to be handled by Astro's action error handling
        throw new Error(`Internal Server Error: ${errorMessage}`)
      }
    }
  })
}