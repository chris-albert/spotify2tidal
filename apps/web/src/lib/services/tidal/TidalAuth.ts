import { generateCodeVerifier, generateCodeChallenge } from '@/lib/utils/pkce'
import { TokenStore } from '@/lib/storage/TokenStore'
import { CredentialsStore } from '@/lib/storage/CredentialsStore'
import type { AuthTokens } from '@/store/authStore'

/**
 * TidalAuth - Tidal OAuth 2.0 PKCE Authentication
 *
 * Implements browser-based PKCE flow for Tidal authentication.
 * Similar to Spotify but uses Tidal's OAuth endpoints.
 */

const getTidalClientId = () => CredentialsStore.getTidalClientId()
// For hash routing on GitHub Pages, redirect to base URL - OAuth params are handled at root
const REDIRECT_URI = `${import.meta.env.VITE_REDIRECT_URI || window.location.origin}/spotify2tidal/`
const AUTH_ENDPOINT = 'https://login.tidal.com/authorize'
const TOKEN_ENDPOINT = 'https://auth.tidal.com/v1/oauth2/token'

// Required scopes for our application
const SCOPES = [
  'r_usr', // Read user information
  'w_usr', // Write user information (for future playlist creation)
  'w_sub', // Manage subscriptions (for favorites/library)
].join(' ')

export class TidalAuth {
  /**
   * Initiate the PKCE OAuth flow
   * Generates PKCE codes and redirects to Tidal authorization
   */
  static async initiateAuth(): Promise<void> {
    const clientId = getTidalClientId()
    if (!clientId) {
      throw new Error('Tidal Client ID not configured')
    }

    // Generate PKCE codes
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)

    // Store verifier for later use in callback
    // Note: Using a different key than Spotify
    sessionStorage.setItem('tidal_pkce_verifier', verifier)

    // Store provider type for callback handling
    sessionStorage.setItem('oauth_provider', 'tidal')

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })

    // Redirect to Tidal authorization
    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   *
   * @param code - Authorization code from Tidal
   * @returns Access and refresh tokens
   */
  static async handleCallback(code: string): Promise<AuthTokens> {
    const clientId = getTidalClientId()
    if (!clientId) {
      throw new Error('Tidal Client ID not configured')
    }

    // Retrieve stored PKCE verifier
    const verifier = sessionStorage.getItem('tidal_pkce_verifier')
    if (!verifier) {
      throw new Error('PKCE verifier not found. Please restart authentication.')
    }

    try {
      // Exchange code for tokens
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: clientId,
          code_verifier: verifier,
          scope: SCOPES,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.error_description || error.error || 'Token exchange failed'
        )
      }

      const data = await response.json()

      // Calculate expiration time
      const expiresAt = Date.now() + data.expires_in * 1000

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        scope: data.scope,
      }

      // Store tokens
      TokenStore.saveTidalTokens(tokens)

      // Clear PKCE verifier
      sessionStorage.removeItem('tidal_pkce_verifier')

      return tokens
    } catch (error) {
      // Clear verifier on error
      sessionStorage.removeItem('tidal_pkce_verifier')
      throw error
    }
  }

  /**
   * Refresh an expired access token
   *
   * @param refreshToken - The refresh token
   * @returns New access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const clientId = getTidalClientId()
    if (!clientId) {
      throw new Error('Tidal Client ID not configured')
    }

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.error_description || error.error || 'Token refresh failed'
        )
      }

      const data = await response.json()

      // Calculate expiration time
      const expiresAt = Date.now() + data.expires_in * 1000

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Use new token if provided
        expiresAt,
        scope: data.scope,
      }

      // Store updated tokens
      TokenStore.saveTidalTokens(tokens)

      return tokens
    } catch (error) {
      // Clear invalid tokens
      TokenStore.clearTidalTokens()
      throw error
    }
  }

  /**
   * Get a valid access token (refreshes if expired)
   *
   * @returns Valid access token
   */
  static async getValidAccessToken(): Promise<string> {
    const tokens = TokenStore.getTidalTokens()

    if (!tokens) {
      throw new Error('Not authenticated with Tidal')
    }

    // Check if token is still valid
    if (TokenStore.isTidalTokenValid()) {
      return tokens.accessToken
    }

    // Token is expired, refresh it
    if (!tokens.refreshToken) {
      throw new Error('No refresh token available. Please re-authenticate.')
    }

    const newTokens = await this.refreshToken(tokens.refreshToken)
    return newTokens.accessToken
  }

  /**
   * Logout (clear all tokens)
   */
  static logout(): void {
    TokenStore.clearTidalTokens()
    sessionStorage.removeItem('tidal_pkce_verifier')
  }
}
