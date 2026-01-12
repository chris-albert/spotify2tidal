import type { MatchMethod } from '@spotify2tidal/types'

interface ConfidenceScoreProps {
  confidence: number
  method: MatchMethod
  className?: string
}

/**
 * ConfidenceScore - Badge displaying match confidence and method
 *
 * Color coding:
 * - Green (≥0.95): High confidence
 * - Yellow (0.85-0.95): Medium confidence
 * - Orange (0.70-0.85): Low confidence
 * - Red (<0.70): Unmatched
 */
export default function ConfidenceScore({
  confidence,
  method,
  className = '',
}: ConfidenceScoreProps) {
  // Determine badge style based on confidence
  const getBadgeStyle = () => {
    if (method === 'unmatched') {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: '❌',
        label: 'Unmatched',
      }
    }

    if (confidence >= 0.95) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: '✅',
        label: 'High',
      }
    }

    if (confidence >= 0.85) {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: '⚠️',
        label: 'Medium',
      }
    }

    return {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: '⚠️',
      label: 'Low',
    }
  }

  const getMethodLabel = () => {
    switch (method) {
      case 'isrc':
        return 'ISRC'
      case 'exact':
        return 'Exact'
      case 'fuzzy':
        return 'Fuzzy'
      case 'unmatched':
        return 'None'
      default:
        return 'Unknown'
    }
  }

  const style = getBadgeStyle()
  const percentage = (confidence * 100).toFixed(0)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Confidence badge */}
      <div
        className={`px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border} text-sm font-semibold flex items-center gap-1.5`}
      >
        <span>{style.icon}</span>
        <span>
          {method === 'unmatched' ? 'Unmatched' : `${percentage}%`}
        </span>
      </div>

      {/* Method badge */}
      <div className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
        {getMethodLabel()}
      </div>
    </div>
  )
}
