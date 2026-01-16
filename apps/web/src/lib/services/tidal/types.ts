/**
 * Tidal API response types
 * These complement the types in @spotify2tidal/types package
 */

export interface TidalSearchResponse {
  tracks?: {
    items: TidalTrackResponse[]
    totalNumberOfItems: number
  }
  albums?: {
    items: TidalAlbumResponse[]
    totalNumberOfItems: number
  }
  artists?: {
    items: TidalArtistResponse[]
    totalNumberOfItems: number
  }
}

export interface TidalTrackResponse {
  id: number
  title: string
  duration: number
  isrc?: string
  explicit: boolean
  audioQuality: string
  artist: {
    id: number
    name: string
  }
  artists: Array<{
    id: number
    name: string
  }>
  album: {
    id: number
    title: string
    cover: string
  }
  url: string
}

export interface TidalAlbumResponse {
  id: number
  title: string
  numberOfTracks: number
  releaseDate: string
  duration: number
  explicit: boolean
  cover: string
  artists: Array<{
    id: number
    name: string
  }>
  url: string
}

export interface TidalArtistResponse {
  id: number
  name: string
  picture: string
  url: string
}

export interface TidalUserProfile {
  userId: number | string
  username?: string
  email?: string
  countryCode?: string
  fullName?: string
  firstName?: string
  lastName?: string
  nickname?: string
  created?: string
}

export interface TidalError {
  status: number
  subStatus: number
  userMessage: string
}

export interface TidalPaginatedResponse<T> {
  limit: number
  offset: number
  totalNumberOfItems: number
  items: T[]
}
