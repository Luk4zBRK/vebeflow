/**
 * Property-Based Tests for formatBlogPostMessage
 * 
 * Feature: slack-community-integration
 * Task: 2.7 Write property test for blog post message formatting
 * 
 * These property-based tests validate that the formatBlogPostMessage function
 * maintains correctness properties across all possible valid inputs using
 * fast-check for randomized testing.
 * 
 * **Validates: Requirements 4.2, 4.3**
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { formatBlogPostMessage } from '../formatters';

describe('formatBlogPostMessage - Property-Based Tests', () => {
  /**
   * Property 9: Blog post message content
   * 
   * For any blog post, the formatted Slack message should include:
   * - The post title
   * - The excerpt (first 200 characters if excerpt is null)
   * - A featured image accessory (if cover_image_url present)
   * - A "Read More" button with correct URL
   * 
   * **Validates: Requirements 4.2, 4.3**
   */
  test('Property 9: Blog post message content', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary blog post objects
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            // Ensure slug is URL-safe
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          excerpt: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1, maxLength: 2000 }),
          cover_image_url: fc.option(
            fc.webUrl({ validSchemes: ['https'] }),
            { nil: null }
          ),
          status: fc.constant('published'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          
          // Property 1: Should include the post title in section block
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          expect(sectionBlock?.text?.text).toContain(post.title);
          
          // Property 2: Should include excerpt if present, or first 200 chars of content
          if (post.excerpt !== null && post.excerpt !== undefined) {
            // Use provided excerpt
            expect(sectionBlock?.text?.text).toContain(post.excerpt);
          } else {
            // Use first 200 chars of content
            const expectedExcerpt = post.content.substring(0, 200);
            expect(sectionBlock?.text?.text).toContain(expectedExcerpt);
            
            // Should have ellipsis if content is longer than 200 chars
            if (post.content.length > 200) {
              expect(sectionBlock?.text?.text).toContain('...');
            }
          }
          
          // Property 3: Should have "Read More" button with correct URL
          const actionsBlock = message.blocks.find(b => b.type === 'actions');
          const button = actionsBlock?.elements?.[0];
          const expectedUrl = `https://vibeflow.site/blog/${post.slug}`;
          expect(button?.url).toBe(expectedUrl);
          expect(button?.text).toEqual({
            type: 'plain_text',
            text: 'Ler Mais',
            emoji: true,
          });
          
          // Property 4: Should have image accessory if cover_image_url present
          if (post.cover_image_url) {
            expect(sectionBlock?.accessory).toBeDefined();
            expect(sectionBlock?.accessory?.type).toBe('image');
            expect(sectionBlock?.accessory?.image_url).toBe(post.cover_image_url);
            expect(sectionBlock?.accessory?.alt_text).toBe(post.title);
          }
          
          // Property 5: Should not have image accessory if cover_image_url is null
          if (!post.cover_image_url) {
            expect(sectionBlock?.accessory).toBeUndefined();
          }
          
          // Property 6: Should have exactly 3 blocks (header, section, actions)
          expect(message.blocks).toHaveLength(3);
          
          // Property 7: Block types should be in correct order
          expect(message.blocks[0].type).toBe('header');
          expect(message.blocks[1].type).toBe('section');
          expect(message.blocks[2].type).toBe('actions');
          
          // Property 8: Header should have the standard text
          expect(message.blocks[0].text?.text).toBe('📝 Novo Artigo Publicado!');
          expect(message.blocks[0].text?.type).toBe('plain_text');
          expect(message.blocks[0].text?.emoji).toBe(true);
          
          // Property 9: Section should use markdown formatting
          expect(sectionBlock?.text?.type).toBe('mrkdwn');
          
          // Property 10: Title should be bold in section text
          expect(sectionBlock?.text?.text).toContain(`*${post.title}*`);
          
          // Property 11: Actions block should have exactly one button
          expect(actionsBlock?.elements).toHaveLength(1);
          expect(button?.type).toBe('button');
          
          // Property 12: Button should be primary style
          expect(button?.style).toBe('primary');
          
          // Property 13: Should have fallback text
          expect(message.text).toBeDefined();
          expect(message.text).toContain(post.title);
          expect(message.text).toContain('Novo Artigo Publicado');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message structure is always valid Block Kit format
   * 
   * For any blog post, the formatted message should always conform to
   * Slack Block Kit structure requirements.
   */
  test('Property: Message always has valid Block Kit structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          excerpt: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1, maxLength: 2000 }),
          cover_image_url: fc.option(
            fc.webUrl({ validSchemes: ['https'] }),
            { nil: null }
          ),
          status: fc.constantFrom('published', 'draft'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          
          // Should have blocks array
          expect(message).toHaveProperty('blocks');
          expect(Array.isArray(message.blocks)).toBe(true);
          
          // All blocks should have a type
          message.blocks.forEach((block) => {
            expect(block).toHaveProperty('type');
            expect(['header', 'section', 'actions', 'context', 'divider']).toContain(block.type);
          });
          
          // Header block should have text with type and text content
          const headerBlock = message.blocks.find(b => b.type === 'header');
          expect(headerBlock).toBeDefined();
          expect(headerBlock?.text).toBeDefined();
          expect(headerBlock?.text?.type).toBe('plain_text');
          expect(headerBlock?.text?.text).toBeTruthy();
          
          // Section block should have text with type and text content
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          expect(sectionBlock).toBeDefined();
          expect(sectionBlock?.text).toBeDefined();
          expect(sectionBlock?.text?.type).toBe('mrkdwn');
          expect(sectionBlock?.text?.text).toBeTruthy();
          
          // Actions block should have elements array
          const actionsBlock = message.blocks.find(b => b.type === 'actions');
          expect(actionsBlock).toBeDefined();
          expect(actionsBlock?.elements).toBeDefined();
          expect(Array.isArray(actionsBlock?.elements)).toBe(true);
          expect(actionsBlock?.elements?.length).toBeGreaterThan(0);
          
          // Button element should have required properties
          const button = actionsBlock?.elements?.[0];
          expect(button?.type).toBe('button');
          expect(button?.text).toBeDefined();
          expect(button?.url).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: URL construction is always valid
   * 
   * For any blog post slug, the constructed URL should always be valid
   * and follow the expected pattern.
   */
  test('Property: URL construction is always valid', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          excerpt: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1 }),
          cover_image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          status: fc.constant('published'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          const actionsBlock = message.blocks.find(b => b.type === 'actions');
          const button = actionsBlock?.elements?.[0];
          
          // URL should be defined
          expect(button?.url).toBeDefined();
          
          // URL should start with the base URL
          expect(button?.url).toMatch(/^https:\/\/vibeflow\.site\/blog\//);
          
          // URL should end with the slug
          expect(button?.url).toBe(`https://vibeflow.site/blog/${post.slug}`);
          
          // URL should be a valid URL
          expect(() => new URL(button?.url || '')).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Excerpt generation from content
   * 
   * For any blog post with null excerpt, the message should use the first
   * 200 characters of content, with ellipsis if content is longer.
   */
  test('Property: Excerpt generation from content when excerpt is null', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          excerpt: fc.constant(null),
          content: fc.string({ minLength: 1, maxLength: 2000 }),
          cover_image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          status: fc.constant('published'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          
          // Should contain first 200 chars of content
          const expectedExcerpt = post.content.substring(0, 200);
          expect(sectionBlock?.text?.text).toContain(expectedExcerpt);
          
          // Should have ellipsis if content is longer than 200 chars
          if (post.content.length > 200) {
            expect(sectionBlock?.text?.text).toContain('...');
          } else {
            // Should not have ellipsis if content is 200 chars or less
            expect(sectionBlock?.text?.text).not.toContain('...');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty or null excerpt handling
   * 
   * For any blog post with empty string excerpt, the message should
   * use the empty excerpt (not fall back to content).
   */
  test('Property: Handles empty string excerpt correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          excerpt: fc.constant(''),
          content: fc.string({ minLength: 1, maxLength: 2000 }),
          cover_image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          status: fc.constant('published'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          
          // Should have section text
          expect(sectionBlock?.text?.text).toBeDefined();
          
          // Should contain title
          expect(sectionBlock?.text?.text).toContain(post.title);
          
          // For empty excerpt, text should be just the bold title and newline
          expect(sectionBlock?.text?.text).toBe(`*${post.title}*\n`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Image accessory is conditional
   * 
   * For any blog post, the image accessory should be present if and only if
   * cover_image_url is provided and not null.
   */
  test('Property: Image accessory presence matches cover_image_url presence', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          excerpt: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1 }),
          cover_image_url: fc.option(
            fc.webUrl({ validSchemes: ['https'] }),
            { nil: null }
          ),
          status: fc.constant('published'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          
          if (post.cover_image_url) {
            // Should have accessory
            expect(sectionBlock?.accessory).toBeDefined();
            expect(sectionBlock?.accessory?.type).toBe('image');
            expect(sectionBlock?.accessory?.image_url).toBe(post.cover_image_url);
            expect(sectionBlock?.accessory?.alt_text).toBe(post.title);
          } else {
            // Should not have accessory
            expect(sectionBlock?.accessory).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fallback text is always present and meaningful
   * 
   * For any blog post, the message should have a fallback text that
   * includes the post title for notification purposes.
   */
  test('Property: Fallback text is always present and contains title', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          excerpt: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1 }),
          cover_image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          status: fc.constant('published'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          
          // Should have fallback text
          expect(message.text).toBeDefined();
          expect(typeof message.text).toBe('string');
          
          // Should contain the post title
          expect(message.text).toContain(post.title);
          
          // Should indicate it's a new article
          expect(message.text).toContain('Novo Artigo Publicado');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Special characters are preserved
   * 
   * For any blog post with special characters in title or excerpt,
   * those characters should be preserved in the message (not escaped or removed).
   */
  test('Property: Special characters are preserved in text', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          // Include various special characters
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          excerpt: fc.option(
            fc.string({ minLength: 1, maxLength: 500 }),
            { nil: null }
          ),
          content: fc.string({ minLength: 1 }),
          cover_image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          status: fc.constant('published'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          
          // Title should be present in section text
          expect(sectionBlock?.text?.text).toContain(post.title);
          
          // Excerpt should be present if it exists
          if (post.excerpt) {
            expect(sectionBlock?.text?.text).toContain(post.excerpt);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
