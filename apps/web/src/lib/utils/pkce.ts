/**
 * PKCE (Proof Key for Code Exchange) utilities
 *
 * Implements OAuth 2.0 PKCE flow for secure browser-based authentication.
 * Uses Web Crypto API for cryptographically secure random generation.
 */

/**
 * Generate a cryptographically random code verifier
 *
 * @returns A base64-URL encoded random string (43-128 characters)
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

/**
 * Generate a code challenge from a verifier using SHA-256
 *
 * @param verifier - The code verifier
 * @returns A base64-URL encoded SHA-256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(hash))
}

/**
 * Base64-URL encode a byte array
 *
 * @param buffer - Byte array to encode
 * @returns Base64-URL encoded string
 */
function base64URLEncode(buffer: Uint8Array): string {
  // Convert to base64
  const base64 = btoa(String.fromCharCode(...Array.from(buffer)))

  // Make it URL-safe
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Validate a code verifier format
 *
 * @param verifier - The verifier to validate
 * @returns True if valid
 */
export function isValidCodeVerifier(verifier: string): boolean {
  // Must be 43-128 characters
  if (verifier.length < 43 || verifier.length > 128) {
    return false
  }

  // Must only contain [A-Z], [a-z], [0-9], -, ., _, ~
  const validChars = /^[A-Za-z0-9\-._~]+$/
  return validChars.test(verifier)
}
