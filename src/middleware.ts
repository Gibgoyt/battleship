import { defineMiddleware } from 'astro:middleware'
import { type APIContext, type MiddlewareNext } from "astro"
import { jwtValidator } from './lib/auth/jwt-validator'
import { firebaseJwtValidator } from './lib/auth/firebase-jwt-validator'
import { createLogger } from './lib/logger'

const logger = createLogger('MIDDLEWARE')

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
    '/test-auth/private',
    // '/app', // Protect all /app routes - MOVED TO PAGE LEVEL
    '/admin' // Protect all /admin routes
  ].some((item: string): boolean => {
    return (url.pathname.startsWith(item))
  })

  const isPublicRoute: boolean = [
    '/',
    '/features',
    '/about',
    '/test-auth/public',
    '/pricing',
    '/download'
  ].some((item: string): boolean => {
    return (url.pathname === item || url.pathname.startsWith(item))
  })

  // Skip middleware for auth routes to prevent redirect loops
  const isAuthRoute: boolean = url.pathname.startsWith('/auth/')

  if (isPublicRoute) {
    return next()
  }

  // Get auth tokens from cookies (check both providers for auth route redirect)
  const cognitoAuthToken = cookies.get('cognito-auth-token')
  const firebaseAuthToken = cookies.get('firebase-auth-token')
  logger.debug('Cookie inspection', {
    hasCognitoToken: Boolean(cognitoAuthToken?.value),
    hasFirebaseToken: Boolean(firebaseAuthToken?.value),
    path: url.pathname
  })

  // Check if the route is auth route
  if (isAuthRoute) {
    logger.debug('Processing auth route', { pathname: url.pathname })
    
    // If user is already logged in with either provider, redirect to app dashboard
    if ((cognitoAuthToken && cognitoAuthToken.value) || (firebaseAuthToken && firebaseAuthToken.value)) {
      logger.debug('Auth token found, redirecting to dashboard')
      return Response.redirect(new URL('/app/dashboard', url), 302)
    } else {
      logger.debug('No auth tokens found, allowing auth page access')
    }
    return next()
  }

  // Check if the route is protected 
  if (isProtectedRoute) {
    logger.debug('Processing protected route', { pathname: url.pathname })
    
    // If no auth token is present, redirect to sign-in
    if ((!cognitoAuthToken || !cognitoAuthToken.value) && (!firebaseAuthToken || !firebaseAuthToken.value)) {
      logger.info('No auth token found for protected route, redirecting to sign-in')
      return Response.redirect(new URL('/auth/sign-in', url), 302)
    }

    try {
      logger.debug('Validating token for protected route access')
      
      let validation: any = { isValid: false, isExpired: false };
      let provider = 'none';

      // Try Cognito first
      if (cognitoAuthToken && cognitoAuthToken.value) {
          validation = jwtValidator.validateTokenBasic(cognitoAuthToken.value);
          provider = 'cognito';
          logger.debug('Validated with Cognito');
      } 
      // If Cognito invalid or missing, try Firebase
      if ((!validation.isValid || validation.isExpired) && firebaseAuthToken && firebaseAuthToken.value) {
          validation = firebaseJwtValidator.validateTokenBasic(firebaseAuthToken.value);
          provider = 'firebase';
          logger.debug('Validated with Firebase');
      }

      logger.debug('Token validation result', {
        provider,
        isValid: validation.isValid,
        isExpired: validation.isExpired
      })
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid token')
      }

      if (validation.isExpired) {
        throw new Error('Token has expired')
      }

      // Store user info in locals for use in pages
      if (validation.payload) {
        if (provider === 'cognito') {
            locals.user = {
              sub: validation.payload.sub,
              email: validation.payload.email,
              username: validation.payload['cognito:username'] || validation.payload.username,
              emailVerified: validation.payload.email_verified || false,
              groups: validation.payload['cognito:groups'] || [],
              tokenUse: validation.payload.token_use
            }
        } else if (provider === 'firebase') {
             locals.user = {
              sub: validation.payload.sub,
              email: validation.payload.email,
              username: validation.payload.name || validation.payload.email,
              emailVerified: validation.payload.email_verified || false,
              groups: [], 
              tokenUse: 'id'
            }
        }
        
        logger.debug('User info stored in locals', {
          email: locals.user?.email,
          provider
        })
      }

      logger.debug('Protected route access granted')
      // Token exists and is valid, allow access
      return next()
    } catch (error) {
      logger.error('Protected route validation failed', error)
      // Invalid token, clear it and redirect to sign-in
      // Clear both to be safe/clean
      if (cognitoAuthToken) cookies.delete('cognito-auth-token', { path: '/' })
      if (firebaseAuthToken) cookies.delete('firebase-auth-token', { path: '/' })
      
      logger.info('Redirecting to sign-in due to validation failure')
      return Response.redirect(new URL('/auth/sign-in', url), 302)
    }
  }

  // For all other routes, continue normally
  return next()
})