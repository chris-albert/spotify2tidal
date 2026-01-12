/**
 * Tidal API Types
 */

export interface TidalTrack {
  id: string
  title: string
  artist: TidalArtist
  artists: TidalArtist[]
  album: TidalAlbum
  isrc: string | null
  duration: number
  explicit: boolean
  url: string
}

export interface TidalArtist {
  id: string
  name: string
  url: string
}

export interface TidalAlbum {
  id: string
  title: string
  artists: TidalArtist[]
  releaseDate: string
  numberOfTracks: number
  url: string
  cover: string
}

export interface TidalPlaylist {
  id: string
  title: string
  description: string
  numberOfTracks: number
  url: string
}

export interface TidalSearchResult {
  tracks?: TidalTrack[]
  artists?: TidalArtist[]
  albums?: TidalAlbum[]
}
