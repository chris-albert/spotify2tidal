import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatching } from '@/hooks/useMatching'
import { SpotifyClient } from '@/lib/services/spotify/SpotifyClient'
import type { SpotifyArtist } from '@spotify2tidal/types'

/**
 * Extraction Route
 *
 * Simplified extraction that only handles followed artists.
 * Skips playlists and saved songs for now.
 */

function ExtractionPage() {
  const navigate = useNavigate()
  const { spotifyConnected, tidalConnected } = useAuth()
  const { matchAllArtists, isMatching } = useMatching()

  const [isExtracting, setIsExtracting] = useState(false)
  const [currentStage, setCurrentStage] = useState<string>('')
  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [artists, setArtists] = useState<SpotifyArtist[]>([])

  useEffect(() => {
    // Redirect to home if not connected
    if (!spotifyConnected) {
      navigate({ to: '/' })
    }
  }, [spotifyConnected, navigate])

  const handleExtract = async () => {
    try {
      setIsExtracting(true)
      setError(null)

      // Extract followed artists only
      setCurrentStage('Extracting followed artists...')
      const followedArtists = await SpotifyClient.extractArtistsOnly(
        (current, total) => {
          setProgress({ current, total })
        }
      )

      setArtists(followedArtists)
      setCurrentStage(`Found ${followedArtists.length} artists!`)
      setProgress(null)

      // If Tidal is connected, start matching
      if (tidalConnected && followedArtists.length > 0) {
        setCurrentStage('Matching artists with Tidal...')
        await matchAllArtists(followedArtists)
        setCurrentStage('Matching complete!')
      }

      // Navigate to results page
      setTimeout(() => {
        navigate({ to: '/match' })
      }, 1500)
    } catch (err) {
      console.error('Extraction failed:', err)
      const message = err instanceof Error ? err.message : 'Extraction failed'
      setError(message)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="container-custom py-16">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Extract Spotify Artists</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!isExtracting && !isMatching ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click the button below to extract your followed artists from Spotify
                and match them to Tidal.
              </p>

              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  <strong>Simplified Mode:</strong> This extracts only followed artists.
                  Playlists and saved songs are skipped for faster processing.
                </p>
              </div>

              {!tidalConnected && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                    <strong>Note:</strong> Connect to Tidal first to automatically match your artists.
                    Without Tidal connected, extraction will complete but matching will be skipped.
                  </p>
                </div>
              )}

              <button
                onClick={handleExtract}
                className="w-full px-6 py-4 bg-spotify-green text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold text-lg"
              >
                {tidalConnected ? 'Extract & Match Artists' : 'Extract Artists'}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">{isMatching ? '🎯' : '🎵'}</div>
              <h2 className="text-xl font-semibold mb-2">{currentStage}</h2>
              {/* Show progress */}
              {progress && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>
                      {progress.current} / {progress.total} artists
                    </span>
                    <span>
                      {((progress.current / progress.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${isMatching ? 'bg-tidal-blue' : 'bg-spotify-green'}`}
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-8 flex justify-center">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isMatching ? 'border-tidal-blue' : 'border-spotify-green'}`}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/extract')({
  component: ExtractionPage,
})
