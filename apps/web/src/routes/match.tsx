import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useMatching } from '@/hooks/useMatching'
import type { ArtistMatchResult } from '@spotify2tidal/types'

/**
 * Match Review Route
 *
 * Simplified version that shows artist matches.
 */

type FilterOption = 'all' | 'matched' | 'unmatched'

function MatchPage() {
  const navigate = useNavigate()
  const { artistMatches, isMatching, matchingComplete } = useMatching()

  const [filter, setFilter] = useState<FilterOption>('all')

  // Filter matches
  const filteredMatches = useMemo(() => {
    let filtered = [...artistMatches]

    switch (filter) {
      case 'matched':
        filtered = filtered.filter((m) => m.status === 'matched')
        break
      case 'unmatched':
        filtered = filtered.filter((m) => m.status === 'unmatched')
        break
    }

    // Sort by confidence (low to high to show problem cases first)
    filtered.sort((a, b) => a.confidence - b.confidence)

    return filtered
  }, [artistMatches, filter])

  const stats = useMemo(() => {
    const matched = artistMatches.filter((m) => m.status === 'matched').length
    const unmatched = artistMatches.filter((m) => m.status === 'unmatched').length
    return {
      total: artistMatches.length,
      matched,
      unmatched,
      successRate: artistMatches.length > 0 ? (matched / artistMatches.length) * 100 : 0,
    }
  }, [artistMatches])

  // No matches yet - show empty state
  if (!isMatching && artistMatches.length === 0) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold mb-4">No Matches Yet</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Extract your Spotify artists and match them to see results here.
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold mb-4">Matching in Progress</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please wait while we match your artists...
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
          <h1 className="text-3xl font-bold mb-2">Artist Match Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review matched artists from your Spotify library.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Statistics sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="font-semibold mb-4 text-lg">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Artists</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Matched</span>
                  <span className="font-semibold text-green-600">{stats.matched}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Unmatched</span>
                  <span className="font-semibold text-red-600">{stats.unmatched}</span>
                </div>
                <div className="pt-3 border-t dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                    <span className="font-semibold">{stats.successRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mt-4">
              <h3 className="font-semibold mb-3">Filters</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All ({artistMatches.length})
                </button>
                <button
                  onClick={() => setFilter('matched')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'matched'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Matched ({stats.matched})
                </button>
                <button
                  onClick={() => setFilter('unmatched')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unmatched'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Unmatched ({stats.unmatched})
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mt-4">
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Extraction
                </button>
              </div>
            </div>
          </div>

          {/* Matches list */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Showing {filteredMatches.length} artists
              </span>
            </div>

            {filteredMatches.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No matches found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filter to see more results.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMatches.map((match) => (
                  <ArtistMatchCard key={match.spotifyArtist.id} match={match} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ArtistMatchCard({ match }: { match: ArtistMatchResult }) {
  const isMatched = match.status === 'matched'

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 ${
      isMatched ? 'border-green-500' : 'border-red-500'
    }`}>
      <div className="flex items-center gap-4">
        {/* Spotify Artist */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spotify</div>
          <div className="font-medium">{match.spotifyArtist.name}</div>
        </div>

        {/* Arrow */}
        <div className="text-gray-400">
          {isMatched ? '→' : '✗'}
        </div>

        {/* Tidal Artist */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tidal</div>
          {isMatched && match.tidalArtist ? (
            <div className="font-medium">{match.tidalArtist.name}</div>
          ) : (
            <div className="text-gray-400 italic">Not found</div>
          )}
        </div>

        {/* Confidence */}
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Confidence</div>
          <div className={`font-semibold ${
            match.confidence >= 0.95 ? 'text-green-600' :
            match.confidence >= 0.85 ? 'text-yellow-600' :
            match.confidence >= 0.70 ? 'text-orange-600' :
            'text-red-600'
          }`}>
            {(match.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/match')({
  component: MatchPage,
})
