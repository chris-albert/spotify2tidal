import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope: string
}

export interface AuthState {
  // Spotify auth
  spotifyTokens: AuthTokens | null
  spotifyConnected: boolean
  spotifyUserId: string | null

  // Tidal auth
  tidalTokens: AuthTokens | null
  tidalConnected: boolean
  tidalUserId: string | null

  // Actions
  setSpotifyTokens: (tokens: AuthTokens) => void
  setSpotifyUserId: (userId: string) => void
  clearSpotifyAuth: () => void

  setTidalTokens: (tokens: AuthTokens) => void
  setTidalUserId: (userId: string) => void
  clearTidalAuth: () => void

  isSpotifyTokenValid: () => boolean
  isTidalTokenValid: () => boolean
  clearAllAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      spotifyTokens: null,
      spotifyConnected: false,
      spotifyUserId: null,

      tidalTokens: null,
      tidalConnected: false,
      tidalUserId: null,

      // Spotify actions
      setSpotifyTokens: (tokens) =>
        set({
          spotifyTokens: tokens,
          spotifyConnected: true,
        }),

      setSpotifyUserId: (userId) =>
        set({ spotifyUserId: userId }),

      clearSpotifyAuth: () =>
        set({
          spotifyTokens: null,
          spotifyConnected: false,
          spotifyUserId: null,
        }),

      // Tidal actions
      setTidalTokens: (tokens) =>
        set({
          tidalTokens: tokens,
          tidalConnected: true,
        }),

      setTidalUserId: (userId) =>
        set({ tidalUserId: userId }),

      clearTidalAuth: () =>
        set({
          tidalTokens: null,
          tidalConnected: false,
          tidalUserId: null,
        }),

      // Token validation
      isSpotifyTokenValid: () => {
        const { spotifyTokens } = get()
        if (!spotifyTokens) return false
        return Date.now() < spotifyTokens.expiresAt
      },

      isTidalTokenValid: () => {
        const { tidalTokens } = get()
        if (!tidalTokens) return false
        return Date.now() < tidalTokens.expiresAt
      },

      clearAllAuth: () =>
        set({
          spotifyTokens: null,
          spotifyConnected: false,
          spotifyUserId: null,
          tidalTokens: null,
          tidalConnected: false,
          tidalUserId: null,
        }),
    }),
    {
      name: 'spotify2tidal-auth',
      // Only persist tokens and connection status
      partialize: (state) => ({
        spotifyTokens: state.spotifyTokens,
        spotifyConnected: state.spotifyConnected,
        spotifyUserId: state.spotifyUserId,
        tidalTokens: state.tidalTokens,
        tidalConnected: state.tidalConnected,
        tidalUserId: state.tidalUserId,
      }),
    }
  )
)
