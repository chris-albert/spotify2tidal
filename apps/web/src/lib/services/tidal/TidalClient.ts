import { TidalAuth } from './TidalAuth'
import { tidalRateLimiter } from '@/lib/utils/rateLimiter'
import type { TidalTrack, TidalAlbum, TidalArtist } from '@spotify2tidal/types'
import type {
  TidalSearchResponse,
  TidalTrackResponse,
  TidalUserProfile,
} from './types'

/**
 * TidalClient - Wrapper for Tidal API
 *
 * Provides methods to search tracks, albums, and artists.
 * Includes ISRC-based track lookup for matching.
 */

const API_BASE = 'https://openapi.tidal.com'
const API_VERSION = 'v2'

export class TidalClient {
  /**
   * Make an authenticated API request
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return tidalRateLimiter.execute(async () => {
      // Get valid access token (auto-refreshes if needed)
      const accessToken = await TidalAuth.getValidAccessToken()

      const url = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE}/${endpoint}`

      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`
        try {
          const error = await response.json()
          errorMessage = error.userMessage || error.message || errorMessage
        } catch {
          // Failed to parse error JSON
        }
        throw new Error(errorMessage)
      }

      return response.json()
    })
  }

  /**
   * Get current user profile
   * Note: Tidal's API is in transition - try multiple endpoint formats
   */
  static async getCurrentUser(): Promise<TidalUserProfile> {
    // Try the v2 user endpoint first (works with user.read scope)
    const endpoints = [
      'v2/userProfile',
      'v2/users/me',
      'v1/users/me',
    ]

    let lastError: Error | null = null

    for (const endpoint of endpoints) {
      try {
        return await this.request<TidalUserProfile>(endpoint)
      } catch (error) {
        lastError = error as Error
        // Continue to next endpoint
      }
    }

    // If all endpoints fail, return a minimal user profile
    // This allows the app to continue working even if user info isn't available
    console.warn('Could not fetch Tidal user profile, using fallback:', lastError?.message)
    return {
      userId: 'authenticated',
      username: 'Tidal User',
    }
  }

  /**
   * Search for tracks
   *
   * @param query - Search query
   * @param limit - Number of results (default: 50)
   * @returns Array of tracks
   */
  static async searchTracks(
    query: string,
    limit: number = 50
  ): Promise<TidalTrack[]> {
    const params = new URLSearchParams({
      query,
      type: 'TRACKS',
      limit: limit.toString(),
      countryCode: 'US', // TODO: Get from user profile
    })

    const response = await this.request<TidalSearchResponse>(
      `${API_VERSION}/search?${params}`
    )

    if (!response.tracks?.items) {
      return []
    }

    return response.tracks.items.map((track) => this.mapTrackResponse(track))
  }

  /**
   * Search for albums
   *
   * @param query - Search query
   * @param limit - Number of results
   * @returns Array of albums
   */
  static async searchAlbums(
    query: string,
    limit: number = 50
  ): Promise<TidalAlbum[]> {
    const params = new URLSearchParams({
      query,
      type: 'ALBUMS',
      limit: limit.toString(),
      countryCode: 'US',
    })

    const response = await this.request<TidalSearchResponse>(
      `${API_VERSION}/search?${params}`
    )

    if (!response.albums?.items) {
      return []
    }

    return response.albums.items.map((album) => ({
      id: album.id.toString(),
      title: album.title,
      artists: album.artists.map((a) => ({
        id: a.id.toString(),
        name: a.name,
        url: `https://tidal.com/artist/${a.id}`,
      })),
      releaseDate: album.releaseDate,
      numberOfTracks: album.numberOfTracks,
      url: album.url || `https://tidal.com/album/${album.id}`,
      cover: album.cover,
    }))
  }

  /**
   * Search for artists
   *
   * @param query - Search query
   * @param limit - Number of results
   * @returns Array of artists
   */
  static async searchArtists(
    query: string,
    limit: number = 50
  ): Promise<TidalArtist[]> {
    const params = new URLSearchParams({
      query,
      type: 'ARTISTS',
      limit: limit.toString(),
      countryCode: 'US',
    })

    const response = await this.request<TidalSearchResponse>(
      `${API_VERSION}/search?${params}`
    )

    if (!response.artists?.items) {
      return []
    }

    return response.artists.items.map((artist) => ({
      id: artist.id.toString(),
      name: artist.name,
      url: artist.url || `https://tidal.com/artist/${artist.id}`,
    }))
  }

  /**
   * Get track by ISRC code
   * This is the most important method for accurate matching!
   *
   * @param isrc - International Standard Recording Code
   * @returns Track if found, null otherwise
   */
  static async getTrackByISRC(isrc: string): Promise<TidalTrack | null> {
    try {
      // Tidal's ISRC search endpoint
      // Note: Endpoint format may vary, check latest Tidal API docs
      const params = new URLSearchParams({
        query: `isrc:${isrc}`,
        type: 'TRACKS',
        limit: '1',
        countryCode: 'US',
      })

      const response = await this.request<TidalSearchResponse>(
        `${API_VERSION}/search?${params}`
      )

      if (!response.tracks?.items || response.tracks.items.length === 0) {
        return null
      }

      const track = response.tracks.items[0]
      return this.mapTrackResponse(track)
    } catch (error) {
      console.error('ISRC lookup failed:', error)
      return null
    }
  }

  /**
   * Get multiple tracks by ISRC codes (batch lookup)
   *
   * @param isrcs - Array of ISRC codes
   * @returns Map of ISRC to Track (or null if not found)
   */
  static async getTracksByISRCs(
    isrcs: string[]
  ): Promise<Map<string, TidalTrack | null>> {
    const results = new Map<string, TidalTrack | null>()

    // Batch lookup with rate limiting
    for (const isrc of isrcs) {
      const track = await this.getTrackByISRC(isrc)
      results.set(isrc, track)
    }

    return results
  }

  /**
   * Map Tidal API response to our TidalTrack type
   */
  private static mapTrackResponse(track: TidalTrackResponse): TidalTrack {
    return {
      id: track.id.toString(),
      title: track.title,
      artist: {
        id: track.artist.id.toString(),
        name: track.artist.name,
        url: `https://tidal.com/artist/${track.artist.id}`,
      },
      artists: track.artists.map((a) => ({
        id: a.id.toString(),
        name: a.name,
        url: `https://tidal.com/artist/${a.id}`,
      })),
      album: {
        id: track.album.id.toString(),
        title: track.album.title,
        artists: track.artists.map((a) => ({
          id: a.id.toString(),
          name: a.name,
          url: `https://tidal.com/artist/${a.id}`,
        })),
        releaseDate: '', // Not provided in track response
        numberOfTracks: 0, // Not provided in track response
        url: `https://tidal.com/album/${track.album.id}`,
        cover: track.album.cover,
      },
      isrc: track.isrc || null,
      duration: track.duration,
      explicit: track.explicit,
      url: track.url || `https://tidal.com/track/${track.id}`,
    }
  }

  /**
   * Create a playlist (placeholder for future when API supports it)
   */
  static async createPlaylist(
    name: string,
    description: string
  ): Promise<void> {
    throw new Error(
      'Playlist creation not yet supported by Tidal API. This feature will be enabled when the API is complete.'
    )
  }

  /**
   * Add tracks to playlist (placeholder for future when API supports it)
   */
  static async addTracksToPlaylist(
    playlistId: string,
    trackIds: string[]
  ): Promise<void> {
    throw new Error(
      'Adding tracks to playlists not yet supported by Tidal API. This feature will be enabled when the API is complete.'
    )
  }
}
