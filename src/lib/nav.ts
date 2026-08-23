export type NavLink = { label: string; href: string };

/**
 * `appUrl` and `hasBlog` are both gates on the same principle: a nav link that
 * 404s in front of a prospect is worse than no link at all. The product is not
 * deployed yet, and the blog ships in a later pass — until each exists, its
 * link stays out.
 */
export function buildNavLinks(
  appUrl: string | undefined,
  hasBlog = false,
): NavLink[] {
  const links: NavLink[] = [{ label: 'Product', href: '/#how-it-works' }];
  if (hasBlog) {
    links.push({ label: 'Blog', href: '/blog/' });
  }
  if (appUrl) {
    links.push({ label: 'Log in', href: `${appUrl.replace(/\/+$/, '')}/login` });
  }
  links.push({ label: 'Book a demo', href: '/demo/' });
  return links;
}
