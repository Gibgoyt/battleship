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
    pathname === '/frameworks-test' ||
    pathname === '/apps' ||
    pathname === '/about' ||
    pathname === '/cloudflare' ||
    pathname === '/features' ||
    // starts with
    pathname.startsWith('/api' + '/') ||
    pathname.startsWith('/docs' + '/')
  ) ?? false

  if (isPublicPath) {
    return next()
  }

  if (
    pathname === '/solid-spa' ||
    pathname.startsWith('/solid-spa')
  ) {
    console.log(`ASTRO MIDDLEWARE: pathname: ${pathname}`)
    return next()
  }

  if (
    pathname === '/svelte-spa' ||
    pathname.startsWith('/svelte-spa')
  ) {
    console.log(`ASTRO MIDDLEWARE: pathname: ${pathname}`)
    return next()
  }

  if (
    pathname === '/qwik-spa' ||
    pathname.startsWith('/qwik-spa')
  ) {
    console.log(`ASTRO MIDDLEWARE: pathname: ${pathname}`)
    return next()
  }

  // hardcoded Astro router rejections will look like this:
  if (!isAuthenticated && pathname === '/demo') {
    return Response.redirect(new URL('/', url), 302)
  }

  // Check if accessing protected app routes
  if (!isAuthenticated && pathname.startsWith('/solid-spa/')) {
    return Response.redirect(new URL('/', url), 302)
  }

  // Check if accessing protected app routes
  if (!isAuthenticated && pathname.startsWith('/svelte-spa/')) {
    return Response.redirect(new URL('/', url), 302)
  }

  // Check if accessing protected app routes
  if (!isAuthenticated && pathname.startsWith('/qwik-spa/')) {
    return Response.redirect(new URL('/', url), 302)
  }

  return next()

  // // if unknown path than return to '/' (no/less 404s)
  // return Response.redirect(new URL('/', url), 302)
})