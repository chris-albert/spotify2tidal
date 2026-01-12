/**
 * String utility functions for track matching
 */

/**
 * Normalize a string for comparison
 * - Lowercase
 * - Remove special characters
 * - Trim whitespace
 *
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate Levenshtein distance between two strings
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0))

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity score between two strings (0-1)
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (1 = identical, 0 = completely different)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1)
  const normalized2 = normalizeString(str2)

  if (normalized1 === normalized2) return 1
  if (normalized1.length === 0 || normalized2.length === 0) return 0

  const maxLength = Math.max(normalized1.length, normalized2.length)
  const distance = levenshteinDistance(normalized1, normalized2)

  return 1 - distance / maxLength
}

/**
 * Check if two durations are similar (within tolerance)
 *
 * @param duration1 - First duration in milliseconds
 * @param duration2 - Second duration in milliseconds
 * @param toleranceSeconds - Tolerance in seconds (default: 2)
 * @returns True if durations are within tolerance
 */
export function isDurationSimilar(
  duration1: number,
  duration2: number,
  toleranceSeconds: number = 2
): boolean {
  const toleranceMs = toleranceSeconds * 1000
  return Math.abs(duration1 - duration2) <= toleranceMs
}

/**
 * Remove common variations from track titles
 * (e.g., "Remastered", "Live", "Radio Edit")
 *
 * @param title - Track title
 * @returns Cleaned title
 */
export function cleanTrackTitle(title: string): string {
  const variations = [
    /\s*\(remaster(ed)?\)/gi,
    /\s*\(.*?remaster.*?\)/gi,
    /\s*\(radio edit\)/gi,
    /\s*\(live\)/gi,
    /\s*\(.*?version\)/gi,
    /\s*-\s*remaster(ed)?/gi,
    /\s*\[.*?\]/g, // Remove anything in square brackets
  ]

  let cleaned = title
  variations.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '')
  })

  return cleaned.trim()
}

/**
 * Extract featured artists from track title
 * (e.g., "Song (feat. Artist)" -> ["Artist"])
 *
 * @param title - Track title
 * @returns Array of featured artist names
 */
export function extractFeaturedArtists(title: string): string[] {
  const patterns = [
    /\(feat\.?\s+([^)]+)\)/gi,
    /\(ft\.?\s+([^)]+)\)/gi,
    /\(featuring\s+([^)]+)\)/gi,
  ]

  const artists: string[] = []

  patterns.forEach((pattern) => {
    const matches = title.matchAll(pattern)
    for (const match of matches) {
      // Split by comma or & for multiple artists
      const featuredArtists = match[1]
        .split(/[,&]/)
        .map((a) => a.trim())
        .filter((a) => a.length > 0)

      artists.push(...featuredArtists)
    }
  })

  return artists
}
