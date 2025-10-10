import { defineMiddleware } from 'astro:middleware'
import { type APIContext, type MiddlewareNext } from "astro"
import { jwtValidator } from './lib/auth/jwt-validator'
import { createLogger } from './lib/logger'

const logger = createLogger('Middleware');

export const onRequest = defineMiddleware(async (
  context: APIContext,
  next: MiddlewareNext
): Promise<Response> => {
  const {
    url,
    locals,
    cookies
  } = context

  const isProtectedRoute: boolean = [
    '/test-auth/private'
  ].some((item: string): boolean => {
    return (url.pathname.startsWith(item))
  })

  const isPublicRoute: boolean = [
    '/',
    '/features',
    '/about',
    '/test-auth/public'
  ].some((item: string): boolean => {
    return (url.pathname === item)
  }) || [
    '/pricing'
  ].some((item: string): boolean => {
    return (url.pathname.startsWith(item))
  })

  // Skip middleware for auth routes to prevent redirect loops
  const isAuthRoute: boolean = url.pathname.startsWith('/auth/')

  // Skip middleware for /app/* and /admin/* routes - they handle auth in their catch-all pages
  const isCatchAllRoute: boolean = url.pathname.startsWith('/app/') || url.pathname.startsWith('/admin/')

  if (isPublicRoute || isCatchAllRoute) {
    return next()
  }

  // Get the Cognito auth token from cookies
  const authToken = cookies.get('cognito-auth-token')
  logger.debug('Cookie inspection', {
    hasCognitoToken: Boolean(authToken?.value),
    cognitoTokenValue: authToken?.value ? 'PRESENT' : 'MISSING',
    authStatusCookie: cookies.get('auth-status')?.value ? 'PRESENT' : 'MISSING',
    path: url.pathname
  })

  // Check if the route is auth route
  if (isAuthRoute) {
    logger.debug(`Processing auth route: ${url.pathname}`);
    
    // If user is already logged in, redirect to app dashboard
    if (authToken && authToken.value) {
      try {
        logger.debug('Validating token for auth route redirect');
        
        // Validate the Cognito JWT token
        const validation = jwtValidator.validateTokenBasic(authToken.value)
        logger.debug('Token validation result', {
          isValid: validation.isValid,
          isExpired: validation.isExpired,
          hasPayload: Boolean(validation.payload),
          error: validation.error
        });
        
        if (validation.isValid && !validation.isExpired) {
          logger.info('Valid token found, redirecting to dashboard from auth page');
          // Token is valid, user is logged in, redirect to dashboard
          return Response.redirect(new URL('/app/dashboard', url), 302)
        } else {
          logger.debug('Invalid or expired token, allowing auth page access');
        }
      } catch (error) {
        logger.error('Token validation failed for auth route', error);
        // Invalid token, clear it and continue to auth page
        cookies.delete('cognito-auth-token', {
          path: '/',
        })
      }
    } else {
      logger.debug('No auth token found, allowing auth page access')
    }
    return next()
  }

  // Check if the route is protected 
  if (isProtectedRoute) {
    logger.debug(`Processing protected route: ${url.pathname}`);
    
    // If no auth token is present, redirect to sign-in
    if (!authToken || !authToken.value) {
      logger.warn('No auth token found for protected route, redirecting to sign-in');
      return Response.redirect(new URL('/auth/sign-in', url), 302)
    }

    try {
      logger.debug('Validating token for protected route access');
      
      // Validate the Cognito JWT token
      const validation = jwtValidator.validateTokenBasic(authToken.value)
      logger.debug('Protected route token validation', {
        isValid: validation.isValid,
        isExpired: validation.isExpired,
        hasPayload: Boolean(validation.payload),
        error: validation.error,
        userEmail: validation.payload?.email,
        tokenUse: validation.payload?.token_use,
        exp: validation.payload?.exp ? new Date(validation.payload.exp * 1000).toISOString() : null
      });
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid token')
      }

      if (validation.isExpired) {
        throw new Error('Token has expired')
      }

      // Store user info in locals for use in pages
      if (validation.payload) {
        locals.user = {
          sub: validation.payload.sub,
          email: validation.payload.email,
          username: validation.payload['cognito:username'] || validation.payload.username,
          emailVerified: validation.payload.email_verified || false,
          groups: validation.payload['cognito:groups'] || [],
          tokenUse: validation.payload.token_use
        }
        
        logger.debug('User info stored in locals', {
          email: locals.user.email,
          username: locals.user.username,
          tokenUse: locals.user.tokenUse
        });
      }

      logger.info('Protected route access granted');
      // Token exists and is valid, allow access
      return next()
    } catch (error) {
      logger.error('Protected route validation failed', error);
      // Invalid token, clear it and redirect to sign-in
      cookies.delete('cognito-auth-token', {
        path: '/',
      })
      logger.warn('Redirecting to sign-in due to validation failure');
      return Response.redirect(new URL('/auth/sign-in', url), 302)
    }
  }

  // For all other routes, continue normally
  return next()
})