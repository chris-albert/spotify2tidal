import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  TrackMatchResult,
  AlbumMatchResult,
  ArtistMatchResult,
  MigrationStatistics,
  MatchingProgress,
} from '@spotify2tidal/types'

export interface MatchingState {
  // Match results
  trackMatches: TrackMatchResult[]
  albumMatches: AlbumMatchResult[]
  artistMatches: ArtistMatchResult[]

  // Statistics
  statistics: MigrationStatistics | null

  // Progress
  progress: MatchingProgress | null
  isMatching: boolean
  matchingComplete: boolean

  // Error handling
  error: string | null

  // Actions
  startMatching: () => void
  setProgress: (progress: MatchingProgress) => void
  addTrackMatch: (match: TrackMatchResult) => void
  addAlbumMatch: (match: AlbumMatchResult) => void
  addArtistMatch: (match: ArtistMatchResult) => void
  setStatistics: (stats: MigrationStatistics) => void
  completeMatching: () => void
  setError: (error: string) => void
  clearError: () => void
  updateTrackMatch: (trackId: string, match: TrackMatchResult) => void
  reset: () => void
}

const initialState = {
  trackMatches: [],
  albumMatches: [],
  artistMatches: [],
  statistics: null,
  progress: null,
  isMatching: false,
  matchingComplete: false,
  error: null,
}

export const useMatchingStore = create<MatchingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startMatching: () =>
        set({
          isMatching: true,
          matchingComplete: false,
          error: null,
          trackMatches: [],
          albumMatches: [],
          artistMatches: [],
          progress: {
            current: 0,
            total: 0,
          },
        }),

      setProgress: (progress) =>
        set({ progress }),

      addTrackMatch: (match) =>
        set((state) => ({
          trackMatches: [...state.trackMatches, match],
        })),

      addAlbumMatch: (match) =>
        set((state) => ({
          albumMatches: [...state.albumMatches, match],
        })),

      addArtistMatch: (match) =>
        set((state) => ({
          artistMatches: [...state.artistMatches, match],
        })),

      setStatistics: (stats) =>
        set({ statistics: stats }),

      completeMatching: () =>
        set({
          isMatching: false,
          matchingComplete: true,
          progress: null,
        }),

      setError: (error) =>
        set({
          error,
          isMatching: false,
        }),

      clearError: () =>
        set({ error: null }),

      updateTrackMatch: (trackId, match) =>
        set((state) => ({
          trackMatches: state.trackMatches.map((m) =>
            m.spotifyTrack.id === trackId ? match : m
          ),
        })),

      reset: () =>
        set(initialState),
    }),
    {
      name: 'spotify2tidal-matching',
      partialize: (state) => ({
        trackMatches: state.trackMatches,
        albumMatches: state.albumMatches,
        artistMatches: state.artistMatches,
        statistics: state.statistics,
        matchingComplete: state.matchingComplete,
      }),
    }
  )
)
