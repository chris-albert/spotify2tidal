import { useState } from 'react'
import type { TrackMatchResult, TidalTrack } from '@spotify2tidal/types'
import { useTidal } from '@/hooks/useTidal'

interface ManualMatchModalProps {
  match: TrackMatchResult
  isOpen: boolean
  onClose: () => void
  onSelectMatch: (tidalTrack: TidalTrack) => void
}

/**
 * ManualMatchModal - Search and select alternative matches
 *
 * Features:
 * - Search Tidal for alternative tracks
 * - Show suggestions if available
 * - Preview and compare tracks
 * - Select a match or mark as unmatched
 */
export default function ManualMatchModal({
  match,
  isOpen,
  onClose,
  onSelectMatch,
}: ManualMatchModalProps) {
  const { searchTracks, isSearching } = useTidal()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TidalTrack[]>(
    match.suggestions || []
  )

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const results = await searchTracks(searchQuery, 20)
    setSearchResults(results)
  }

  const handleSelectTrack = (track: TidalTrack) => {
    onSelectMatch(track)
    onClose()
  }

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Manual Match
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Search for: {match.spotifyTrack.name} -{' '}
              {match.spotifyTrack.artists[0].name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Spotify track reference */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-spotify-green rounded-full flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <h3 className="font-semibold text-gray-900">
              Spotify Track (Reference)
            </h3>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-gray-900">
              {match.spotifyTrack.name}
            </p>
            <p className="text-sm text-gray-600">
              {match.spotifyTrack.artists.map((a) => a.name).join(', ')}
            </p>
            {match.spotifyTrack.album && (
              <p className="text-sm text-gray-500">
                {match.spotifyTrack.album.name}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Duration: {formatDuration(match.spotifyTrack.duration_ms)}
            </p>
          </div>
        </div>

        {/* Search form */}
        <div className="px-6 py-4 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tidal (e.g., track name + artist)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="font-medium">
                {match.suggestions && match.suggestions.length > 0
                  ? 'Showing initial suggestions'
                  : 'No results yet'}
              </p>
              <p className="text-sm mt-1">
                Search Tidal to find alternative matches
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-blue-900">
                        {track.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {track.artist.name}
                      </p>
                      {track.album && (
                        <p className="text-sm text-gray-500 truncate">
                          {track.album.title}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span>{formatDuration(track.duration)}</span>
                        {track.isrc && (
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            ISRC: {track.isrc}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        Select
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Mark as unmatched
                onClose()
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Mark as Unmatched
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
