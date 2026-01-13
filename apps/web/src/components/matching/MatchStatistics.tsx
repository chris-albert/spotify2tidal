interface MatchStatisticsProps {
  totalMatches: number
  matchedByISRC: number
  matchedByExact: number
  matchedByFuzzy: number
  unmatched: number
  successRate: number
  className?: string
}

/**
 * MatchStatistics - Dashboard showing matching statistics
 *
 * Displays:
 * - Overall success rate
 * - Match breakdown by method (ISRC, exact, fuzzy)
 * - Unmatched count
 * - Visual progress bars
 */
export default function MatchStatistics({
  totalMatches,
  matchedByISRC,
  matchedByExact,
  matchedByFuzzy,
  unmatched,
  successRate,
  className = '',
}: MatchStatisticsProps) {
  const totalMatched = matchedByISRC + matchedByExact + matchedByFuzzy

  // Calculate percentages
  const isrcPercent =
    totalMatches > 0 ? (matchedByISRC / totalMatches) * 100 : 0
  const exactPercent =
    totalMatches > 0 ? (matchedByExact / totalMatches) * 100 : 0
  const fuzzyPercent =
    totalMatches > 0 ? (matchedByFuzzy / totalMatches) * 100 : 0
  const unmatchedPercent =
    totalMatches > 0 ? (unmatched / totalMatches) * 100 : 0

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6">Matching Statistics</h2>

      {/* Overall success rate */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Overall Success Rate</span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {successRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
            style={{ width: `${successRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-sm text-gray-600 dark:text-gray-400">
          <span>
            {totalMatched} of {totalMatches} matched
          </span>
          <span>{unmatched} unmatched</span>
        </div>
      </div>

      {/* Match breakdown */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Match Breakdown</h3>

        {/* ISRC matches */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ISRC Match
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                99.9% accuracy
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {matchedByISRC}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${isrcPercent}%` }}
            />
          </div>
        </div>

        {/* Exact matches */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">✓</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Exact Match
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                98-99% accuracy
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {matchedByExact}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${exactPercent}%` }}
            />
          </div>
        </div>

        {/* Fuzzy matches */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">~</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fuzzy Match
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                70-95% accuracy
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {matchedByFuzzy}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${fuzzyPercent}%` }}
            />
          </div>
        </div>

        {/* Unmatched */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">✗</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unmatched
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                Needs review
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{unmatched}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${unmatchedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Matched</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">{totalMatched}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">Unmatched</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-300">{unmatched}</p>
        </div>
      </div>
    </div>
  )
}
