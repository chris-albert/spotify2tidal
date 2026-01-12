/**
 * Migration Types
 */

import type { SpotifyTrack, SpotifyPlaylist, SpotifyAlbum, SpotifyArtist } from './spotify'
import type { TidalTrack, TidalAlbum, TidalArtist } from './tidal'

export type MatchMethod = 'isrc' | 'exact' | 'fuzzy' | 'unmatched'
export type MatchStatus = 'matched' | 'unmatched' | 'pending' | 'manual'

export interface TrackMatchResult {
  spotifyTrack: SpotifyTrack
  tidalTrack: TidalTrack | null
  status: MatchStatus
  method: MatchMethod
  confidence: number
  suggestions?: TidalTrack[]
}

export interface AlbumMatchResult {
  spotifyAlbum: SpotifyAlbum
  tidalAlbum: TidalAlbum | null
  status: MatchStatus
  method: MatchMethod
  confidence: number
}

export interface ArtistMatchResult {
  spotifyArtist: SpotifyArtist
  tidalArtist: TidalArtist | null
  status: MatchStatus
  method: MatchMethod
  confidence: number
}

export interface PlaylistMigrationResult {
  playlist: SpotifyPlaylist
  trackMatches: TrackMatchResult[]
  successRate: number
}

export interface MigrationStatistics {
  totalTracks: number
  totalPlaylists: number
  totalAlbums: number
  totalArtists: number
  matched: {
    byISRC: number
    byExact: number
    byFuzzy: number
    total: number
  }
  unmatched: number
  confidence: {
    high: number // > 0.95
    medium: number // 0.85 - 0.95
    low: number // < 0.85
  }
}

export interface MigrationExport {
  metadata: {
    exportDate: string
    spotifyUserId: string
    version: string
  }
  playlists: Array<{
    name: string
    description: string
    public: boolean
    collaborative: boolean
    tracks: Array<{
      spotify: {
        name: string
        artist: string
        album: string
        isrc: string | null
        uri: string
      }
      tidal: {
        id: string
        title: string
        artist: string
      } | null
      matchStatus: MatchStatus
      matchMethod: MatchMethod
      confidence: number
    }>
  }>
  albums: AlbumMatchResult[]
  artists: ArtistMatchResult[]
  statistics: MigrationStatistics
  unmatchedTracks: Array<{
    name: string
    artist: string
    album: string
    suggestions?: TidalTrack[]
  }>
}

export interface ExtractionProgress {
  stage: 'playlists' | 'albums' | 'artists' | 'complete'
  current: number
  total: number
  currentItem?: string
}

export interface MatchingProgress {
  current: number
  total: number
  currentTrack?: string
}
