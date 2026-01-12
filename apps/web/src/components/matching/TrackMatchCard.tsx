import type { TrackMatchResult } from '@spotify2tidal/types'
import ConfidenceScore from './ConfidenceScore'

interface TrackMatchCardProps {
  match: TrackMatchResult
  onManualMatch?: (match: TrackMatchResult) => void
  onViewSuggestions?: (match: TrackMatchResult) => void
  className?: string
}

/**
 * TrackMatchCard - Side-by-side comparison of Spotify and Tidal tracks
 *
 * Shows:
 * - Track name, artist, album
 * - Duration
 * - Confidence score badge
 * - Actions (manual match, view suggestions)
 */
export default function TrackMatchCard({
  match,
  onManualMatch,
  onViewSuggestions,
  className = '',
}: TrackMatchCardProps) {
  const { spotifyTrack, tidalTrack, confidence, method, suggestions } = match

  // Format duration from milliseconds to mm:ss
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const hasSuggestions = suggestions && suggestions.length > 0

  return (
    <div
      className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {/* Header with confidence score */}
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <ConfidenceScore confidence={confidence} method={method} />
        {match.status === 'unmatched' && hasSuggestions && (
          <button
            onClick={() => onViewSuggestions?.(match)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Suggestions ({suggestions.length})
          </button>
        )}
      </div>

      {/* Side-by-side comparison */}
      <div className="grid md:grid-cols-2 divide-x">
        {/* Spotify side */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <h4 className="font-semibold text-gray-900">Spotify</h4>
          </div>

          <div className="space-y-1.5">
            <p className="font-medium text-gray-900">{spotifyTrack.name}</p>
            <p className="text-sm text-gray-600">
              {spotifyTrack.artists.map((a) => a.name).join(', ')}
            </p>
            {spotifyTrack.album && (
              <p className="text-sm text-gray-500">{spotifyTrack.album.name}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
              <span>{formatDuration(spotifyTrack.duration_ms)}</span>
              {spotifyTrack.isrc && (
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  ISRC: {spotifyTrack.isrc}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tidal side */}
        <div className="p-4">
          {tidalTrack ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-tidal-blue rounded-full flex items-center justify-center text-black font-bold text-sm">
                  T
                </div>
                <h4 className="font-semibold text-gray-900">Tidal</h4>
              </div>

              <div className="space-y-1.5">
                <p className="font-medium text-gray-900">{tidalTrack.title}</p>
                <p className="text-sm text-gray-600">{tidalTrack.artist.name}</p>
                {tidalTrack.album && (
                  <p className="text-sm text-gray-500">{tidalTrack.album.title}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                  <span>{formatDuration(tidalTrack.duration)}</span>
                  {tidalTrack.isrc && (
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      ISRC: {tidalTrack.isrc}
                    </span>
                  )}
                </div>
              </div>

              {/* Tidal link */}
              {tidalTrack.url && (
                <a
                  href={tidalTrack.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                >
                  <span>Open in Tidal</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg
                className="w-12 h-12 mb-2"
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
              <p className="text-sm font-medium">No match found</p>
              {hasSuggestions && (
                <p className="text-xs mt-1">
                  {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}{' '}
                  available
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {(match.status === 'unmatched' || confidence < 0.9) && (
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end gap-2">
          {match.status === 'unmatched' ? (
            <button
              onClick={() => onManualMatch?.(match)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search Manually
            </button>
          ) : (
            <>
              <button
                onClick={() => onManualMatch?.(match)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Change Match
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Accept
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
