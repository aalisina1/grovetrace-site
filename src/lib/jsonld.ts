import { SITE } from '../config';

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
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
}) {
  const url = `${SITE.url}/blog/${input.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
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
