import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSpotify } from '@/hooks/useSpotify'
import { SpotifyClient } from '@/lib/services/spotify/SpotifyClient'

/**
 * Extraction Route
 *
 * Allows users to extract their complete Spotify library including:
 * - Playlists with all tracks
 * - Saved albums
 * - Followed artists
 */

function ExtractionPage() {
  const navigate = useNavigate()
  const { spotifyConnected } = useAuth()
  const { setLibrary } = useSpotify()

  const [isExtracting, setIsExtracting] = useState(false)
  const [currentStage, setCurrentStage] = useState<string>('')
  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

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

      const library = await SpotifyClient.extractLibrary(
        (stage) => {
          setCurrentStage(
            stage === 'playlists'
              ? 'Extracting playlists...'
              : stage === 'albums'
              ? 'Extracting saved albums...'
              : stage === 'artists'
              ? 'Extracting followed artists...'
              : 'Complete!'
          )
        },
        (stageName, current, total) => {
          setProgress({ current, total })
        }
      )

      // Save to store
      setLibrary(library)

      // Navigate to matching page
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
          <h1 className="text-3xl font-bold mb-6">Extract Spotify Library</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!isExtracting ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click the button below to extract your complete Spotify library.
                This includes:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-8 space-y-2">
                <li>All playlists (public, private, and collaborative)</li>
                <li>Saved albums</li>
                <li>Followed artists</li>
              </ul>
              <button
                onClick={handleExtract}
                className="w-full px-6 py-4 bg-spotify-green text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold text-lg"
              >
                Start Extraction
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎵</div>
              <h2 className="text-xl font-semibold mb-2">{currentStage}</h2>
              {progress && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>
                      {progress.current} / {progress.total}
                    </span>
                    <span>
                      {((progress.current / progress.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-spotify-green h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
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
