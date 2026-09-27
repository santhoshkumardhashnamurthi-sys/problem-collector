import crypto from 'crypto';
import { NextRequest } from 'next/server';

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME?.trim() || '';
  const password = process.env.ADMIN_PASSWORD?.trim() || '';
  return {
    username,
    password,
    isConfigured: Boolean(username && password),
  };
}

const getSessionSecret = () => process.env.SESSION_SECRET || 'artix-secure-session-secret-2026-key';

export const COOKIE_NAME = 'artix_admin_token';

/**
 * Creates a signed HMAC session token containing timestamp and username
 */
export function createSessionToken(username: string): string {
  const timestamp = Date.now();
  const payload = `${username}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/**
 * Verifies an HMAC session token and checks expiry (24 hours)
 */
export function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const [username, timestampStr, signature] = parts;
    const { username: validUsername } = getAdminCredentials();
    if (username !== validUsername) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // 24 hours expiry
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) return false;

    // Check signature
    const hmac = crypto.createHmac('sha256', getSessionSecret());
    hmac.update(`${username}:${timestampStr}`);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Verifies if the request contains a valid admin session cookie
 */
export function verifyAdminSession(request: NextRequest): boolean {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie || !cookie.value) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return verifySessionToken(authHeader.substring(7));
    }
    return false;
  }
  return verifySessionToken(cookie.value);
}
