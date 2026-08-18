import { SITE } from '../config';

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    // trailingSlash: 'always' — matches the canonical tag and
    // blogPostingLd's mainEntityOfPage['@id'].
    url: `${SITE.url}/`,
    logo: `${SITE.url}/img/grovetrace-mark.svg`,
    description: SITE.tagline,
    contactPoint: {
      '@type': 'ContactPoint',
      email: SITE.email,
      contactType: 'sales',
    },
  };
}

export function softwareApplicationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: SITE.tagline,
    url: SITE.url,
  };
}

export function blogPostingLd(input: {
  title: string;
  description: string;
  slug: string;
  publishDate: Date;
  updatedDate?: Date;
  author: string;
  image?: string;
}) {
  const url = `${SITE.url}/blog/${input.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    image: input.image ?? `${SITE.url}/img/og-default.png`,
    datePublished: iso(input.publishDate),
    ...(input.updatedDate ? { dateModified: iso(input.updatedDate) } : {}),
    author: { '@type': 'Organization', name: input.author },
    publisher: { '@type': 'Organization', name: SITE.name },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

export function faqPageLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export function breadcrumbLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Serializes a JSON-LD object for a `<script type="application/ld+json">`
 * tag, escaping `<` so a value containing the literal string `</script>`
 * can't break out of the tag. The JSON escape sequence u003c is valid JSON,
 * so `JSON.parse` on the script's contents still recovers the original `<` —
 * this only changes the raw HTML text, never the parsed value. Static copy
 * never needed this, but author-written FAQ/blog content flowing through
 * jsonLd props does.
 */
export function jsonLdScript(block: object): string {
  return JSON.stringify(block).replace(/</g, '\\u003c');
}
