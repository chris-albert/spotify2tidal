import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { TokenStore } from '@/lib/storage/TokenStore'

/**
 * useAuth - Custom hook for authentication operations
 *
 * Provides a clean API for components to interact with authentication state
 * and perform auth-related operations.
 */
export function useAuth() {
  const {
    spotifyConnected,
    spotifyUserId,
    tidalConnected,
    tidalUserId,
    setSpotifyTokens,
    setSpotifyUserId,
    clearSpotifyAuth,
    setTidalTokens,
    setTidalUserId,
    clearTidalAuth,
    isSpotifyTokenValid,
    isTidalTokenValid,
    clearAllAuth,
  } = useAuthStore()

  /**
   * Initialize auth state from localStorage on mount
   */
  const initializeAuth = useCallback(() => {
    // Load Spotify tokens
    const spotifyTokens = TokenStore.getSpotifyTokens()
    if (spotifyTokens && TokenStore.isSpotifyTokenValid()) {
      setSpotifyTokens(spotifyTokens)
    } else {
      clearSpotifyAuth()
    }

    // Load Tidal tokens
    const tidalTokens = TokenStore.getTidalTokens()
    if (tidalTokens && TokenStore.isTidalTokenValid()) {
      setTidalTokens(tidalTokens)
    } else {
      clearTidalAuth()
    }
  }, [setSpotifyTokens, setTidalTokens, clearSpotifyAuth, clearTidalAuth])

  /**
   * Disconnect Spotify account
   */
  const disconnectSpotify = useCallback(() => {
    TokenStore.clearSpotifyTokens()
    clearSpotifyAuth()
  }, [clearSpotifyAuth])

  /**
   * Disconnect Tidal account
   */
  const disconnectTidal = useCallback(() => {
    TokenStore.clearTidalTokens()
    clearTidalAuth()
  }, [clearTidalAuth])

  /**
   * Disconnect all accounts
   */
  const disconnectAll = useCallback(() => {
    TokenStore.clearAllTokens()
    clearAllAuth()
  }, [clearAllAuth])

  /**
   * Check if both services are connected
   */
  const isFullyConnected = spotifyConnected && tidalConnected

  /**
   * Get connection status summary
   */
  const connectionStatus = {
    spotify: {
      connected: spotifyConnected,
      userId: spotifyUserId,
      tokenValid: isSpotifyTokenValid(),
    },
    tidal: {
      connected: tidalConnected,
      userId: tidalUserId,
      tokenValid: isTidalTokenValid(),
    },
    fullyConnected: isFullyConnected,
  }

  return {
    // State
    spotifyConnected,
    spotifyUserId,
    tidalConnected,
    tidalUserId,
    isFullyConnected,
    connectionStatus,

    // Actions
    initializeAuth,
    setSpotifyTokens,
    setSpotifyUserId,
    disconnectSpotify,
    setTidalTokens,
    setTidalUserId,
    disconnectTidal,
    disconnectAll,
    isSpotifyTokenValid,
    isTidalTokenValid,
  }
}
