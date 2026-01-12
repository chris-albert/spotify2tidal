import type { MigrationExport } from '@spotify2tidal/types'

interface ExportSummaryProps {
  exportData: MigrationExport
  fileSize: number
  className?: string
}

/**
 * ExportSummary - Display export statistics and summary
 *
 * Shows:
 * - Export metadata (date, user, version)
 * - Overall statistics with visual progress
 * - Playlist breakdown
 * - Match quality distribution
 * - File size information
 */
export default function ExportSummary({
  exportData,
  fileSize,
  className = '',
}: ExportSummaryProps) {
  const { metadata, playlists, statistics } = exportData

  const successRate =
    statistics.totalTracks > 0
      ? ((statistics.matched.total / statistics.totalTracks) * 100).toFixed(1)
      : '0'

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export metadata */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Export Ready!
            </h2>
            <p className="text-sm text-gray-600">
              Your migration data is ready to download
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Export Date</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(metadata.exportDate).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">User</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {metadata.spotifyUserId}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Version</p>
            <p className="text-sm font-semibold text-gray-900">
              {metadata.version}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">File Size</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatFileSize(fileSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Overall statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">Overall Statistics</h3>

        {/* Success rate */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Success Rate</span>
            <span className="text-2xl font-bold text-green-600">
              {successRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600"
              style={{ width: `${successRate}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {statistics.matched.total} of {statistics.totalTracks} tracks
            successfully matched
          </p>
        </div>

        {/* Counts grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-900">
              {statistics.totalTracks}
            </p>
            <p className="text-sm text-blue-700 mt-1">Tracks</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-900">
              {statistics.totalPlaylists}
            </p>
            <p className="text-sm text-purple-700 mt-1">Playlists</p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <p className="text-3xl font-bold text-indigo-900">
              {statistics.totalAlbums}
            </p>
            <p className="text-sm text-indigo-700 mt-1">Albums</p>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <p className="text-3xl font-bold text-pink-900">
              {statistics.totalArtists}
            </p>
            <p className="text-sm text-pink-700 mt-1">Artists</p>
          </div>
        </div>
      </div>

      {/* Match quality breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">Match Quality</h3>

        <div className="space-y-3">
          {/* ISRC matches */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold text-gray-900">ISRC Match</p>
                <p className="text-xs text-gray-600">99.9% accuracy</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {statistics.matched.byISRC}
            </p>
          </div>

          {/* Exact matches */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-gray-900">Exact Match</p>
                <p className="text-xs text-gray-600">98-99% accuracy</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {statistics.matched.byExact}
            </p>
          </div>

          {/* Fuzzy matches */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">~</span>
              <div>
                <p className="font-semibold text-gray-900">Fuzzy Match</p>
                <p className="text-xs text-gray-600">70-95% accuracy</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {statistics.matched.byFuzzy}
            </p>
          </div>

          {/* Unmatched */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✗</span>
              <div>
                <p className="font-semibold text-gray-900">Unmatched</p>
                <p className="text-xs text-gray-600">Needs manual review</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-900">
              {statistics.unmatched}
            </p>
          </div>
        </div>

        {/* Confidence distribution */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold mb-3">Confidence Distribution</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-2xl font-bold text-green-900">
                {statistics.confidence.high}
              </p>
              <p className="text-xs text-green-700 mt-1">High (≥95%)</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-2xl font-bold text-yellow-900">
                {statistics.confidence.medium}
              </p>
              <p className="text-xs text-yellow-700 mt-1">Medium (85-95%)</p>
            </div>
            <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-2xl font-bold text-orange-900">
                {statistics.confidence.low}
              </p>
              <p className="text-xs text-orange-700 mt-1">Low (70-85%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">
          Playlists ({playlists.length})
        </h3>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {playlists.map((playlist, index) => {
            const matched = playlist.tracks.filter(
              (t) => t.matchStatus === 'matched'
            ).length
            const total = playlist.tracks.length
            const rate = total > 0 ? ((matched / total) * 100).toFixed(0) : '0'

            return (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {playlist.name}
                    </h4>
                    {playlist.description && (
                      <p className="text-sm text-gray-600 truncate">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {playlist.collaborative && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        Collaborative
                      </span>
                    )}
                    {playlist.public && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Public
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    {matched}/{total} ({rate}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
