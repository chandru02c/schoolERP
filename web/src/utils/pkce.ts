/**
 * File: pkce.ts
 * Description: PKCE (Proof Key for Code Exchange) utilities using native Web Crypto API.
 */

const PKCE_VERIFIER_KEY = 'cognito_pkce_code_verifier';

/**
 * Base64URL encoding without padding
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a random 32-byte (Base64URL-encoded) PKCE code_verifier string
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

/**
 * Compute SHA-256 code_challenge from code_verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

/**
 * Generate PKCE pair, save verifier in sessionStorage, return challenge
 */
export async function setupPkce(): Promise<string> {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  return generateCodeChallenge(verifier);
}

/**
 * Get saved PKCE code_verifier from sessionStorage and optionally clear it
 */
export function getPkceVerifier(clear: boolean = true): string | null {
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (clear) {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  }
  return verifier;
}
