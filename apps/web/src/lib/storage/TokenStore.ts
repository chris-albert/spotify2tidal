import type { AuthTokens } from '@/store/authStore'

/**
 * TokenStore - Secure token management using localStorage
 *
 * Handles storage, retrieval, and validation of OAuth tokens for both Spotify and Tidal.
 * Tokens are stored with expiration times and can be automatically validated.
 */

const SPOTIFY_TOKEN_KEY = 'spotify2tidal_spotify_tokens'
const TIDAL_TOKEN_KEY = 'spotify2tidal_tidal_tokens'
const PKCE_VERIFIER_KEY = 'spotify2tidal_pkce_verifier'

export class TokenStore {
  /**
   * Save Spotify tokens to localStorage
   */
  static saveSpotifyTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(tokens))
    } catch (error) {
      console.error('Failed to save Spotify tokens:', error)
      throw new Error('Failed to save authentication tokens')
    }
  }

  /**
   * Get Spotify tokens from localStorage
   */
  static getSpotifyTokens(): AuthTokens | null {
    try {
      const tokensJson = localStorage.getItem(SPOTIFY_TOKEN_KEY)
      if (!tokensJson) return null

      const tokens = JSON.parse(tokensJson) as AuthTokens
      return tokens
    } catch (error) {
      console.error('Failed to retrieve Spotify tokens:', error)
      return null
    }
  }

  /**
   * Check if Spotify tokens are valid (not expired)
   */
  static isSpotifyTokenValid(): boolean {
    const tokens = this.getSpotifyTokens()
    if (!tokens) return false

    // Check if token is expired (with 5 minute buffer)
    const bufferMs = 5 * 60 * 1000
    return Date.now() < tokens.expiresAt - bufferMs
  }

  /**
   * Clear Spotify tokens from localStorage
   */
  static clearSpotifyTokens(): void {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY)
  }

  /**
   * Save Tidal tokens to localStorage
   */
  static saveTidalTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(TIDAL_TOKEN_KEY, JSON.stringify(tokens))
    } catch (error) {
      console.error('Failed to save Tidal tokens:', error)
      throw new Error('Failed to save authentication tokens')
    }
  }

  /**
   * Get Tidal tokens from localStorage
   */
  static getTidalTokens(): AuthTokens | null {
    try {
      const tokensJson = localStorage.getItem(TIDAL_TOKEN_KEY)
      if (!tokensJson) return null

      const tokens = JSON.parse(tokensJson) as AuthTokens
      return tokens
    } catch (error) {
      console.error('Failed to retrieve Tidal tokens:', error)
      return null
    }
  }

  /**
   * Check if Tidal tokens are valid (not expired)
   */
  static isTidalTokenValid(): boolean {
    const tokens = this.getTidalTokens()
    if (!tokens) return false

    // Check if token is expired (with 5 minute buffer)
    const bufferMs = 5 * 60 * 1000
    return Date.now() < tokens.expiresAt - bufferMs
  }

  /**
   * Clear Tidal tokens from localStorage
   */
  static clearTidalTokens(): void {
    localStorage.removeItem(TIDAL_TOKEN_KEY)
  }

  /**
   * Clear all tokens from localStorage
   */
  static clearAllTokens(): void {
    this.clearSpotifyTokens()
    this.clearTidalTokens()
    this.clearPKCEVerifier()
  }

  /**
   * Save PKCE code verifier (used during Spotify OAuth)
   */
  static savePKCEVerifier(verifier: string): void {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
  }

  /**
   * Get PKCE code verifier
   */
  static getPKCEVerifier(): string | null {
    return sessionStorage.getItem(PKCE_VERIFIER_KEY)
  }

  /**
   * Clear PKCE code verifier
   */
  static clearPKCEVerifier(): void {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY)
  }

  /**
   * Get valid access token or null if expired
   */
  static getValidSpotifyToken(): string | null {
    if (!this.isSpotifyTokenValid()) return null
    const tokens = this.getSpotifyTokens()
    return tokens?.accessToken || null
  }

  /**
   * Get valid access token or null if expired
   */
  static getValidTidalToken(): string | null {
    if (!this.isTidalTokenValid()) return null
    const tokens = this.getTidalTokens()
    return tokens?.accessToken || null
  }
}
