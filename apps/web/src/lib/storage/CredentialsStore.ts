const SPOTIFY_CLIENT_ID_KEY = 'spotify2tidal-spotify-client-id'
const TIDAL_CLIENT_ID_KEY = 'spotify2tidal-tidal-client-id'

/**
 * CredentialsStore - Manages OAuth client IDs in localStorage
 *
 * Allows users to enter their own client IDs instead of requiring env vars.
 */
export const CredentialsStore = {
  // Spotify
  getSpotifyClientId(): string | null {
    return localStorage.getItem(SPOTIFY_CLIENT_ID_KEY)
  },

  saveSpotifyClientId(clientId: string): void {
    localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, clientId.trim())
  },

  clearSpotifyClientId(): void {
    localStorage.removeItem(SPOTIFY_CLIENT_ID_KEY)
  },

  // Tidal
  getTidalClientId(): string | null {
    return localStorage.getItem(TIDAL_CLIENT_ID_KEY)
  },

  saveTidalClientId(clientId: string): void {
    localStorage.setItem(TIDAL_CLIENT_ID_KEY, clientId.trim())
  },

  clearTidalClientId(): void {
    localStorage.removeItem(TIDAL_CLIENT_ID_KEY)
  },
}
