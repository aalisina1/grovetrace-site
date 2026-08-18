import { describe, it, expect } from 'vitest';
import { organizationLd, blogPostingLd, faqPageLd } from '../../src/lib/jsonld';

describe('organizationLd', () => {
  it('declares the schema.org context and Organization type', () => {
    const ld = organizationLd() as Record<string, unknown>;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Organization');
    expect(ld.url).toBe('https://grovetrace.com');
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
