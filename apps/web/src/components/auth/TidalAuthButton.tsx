import { useState } from 'react'
import { TidalAuth } from '@/lib/services/tidal/TidalAuth'
import { CredentialsStore } from '@/lib/storage/CredentialsStore'
import { useAuth } from '@/hooks/useAuth'

interface TidalAuthButtonProps {
  className?: string
}

export default function TidalAuthButton({
  className = '',
}: TidalAuthButtonProps) {
  const { tidalConnected, tidalUserId, disconnectTidal } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showClientIdModal, setShowClientIdModal] = useState(false)
  const [clientIdInput, setClientIdInput] = useState('')

  const handleConnect = async () => {
    // Check if client ID is configured
    const clientId = CredentialsStore.getTidalClientId()
    if (!clientId) {
      setShowClientIdModal(true)
      return
    }

    try {
      setIsLoading(true)
      await TidalAuth.initiateAuth()
    } catch (error) {
      console.error('Failed to initiate auth:', error)
      setIsLoading(false)
      alert('Failed to connect to Tidal. Please try again.')
    }
  }

  const handleSaveClientId = async () => {
    if (!clientIdInput.trim()) {
      alert('Please enter a valid Client ID')
      return
    }

    CredentialsStore.saveTidalClientId(clientIdInput.trim())
    setShowClientIdModal(false)
    setClientIdInput('')

    // Now initiate auth
    try {
      setIsLoading(true)
      await TidalAuth.initiateAuth()
    } catch (error) {
      console.error('Failed to initiate auth:', error)
      setIsLoading(false)
      alert('Failed to connect to Tidal. Please try again.')
    }
  }

  const handleDisconnect = () => {
    if (
      confirm(
        'Are you sure you want to disconnect your Tidal account?'
      )
    ) {
      disconnectTidal()
    }
  }

  if (tidalConnected) {
    return (
      <div
        className={`flex items-center gap-3 bg-tidal-blue/10 border border-tidal-blue/20 rounded-lg p-4 ${className}`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✅</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Tidal Connected
            </span>
          </div>
          {tidalUserId && (
            <p className="text-sm text-gray-600 dark:text-gray-400">User ID: {tidalUserId}</p>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={`px-6 py-3 bg-tidal-blue text-black rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold ${className}`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.115 17.115c-.241 0-.483-.121-.604-.362-1.449-2.412-3.982-3.865-6.771-3.865-1.328 0-2.656.241-3.863.724-.241.121-.604 0-.724-.241-.121-.241 0-.604.241-.724 1.328-.604 2.777-.845 4.346-.845 3.019 0 5.794 1.57 7.364 4.225.121.241 0 .604-.241.724-.121.241-.362.362-.483.362h-.265zm.845-2.656c-.241 0-.483-.121-.604-.362-1.691-2.898-4.829-4.588-8.088-4.588-1.57 0-3.14.362-4.588.966-.241.121-.604 0-.724-.241-.121-.241 0-.604.241-.724 1.57-.724 3.26-1.087 4.95-1.087 3.743 0 7.243 1.932 9.176 5.069.121.241 0 .604-.241.724-.121.121-.241.241-.362.241h.24z"/>
            </svg>
            <span>Connect Tidal</span>
          </>
        )}
      </button>

      {/* Client ID Modal */}
      {showClientIdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Enter Tidal Client ID
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              To connect to Tidal, you need to provide your Tidal Developer App Client ID.
              You can create one at{' '}
              <a
                href="https://developer.tidal.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tidal-blue hover:underline"
              >
                developer.tidal.com
              </a>
            </p>
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="Enter your Tidal Client ID"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tidal-blue"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveClientId()
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClientIdModal(false)
                  setClientIdInput('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClientId}
                className="flex-1 px-4 py-2 bg-tidal-blue text-black rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
