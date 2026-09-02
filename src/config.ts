// All site tunables in one place.
export const SITE = {
  name: 'Grovetrace',
  url: 'https://grovetrace.com',
  email: 'hello@grovetrace.com',
  tagline: 'EUDR compliance software: plot data in, accepted DDS out',
} as const;

/**
 * The product app's origin.
 *
 * Held at `undefined` until the app was actually deployed — a `Log in` link
 * that 404s in front of a prospect is worse than no link at all. Turned on
 * 2026-08-31, once app.grovetrace.com was serving over TLS and the full login
 * path was verified end to end: /login returns 200, and authenticating as a
 * seeded user through the deployed API returns tokens and org-scoped data.
 */
export const APP_URL: string | undefined = 'https://app.grovetrace.com';

/** Cal.com event link, as `user/event-type`. */
export const CAL_LINK = 'ali-ahmadi-yp5bv1/grovetrace-demo';
