import { generateCodeVerifier, generateCodeChallenge } from '@/lib/utils/pkce'
import { TokenStore } from '@/lib/storage/TokenStore'
import type { AuthTokens } from '@/store/authStore'

/**
 * SpotifyAuth - Spotify OAuth 2.0 PKCE Authentication
 *
 * Implements browser-based PKCE flow for secure authentication without client secret.
 */

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = `${import.meta.env.VITE_REDIRECT_URI || window.location.origin}/spotify2tidal/auth/spotify`
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

// Required scopes for our application
const SCOPES = [
  'user-library-read', // Read saved tracks and albums
  'playlist-read-private', // Read private playlists
  'playlist-read-collaborative', // Read collaborative playlists
  'user-follow-read', // Read followed artists
].join(' ')

export class SpotifyAuth {
  /**
   * Initiate the PKCE OAuth flow
   * Generates PKCE codes and redirects to Spotify authorization
   */
  static async initiateAuth(): Promise<void> {
    if (!SPOTIFY_CLIENT_ID) {
      throw new Error('Spotify Client ID not configured')
    }

    // Generate PKCE codes
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)

    // Store verifier for later use in callback
    TokenStore.savePKCEVerifier(verifier)

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      scope: SCOPES,
      show_dialog: 'false', // Don't force approval screen every time
    })

    // Redirect to Spotify authorization
    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   *
   * @param code - Authorization code from Spotify
   * @returns Access and refresh tokens
   */
  static async handleCallback(code: string): Promise<AuthTokens> {
    if (!SPOTIFY_CLIENT_ID) {
      throw new Error('Spotify Client ID not configured')
    }

    // Retrieve stored PKCE verifier
    const verifier = TokenStore.getPKCEVerifier()
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
          client_id: SPOTIFY_CLIENT_ID,
          code_verifier: verifier,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error_description || 'Token exchange failed')
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
      TokenStore.saveSpotifyTokens(tokens)

      // Clear PKCE verifier
      TokenStore.clearPKCEVerifier()

      return tokens
    } catch (error) {
      // Clear verifier on error
      TokenStore.clearPKCEVerifier()
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
    if (!SPOTIFY_CLIENT_ID) {
      throw new Error('Spotify Client ID not configured')
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
          client_id: SPOTIFY_CLIENT_ID,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error_description || 'Token refresh failed')
      }

      const data = await response.json()

      // Calculate expiration time
      const expiresAt = Date.now() + data.expires_in * 1000

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Use new token if provided, else keep old one
        expiresAt,
        scope: data.scope,
      }

      // Store updated tokens
      TokenStore.saveSpotifyTokens(tokens)

      return tokens
    } catch (error) {
      // Clear invalid tokens
      TokenStore.clearSpotifyTokens()
      throw error
    }
  }

  /**
   * Get a valid access token (refreshes if expired)
   *
   * @returns Valid access token
   */
  static async getValidAccessToken(): Promise<string> {
    const tokens = TokenStore.getSpotifyTokens()

    if (!tokens) {
      throw new Error('Not authenticated with Spotify')
    }

    // Check if token is still valid
    if (TokenStore.isSpotifyTokenValid()) {
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
    TokenStore.clearSpotifyTokens()
    TokenStore.clearPKCEVerifier()
  }
}
