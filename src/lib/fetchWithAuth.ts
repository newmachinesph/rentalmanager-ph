/**
 * Thin wrapper around fetch() that auto-redirects to /login on 401 responses.
 * Use this in all client-side stores to ensure expired sessions are handled gracefully.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401 && typeof window !== 'undefined') {
    // Session expired or invalid — redirect to login
    window.location.href = '/login';
    // Return the response anyway so callers don't throw before redirect completes
    return res;
  }

  return res;
}
