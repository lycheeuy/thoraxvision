/**
 * JWT token storage — the ONLY place allowed to touch localStorage.
 *
 * Swapping the mechanism later (e.g. httpOnly cookies) means changing this
 * file only. Guards against SSR: on the server, localStorage doesn't exist,
 * so every function no-ops / returns null there.
 */
const TOKEN_KEY = "thoraxvision.access_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export const tokenStorage = {
  get(): string | null {
    if (!isBrowser()) return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null; // storage blocked (private mode, etc.)
    }
  },

  set(token: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage blocked — session simply won't persist */
    }
  },

  clear(): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },

  has(): boolean {
    return this.get() !== null;
  },
} as const;