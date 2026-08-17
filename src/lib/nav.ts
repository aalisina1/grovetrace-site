export type NavLink = { label: string; href: string };

export function buildNavLinks(appUrl: string | undefined): NavLink[] {
  const links: NavLink[] = [
    { label: 'Product', href: '/#how-it-works' },
    { label: 'Blog', href: '/blog/' },
  ];
  if (appUrl) {
    links.push({ label: 'Log in', href: `${appUrl.replace(/\/+$/, '')}/login` });
  }
  links.push({ label: 'Book a demo', href: '/demo/' });
  return links;
}
