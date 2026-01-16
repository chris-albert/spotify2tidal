import { SpotifyAuth } from './SpotifyAuth'
import { spotifyRateLimiter } from '@/lib/utils/rateLimiter'
import type {
  SpotifyPlaylist,
  SpotifyTrack,
  SpotifyAlbum,
  SpotifyArtist,
  SpotifyLibrary,
  SpotifyPlaylistTrack,
} from '@spotify2tidal/types'
import type { SpotifyPaginatedResponse, SpotifyUser } from './types'

/**
 * SpotifyClient - Wrapper for Spotify Web API
 *
 * Provides methods to fetch user library data with automatic pagination,
 * rate limiting, and token refresh.
 */

const API_BASE = 'https://api.spotify.com/v1'

export class SpotifyClient {
  /**
   * Make an authenticated API request
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return spotifyRateLimiter.execute(async () => {
      // Get valid access token (auto-refreshes if needed)
      const accessToken = await SpotifyAuth.getValidAccessToken()

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.error?.message || `API request failed: ${response.status}`
        )
      }

      return response.json()
    })
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<SpotifyUser> {
    return this.request<SpotifyUser>('/me')
  }

  /**
   * Get all items from a paginated endpoint
   */
  private static async getAllPaginated<T>(
    endpoint: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<T[]> {
    const items: T[] = []
    let nextUrl: string | null = endpoint
    let offset = 0
    const limit = 50 // Maximum allowed by Spotify

    while (nextUrl) {
      const url: string = nextUrl.startsWith('http')
        ? nextUrl.replace(API_BASE, '')
        : `${nextUrl}${nextUrl.includes('?') ? '&' : '?'}limit=${limit}&offset=${offset}`

      const response: SpotifyPaginatedResponse<T> = await this.request<SpotifyPaginatedResponse<T>>(url)

      items.push(...response.items)

      // Call progress callback
      if (onProgress) {
        onProgress(items.length, response.total)
      }

      // Check if there's more data
      nextUrl = response.next
      offset += limit
    }

    return items
  }

  /**
   * Get all user playlists
   */
  static async getAllPlaylists(
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyPlaylist[]> {
    return this.getAllPaginated<SpotifyPlaylist>('/me/playlists', onProgress)
  }

  /**
   * Get all tracks from a playlist
   */
  static async getPlaylistTracks(
    playlistId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyPlaylistTrack[]> {
    return this.getAllPaginated<SpotifyPlaylistTrack>(
      `/playlists/${playlistId}/tracks`,
      onProgress
    )
  }

  /**
   * Get full playlist with all tracks
   */
  static async getFullPlaylist(
    playlistId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyPlaylist> {
    const playlist = await this.request<SpotifyPlaylist>(
      `/playlists/${playlistId}`
    )

    const tracks = await this.getPlaylistTracks(playlistId, onProgress)

    return {
      ...playlist,
      tracks: {
        total: tracks.length,
        items: tracks,
      },
    }
  }

  /**
   * Get all saved tracks (Liked Songs)
   */
  static async getSavedTracks(
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyTrack[]> {
    const items = await this.getAllPaginated<{ track: SpotifyTrack }>(
      '/me/tracks',
      onProgress
    )
    return items.map((item) => item.track)
  }

  /**
   * Get all saved albums
   */
  static async getSavedAlbums(
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyAlbum[]> {
    const items = await this.getAllPaginated<{ album: SpotifyAlbum }>(
      '/me/albums',
      onProgress
    )
    return items.map((item) => item.album)
  }

  /**
   * Get all followed artists
   */
  static async getFollowedArtists(
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyArtist[]> {
    const items: SpotifyArtist[] = []
    let after: string | undefined

    while (true) {
      const url = after
        ? `/me/following?type=artist&limit=50&after=${after}`
        : '/me/following?type=artist&limit=50'

      const response = await this.request<{
        artists: SpotifyPaginatedResponse<SpotifyArtist>
      }>(url)

      items.push(...response.artists.items)

      if (onProgress) {
        onProgress(items.length, response.artists.total)
      }

      // Check if there's more data
      if (!response.artists.next) break

      // Extract 'after' cursor from next URL
      const nextUrl = new URL(response.artists.next)
      after = nextUrl.searchParams.get('after') || undefined
      if (!after) break
    }

    return items
  }

  /**
   * Extract complete user library
   */
  static async extractLibrary(
    onStageChange?: (
      stage: 'playlists' | 'albums' | 'artists' | 'complete'
    ) => void,
    onProgress?: (stage: string, current: number, total: number) => void
  ): Promise<SpotifyLibrary> {
    // Stage 1: Playlists
    onStageChange?.('playlists')
    const playlists = await this.getAllPlaylists((current, total) =>
      onProgress?.('playlists', current, total)
    )

    // Fetch all tracks for each playlist
    const playlistsWithTracks = await Promise.all(
      playlists.map(async (playlist, index) => {
        const tracks = await this.getPlaylistTracks(
          playlist.id,
          (current, total) =>
            onProgress?.(
              `playlist-${index + 1}/${playlists.length}`,
              current,
              total
            )
        )

        return {
          ...playlist,
          tracks: {
            total: tracks.length,
            items: tracks,
          },
        }
      })
    )

    // Stage 2: Saved albums
    onStageChange?.('albums')
    const savedAlbums = await this.getSavedAlbums((current, total) =>
      onProgress?.('albums', current, total)
    )

    // Stage 3: Followed artists
    onStageChange?.('artists')
    const followedArtists = await this.getFollowedArtists((current, total) =>
      onProgress?.('artists', current, total)
    )

    // Note: We don't fetch saved tracks separately since they're included in playlists
    // But if needed, we can add:
    // const savedTracks = await this.getSavedTracks(...)

    onStageChange?.('complete')

    return {
      playlists: playlistsWithTracks,
      savedTracks: [], // Can be populated if needed
      savedAlbums,
      followedArtists,
    }
  }

  /**
   * Extract only followed artists (simplified extraction)
   */
  static async extractArtistsOnly(
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyArtist[]> {
    return this.getFollowedArtists(onProgress)
  }
}
