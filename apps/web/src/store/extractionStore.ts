import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpotifyLibrary, ExtractionProgress } from '@spotify2tidal/types'

export interface ExtractionState {
  // Extracted data
  library: SpotifyLibrary | null

  // Progress tracking
  progress: ExtractionProgress | null
  isExtracting: boolean
  extractionComplete: boolean

  // Error handling
  error: string | null

  // Actions
  startExtraction: () => void
  setProgress: (progress: ExtractionProgress) => void
  setLibrary: (library: SpotifyLibrary) => void
  completeExtraction: () => void
  setError: (error: string) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  library: null,
  progress: null,
  isExtracting: false,
  extractionComplete: false,
  error: null,
}

export const useExtractionStore = create<ExtractionState>()(
  persist(
    (set) => ({
      ...initialState,

      startExtraction: () =>
        set({
          isExtracting: true,
          extractionComplete: false,
          error: null,
          progress: {
            stage: 'playlists',
            current: 0,
            total: 0,
          },
        }),

      setProgress: (progress) =>
        set({ progress }),

      setLibrary: (library) =>
        set({ library }),

      completeExtraction: () =>
        set({
          isExtracting: false,
          extractionComplete: true,
          progress: null,
        }),

      setError: (error) =>
        set({
          error,
          isExtracting: false,
        }),

      clearError: () =>
        set({ error: null }),

      reset: () =>
        set(initialState),
    }),
    {
      name: 'spotify2tidal-extraction',
      partialize: (state) => ({
        library: state.library,
        extractionComplete: state.extractionComplete,
      }),
    }
  )
)
