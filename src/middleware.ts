import { defineMiddleware } from 'astro:middleware'

// Hardcoded authentication status - change this to true/false as needed
const isAuthenticated: boolean = true

// 'startsWith' should include SPAs, since any reloads of the page, even while client-side router is active, will route
// through the server (i.e. Astro's router)
type Paths = {
  exact: string[],
  startsWith: string[],
} | null

export const onRequest = defineMiddleware((context, next) => {
  const { url } = context
  const { pathname } = url

  console.log(`ASTRO MIDDLEWARE`)

  const isPublicPath: boolean = (
    // exact match
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/pricing' ||
    pathname === '/features' ||
    // starts with
    pathname.startsWith('/pricing' + '/')
  ) ?? false

  if (isPublicPath) {
    return next()
  }

  if (
    pathname === '/app' ||
    pathname.startsWith('/app/')
  ) {
    console.log(`ASTRO MIDDLEWARE: pathname: ${pathname}`)
    return next()
  }

  if (
    pathname === '/settings' ||
    pathname.startsWith('/settings/')
  ) {
    console.log(`ASTRO MIDDLEWARE: pathname: ${pathname}`)
    return next()
  }

  return next()

  // // if unknown path than return to '/' (no/less 404s)
  // return Response.redirect(new URL('/', url), 302)
})