import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useMatching } from '@/hooks/useMatching'
import TrackMatchCard from '@/components/matching/TrackMatchCard'
import MatchStatistics from '@/components/matching/MatchStatistics'
import ManualMatchModal from '@/components/matching/ManualMatchModal'
import type { TrackMatchResult, TidalTrack } from '@spotify2tidal/types'

/**
 * Match Review Route
 *
 * Features:
 * - Display all matched tracks with confidence scores
 * - Filter by match status (all, matched, unmatched)
 * - Sort by confidence, name, or match method
 * - Manual match correction
 * - Statistics dashboard
 * - Export functionality
 */

type FilterOption = 'all' | 'matched' | 'unmatched' | 'low-confidence'
type SortOption = 'confidence-asc' | 'confidence-desc' | 'name' | 'method'

function MatchPage() {
  const navigate = useNavigate()
  const {
    trackMatches,
    isMatching,
    matchingComplete,
    getMatchStats,
    manuallyMatchTrack,
  } = useMatching()

  const [filter, setFilter] = useState<FilterOption>('all')
  const [sort, setSort] = useState<SortOption>('confidence-asc')
  const [selectedMatch, setSelectedMatch] = useState<TrackMatchResult | null>(
    null
  )
  const [showModal, setShowModal] = useState(false)

  const stats = getMatchStats()

  // Filter and sort matches
  const filteredAndSortedMatches = useMemo(() => {
    let filtered = [...trackMatches]

    // Apply filter
    switch (filter) {
      case 'matched':
        filtered = filtered.filter((m) => m.status === 'matched')
        break
      case 'unmatched':
        filtered = filtered.filter((m) => m.status === 'unmatched')
        break
      case 'low-confidence':
        filtered = filtered.filter(
          (m) => m.status === 'matched' && m.confidence < 0.9
        )
        break
      // 'all' - no filtering
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sort) {
        case 'confidence-asc':
          return a.confidence - b.confidence
        case 'confidence-desc':
          return b.confidence - a.confidence
        case 'name':
          return a.spotifyTrack.name.localeCompare(b.spotifyTrack.name)
        case 'method':
          return a.method.localeCompare(b.method)
        default:
          return 0
      }
    })

    return filtered
  }, [trackMatches, filter, sort])

  const handleManualMatch = (match: TrackMatchResult) => {
    setSelectedMatch(match)
    setShowModal(true)
  }

  const handleSelectMatch = async (tidalTrack: TidalTrack) => {
    if (!selectedMatch) return

    const updatedMatch: TrackMatchResult = {
      ...selectedMatch,
      tidalTrack,
      status: 'matched',
      method: 'fuzzy', // Manual selection treated as fuzzy
      confidence: 1.0, // User confirmed = 100% confidence for them
    }

    await manuallyMatchTrack(selectedMatch.spotifyTrack.id, updatedMatch)
    setShowModal(false)
    setSelectedMatch(null)
  }

  // No matches yet - show empty state
  if (!isMatching && trackMatches.length === 0) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold mb-4">No Matches Yet</h1>
            <p className="text-gray-600 mb-6">
              Extract your Spotify library and start matching tracks to see them
              here.
            </p>
            <button
              onClick={() => navigate({ to: '/extract' })}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Extraction
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Matching in progress
  if (isMatching) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold mb-4">Matching in Progress</h1>
            <p className="text-gray-600 mb-6">
              Please wait while we match your tracks...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <h1 className="text-3xl font-bold mb-2">Match Review</h1>
          <p className="text-gray-600">
            Review matched tracks, verify low-confidence matches, and manually
            search for unmatched tracks.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Statistics sidebar */}
          <div className="lg:col-span-1">
            <MatchStatistics
              totalMatches={stats.totalMatches}
              matchedByISRC={stats.matchedByISRC}
              matchedByExact={stats.matchedByExact}
              matchedByFuzzy={stats.matchedByFuzzy}
              unmatched={stats.unmatched}
              successRate={stats.successRate}
            />

            {/* Quick filters */}
            <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
              <h3 className="font-semibold mb-3">Quick Filters</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Matches ({trackMatches.length})
                </button>
                <button
                  onClick={() => setFilter('matched')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'matched'
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Matched Only ({stats.totalMatches - stats.unmatched})
                </button>
                <button
                  onClick={() => setFilter('unmatched')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unmatched'
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Unmatched ({stats.unmatched})
                </button>
                <button
                  onClick={() => setFilter('low-confidence')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'low-confidence'
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Low Confidence (
                  {
                    trackMatches.filter(
                      (m) => m.status === 'matched' && m.confidence < 0.9
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
              <h3 className="font-semibold mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate({ to: '/export' })}
                  disabled={!matchingComplete}
                  className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Results
                </button>
                <button
                  onClick={() => navigate({ to: '/extract' })}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Extraction
                </button>
              </div>
            </div>
          </div>

          {/* Matches list */}
          <div className="lg:col-span-2">
            {/* Sort controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Showing {filteredAndSortedMatches.length} matches
                </span>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="sort"
                    className="text-sm text-gray-600 font-medium"
                  >
                    Sort by:
                  </label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="confidence-asc">
                      Confidence (Low to High)
                    </option>
                    <option value="confidence-desc">
                      Confidence (High to Low)
                    </option>
                    <option value="name">Track Name (A-Z)</option>
                    <option value="method">Match Method</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Matches */}
            {filteredAndSortedMatches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No matches found</h3>
                <p className="text-gray-600">
                  Try adjusting your filter to see more results.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedMatches.map((match) => (
                  <TrackMatchCard
                    key={match.spotifyTrack.id}
                    match={match}
                    onManualMatch={handleManualMatch}
                    onViewSuggestions={handleManualMatch}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual match modal */}
      {selectedMatch && (
        <ManualMatchModal
          match={selectedMatch}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedMatch(null)
          }}
          onSelectMatch={handleSelectMatch}
        />
      )}
    </div>
  )
}

export const Route = createFileRoute('/match')({
  component: MatchPage,
})
