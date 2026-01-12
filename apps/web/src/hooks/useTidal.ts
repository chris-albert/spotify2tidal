import { useCallback, useState } from 'react'
import { TidalClient } from '@/lib/services/tidal/TidalClient'
import type { TidalTrack, TidalAlbum, TidalArtist } from '@spotify2tidal/types'

/**
 * useTidal - Custom hook for Tidal operations
 *
 * Provides methods to interact with Tidal API for searching and matching tracks.
 */
export function useTidal() {
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Search for tracks on Tidal
   */
  const searchTracks = useCallback(
    async (query: string, limit?: number): Promise<TidalTrack[]> => {
      try {
        setIsSearching(true)
        setError(null)

        const tracks = await TidalClient.searchTracks(query, limit)
        return tracks
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed'
        setError(message)
        return []
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  /**
   * Get track by ISRC code
   * Critical for accurate matching!
   */
  const getTrackByISRC = useCallback(
    async (isrc: string): Promise<TidalTrack | null> => {
      try {
        setIsSearching(true)
        setError(null)

        const track = await TidalClient.getTrackByISRC(isrc)
        return track
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'ISRC lookup failed'
        setError(message)
        return null
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  /**
   * Get multiple tracks by ISRC codes (batch lookup)
   */
  const getTracksByISRCs = useCallback(
    async (isrcs: string[]): Promise<Map<string, TidalTrack | null>> => {
      try {
        setIsSearching(true)
        setError(null)

        const tracks = await TidalClient.getTracksByISRCs(isrcs)
        return tracks
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Batch ISRC lookup failed'
        setError(message)
        return new Map()
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  /**
   * Search for albums on Tidal
   */
  const searchAlbums = useCallback(
    async (query: string, limit?: number): Promise<TidalAlbum[]> => {
      try {
        setIsSearching(true)
        setError(null)

        const albums = await TidalClient.searchAlbums(query, limit)
        return albums
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed'
        setError(message)
        return []
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  /**
   * Search for artists on Tidal
   */
  const searchArtists = useCallback(
    async (query: string, limit?: number): Promise<TidalArtist[]> => {
      try {
        setIsSearching(true)
        setError(null)

        const artists = await TidalClient.searchArtists(query, limit)
        return artists
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed'
        setError(message)
        return []
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    isSearching,
    error,

    // Actions
    searchTracks,
    getTrackByISRC,
    getTracksByISRCs,
    searchAlbums,
    searchArtists,
    clearError,
  }
}
