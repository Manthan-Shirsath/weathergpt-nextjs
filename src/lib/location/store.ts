export interface SavedLocation {
  name: string;
  display: string;
  lat: number;
  lon: number;
}

export const DEFAULT_LOCATION: SavedLocation = {
  name: 'Pune',
  display: 'Pune, Maharashtra, India',
  lat: 18.5204,
  lon: 73.8567,
};

export const LOCATION_COOKIE_KEY = 'skycast_location';

/**
 * Saves the selected location to document.cookie (accessible to Server Components)
 * and localStorage, then dispatches an event to notify client components.
 */
export function saveActiveLocation(loc: SavedLocation): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(loc);
    localStorage.setItem(LOCATION_COOKIE_KEY, serialized);
    // Cookie valid across all paths for 30 days
    document.cookie = `${LOCATION_COOKIE_KEY}=${encodeURIComponent(serialized)}; path=/; max-age=2592000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('skycast_location_change', { detail: loc }));
  } catch (err) {
    console.warn('[LocationStore] Failed to save active location:', err);
  }
}

/**
 * Reads the active location on client side from localStorage or document.cookie.
 */
export function getClientActiveLocation(): SavedLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCATION_COOKIE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    const match = document.cookie.match(new RegExp('(^| )' + LOCATION_COOKIE_KEY + '=([^;]+)'));
    if (match && match[2]) {
      return JSON.parse(decodeURIComponent(match[2]));
    }
  } catch (err) {
    console.warn('[LocationStore] Failed to read active location:', err);
  }
  return null;
}

/**
 * Parses the skycast_location from a standard HTTP Cookie header string.
 */
export function parseCookieHeader(cookieHeader?: string | null): SavedLocation | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${LOCATION_COOKIE_KEY}=([^;]+)`));
  if (!match || !match[2]) return null;
  return parseLocationCookie(match[2]);
}

/**
 * Parses the skycast_location cookie value on server side.
 */
export function parseLocationCookie(cookieValue?: string | null): SavedLocation | null {
  if (!cookieValue) return null;
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    try {
      return JSON.parse(cookieValue);
    } catch {
      return null;
    }
  }
}
