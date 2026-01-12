import type { SpotifyTrack, TidalTrack } from '@spotify2tidal/types'
import type { TrackMatchResult, MatchMethod, MatchStatus } from '@spotify2tidal/types'
import { TidalClient } from '../tidal/TidalClient'
import { CacheStore } from '@/lib/storage/CacheStore'
import {
  stringSimilarity,
  isDurationSimilar,
  cleanTrackTitle,
  normalizeString,
} from '@/lib/utils/stringUtils'

/**
 * TrackMatcher - Multi-strategy track matching engine
 *
 * Implements a waterfall matching approach:
 * 1. ISRC Match (99.9% accuracy)
 * 2. Exact Metadata Match (normalized strings + duration)
 * 3. Fuzzy Metadata Match (Levenshtein distance)
 * 4. Return suggestions if no match found
 */

// Confidence thresholds
const CONFIDENCE_THRESHOLD_HIGH = 0.95
const CONFIDENCE_THRESHOLD_MEDIUM = 0.85
const CONFIDENCE_THRESHOLD_LOW = 0.70

// Fuzzy matching weights
const WEIGHT_TITLE = 0.5
const WEIGHT_ARTIST = 0.3
const WEIGHT_DURATION = 0.1
const WEIGHT_ALBUM = 0.1

export class TrackMatcher {
  /**
   * Match a single Spotify track to Tidal
   *
   * @param spotifyTrack - The Spotify track to match
   * @param includeSuggestions - Whether to include alternative suggestions
   * @returns Match result with confidence score
   */
  static async matchTrack(
    spotifyTrack: SpotifyTrack,
    includeSuggestions: boolean = true
  ): Promise<TrackMatchResult> {
    // Step 0: Check cache first
    const cachedMatch = await this.checkCache(spotifyTrack)
    if (cachedMatch) {
      console.log(`✅ Cache hit for: ${spotifyTrack.name}`)
      return cachedMatch
    }

    // Step 1: Try ISRC matching (highest accuracy)
    if (spotifyTrack.isrc) {
      const isrcMatch = await this.matchByISRC(spotifyTrack)
      if (isrcMatch) {
        await CacheStore.saveMatch(isrcMatch)
        return isrcMatch
      }
    }

    // Step 2: Try exact metadata matching
    const exactMatch = await this.matchByExactMetadata(spotifyTrack)
    if (exactMatch) {
      await CacheStore.saveMatch(exactMatch)
      return exactMatch
    }

    // Step 3: Try fuzzy matching
    const fuzzyMatch = await this.matchByFuzzyMetadata(spotifyTrack)
    if (fuzzyMatch && fuzzyMatch.confidence >= CONFIDENCE_THRESHOLD_LOW) {
      await CacheStore.saveMatch(fuzzyMatch)
      return fuzzyMatch
    }

    // Step 4: No match found - get suggestions if requested
    let suggestions: TidalTrack[] = []
    if (includeSuggestions) {
      suggestions = await this.getSuggestions(spotifyTrack)
    }

    const unmatchedResult: TrackMatchResult = {
      spotifyTrack,
      tidalTrack: null,
      status: 'unmatched',
      method: 'unmatched',
      confidence: 0,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    }

    // Cache the unmatched result to avoid re-searching
    await CacheStore.saveMatch(unmatchedResult)

    return unmatchedResult
  }

  /**
   * Match multiple tracks in batch
   *
   * @param spotifyTracks - Array of Spotify tracks
   * @param onProgress - Progress callback (current, total, currentTrack)
   * @returns Array of match results
   */
  static async matchTracks(
    spotifyTracks: SpotifyTrack[],
    onProgress?: (current: number, total: number, currentTrack?: string) => void
  ): Promise<TrackMatchResult[]> {
    const results: TrackMatchResult[] = []

    for (let i = 0; i < spotifyTracks.length; i++) {
      const track = spotifyTracks[i]
      onProgress?.(i + 1, spotifyTracks.length, track.name)

      const match = await this.matchTrack(track)
      results.push(match)
    }

    return results
  }

  /**
   * Check cache for existing match
   */
  private static async checkCache(
    spotifyTrack: SpotifyTrack
  ): Promise<TrackMatchResult | null> {
    try {
      // Try by track ID first
      const cached = await CacheStore.getMatchByTrackId(spotifyTrack.id)
      if (cached) {
        return {
          spotifyTrack,
          tidalTrack: cached.tidalTrack,
          status: cached.tidalTrack ? 'matched' : 'unmatched',
          method: cached.matchMethod as MatchMethod,
          confidence: cached.confidence,
        }
      }

      // Try by ISRC if available
      if (spotifyTrack.isrc) {
        const cachedByISRC = await CacheStore.getMatchByISRC(spotifyTrack.isrc)
        if (cachedByISRC) {
          return {
            spotifyTrack,
            tidalTrack: cachedByISRC.tidalTrack,
            status: cachedByISRC.tidalTrack ? 'matched' : 'unmatched',
            method: cachedByISRC.matchMethod as MatchMethod,
            confidence: cachedByISRC.confidence,
          }
        }
      }

      return null
    } catch (error) {
      console.error('Cache lookup failed:', error)
      return null
    }
  }

  /**
   * Match by ISRC code (highest accuracy - 99.9%)
   */
  private static async matchByISRC(
    spotifyTrack: SpotifyTrack
  ): Promise<TrackMatchResult | null> {
    if (!spotifyTrack.isrc) return null

    try {
      console.log(`🔍 ISRC lookup: ${spotifyTrack.name} (${spotifyTrack.isrc})`)

      const tidalTrack = await TidalClient.getTrackByISRC(spotifyTrack.isrc)

      if (tidalTrack) {
        console.log(`✅ ISRC match found: ${tidalTrack.title}`)
        return {
          spotifyTrack,
          tidalTrack,
          status: 'matched',
          method: 'isrc',
          confidence: 1.0, // ISRC match is always 100% confidence
        }
      }

      console.log(`❌ No ISRC match found for: ${spotifyTrack.name}`)
      return null
    } catch (error) {
      console.error('ISRC matching failed:', error)
      return null
    }
  }

  /**
   * Match by exact metadata (normalized strings + duration)
   */
  private static async matchByExactMetadata(
    spotifyTrack: SpotifyTrack
  ): Promise<TrackMatchResult | null> {
    try {
      console.log(`🔍 Exact match: ${spotifyTrack.name}`)

      // Search Tidal for the track
      const query = `${spotifyTrack.name} ${spotifyTrack.artists[0].name}`
      const searchResults = await TidalClient.searchTracks(query, 10)

      if (searchResults.length === 0) return null

      // Find exact match
      for (const tidalTrack of searchResults) {
        if (this.isExactMatch(spotifyTrack, tidalTrack)) {
          console.log(`✅ Exact match found: ${tidalTrack.title}`)
          return {
            spotifyTrack,
            tidalTrack,
            status: 'matched',
            method: 'exact',
            confidence: 0.99, // Very high confidence for exact matches
          }
        }
      }

      console.log(`❌ No exact match found for: ${spotifyTrack.name}`)
      return null
    } catch (error) {
      console.error('Exact matching failed:', error)
      return null
    }
  }

  /**
   * Match by fuzzy metadata (Levenshtein distance)
   */
  private static async matchByFuzzyMetadata(
    spotifyTrack: SpotifyTrack
  ): Promise<TrackMatchResult | null> {
    try {
      console.log(`🔍 Fuzzy match: ${spotifyTrack.name}`)

      // Search Tidal for the track
      const query = `${spotifyTrack.name} ${spotifyTrack.artists[0].name}`
      const searchResults = await TidalClient.searchTracks(query, 20)

      if (searchResults.length === 0) return null

      // Calculate confidence scores for all results
      const scoredResults = searchResults.map((tidalTrack) => ({
        track: tidalTrack,
        confidence: this.calculateConfidence(spotifyTrack, tidalTrack),
      }))

      // Sort by confidence (highest first)
      scoredResults.sort((a, b) => b.confidence - a.confidence)

      const bestMatch = scoredResults[0]

      if (bestMatch.confidence >= CONFIDENCE_THRESHOLD_LOW) {
        console.log(
          `✅ Fuzzy match found: ${bestMatch.track.title} (confidence: ${bestMatch.confidence.toFixed(2)})`
        )
        return {
          spotifyTrack,
          tidalTrack: bestMatch.track,
          status: 'matched',
          method: 'fuzzy',
          confidence: bestMatch.confidence,
        }
      }

      console.log(
        `❌ No confident fuzzy match for: ${spotifyTrack.name} (best: ${bestMatch.confidence.toFixed(2)})`
      )
      return null
    } catch (error) {
      console.error('Fuzzy matching failed:', error)
      return null
    }
  }

  /**
   * Get alternative suggestions for unmatched tracks
   */
  private static async getSuggestions(
    spotifyTrack: SpotifyTrack
  ): Promise<TidalTrack[]> {
    try {
      const query = `${spotifyTrack.name} ${spotifyTrack.artists[0].name}`
      const searchResults = await TidalClient.searchTracks(query, 5)

      return searchResults
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      return []
    }
  }

  /**
   * Check if two tracks are an exact match
   */
  private static isExactMatch(
    spotifyTrack: SpotifyTrack,
    tidalTrack: TidalTrack
  ): boolean {
    // Clean and normalize titles
    const spotifyTitle = normalizeString(cleanTrackTitle(spotifyTrack.name))
    const tidalTitle = normalizeString(cleanTrackTitle(tidalTrack.title))

    // Check title match
    if (spotifyTitle !== tidalTitle) return false

    // Check primary artist match
    const spotifyArtist = normalizeString(spotifyTrack.artists[0].name)
    const tidalArtist = normalizeString(tidalTrack.artist.name)

    if (spotifyArtist !== tidalArtist) {
      // Also check against all artists in case primary artist is different
      const tidalArtistNames = tidalTrack.artists.map((a) =>
        normalizeString(a.name)
      )
      if (!tidalArtistNames.includes(spotifyArtist)) {
        return false
      }
    }

    // Check duration (within 2 seconds)
    if (!isDurationSimilar(spotifyTrack.duration_ms, tidalTrack.duration)) {
      return false
    }

    return true
  }

  /**
   * Calculate confidence score for fuzzy matching
   *
   * @param spotifyTrack - Spotify track
   * @param tidalTrack - Tidal track
   * @returns Confidence score (0-1)
   */
  private static calculateConfidence(
    spotifyTrack: SpotifyTrack,
    tidalTrack: TidalTrack
  ): number {
    // Title similarity (50% weight)
    const titleScore = stringSimilarity(
      cleanTrackTitle(spotifyTrack.name),
      cleanTrackTitle(tidalTrack.title)
    )

    // Artist similarity (30% weight)
    const spotifyArtist = spotifyTrack.artists[0].name
    const tidalArtist = tidalTrack.artist.name
    const artistScore = stringSimilarity(spotifyArtist, tidalArtist)

    // Duration similarity (10% weight)
    const durationDiff = Math.abs(
      spotifyTrack.duration_ms - tidalTrack.duration
    )
    const durationScore = isDurationSimilar(
      spotifyTrack.duration_ms,
      tidalTrack.duration,
      5 // 5 second tolerance for fuzzy matching
    )
      ? 1.0
      : Math.max(0, 1 - durationDiff / 30000) // Gradual decrease up to 30 sec diff

    // Album similarity (10% weight)
    const albumScore = spotifyTrack.album && tidalTrack.album
      ? stringSimilarity(spotifyTrack.album.name, tidalTrack.album.title)
      : 0.5 // Neutral if album not available

    // Weighted average
    const confidence =
      titleScore * WEIGHT_TITLE +
      artistScore * WEIGHT_ARTIST +
      durationScore * WEIGHT_DURATION +
      albumScore * WEIGHT_ALBUM

    return confidence
  }

  /**
   * Get match statistics from results
   */
  static getStatistics(results: TrackMatchResult[]): {
    total: number
    byISRC: number
    byExact: number
    byFuzzy: number
    unmatched: number
    highConfidence: number
    mediumConfidence: number
    lowConfidence: number
  } {
    return {
      total: results.length,
      byISRC: results.filter((r) => r.method === 'isrc').length,
      byExact: results.filter((r) => r.method === 'exact').length,
      byFuzzy: results.filter((r) => r.method === 'fuzzy').length,
      unmatched: results.filter((r) => r.status === 'unmatched').length,
      highConfidence: results.filter(
        (r) => r.confidence >= CONFIDENCE_THRESHOLD_HIGH
      ).length,
      mediumConfidence: results.filter(
        (r) =>
          r.confidence >= CONFIDENCE_THRESHOLD_MEDIUM &&
          r.confidence < CONFIDENCE_THRESHOLD_HIGH
      ).length,
      lowConfidence: results.filter(
        (r) =>
          r.confidence >= CONFIDENCE_THRESHOLD_LOW &&
          r.confidence < CONFIDENCE_THRESHOLD_MEDIUM
      ).length,
    }
  }
}
