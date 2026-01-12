import type {
  MigrationExport,
  TrackMatchResult,
  AlbumMatchResult,
  ArtistMatchResult,
  MigrationStatistics,
} from '@spotify2tidal/types'
import type { SpotifyLibrary } from '@spotify2tidal/types'

/**
 * Export utilities for generating migration reports
 */

/**
 * Generate a complete migration export
 *
 * @param library - Extracted Spotify library
 * @param trackMatches - All track match results
 * @param albumMatches - All album match results
 * @param artistMatches - All artist match results
 * @param statistics - Matching statistics
 * @param spotifyUserId - Spotify user ID
 * @returns Complete migration export
 */
export function generateMigrationExport(
  library: SpotifyLibrary,
  trackMatches: TrackMatchResult[],
  albumMatches: AlbumMatchResult[],
  artistMatches: ArtistMatchResult[],
  statistics: MigrationStatistics,
  spotifyUserId: string
): MigrationExport {
  const exportData: MigrationExport = {
    metadata: {
      exportDate: new Date().toISOString(),
      spotifyUserId,
      version: '1.0.0',
    },
    playlists: library.playlists.map((playlist) => {
      // Get track matches for this playlist
      const playlistTrackIds = playlist.tracks.items.map((t) => t.id)
      const playlistMatches = trackMatches.filter((m) =>
        playlistTrackIds.includes(m.spotifyTrack.id)
      )

      return {
        name: playlist.name,
        description: playlist.description || '',
        public: playlist.public,
        collaborative: playlist.collaborative,
        tracks: playlistMatches.map((match) => ({
          spotify: {
            name: match.spotifyTrack.name,
            artist: match.spotifyTrack.artists[0].name,
            album: match.spotifyTrack.album?.name || '',
            isrc: match.spotifyTrack.isrc,
            uri: match.spotifyTrack.uri,
          },
          tidal: match.tidalTrack
            ? {
                id: match.tidalTrack.id,
                title: match.tidalTrack.title,
                artist: match.tidalTrack.artist.name,
              }
            : null,
          matchStatus: match.status,
          matchMethod: match.method,
          confidence: match.confidence,
        })),
      }
    }),
    albums: albumMatches,
    artists: artistMatches,
    statistics,
    unmatchedTracks: trackMatches
      .filter((m) => m.status === 'unmatched')
      .map((match) => ({
        name: match.spotifyTrack.name,
        artist: match.spotifyTrack.artists[0].name,
        album: match.spotifyTrack.album?.name || '',
        suggestions: match.suggestions,
      })),
  }

  return exportData
}

/**
 * Download export as JSON file
 *
 * @param exportData - Migration export data
 * @param filename - Optional filename (default: spotify2tidal-export-[date].json)
 */
export function downloadAsJSON(
  exportData: MigrationExport,
  filename?: string
): void {
  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const defaultFilename = `spotify2tidal-export-${new Date()
    .toISOString()
    .slice(0, 10)}.json`

  const link = document.createElement('a')
  link.href = url
  link.download = filename || defaultFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copy export to clipboard
 *
 * @param exportData - Migration export data
 * @returns Promise that resolves when copied
 */
export async function copyToClipboard(
  exportData: MigrationExport
): Promise<void> {
  const json = JSON.stringify(exportData, null, 2)
  await navigator.clipboard.writeText(json)
}

/**
 * Generate a human-readable text report
 *
 * @param exportData - Migration export data
 * @returns Formatted text report
 */
export function generateTextReport(exportData: MigrationExport): string {
  const { metadata, playlists, statistics, unmatchedTracks } = exportData

  const lines: string[] = []

  // Header
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('          SPOTIFY TO TIDAL MIGRATION REPORT           ')
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push(`Export Date: ${new Date(metadata.exportDate).toLocaleString()}`)
  lines.push(`Spotify User: ${metadata.spotifyUserId}`)
  lines.push(`Version: ${metadata.version}`)
  lines.push('')

  // Statistics
  lines.push('───────────────────────────────────────────────────────')
  lines.push('MATCHING STATISTICS')
  lines.push('───────────────────────────────────────────────────────')
  lines.push(`Total Tracks:     ${statistics.totalTracks}`)
  lines.push(`Total Playlists:  ${statistics.totalPlaylists}`)
  lines.push(`Total Albums:     ${statistics.totalAlbums}`)
  lines.push(`Total Artists:    ${statistics.totalArtists}`)
  lines.push('')
  lines.push('Match Results:')
  lines.push(`  ✓ Matched by ISRC:  ${statistics.matched.byISRC}`)
  lines.push(`  ✓ Matched by Exact: ${statistics.matched.byExact}`)
  lines.push(`  ✓ Matched by Fuzzy: ${statistics.matched.byFuzzy}`)
  lines.push(`  ✗ Unmatched:        ${statistics.unmatched}`)
  lines.push('')
  const successRate =
    statistics.totalTracks > 0
      ? ((statistics.matched.total / statistics.totalTracks) * 100).toFixed(1)
      : '0'
  lines.push(`Success Rate: ${successRate}%`)
  lines.push('')
  lines.push('Confidence Distribution:')
  lines.push(`  High (≥95%):    ${statistics.confidence.high}`)
  lines.push(`  Medium (85-95%): ${statistics.confidence.medium}`)
  lines.push(`  Low (70-85%):   ${statistics.confidence.low}`)
  lines.push('')

  // Playlists summary
  lines.push('───────────────────────────────────────────────────────')
  lines.push('PLAYLISTS')
  lines.push('───────────────────────────────────────────────────────')
  playlists.forEach((playlist) => {
    const matched = playlist.tracks.filter(
      (t) => t.matchStatus === 'matched'
    ).length
    const total = playlist.tracks.length
    const rate = total > 0 ? ((matched / total) * 100).toFixed(0) : '0'

    lines.push(``)
    lines.push(`${playlist.name}`)
    lines.push(`  Tracks: ${matched}/${total} matched (${rate}%)`)
    if (playlist.collaborative) lines.push(`  [Collaborative]`)
    if (playlist.public) lines.push(`  [Public]`)
  })
  lines.push('')

  // Unmatched tracks
  if (unmatchedTracks.length > 0) {
    lines.push('───────────────────────────────────────────────────────')
    lines.push('UNMATCHED TRACKS (Needs Manual Review)')
    lines.push('───────────────────────────────────────────────────────')
    unmatchedTracks.forEach((track, index) => {
      lines.push(`${index + 1}. ${track.name} - ${track.artist}`)
      if (track.album) lines.push(`   Album: ${track.album}`)
      if (track.suggestions && track.suggestions.length > 0) {
        lines.push(
          `   Suggestions: ${track.suggestions.length} alternative(s) available`
        )
      }
    })
    lines.push('')
  }

  // Footer
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('Generated with Spotify2Tidal Migration Tool')
  lines.push('https://github.com/yourusername/spotify2tidal')
  lines.push('═══════════════════════════════════════════════════════')

  return lines.join('\n')
}

/**
 * Download report as text file
 *
 * @param exportData - Migration export data
 * @param filename - Optional filename (default: spotify2tidal-report-[date].txt)
 */
export function downloadAsText(
  exportData: MigrationExport,
  filename?: string
): void {
  const text = generateTextReport(exportData)
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const defaultFilename = `spotify2tidal-report-${new Date()
    .toISOString()
    .slice(0, 10)}.txt`

  const link = document.createElement('a')
  link.href = url
  link.download = filename || defaultFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate CSV export for tracks
 *
 * @param trackMatches - All track match results
 * @returns CSV string
 */
export function generateTrackCSV(trackMatches: TrackMatchResult[]): string {
  const lines: string[] = []

  // Header
  lines.push(
    'Spotify Track,Spotify Artist,Spotify Album,Spotify ISRC,Tidal Track,Tidal Artist,Match Status,Match Method,Confidence'
  )

  // Data rows
  trackMatches.forEach((match) => {
    const row = [
      escapeCSV(match.spotifyTrack.name),
      escapeCSV(match.spotifyTrack.artists[0].name),
      escapeCSV(match.spotifyTrack.album?.name || ''),
      escapeCSV(match.spotifyTrack.isrc || ''),
      escapeCSV(match.tidalTrack?.title || ''),
      escapeCSV(match.tidalTrack?.artist.name || ''),
      match.status,
      match.method,
      match.confidence.toFixed(2),
    ]
    lines.push(row.join(','))
  })

  return lines.join('\n')
}

/**
 * Download CSV export
 *
 * @param trackMatches - All track match results
 * @param filename - Optional filename (default: spotify2tidal-tracks-[date].csv)
 */
export function downloadAsCSV(
  trackMatches: TrackMatchResult[],
  filename?: string
): void {
  const csv = generateTrackCSV(trackMatches)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const defaultFilename = `spotify2tidal-tracks-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  const link = document.createElement('a')
  link.href = url
  link.download = filename || defaultFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape CSV field
 */
function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Format file size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Calculate export file size
 *
 * @param exportData - Migration export data
 * @returns Size in bytes
 */
export function calculateExportSize(exportData: MigrationExport): number {
  const json = JSON.stringify(exportData, null, 2)
  return new Blob([json]).size
}
