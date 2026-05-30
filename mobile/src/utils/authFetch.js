import { useAuthStore } from "@/utils/auth/store";

/**
 * A drop-in replacement for `fetch` that automatically attaches the
 * stored JWT as an Authorization: Bearer header.
 * Mobile uses this so the backend can identify the logged-in user.
 */
export async function authFetch(url, options = {}) {
  const { auth } = useAuthStore.getState();
  const headers = { ...(options.headers || {}) };

  if (auth?.jwt) {
    headers["Authorization"] = `Bearer ${auth.jwt}`;
  }

  return fetch(url, { ...options, headers });
}
