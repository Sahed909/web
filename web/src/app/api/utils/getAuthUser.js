import { getToken } from "@auth/core/jwt";

/**
 * Extracts the authenticated user from a request.
 * Works for both:
 * - Web: cookie-based next-auth session
 * - Mobile: JWT passed as Authorization: Bearer <token> header
 */
export async function getAuthUser(request) {
  const isSecure =
    process.env.AUTH_URL?.startsWith("https") ??
    request.url?.startsWith("https") ??
    false;

  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  // 1) Try Authorization: Bearer <token> header (mobile app sends this)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawToken = authHeader.slice(7);
    try {
      const mockHeaders = new Headers();
      mockHeaders.set("cookie", `${cookieName}=${rawToken}`);
      const mockReq = new Request(request.url, { headers: mockHeaders });
      const jwt = await getToken({
        req: mockReq,
        secret: process.env.AUTH_SECRET,
        secureCookie: isSecure,
      });
      if (jwt?.sub) {
        return { id: jwt.sub, email: jwt.email, name: jwt.name };
      }
    } catch (e) {
      console.error("[getAuthUser] Bearer token decode failed:", e);
    }
  }

  // 2) Fall back to cookie-based session (web browser)
  try {
    const jwt = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isSecure,
    });
    if (jwt?.sub) {
      return { id: jwt.sub, email: jwt.email, name: jwt.name };
    }
  } catch (e) {
    // not authenticated
  }

  return null;
}
