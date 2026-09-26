/**
 * Attaches the CSRF double-submit header to every same-origin, state-changing
 * fetch call app-wide by patching the global fetch once, instead of touching
 * every call site. Backend reads the raw XSRF-TOKEN cookie value (set by
 * Spring's CookieCsrfTokenRepository) and expects it back as X-XSRF-TOKEN.
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const originalFetch = window.fetch.bind(window);

window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();

  if (MUTATING_METHODS.has(method)) {
    const token = getCsrfToken();
    if (token) {
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      headers.set("X-XSRF-TOKEN", token);
      init = { ...init, headers };
    }
  }

  return originalFetch(input, init);
}) as typeof window.fetch;
