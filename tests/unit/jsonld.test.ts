import { describe, it, expect } from 'vitest';
import {
  organizationLd,
  softwareApplicationLd,
  blogPostingLd,
  faqPageLd,
  breadcrumbLd,
  jsonLdScript,
} from '../../src/lib/jsonld';

describe('organizationLd', () => {
  it('declares the schema.org context and Organization type', () => {
    const ld = organizationLd() as Record<string, unknown>;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Organization');
    // trailingSlash: 'always' — matches the canonical tag and
    // blogPostingLd's mainEntityOfPage['@id'], both of which trail-slash.
    expect(ld.url).toBe('https://grovetrace.com/');
  });

  it('gives logo as an absolute https URL', () => {
    const ld = organizationLd() as Record<string, unknown>;
    expect(ld.logo).toMatch(/^https:\/\//);
    expect(ld.logo).toBe('https://grovetrace.com/img/grovetrace-mark.svg');
  });
});

describe('softwareApplicationLd', () => {
  it('declares the schema.org context and SoftwareApplication type', () => {
    const ld = softwareApplicationLd() as Record<string, unknown>;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('SoftwareApplication');
    expect(ld.name).toBe('Grovetrace');
    expect(ld.applicationCategory).toBe('BusinessApplication');
    expect(ld.operatingSystem).toBe('Web');
    // trailingSlash: 'always' — matches organizationLd().url.
    expect(ld.url).toBe('https://grovetrace.com/');
  });
});

describe('blogPostingLd', () => {
  it('emits absolute canonical URLs and ISO dates', () => {
    const ld = blogPostingLd({
      title: 'Test post',
      description: 'A test',
      slug: 'test-post',
      publishDate: new Date('2026-08-16T00:00:00Z'),
      author: 'Grovetrace',
    }) as Record<string, any>;
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.mainEntityOfPage['@id']).toBe('https://grovetrace.com/blog/test-post/');
    expect(ld.datePublished).toBe('2026-08-16');
  });

  it('omits dateModified when there is no update', () => {
    const ld = blogPostingLd({
      title: 'x', description: 'y', slug: 'z',
      publishDate: new Date('2026-08-16T00:00:00Z'), author: 'Grovetrace',
    }) as Record<string, unknown>;
    expect(ld).not.toHaveProperty('dateModified');
  });

  it('defaults image to the site OG card when the post supplies none', () => {
    const ld = blogPostingLd({
      title: 'x', description: 'y', slug: 'z',
      publishDate: new Date('2026-08-16T00:00:00Z'), author: 'Grovetrace',
    }) as Record<string, unknown>;
    expect(ld.image).toBe('https://grovetrace.com/img/og-default.png');
  });

  it('uses the post-supplied image when given one', () => {
    const ld = blogPostingLd({
      title: 'x', description: 'y', slug: 'z',
      publishDate: new Date('2026-08-16T00:00:00Z'), author: 'Grovetrace',
      image: 'https://grovetrace.com/img/blog/z-cover.png',
    }) as Record<string, unknown>;
    expect(ld.image).toBe('https://grovetrace.com/img/blog/z-cover.png');
  });
});

describe('faqPageLd', () => {
  it('maps each item to a Question with an acceptedAnswer', () => {
    const ld = faqPageLd([{ q: 'Does it apply to me?', a: 'If you place cocoa on the EU market, yes.' }]) as Record<string, any>;
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(1);
    expect(ld.mainEntity[0]['@type']).toBe('Question');
    expect(ld.mainEntity[0].name).toBe('Does it apply to me?');
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('If you place cocoa on the EU market, yes.');
  });
});

describe('breadcrumbLd', () => {
  it('assigns 1-based sequential positions and preserves absolute item URLs', () => {
    const items = [
      { name: 'Home', url: 'https://grovetrace.com/' },
      { name: 'Blog', url: 'https://grovetrace.com/blog/' },
      { name: 'Test post', url: 'https://grovetrace.com/blog/test-post/' },
    ];
    const ld = breadcrumbLd(items) as Record<string, any>;
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toHaveLength(3);
    ld.itemListElement.forEach((el: Record<string, unknown>, i: number) => {
      expect(el['@type']).toBe('ListItem');
      expect(el.position).toBe(i + 1);
      expect(el.item).toMatch(/^https:\/\//);
      expect(el.item).toBe(items[i].url);
      expect(el.name).toBe(items[i].name);
    });
  });
});

describe('jsonLdScript', () => {
  it('serializes a plain object to valid, parseable JSON', () => {
    const block = { '@type': 'Organization', name: 'Grovetrace' };
    expect(JSON.parse(jsonLdScript(block))).toEqual(block);
  });

  it('neutralises a </script>-breakout payload without changing the parsed value', () => {
    const block = {
      '@type': 'BlogPosting',
      description: 'Read more </script><script>alert(1)</script> here.',
    };
    const serialized = jsonLdScript(block);
    expect(serialized).not.toContain('</script>');
    expect(JSON.parse(serialized)).toEqual(block);
  });
});
