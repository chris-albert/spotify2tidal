import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SpotifyAuth } from '@/lib/services/spotify/SpotifyAuth'
import { SpotifyClient } from '@/lib/services/spotify/SpotifyClient'
import { useAuth } from '@/hooks/useAuth'

/**
 * Spotify OAuth Callback Route
 *
 * Handles the OAuth redirect from Spotify, exchanges the authorization code
 * for tokens, and redirects to the extraction page.
 */

function SpotifyCallbackPage() {
  const navigate = useNavigate()
  const { setSpotifyTokens, setSpotifyUserId } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Processing authentication...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL params
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const errorParam = params.get('error')

        // Check for error from Spotify
        if (errorParam) {
          throw new Error(`Authentication failed: ${errorParam}`)
        }

        if (!code) {
          throw new Error('No authorization code received')
        }

        // Exchange code for tokens
        setStatus('Exchanging authorization code...')
        const tokens = await SpotifyAuth.handleCallback(code)

        // Save tokens to store
        setSpotifyTokens(tokens)

        // Get user profile
        setStatus('Fetching user profile...')
        const user = await SpotifyClient.getCurrentUser()
        setSpotifyUserId(user.id)

        // Success! Redirect to extraction page
        setStatus('Success! Redirecting...')
        setTimeout(() => {
          navigate({ to: '/extract' })
        }, 1000)
      } catch (err) {
        console.error('OAuth callback error:', err)
        const message =
          err instanceof Error ? err.message : 'Authentication failed'
        setError(message)
      }
    }

    handleCallback()
  }, [navigate, setSpotifyTokens, setSpotifyUserId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {error ? (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                Authentication Failed
              </h1>
              <p className="text-gray-600">{error}</p>
            </div>
            <button
              onClick={() => navigate({ to: '/' })}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return Home
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Connecting to Spotify
            </h1>
            <p className="text-gray-600 mb-6">{status}</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/auth/spotify')({
  component: SpotifyCallbackPage,
})
