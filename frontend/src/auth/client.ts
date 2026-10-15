import { createAuthClient } from '@neondatabase/neon-js/auth'

export const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL as string | undefined
export const isAuthConfigured = Boolean(NEON_AUTH_URL)
export const authClient = isAuthConfigured ? createAuthClient(NEON_AUTH_URL!) : null