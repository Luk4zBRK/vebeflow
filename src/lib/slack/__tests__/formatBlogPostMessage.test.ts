/**
 * Unit Tests for formatBlogPostMessage
 * 
 * Feature: slack-community-integration
 * Task: 2.6 Implement formatBlogPostMessage function
 * 
 * These tests validate that the formatBlogPostMessage function correctly
 * formats blog post data into Slack Block Kit messages according to the
 * design specification.
 */

import { describe, test, expect } from '@jest/globals';
import { formatBlogPostMessage } from '../formatters';

describe('formatBlogPostMessage', () => {
  /**
   * Unit Test: Basic blog post message structure
   * 
   * Validates: Requirements 4.2, 4.3
   * - Message has header, section, and actions blocks
   * - Header contains emoji and Portuguese text
   * - Section contains title and excerpt
   * - Actions contains "Read More" button
   */
  test('creates message with header, section, and actions blocks', () => {
    const post = {
      id: '123',
      title: 'Test Blog Post',
      slug: 'test-blog-post',
      excerpt: 'This is a test excerpt',
      content: 'Full content here',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);

    // Should have blocks array
    expect(message.blocks).toBeDefined();
    expect(Array.isArray(message.blocks)).toBe(true);
    expect(message.blocks.length).toBe(3);

    // Should have header block
    expect(message.blocks[0].type).toBe('header');
    expect(message.blocks[0].text?.text).toBe('📝 Novo Artigo Publicado!');

    // Should have section block
    expect(message.blocks[1].type).toBe('section');

    // Should have actions block
    expect(message.blocks[2].type).toBe('actions');
  });

  /**
   * Unit Test: Blog post title and excerpt in section block
   * 
   * Validates: Requirements 4.2
   * - Section block includes post title in bold
   * - Section block includes excerpt
   */
  test('includes post title and excerpt in section block', () => {
    const post = {
      id: '123',
      title: 'Amazing Blog Post',
      slug: 'amazing-blog-post',
      excerpt: 'This is an amazing excerpt about the post',
      content: 'Full content here',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('*Amazing Blog Post*');
    expect(sectionBlock.text?.text).toContain('This is an amazing excerpt about the post');
  });

  /**
   * Unit Test: Blog post with null excerpt uses first 200 chars of content
   * 
   * Validates: Requirements 4.2
   * - When excerpt is null, uses first 200 characters of content
   * - Adds ellipsis if content is longer than 200 chars
   */
  test('uses first 200 chars of content when excerpt is null', () => {
    const longContent = 'A'.repeat(250);
    const post = {
      id: '123',
      title: 'Test Post',
      slug: 'test-post',
      excerpt: null,
      content: longContent,
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const sectionBlock = message.blocks[1];

    // Should contain first 200 chars plus ellipsis
    expect(sectionBlock.text?.text).toContain('A'.repeat(200) + '...');
  });

  /**
   * Unit Test: Blog post with short content (no ellipsis)
   * 
   * Validates: Requirements 4.2
   * - When content is less than 200 chars and no excerpt, uses full content
   * - Does not add ellipsis for short content
   */
  test('uses full content without ellipsis when content is short', () => {
    const shortContent = 'This is a short blog post content.';
    const post = {
      id: '123',
      title: 'Short Post',
      slug: 'short-post',
      excerpt: null,
      content: shortContent,
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain(shortContent);
    expect(sectionBlock.text?.text).not.toContain('...');
  });

  /**
   * Unit Test: Blog post with cover image
   * 
   * Validates: Requirements 4.3
   * - Section block includes image accessory when cover_image_url is present
   * - Image accessory has correct URL and alt text
   */
  test('includes image accessory when cover_image_url is present', () => {
    const post = {
      id: '123',
      title: 'Post with Image',
      slug: 'post-with-image',
      excerpt: 'Post excerpt',
      content: 'Content',
      cover_image_url: 'https://example.com/cover.jpg',
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.accessory).toBeDefined();
    expect(sectionBlock.accessory?.type).toBe('image');
    expect(sectionBlock.accessory?.image_url).toBe('https://example.com/cover.jpg');
    expect(sectionBlock.accessory?.alt_text).toBe('Post with Image');
  });

  /**
   * Unit Test: Blog post without cover image
   * 
   * Validates: Requirements 4.3
   * - Section block does not include image accessory when cover_image_url is null
   */
  test('does not include image accessory when cover_image_url is null', () => {
    const post = {
      id: '123',
      title: 'Post without Image',
      slug: 'post-without-image',
      excerpt: 'Post excerpt',
      content: 'Content',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.accessory).toBeUndefined();
  });

  /**
   * Unit Test: "Read More" button
   * 
   * Validates: Requirements 4.2
   * - Actions block contains button with "Ler Mais" text
   * - Button links to correct blog post URL
   * - Button has primary style
   */
  test('includes Read More button with correct URL', () => {
    const post = {
      id: '123',
      title: 'Test Post',
      slug: 'test-post',
      excerpt: 'Excerpt',
      content: 'Content',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const actionsBlock = message.blocks[2];
    const button = actionsBlock.elements![0];

    expect(button.type).toBe('button');
    expect(button.text).toEqual({
      type: 'plain_text',
      text: 'Ler Mais',
      emoji: true,
    });
    expect(button.url).toBe('https://vibeflow.site/blog/test-post');
    expect(button.style).toBe('primary');
  });

  /**
   * Unit Test: Fallback text
   * 
   * Validates: Requirements 4.2
   * - Message includes fallback text for notifications
   * - Fallback text contains post title
   */
  test('includes fallback text for notifications', () => {
    const post = {
      id: '123',
      title: 'Notification Test',
      slug: 'notification-test',
      excerpt: 'Excerpt',
      content: 'Content',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);

    expect(message.text).toBeDefined();
    expect(message.text).toBe('Novo Artigo Publicado: Notification Test');
  });

  /**
   * Unit Test: Empty string excerpt
   * 
   * Edge case: Handles empty string excerpt (uses it as-is)
   */
  test('handles empty string excerpt', () => {
    const post = {
      id: '123',
      title: 'Empty Excerpt Post',
      slug: 'empty-excerpt',
      excerpt: '',
      content: 'Full content here',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const sectionBlock = message.blocks[1];

    // Should use empty excerpt (not fall back to content)
    expect(sectionBlock.text?.text).toBe('*Empty Excerpt Post*\n');
  });

  /**
   * Unit Test: Very long title
   * 
   * Edge case: Handles very long post titles without truncation
   */
  test('handles very long post title', () => {
    const longTitle = 'A'.repeat(500);
    const post = {
      id: '123',
      title: longTitle,
      slug: 'long-title',
      excerpt: 'Excerpt',
      content: 'Content',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain(longTitle);
  });

  /**
   * Unit Test: Special characters in title and excerpt
   * 
   * Edge case: Handles special characters and markdown syntax
   */
  test('handles special characters in title and excerpt', () => {
    const post = {
      id: '123',
      title: 'Post with *asterisks* and _underscores_',
      slug: 'special-chars',
      excerpt: 'Excerpt with `code` and [links](url)',
      content: 'Content',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('*Post with *asterisks* and _underscores_*');
    expect(sectionBlock.text?.text).toContain('Excerpt with `code` and [links](url)');
  });

  /**
   * Unit Test: URL construction with special slug characters
   * 
   * Edge case: Ensures URL is constructed correctly even with special characters
   */
  test('constructs URL correctly with special slug characters', () => {
    const post = {
      id: '123',
      title: 'Test',
      slug: 'post-with-special-chars-123',
      excerpt: 'Excerpt',
      content: 'Content',
      cover_image_url: null,
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);
    const actionsBlock = message.blocks[2];
    const button = actionsBlock.elements![0];

    expect(button.url).toBe('https://vibeflow.site/blog/post-with-special-chars-123');
  });

  /**
   * Unit Test: Valid Slack Block Kit message structure
   * 
   * Validates: Requirements 9.1
   * - Message can be serialized to JSON
   * - All required fields are present
   */
  test('creates valid Slack Block Kit message structure', () => {
    const post = {
      id: '123',
      title: 'Valid Structure Test',
      slug: 'valid-structure',
      excerpt: 'Testing structure',
      content: 'Content',
      cover_image_url: 'https://example.com/image.jpg',
      status: 'published',
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatBlogPostMessage(post);

    // Should be serializable to JSON
    expect(() => JSON.stringify(message)).not.toThrow();

    // Should have required structure
    expect(message).toHaveProperty('blocks');
    expect(message).toHaveProperty('text');
    expect(message.blocks[0]).toHaveProperty('type', 'header');
    expect(message.blocks[1]).toHaveProperty('type', 'section');
    expect(message.blocks[2]).toHaveProperty('type', 'actions');
  });
});
