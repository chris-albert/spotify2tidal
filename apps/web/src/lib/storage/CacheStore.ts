import type { TrackMatchResult, TidalTrack } from '@spotify2tidal/types'

/**
 * CacheStore - IndexedDB-based caching for match results
 *
 * Caches track matches to avoid re-matching the same tracks.
 * Uses IndexedDB for persistent storage across sessions.
 */

const DB_NAME = 'spotify2tidal_cache'
const DB_VERSION = 1
const MATCH_STORE = 'track_matches'
const ISRC_INDEX = 'isrc_index'

interface CacheEntry {
  spotifyTrackId: string
  isrc: string | null
  tidalTrack: TidalTrack | null
  matchMethod: string
  confidence: number
  cachedAt: number
}

export class CacheStore {
  private static db: IDBDatabase | null = null
  private static initPromise: Promise<void> | null = null

  /**
   * Initialize IndexedDB
   */
  private static async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(new Error('Failed to initialize cache'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(MATCH_STORE)) {
          const objectStore = db.createObjectStore(MATCH_STORE, {
            keyPath: 'spotifyTrackId',
          })

          // Create index on ISRC for faster lookups
          objectStore.createIndex(ISRC_INDEX, 'isrc', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Save a track match to cache
   */
  static async saveMatch(match: TrackMatchResult): Promise<void> {
    await this.init()

    if (!this.db) throw new Error('Database not initialized')

    const cacheEntry: CacheEntry = {
      spotifyTrackId: match.spotifyTrack.id,
      isrc: match.spotifyTrack.isrc,
      tidalTrack: match.tidalTrack,
      matchMethod: match.method,
      confidence: match.confidence,
      cachedAt: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MATCH_STORE], 'readwrite')
      const objectStore = transaction.objectStore(MATCH_STORE)
      const request = objectStore.put(cacheEntry)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('Failed to cache match:', request.error)
        reject(new Error('Failed to cache match'))
      }
    })
  }

  /**
   * Get a cached match by Spotify track ID
   */
  static async getMatchByTrackId(
    spotifyTrackId: string
  ): Promise<CacheEntry | null> {
    await this.init()

    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MATCH_STORE], 'readonly')
      const objectStore = transaction.objectStore(MATCH_STORE)
      const request = objectStore.get(spotifyTrackId)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined
        resolve(entry || null)
      }

      request.onerror = () => {
        console.error('Failed to retrieve cached match:', request.error)
        reject(new Error('Failed to retrieve cached match'))
      }
    })
  }

  /**
   * Get a cached match by ISRC code
   */
  static async getMatchByISRC(isrc: string): Promise<CacheEntry | null> {
    await this.init()

    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MATCH_STORE], 'readonly')
      const objectStore = transaction.objectStore(MATCH_STORE)
      const index = objectStore.index(ISRC_INDEX)
      const request = index.get(isrc)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined
        resolve(entry || null)
      }

      request.onerror = () => {
        console.error('Failed to retrieve cached match by ISRC:', request.error)
        reject(new Error('Failed to retrieve cached match'))
      }
    })
  }

  /**
   * Clear all cached matches
   */
  static async clearCache(): Promise<void> {
    await this.init()

    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MATCH_STORE], 'readwrite')
      const objectStore = transaction.objectStore(MATCH_STORE)
      const request = objectStore.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('Failed to clear cache:', request.error)
        reject(new Error('Failed to clear cache'))
      }
    })
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalEntries: number
    oldestEntry: number | null
    newestEntry: number | null
  }> {
    await this.init()

    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MATCH_STORE], 'readonly')
      const objectStore = transaction.objectStore(MATCH_STORE)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[]
        const timestamps = entries.map((e) => e.cachedAt)

        resolve({
          totalEntries: entries.length,
          oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
          newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
        })
      }

      request.onerror = () => {
        console.error('Failed to get cache stats:', request.error)
        reject(new Error('Failed to get cache stats'))
      }
    })
  }

  /**
   * Clear old cache entries (older than specified days)
   */
  static async clearOldEntries(daysOld: number = 30): Promise<number> {
    await this.init()

    if (!this.db) throw new Error('Database not initialized')

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MATCH_STORE], 'readwrite')
      const objectStore = transaction.objectStore(MATCH_STORE)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[]
        let deleteCount = 0

        entries.forEach((entry) => {
          if (entry.cachedAt < cutoffTime) {
            objectStore.delete(entry.spotifyTrackId)
            deleteCount++
          }
        })

        resolve(deleteCount)
      }

      request.onerror = () => {
        console.error('Failed to clear old entries:', request.error)
        reject(new Error('Failed to clear old entries'))
      }
    })
  }
}
