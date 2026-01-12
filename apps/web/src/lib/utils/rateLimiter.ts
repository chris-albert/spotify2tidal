/**
 * RateLimiter - Queue-based API rate limiting
 *
 * Ensures API calls don't exceed rate limits by queuing requests
 * and executing them at a controlled rate.
 */

type QueuedOperation<T> = () => Promise<T>

export class RateLimiter {
  private queue: Array<{
    operation: QueuedOperation<any>
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []

  private processing = false
  private lastExecutionTime = 0

  constructor(
    private requestsPerSecond: number,
    private burstSize: number = 1
  ) {}

  /**
   * Execute an operation with rate limiting
   *
   * @param operation - Async operation to execute
   * @returns Promise that resolves when operation completes
   */
  async execute<T>(operation: QueuedOperation<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject })
      this.processQueue()
    })
  }

  /**
   * Process the queue of operations
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      // Calculate delay needed to respect rate limit
      const now = Date.now()
      const timeSinceLastExecution = now - this.lastExecutionTime
      const minInterval = 1000 / this.requestsPerSecond
      const delay = Math.max(0, minInterval - timeSinceLastExecution)

      if (delay > 0) {
        await this.sleep(delay)
      }

      // Execute a burst of operations
      const burst = this.queue.splice(0, this.burstSize)

      await Promise.all(
        burst.map(async ({ operation, resolve, reject }) => {
          try {
            const result = await operation()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      )

      this.lastExecutionTime = Date.now()
    }

    this.processing = false
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Clear the queue (useful for cleanup)
   */
  clearQueue(): void {
    this.queue = []
  }
}

// Pre-configured rate limiters
export const spotifyRateLimiter = new RateLimiter(6, 3) // 6 req/sec, burst of 3
export const tidalRateLimiter = new RateLimiter(5, 2) // 5 req/sec, burst of 2
