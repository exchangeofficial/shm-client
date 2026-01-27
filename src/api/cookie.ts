// Cookie utilities for session management

const COOKIE_NAME = 'session-id';
const COOKIE_DAYS = 3;

export function setCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(): string | null {
  const name = COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removeCookie(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

// Extend cookie expiration (call on each API request)
export function extendCookie(): void {
  const value = getCookie();
  if (value) {
    setCookie(value);
  }
}
