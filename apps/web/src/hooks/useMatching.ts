import { useCallback } from 'react'
import { useMatchingStore } from '@/store/matchingStore'
import { CacheStore } from '@/lib/storage/CacheStore'
import { TrackMatcher } from '@/lib/services/matching/TrackMatcher'
import { AlbumMatcher } from '@/lib/services/matching/AlbumMatcher'
import { ArtistMatcher } from '@/lib/services/matching/ArtistMatcher'
import type {
  TrackMatchResult,
  SpotifyTrack,
  SpotifyAlbum,
  SpotifyArtist,
} from '@spotify2tidal/types'

/**
 * useMatching - Custom hook for track matching operations
 *
 * Provides methods to match Spotify tracks with Tidal tracks using various strategies:
 * 1. ISRC matching (highest accuracy)
 * 2. Exact metadata matching
 * 3. Fuzzy matching with confidence scoring
 */
export function useMatching() {
  const {
    trackMatches,
    albumMatches,
    artistMatches,
    statistics,
    progress,
    isMatching,
    matchingComplete,
    error,
    startMatching,
    setProgress,
    addTrackMatch,
    addAlbumMatch,
    addArtistMatch,
    setStatistics,
    completeMatching,
    setError,
    clearError,
    updateTrackMatch,
    reset,
  } = useMatchingStore()

  /**
   * Match a single track
   */
  const matchTrack = useCallback(
    async (spotifyTrack: SpotifyTrack): Promise<TrackMatchResult | null> => {
      try {
        const result = await TrackMatcher.matchTrack(spotifyTrack)
        return result
      } catch (err) {
        console.error('Failed to match track:', err)
        return null
      }
    },
    []
  )

  /**
   * Match all tracks from library
   */
  const matchAllTracks = useCallback(
    async (tracks: SpotifyTrack[]) => {
      try {
        startMatching()

        setProgress({
          current: 0,
          total: tracks.length,
        })

        // Match tracks with progress updates
        const results = await TrackMatcher.matchTracks(tracks, (current, total, currentTrack) => {
          setProgress({
            current,
            total,
            currentTrack,
          })
        })

        // Add all results to store
        results.forEach((result) => {
          addTrackMatch(result)
        })

        // Calculate and set statistics
        const stats = TrackMatcher.getStatistics(results)
        setStatistics({
          totalTracks: stats.total,
          totalPlaylists: 0, // Will be set by playlist matching
          totalAlbums: 0,
          totalArtists: 0,
          matched: {
            byISRC: stats.byISRC,
            byExact: stats.byExact,
            byFuzzy: stats.byFuzzy,
            total: stats.byISRC + stats.byExact + stats.byFuzzy,
          },
          unmatched: stats.unmatched,
          confidence: {
            high: stats.highConfidence,
            medium: stats.mediumConfidence,
            low: stats.lowConfidence,
          },
        })

        completeMatching()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Matching failed'
        setError(message)
      }
    },
    [startMatching, setProgress, addTrackMatch, setStatistics, completeMatching, setError]
  )

  /**
   * Manually update a track match (for user corrections)
   */
  const manuallyMatchTrack = useCallback(
    async (trackId: string, match: TrackMatchResult) => {
      try {
        updateTrackMatch(trackId, match)
        await CacheStore.saveMatch(match)
      } catch (err) {
        console.error('Failed to update match:', err)
      }
    },
    [updateTrackMatch]
  )

  /**
   * Get matching statistics
   */
  const getMatchStats = useCallback(() => {
    if (!statistics) {
      return {
        totalMatches: trackMatches.length,
        matchedByISRC: 0,
        matchedByExact: 0,
        matchedByFuzzy: 0,
        unmatched: 0,
        successRate: 0,
      }
    }

    const totalMatched =
      statistics.matched.byISRC +
      statistics.matched.byExact +
      statistics.matched.byFuzzy

    return {
      totalMatches: trackMatches.length,
      matchedByISRC: statistics.matched.byISRC,
      matchedByExact: statistics.matched.byExact,
      matchedByFuzzy: statistics.matched.byFuzzy,
      unmatched: statistics.unmatched,
      successRate:
        trackMatches.length > 0
          ? (totalMatched / trackMatches.length) * 100
          : 0,
    }
  }, [trackMatches, statistics])

  /**
   * Get unmatched tracks
   */
  const getUnmatchedTracks = useCallback(() => {
    return trackMatches.filter((m) => m.status === 'unmatched')
  }, [trackMatches])

  /**
   * Get low confidence matches (for manual review)
   */
  const getLowConfidenceMatches = useCallback(
    (threshold: number = 0.9) => {
      return trackMatches.filter(
        (m) => m.status === 'matched' && m.confidence < threshold
      )
    },
    [trackMatches]
  )

  /**
   * Match all albums from library
   */
  const matchAllAlbums = useCallback(
    async (albums: SpotifyAlbum[]) => {
      try {
        const results = await AlbumMatcher.matchAlbums(albums, (current, total) => {
          console.log(`Matching albums: ${current}/${total}`)
        })

        // Add all results to store
        results.forEach((result) => {
          addAlbumMatch(result)
        })

        return results
      } catch (err) {
        console.error('Failed to match albums:', err)
        throw err
      }
    },
    [addAlbumMatch]
  )

  /**
   * Match all artists from library
   */
  const matchAllArtists = useCallback(
    async (artists: SpotifyArtist[]) => {
      try {
        const results = await ArtistMatcher.matchArtists(artists, (current, total) => {
          console.log(`Matching artists: ${current}/${total}`)
        })

        // Add all results to store
        results.forEach((result) => {
          addArtistMatch(result)
        })

        return results
      } catch (err) {
        console.error('Failed to match artists:', err)
        throw err
      }
    },
    [addArtistMatch]
  )

  /**
   * Clear cache
   */
  const clearCache = useCallback(async () => {
    try {
      await CacheStore.clearCache()
    } catch (err) {
      console.error('Failed to clear cache:', err)
    }
  }, [])

  return {
    // State
    trackMatches,
    albumMatches,
    artistMatches,
    statistics,
    progress,
    isMatching,
    matchingComplete,
    error,

    // Actions
    matchTrack,
    matchAllTracks,
    matchAllAlbums,
    matchAllArtists,
    manuallyMatchTrack,
    getMatchStats,
    getUnmatchedTracks,
    getLowConfidenceMatches,
    clearCache,
    clearError,
    reset,
  }
}
