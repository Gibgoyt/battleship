globalThis.process ??= {}; globalThis.process.env ??= {};
class JWTValidator {
  static instance;
  jwksCache = null;
  jwksCacheExpiry = 0;
  constructor() {
  }
  static getInstance() {
    if (!JWTValidator.instance) {
      JWTValidator.instance = new JWTValidator();
    }
    return JWTValidator.instance;
  }
  // Decode JWT token without verification (for basic checks)
  decodeToken(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      return { header, payload };
    } catch (error) {
      console.error("❌ [JWT Validator] Failed to decode token:", error);
      return null;
    }
  }
  // Check if token is expired
  isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;
    const currentTime = Math.floor(Date.now() / 1e3);
    return decoded.payload.exp < currentTime;
  }
  // Basic token validation (without signature verification)
  validateTokenBasic(token) {
    try {
      console.log("🔍 [JWT Validator] Starting token validation...", {
        hasToken: Boolean(token),
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 20) + "...",
        tokenSuffix: "..." + token?.substring(token.length - 20)
      });
      if (!token || typeof token !== "string") {
        console.log("❌ [JWT Validator] Token missing or invalid format");
        return {
          isValid: false,
          isExpired: false,
          error: "Token is missing or invalid format"
        };
      }
      const decoded = this.decodeToken(token);
      if (!decoded) {
        console.log("❌ [JWT Validator] Failed to decode token");
        return {
          isValid: false,
          isExpired: false,
          error: "Failed to decode token"
        };
      }
      const { payload } = decoded;
      const currentTime = Math.floor(Date.now() / 1e3);
      const isExpired = payload.exp < currentTime;
      console.log("🔍 [JWT Validator] Token decoded successfully:", {
        sub: payload.sub?.substring(0, 8) + "...",
        email: payload.email,
        tokenUse: payload.token_use,
        iat: new Date(payload.iat * 1e3).toISOString(),
        exp: new Date(payload.exp * 1e3).toISOString(),
        isExpired,
        timeUntilExpiry: payload.exp - currentTime + " seconds"
      });
      if (isExpired) {
        console.log("❌ [JWT Validator] Token has expired");
        return {
          isValid: false,
          isExpired: true,
          payload,
          error: "Token has expired"
        };
      }
      if (!payload.sub || !payload.exp || !payload.iat) {
        console.log("❌ [JWT Validator] Token missing required claims:", {
          hasSub: Boolean(payload.sub),
          hasExp: Boolean(payload.exp),
          hasIat: Boolean(payload.iat)
        });
        return {
          isValid: false,
          isExpired: false,
          payload,
          error: "Token missing required claims"
        };
      }
      console.log("✅ [JWT Validator] Token validation successful");
      return {
        isValid: true,
        isExpired: false,
        payload
      };
    } catch (error) {
      console.error("❌ [JWT Validator] Validation error:", error);
      return {
        isValid: false,
        isExpired: false,
        error: error instanceof Error ? error.message : "Unknown validation error"
      };
    }
  }
  // Extract user info from valid token
  extractUserInfo(token) {
    const validation = this.validateTokenBasic(token);
    if (!validation.isValid || !validation.payload) {
      return null;
    }
    const { payload } = validation;
    return {
      email: payload.email,
      username: payload["cognito:username"] || payload.username,
      groups: payload["cognito:groups"] || []
    };
  }
  // Validate tokens from storage (localStorage/sessionStorage)
  validateStoredTokens() {
    try {
      const storages = [localStorage, sessionStorage];
      let accessToken = null;
      let idToken = null;
      for (const storage of storages) {
        if (!accessToken) accessToken = storage.getItem("accessToken");
        if (!idToken) idToken = storage.getItem("idToken");
      }
      const accessResult = accessToken ? this.validateTokenBasic(accessToken) : null;
      const idResult = idToken ? this.validateTokenBasic(idToken) : null;
      const hasValidTokens = Boolean(
        accessResult?.isValid || idResult?.isValid
      );
      return {
        accessToken: accessResult || void 0,
        idToken: idResult || void 0,
        hasValidTokens
      };
    } catch (error) {
      console.error("❌ [JWT Validator] Failed to validate stored tokens:", error);
      return { hasValidTokens: false };
    }
  }
  // Check if user is authenticated based on stored tokens
  isUserAuthenticated() {
    const validation = this.validateStoredTokens();
    return validation.hasValidTokens;
  }
  // Clear expired or invalid tokens from storage
  clearInvalidTokens() {
    try {
      const storages = [localStorage, sessionStorage];
      for (const storage of storages) {
        const accessToken = storage.getItem("accessToken");
        const idToken = storage.getItem("idToken");
        const refreshToken = storage.getItem("refreshToken");
        let shouldClear = false;
        if (accessToken && !this.validateTokenBasic(accessToken).isValid) {
          shouldClear = true;
        }
        if (idToken && !this.validateTokenBasic(idToken).isValid) {
          shouldClear = true;
        }
        if (shouldClear) {
          console.log("🧹 [JWT Validator] Clearing invalid tokens from storage");
          storage.removeItem("accessToken");
          storage.removeItem("idToken");
          storage.removeItem("refreshToken");
          storage.removeItem("rememberMe");
        }
      }
    } catch (error) {
      console.error("❌ [JWT Validator] Failed to clear invalid tokens:", error);
    }
  }
}
const jwtValidator = JWTValidator.getInstance();

export { jwtValidator as j };
