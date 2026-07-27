/**
 * Validated environment access.
 *
 * All NEXT_PUBLIC_* reads go through here so a missing variable fails loudly
 * at one place instead of producing undefined URLs scattered across the app.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
} as const;