globalThis.process ??= {}; globalThis.process.env ??= {};
import { d as defineMiddleware, s as sequence } from './chunks/index_B8l2tSwD.mjs';
import { j as jwtValidator } from './chunks/jwt-validator_BY4779SR.mjs';
import './chunks/astro-designed-error-pages_DeoTEGAa.mjs';
import './chunks/astro/server_CzDYtiW_.mjs';

const onRequest$2 = defineMiddleware(async (context, next) => {
  const {
    url,
    locals,
    cookies
  } = context;
  const isProtectedRoute = [
    "/test-auth/private"
  ].some((item) => {
    return url.pathname.startsWith(item);
  });
  const isPublicRoute = [
    "/",
    "/features",
    "/about",
    "/test-auth/public"
  ].some((item) => {
    return url.pathname === item;
  }) || [
    "/pricing"
  ].some((item) => {
    return url.pathname.startsWith(item);
  });
  const isAuthRoute = url.pathname.startsWith("/auth/");
  if (isPublicRoute) {
    return next();
  }
  const authToken = cookies.get("cognito-auth-token");
  console.log("🍪 [MIDDLEWARE] Cookie inspection:", {
    hasCognitoToken: Boolean(authToken?.value),
    cognitoTokenValue: authToken?.value ? "PRESENT" : "MISSING",
    authStatusCookie: cookies.get("auth-status")?.value ? "PRESENT" : "MISSING"
  });
  if (isAuthRoute) {
    console.log("🔐 [MIDDLEWARE] Processing auth route:", url.pathname);
    if (authToken && authToken.value) {
      try {
        console.log("🔍 [MIDDLEWARE] Validating token for auth route redirect...");
        const validation = jwtValidator.validateTokenBasic(authToken.value);
        console.log("🔍 [MIDDLEWARE] Token validation result:", {
          isValid: validation.isValid,
          isExpired: validation.isExpired,
          hasPayload: Boolean(validation.payload),
          error: validation.error
        });
        if (validation.isValid && !validation.isExpired) {
          console.log("✅ [MIDDLEWARE] Valid token found, redirecting to dashboard from auth page");
          return Response.redirect(new URL("/app/dashboard", url), 302);
        } else {
          console.log("❌ [MIDDLEWARE] Invalid or expired token, allowing auth page access");
        }
      } catch (error) {
        console.error("❌ [MIDDLEWARE] Token validation failed for auth route:", error);
        cookies.delete("cognito-auth-token", {
          path: "/"
        });
      }
    } else {
      console.log("📭 [MIDDLEWARE] No auth token found, allowing auth page access");
    }
    return next();
  }
  if (isProtectedRoute) {
    console.log("🔒 [MIDDLEWARE] Processing protected route:", url.pathname);
    if (!authToken || !authToken.value) {
      console.log("❌ [MIDDLEWARE] No auth token found for protected route, redirecting to sign-in");
      return Response.redirect(new URL("/auth/sign-in", url), 302);
    }
    try {
      console.log("🔍 [MIDDLEWARE] Validating token for protected route access...");
      const validation = jwtValidator.validateTokenBasic(authToken.value);
      console.log("🔍 [MIDDLEWARE] Protected route token validation:", {
        isValid: validation.isValid,
        isExpired: validation.isExpired,
        hasPayload: Boolean(validation.payload),
        error: validation.error,
        payloadPreview: validation.payload ? {
          sub: validation.payload.sub?.substring(0, 8) + "...",
          email: validation.payload.email,
          tokenUse: validation.payload.token_use,
          exp: new Date(validation.payload.exp * 1e3).toISOString()
        } : null
      });
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid token");
      }
      if (validation.isExpired) {
        throw new Error("Token has expired");
      }
      if (validation.payload) {
        locals.user = {
          sub: validation.payload.sub,
          email: validation.payload.email,
          username: validation.payload["cognito:username"] || validation.payload.username,
          emailVerified: validation.payload.email_verified || false,
          groups: validation.payload["cognito:groups"] || [],
          tokenUse: validation.payload.token_use
        };
        console.log("👤 [MIDDLEWARE] User info stored in locals:", {
          email: locals.user.email,
          username: locals.user.username,
          tokenUse: locals.user.tokenUse
        });
      }
      console.log("✅ [MIDDLEWARE] Protected route access granted");
      return next();
    } catch (error) {
      console.error("❌ [MIDDLEWARE] Protected route validation failed:", error);
      cookies.delete("cognito-auth-token", {
        path: "/"
      });
      console.log("🔄 [MIDDLEWARE] Redirecting to sign-in due to validation failure");
      return Response.redirect(new URL("/auth/sign-in", url), 302);
    }
  }
  return next();
});

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	onRequest$2
	
);

export { onRequest };
