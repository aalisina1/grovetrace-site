// All site tunables in one place.
export const SITE = {
  name: 'Grovetrace',
  url: 'https://grovetrace.com',
  email: 'hello@grovetrace.com',
  tagline: 'EUDR compliance software: plot data in, accepted DDS out',
} as const;

/**
 * The product app's origin, e.g. 'https://app.grovetrace.com'.
 * Intentionally undefined until the app is actually deployed — a `Log in`
 * link that 404s in front of a prospect is worse than no link at all.
 * Setting this string is the entire "turn on login" change.
 */
export const APP_URL: string | undefined = undefined;

/** Cal.com event link, as `user/event-type`. */
export const CAL_LINK = 'grovetrace/demo';

/** Public by design — Web3Forms access keys ship in client HTML. */
export const WEB3FORMS_KEY = 'REPLACE_WITH_ACCESS_KEY_FROM_WEB3FORMS';

/** EUDR application date for medium and large operators (verified 2026-08-16). */
export const EUDR_DEADLINE = '2026-12-30';
