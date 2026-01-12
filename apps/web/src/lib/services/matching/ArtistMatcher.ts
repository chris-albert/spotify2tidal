import type { SpotifyArtist, TidalArtist } from '@spotify2tidal/types'
import type { ArtistMatchResult, MatchMethod, MatchStatus } from '@spotify2tidal/types'
import { TidalClient } from '../tidal/TidalClient'
import { stringSimilarity, normalizeString } from '@/lib/utils/stringUtils'

/**
 * ArtistMatcher - Artist matching engine
 *
 * Matches Spotify artists to Tidal artists using:
 * 1. Exact name matching (normalized strings)
 * 2. Fuzzy name matching (Levenshtein distance)
 */

// Confidence thresholds
const CONFIDENCE_THRESHOLD_HIGH = 0.95
const CONFIDENCE_THRESHOLD_MEDIUM = 0.85
const CONFIDENCE_THRESHOLD_LOW = 0.70

export class ArtistMatcher {
  /**
   * Match a single Spotify artist to Tidal
   *
   * @param spotifyArtist - The Spotify artist to match
   * @returns Match result with confidence score
   */
  static async matchArtist(
    spotifyArtist: SpotifyArtist
  ): Promise<ArtistMatchResult> {
    // Step 1: Try exact name matching
    const exactMatch = await this.matchByExactName(spotifyArtist)
    if (exactMatch) {
      return exactMatch
    }

    // Step 2: Try fuzzy matching
    const fuzzyMatch = await this.matchByFuzzyName(spotifyArtist)
    if (fuzzyMatch && fuzzyMatch.confidence >= CONFIDENCE_THRESHOLD_LOW) {
      return fuzzyMatch
    }

    // No match found
    return {
      spotifyArtist,
      tidalArtist: null,
      status: 'unmatched',
      method: 'unmatched',
      confidence: 0,
    }
  }

  /**
   * Match multiple artists in batch
   *
   * @param spotifyArtists - Array of Spotify artists
   * @param onProgress - Progress callback (current, total)
   * @returns Array of match results
   */
  static async matchArtists(
    spotifyArtists: SpotifyArtist[],
    onProgress?: (current: number, total: number) => void
  ): Promise<ArtistMatchResult[]> {
    const results: ArtistMatchResult[] = []

    for (let i = 0; i < spotifyArtists.length; i++) {
      const artist = spotifyArtists[i]
      onProgress?.(i + 1, spotifyArtists.length)

      const match = await this.matchArtist(artist)
      results.push(match)
    }

    return results
  }

  /**
   * Match by exact name
   */
  private static async matchByExactName(
    spotifyArtist: SpotifyArtist
  ): Promise<ArtistMatchResult | null> {
    try {
      console.log(`🔍 Exact artist match: ${spotifyArtist.name}`)

      // Search Tidal for the artist
      const searchResults = await TidalClient.searchArtists(
        spotifyArtist.name,
        10
      )

      if (searchResults.length === 0) return null

      // Normalize the Spotify artist name
      const normalizedSpotifyName = normalizeString(spotifyArtist.name)

      // Find exact match
      for (const tidalArtist of searchResults) {
        const normalizedTidalName = normalizeString(tidalArtist.name)

        if (normalizedSpotifyName === normalizedTidalName) {
          console.log(`✅ Exact artist match found: ${tidalArtist.name}`)
          return {
            spotifyArtist,
            tidalArtist,
            status: 'matched',
            method: 'exact',
            confidence: 1.0,
          }
        }
      }

      console.log(`❌ No exact artist match found for: ${spotifyArtist.name}`)
      return null
    } catch (error) {
      console.error('Exact artist matching failed:', error)
      return null
    }
  }

  /**
   * Match by fuzzy name
   */
  private static async matchByFuzzyName(
    spotifyArtist: SpotifyArtist
  ): Promise<ArtistMatchResult | null> {
    try {
      console.log(`🔍 Fuzzy artist match: ${spotifyArtist.name}`)

      // Search Tidal for the artist
      const searchResults = await TidalClient.searchArtists(
        spotifyArtist.name,
        20
      )

      if (searchResults.length === 0) return null

      // Calculate confidence scores for all results
      const scoredResults = searchResults.map((tidalArtist) => ({
        artist: tidalArtist,
        confidence: stringSimilarity(spotifyArtist.name, tidalArtist.name),
      }))

      // Sort by confidence (highest first)
      scoredResults.sort((a, b) => b.confidence - a.confidence)

      const bestMatch = scoredResults[0]

      if (bestMatch.confidence >= CONFIDENCE_THRESHOLD_LOW) {
        console.log(
          `✅ Fuzzy artist match found: ${bestMatch.artist.name} (confidence: ${bestMatch.confidence.toFixed(2)})`
        )
        return {
          spotifyArtist,
          tidalArtist: bestMatch.artist,
          status: 'matched',
          method: 'fuzzy',
          confidence: bestMatch.confidence,
        }
      }

      console.log(
        `❌ No confident fuzzy artist match for: ${spotifyArtist.name} (best: ${bestMatch.confidence.toFixed(2)})`
      )
      return null
    } catch (error) {
      console.error('Fuzzy artist matching failed:', error)
      return null
    }
  }

  /**
   * Get match statistics from results
   */
  static getStatistics(results: ArtistMatchResult[]): {
    total: number
    byExact: number
    byFuzzy: number
    unmatched: number
    highConfidence: number
    mediumConfidence: number
    lowConfidence: number
  } {
    return {
      total: results.length,
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
