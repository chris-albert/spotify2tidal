import type { SpotifyAlbum, TidalAlbum } from '@spotify2tidal/types'
import type { AlbumMatchResult, MatchMethod, MatchStatus } from '@spotify2tidal/types'
import { TidalClient } from '../tidal/TidalClient'
import { stringSimilarity, normalizeString } from '@/lib/utils/stringUtils'

/**
 * AlbumMatcher - Album matching engine
 *
 * Matches Spotify albums to Tidal albums using:
 * 1. Exact metadata matching (album name + artist + release year)
 * 2. Fuzzy metadata matching (Levenshtein distance)
 */

// Confidence thresholds
const CONFIDENCE_THRESHOLD_HIGH = 0.95
const CONFIDENCE_THRESHOLD_MEDIUM = 0.85
const CONFIDENCE_THRESHOLD_LOW = 0.70

// Fuzzy matching weights
const WEIGHT_TITLE = 0.6
const WEIGHT_ARTIST = 0.3
const WEIGHT_RELEASE_YEAR = 0.1

export class AlbumMatcher {
  /**
   * Match a single Spotify album to Tidal
   *
   * @param spotifyAlbum - The Spotify album to match
   * @returns Match result with confidence score
   */
  static async matchAlbum(spotifyAlbum: SpotifyAlbum): Promise<AlbumMatchResult> {
    // Step 1: Try exact metadata matching
    const exactMatch = await this.matchByExactMetadata(spotifyAlbum)
    if (exactMatch) {
      return exactMatch
    }

    // Step 2: Try fuzzy matching
    const fuzzyMatch = await this.matchByFuzzyMetadata(spotifyAlbum)
    if (fuzzyMatch && fuzzyMatch.confidence >= CONFIDENCE_THRESHOLD_LOW) {
      return fuzzyMatch
    }

    // No match found
    return {
      spotifyAlbum,
      tidalAlbum: null,
      status: 'unmatched',
      method: 'unmatched',
      confidence: 0,
    }
  }

  /**
   * Match multiple albums in batch
   *
   * @param spotifyAlbums - Array of Spotify albums
   * @param onProgress - Progress callback (current, total)
   * @returns Array of match results
   */
  static async matchAlbums(
    spotifyAlbums: SpotifyAlbum[],
    onProgress?: (current: number, total: number) => void
  ): Promise<AlbumMatchResult[]> {
    const results: AlbumMatchResult[] = []

    for (let i = 0; i < spotifyAlbums.length; i++) {
      const album = spotifyAlbums[i]
      onProgress?.(i + 1, spotifyAlbums.length)

      const match = await this.matchAlbum(album)
      results.push(match)
    }

    return results
  }

  /**
   * Match by exact metadata
   */
  private static async matchByExactMetadata(
    spotifyAlbum: SpotifyAlbum
  ): Promise<AlbumMatchResult | null> {
    try {
      console.log(`🔍 Exact album match: ${spotifyAlbum.name}`)

      // Search Tidal for the album
      const primaryArtist = spotifyAlbum.artists[0].name
      const query = `${spotifyAlbum.name} ${primaryArtist}`
      const searchResults = await TidalClient.searchAlbums(query, 10)

      if (searchResults.length === 0) return null

      // Find exact match
      for (const tidalAlbum of searchResults) {
        if (this.isExactMatch(spotifyAlbum, tidalAlbum)) {
          console.log(`✅ Exact album match found: ${tidalAlbum.title}`)
          return {
            spotifyAlbum,
            tidalAlbum,
            status: 'matched',
            method: 'exact',
            confidence: 0.99,
          }
        }
      }

      console.log(`❌ No exact album match found for: ${spotifyAlbum.name}`)
      return null
    } catch (error) {
      console.error('Exact album matching failed:', error)
      return null
    }
  }

  /**
   * Match by fuzzy metadata
   */
  private static async matchByFuzzyMetadata(
    spotifyAlbum: SpotifyAlbum
  ): Promise<AlbumMatchResult | null> {
    try {
      console.log(`🔍 Fuzzy album match: ${spotifyAlbum.name}`)

      // Search Tidal for the album
      const primaryArtist = spotifyAlbum.artists[0].name
      const query = `${spotifyAlbum.name} ${primaryArtist}`
      const searchResults = await TidalClient.searchAlbums(query, 20)

      if (searchResults.length === 0) return null

      // Calculate confidence scores for all results
      const scoredResults = searchResults.map((tidalAlbum) => ({
        album: tidalAlbum,
        confidence: this.calculateConfidence(spotifyAlbum, tidalAlbum),
      }))

      // Sort by confidence (highest first)
      scoredResults.sort((a, b) => b.confidence - a.confidence)

      const bestMatch = scoredResults[0]

      if (bestMatch.confidence >= CONFIDENCE_THRESHOLD_LOW) {
        console.log(
          `✅ Fuzzy album match found: ${bestMatch.album.title} (confidence: ${bestMatch.confidence.toFixed(2)})`
        )
        return {
          spotifyAlbum,
          tidalAlbum: bestMatch.album,
          status: 'matched',
          method: 'fuzzy',
          confidence: bestMatch.confidence,
        }
      }

      console.log(
        `❌ No confident fuzzy album match for: ${spotifyAlbum.name} (best: ${bestMatch.confidence.toFixed(2)})`
      )
      return null
    } catch (error) {
      console.error('Fuzzy album matching failed:', error)
      return null
    }
  }

  /**
   * Check if two albums are an exact match
   */
  private static isExactMatch(
    spotifyAlbum: SpotifyAlbum,
    tidalAlbum: TidalAlbum
  ): boolean {
    // Normalize album titles
    const spotifyTitle = normalizeString(spotifyAlbum.name)
    const tidalTitle = normalizeString(tidalAlbum.title)

    // Check title match
    if (spotifyTitle !== tidalTitle) return false

    // Check primary artist match
    const spotifyArtist = normalizeString(spotifyAlbum.artists[0].name)

    // Check against all Tidal album artists
    const tidalArtistNames = tidalAlbum.artists.map((a) =>
      normalizeString(a.name)
    )

    if (!tidalArtistNames.includes(spotifyArtist)) {
      return false
    }

    // Check release year (if available)
    if (spotifyAlbum.release_date && tidalAlbum.releaseDate) {
      const spotifyYear = spotifyAlbum.release_date.substring(0, 4)
      const tidalYear = tidalAlbum.releaseDate.substring(0, 4)

      // Allow 1 year difference for re-releases
      if (Math.abs(parseInt(spotifyYear) - parseInt(tidalYear)) > 1) {
        return false
      }
    }

    return true
  }

  /**
   * Calculate confidence score for fuzzy matching
   */
  private static calculateConfidence(
    spotifyAlbum: SpotifyAlbum,
    tidalAlbum: TidalAlbum
  ): number {
    // Title similarity (60% weight)
    const titleScore = stringSimilarity(spotifyAlbum.name, tidalAlbum.title)

    // Artist similarity (30% weight)
    const spotifyArtist = spotifyAlbum.artists[0].name

    // Check similarity against all Tidal artists, take the best match
    const artistScores = tidalAlbum.artists.map((tidalArtist) =>
      stringSimilarity(spotifyArtist, tidalArtist.name)
    )
    const artistScore = Math.max(...artistScores)

    // Release year similarity (10% weight)
    let releaseYearScore = 0.5 // Neutral if not available

    if (spotifyAlbum.release_date && tidalAlbum.releaseDate) {
      const spotifyYear = parseInt(spotifyAlbum.release_date.substring(0, 4))
      const tidalYear = parseInt(tidalAlbum.releaseDate.substring(0, 4))
      const yearDiff = Math.abs(spotifyYear - tidalYear)

      if (yearDiff === 0) {
        releaseYearScore = 1.0
      } else if (yearDiff === 1) {
        releaseYearScore = 0.9 // Allow 1 year difference for re-releases
      } else if (yearDiff <= 3) {
        releaseYearScore = 0.7 // Some tolerance for older albums
      } else {
        releaseYearScore = 0.3 // Likely different albums
      }
    }

    // Weighted average
    const confidence =
      titleScore * WEIGHT_TITLE +
      artistScore * WEIGHT_ARTIST +
      releaseYearScore * WEIGHT_RELEASE_YEAR

    return confidence
  }

  /**
   * Get match statistics from results
   */
  static getStatistics(results: AlbumMatchResult[]): {
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
