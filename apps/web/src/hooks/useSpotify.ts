import { useCallback } from 'react'
import { useExtractionStore } from '@/store/extractionStore'
import type { SpotifyLibrary } from '@spotify2tidal/types'

/**
 * useSpotify - Custom hook for Spotify operations
 *
 * Provides methods to interact with Spotify API and manage extraction state.
 * This hook will be expanded with actual API calls in Phase 3.
 */
export function useSpotify() {
  const {
    library,
    progress,
    isExtracting,
    extractionComplete,
    error,
    startExtraction,
    setProgress,
    setLibrary,
    completeExtraction,
    setError,
    clearError,
    reset,
  } = useExtractionStore()

  /**
   * Start extracting Spotify library
   * (Will be implemented with actual API calls in Phase 3)
   */
  const extractLibrary = useCallback(async () => {
    try {
      startExtraction()

      // TODO: Implement actual extraction in Phase 3
      // This is a placeholder that will be replaced with:
      // 1. Fetch all playlists
      // 2. Fetch all saved tracks
      // 3. Fetch all saved albums
      // 4. Fetch all followed artists

      // For now, just complete immediately
      completeExtraction()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed'
      setError(message)
    }
  }, [startExtraction, completeExtraction, setError])

  /**
   * Get extraction statistics
   */
  const getStats = useCallback(() => {
    if (!library) {
      return {
        totalPlaylists: 0,
        totalTracks: 0,
        totalAlbums: 0,
        totalArtists: 0,
      }
    }

    // Calculate unique tracks across all playlists
    const playlistTracks = library.playlists.flatMap((p) =>
      p.tracks.items.map((item) => item.track.id)
    )
    const uniquePlaylistTracks = new Set(playlistTracks).size

    return {
      totalPlaylists: library.playlists.length,
      totalTracks: library.savedTracks.length + uniquePlaylistTracks,
      totalAlbums: library.savedAlbums.length,
      totalArtists: library.followedArtists.length,
    }
  }, [library])

  /**
   * Check if library has been extracted
   */
  const hasLibrary = library !== null

  return {
    // State
    library,
    progress,
    isExtracting,
    extractionComplete,
    hasLibrary,
    error,

    // Actions
    extractLibrary,
    setLibrary,
    getStats,
    clearError,
    reset,
  }
}
