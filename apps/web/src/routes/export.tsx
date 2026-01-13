import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useMatching } from '@/hooks/useMatching'
import { useExtractionStore } from '@/store/extractionStore'
import { useAuthStore } from '@/store/authStore'
import ExportSummary from '@/components/export/ExportSummary'
import ExportActions from '@/components/export/ExportActions'
import {
  generateMigrationExport,
  calculateExportSize,
} from '@/lib/utils/exportUtils'

/**
 * Export Route
 *
 * Features:
 * - Display export summary with statistics
 * - Download as JSON, Text, CSV
 * - Copy to clipboard
 * - Print report
 * - Migration completion notice
 */

function ExportPage() {
  const navigate = useNavigate()
  const { trackMatches, albumMatches, artistMatches, statistics } =
    useMatching()
  const { library } = useExtractionStore()
  const { spotifyUserId } = useAuthStore()

  // Generate export data
  const exportData = useMemo(() => {
    const safeLibrary = library || {
      playlists: [],
      savedTracks: [],
      savedAlbums: [],
      followedArtists: [],
    }
    return generateMigrationExport(
      safeLibrary,
      trackMatches,
      albumMatches,
      artistMatches,
      statistics || {
        totalTracks: 0,
        totalPlaylists: 0,
        totalAlbums: 0,
        totalArtists: 0,
        matched: {
          byISRC: 0,
          byExact: 0,
          byFuzzy: 0,
          total: 0,
        },
        unmatched: 0,
        confidence: {
          high: 0,
          medium: 0,
          low: 0,
        },
      },
      spotifyUserId || 'unknown'
    )
  }, [
    library,
    trackMatches,
    albumMatches,
    artistMatches,
    statistics,
    spotifyUserId,
  ])

  const fileSize = useMemo(
    () => calculateExportSize(exportData),
    [exportData]
  )

  // No data yet - show empty state
  if (trackMatches.length === 0) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h1 className="text-3xl font-bold mb-4">No Export Data</h1>
            <p className="text-gray-600 mb-6">
              Complete the matching process before exporting your results.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate({ to: '/extract' })}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Extraction
              </button>
              <button
                onClick={() => navigate({ to: '/match' })}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go to Matching
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Export Results</h1>
          <p className="text-gray-600">
            Your migration data is ready to export. Download your results in
            various formats or view a detailed summary.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content - Summary */}
          <div className="lg:col-span-2">
            <ExportSummary exportData={exportData} fileSize={fileSize} />

            {/* Success message */}
            <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Migration Data Ready!
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Your Spotify library has been successfully matched with Tidal
                    tracks. You can now export your migration data for future use.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white border border-green-300 rounded-full text-sm font-medium text-green-800">
                      ✓ {statistics?.matched.total || 0} Tracks Matched
                    </span>
                    <span className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm font-medium text-blue-800">
                      ✓ {exportData.playlists.length} Playlists Ready
                    </span>
                    <span className="px-3 py-1 bg-white border border-purple-300 rounded-full text-sm font-medium text-purple-800">
                      ✓ Export Formats Available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="lg:col-span-1">
            <ExportActions
              exportData={exportData}
              trackMatches={trackMatches}
            />

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-lg p-4 mt-6">
              <h3 className="font-semibold mb-3">Navigation</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate({ to: '/match' })}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  ← Back to Match Review
                </button>
                <button
                  onClick={() => navigate({ to: '/extract' })}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  ← Back to Extraction
                </button>
                <button
                  onClick={() => navigate({ to: '/' })}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </div>

            {/* Help section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                💡 What's Next?
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Save your export:</strong> Download the JSON file and
                  keep it safe for future use.
                </p>
                <p>
                  <strong>Manual import:</strong> Use the CSV export to manually
                  add tracks to Tidal playlists.
                </p>
                <p>
                  <strong>Future migration:</strong> When Tidal's API supports
                  playlist creation, you can use your JSON export for automated
                  migration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/export')({
  component: ExportPage,
})
