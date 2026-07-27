/**
 * Ambient declarations.
 *
 * Next.js normally provides these via the generated `next-env.d.ts`, but that
 * file is git-ignored and disappears whenever the workspace is cleaned. Keeping
 * an explicit declaration here means the editor never flags CSS side-effect
 * imports again.
 */
declare module "*.css";