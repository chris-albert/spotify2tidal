import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import SpotifyAuthButton from '@/components/auth/SpotifyAuthButton'
import TidalAuthButton from '@/components/auth/TidalAuthButton'

function HomePage() {
  const navigate = useNavigate()
  const { initializeAuth, spotifyConnected, tidalConnected } = useAuth()

  useEffect(() => {
    // Initialize auth state on mount
    initializeAuth()
  }, [initializeAuth])

  const handleStartExtraction = () => {
    if (spotifyConnected) {
      navigate({ to: '/extract' })
    }
  }

  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-spotify-green to-tidal-blue bg-clip-text text-transparent">
            Spotify to Tidal Migration
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Seamlessly transfer your music library, playlists, and favorite artists from Spotify to Tidal
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🎵</div>
            <h3 className="text-lg font-semibold mb-2">Smart Matching</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Uses ISRC codes and fuzzy matching for high-accuracy track matching
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Detailed Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Review match confidence scores and manually verify uncertain matches
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">💾</div>
            <h3 className="text-lg font-semibold mb-2">Export Ready</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Export your migration plan to JSON for future import when Tidal API is ready
            </p>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Get Started</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-spotify-green text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Connect Spotify</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Authorize access to your Spotify account to extract your library
                </p>
                <SpotifyAuthButton className="w-full md:w-auto" />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-tidal-blue text-black rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Connect Tidal</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Authorize access to your Tidal account for track matching
                </p>
                <TidalAuthButton className="w-full md:w-auto" />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Start Extraction</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Extract, match, and export your music library
                </p>
                <button
                  onClick={handleStartExtraction}
                  disabled={!spotifyConnected}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {spotifyConnected ? 'Start Extraction' : 'Connect Spotify First'}
                </button>
                {spotifyConnected && !tidalConnected && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    💡 Tip: Connect Tidal first for better matching accuracy
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-200">⚠️ Important Note</h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Tidal's official API currently does not support playlist creation or library management.
            This tool will match your tracks and export a migration plan. Full automated migration
            will be available when Tidal's API is complete.
          </p>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
