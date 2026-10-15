import { createAuthClient } from 'better-auth/react'
import { jwtClient } from 'better-auth/client/plugins'

export const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL as string | undefined
export const isAuthConfigured = Boolean(NEON_AUTH_URL)
export const NEON_AUTH_SESSION_VERIFIER_PARAM_NAME = 'neon_auth_session_verifier'
export const authClient = createAuthClient(
	NEON_AUTH_URL
		? {
			baseURL: NEON_AUTH_URL,
			plugins: [jwtClient()],
			fetchOptions: {
				onRequest(context) {
					if (typeof window === 'undefined') return
					const verifier = new URLSearchParams(window.location.search).get(
						NEON_AUTH_SESSION_VERIFIER_PARAM_NAME,
					)
					if (!verifier) return

					const requestUrl = new URL(context.url.toString(), window.location.origin)
					if (!requestUrl.pathname.endsWith('/get-session')) return
					requestUrl.searchParams.set(NEON_AUTH_SESSION_VERIFIER_PARAM_NAME, verifier)
					return { ...context, url: requestUrl }
				},
			},
		}
		: { plugins: [jwtClient()] },
)
