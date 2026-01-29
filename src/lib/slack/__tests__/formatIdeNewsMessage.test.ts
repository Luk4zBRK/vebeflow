/**
 * Unit Tests for formatIdeNewsMessage
 * 
 * Feature: slack-community-integration
 * Task: 2.8 Implement formatIdeNewsMessage function
 * 
 * These tests validate that the formatIdeNewsMessage function correctly
 * formats IDE news data into Slack Block Kit messages according to the
 * design specification.
 */

import { describe, test, expect } from '@jest/globals';
import { formatIdeNewsMessage } from '../formatters';

describe('formatIdeNewsMessage', () => {
  /**
   * Unit Test: Basic IDE news message structure
   * 
   * Validates: Requirements 5.2, 5.3
   * - Message has header, section blocks, and context block
   * - Header contains count and emoji
   * - Section blocks contain news items
   * - Context block contains "View all" link
   */
  test('creates message with header, section blocks, and context', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'Test News 1',
        resumo: 'Test summary 1',
        link: 'https://example.com/news1',
        fonte: 'Cursor',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '456',
        titulo: 'Test News 2',
        resumo: 'Test summary 2',
        link: 'https://example.com/news2',
        fonte: 'Windsurf',
        cor: null,
        logo: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);

    // Should have blocks array
    expect(message.blocks).toBeDefined();
    expect(Array.isArray(message.blocks)).toBe(true);
    
    // Should have header + 2 sections + context = 4 blocks
    expect(message.blocks.length).toBe(4);

    // Should have header block
    expect(message.blocks[0].type).toBe('header');
    expect(message.blocks[0].text?.text).toBe('🤖 2 Novidades de IDEs com IA');

    // Should have section blocks
    expect(message.blocks[1].type).toBe('section');
    expect(message.blocks[2].type).toBe('section');

    // Should have context block
    expect(message.blocks[3].type).toBe('context');
  });

  /**
   * Unit Test: News item content in section blocks
   * 
   * Validates: Requirements 5.2
   * - Section blocks include title, resumo, link, and fonte
   */
  test('includes news item content in section blocks', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'Amazing AI Feature',
        resumo: 'This is an amazing new feature',
        link: 'https://example.com/news',
        fonte: 'Cursor',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('*Amazing AI Feature*');
    expect(sectionBlock.text?.text).toContain('This is an amazing new feature');
    expect(sectionBlock.text?.text).toContain('https://example.com/news');
    expect(sectionBlock.text?.text).toContain('Cursor');
    expect(sectionBlock.text?.text).toContain('Ler mais');
  });

  /**
   * Unit Test: Batching maximum 10 items
   * 
   * Validates: Requirements 5.3
   * - When more than 10 items provided, only first 10 are included
   */
  test('batches maximum 10 items per message', () => {
    const newsItems = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      titulo: `News ${i}`,
      resumo: `Summary ${i}`,
      link: `https://example.com/news${i}`,
      fonte: 'Cursor',
      cor: null,
      logo: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }));

    const message = formatIdeNewsMessage(newsItems);

    // Should have header + 10 sections + context = 12 blocks
    expect(message.blocks.length).toBe(12);

    // Header should show count of 10
    expect(message.blocks[0].text?.text).toBe('🤖 10 Novidades de IDEs com IA');

    // Should have exactly 10 section blocks
    const sectionBlocks = message.blocks.filter(b => b.type === 'section');
    expect(sectionBlocks.length).toBe(10);
  });

  /**
   * Unit Test: News item with null resumo
   * 
   * Validates: Requirements 5.2
   * - When resumo is null, section block still includes title, link, and fonte
   */
  test('handles news item with null resumo', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'News without summary',
        resumo: null,
        link: 'https://example.com/news',
        fonte: 'Windsurf',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('*News without summary*');
    expect(sectionBlock.text?.text).toContain('https://example.com/news');
    expect(sectionBlock.text?.text).toContain('Windsurf');
    expect(sectionBlock.text?.text).not.toContain('null');
  });

  /**
   * Unit Test: Context block with "View all" link
   * 
   * Validates: Requirements 5.2
   * - Context block includes "View all" link to IDE news page
   */
  test('includes context block with View all link', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'Test News',
        resumo: 'Test summary',
        link: 'https://example.com/news',
        fonte: 'Cursor',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);
    const contextBlock = message.blocks[message.blocks.length - 1];

    expect(contextBlock.type).toBe('context');
    expect(contextBlock.elements?.[0].type).toBe('mrkdwn');
    expect(contextBlock.elements?.[0].text).toContain('Sincronizado automaticamente');
    expect(contextBlock.elements?.[0].text).toContain('https://vibeflow.site/ide-news');
    expect(contextBlock.elements?.[0].text).toContain('Ver todas');
  });

  /**
   * Unit Test: Fallback text
   * 
   * Validates: Requirements 5.2
   * - Message includes fallback text for notifications
   * - Fallback text contains count
   */
  test('includes fallback text for notifications', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'Test News',
        resumo: 'Test summary',
        link: 'https://example.com/news',
        fonte: 'Cursor',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);

    expect(message.text).toBeDefined();
    expect(message.text).toBe('1 Novidades de IDEs com IA');
  });

  /**
   * Unit Test: Single news item
   * 
   * Edge case: Handles single news item correctly
   */
  test('handles single news item', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'Single News',
        resumo: 'Single summary',
        link: 'https://example.com/news',
        fonte: 'Cursor',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);

    // Should have header + 1 section + context = 3 blocks
    expect(message.blocks.length).toBe(3);
    expect(message.blocks[0].text?.text).toBe('🤖 1 Novidades de IDEs com IA');
  });

  /**
   * Unit Test: Empty array
   * 
   * Edge case: Handles empty array gracefully
   */
  test('handles empty array', () => {
    const newsItems: any[] = [];

    const message = formatIdeNewsMessage(newsItems);

    // Should have header + context = 2 blocks (no section blocks)
    expect(message.blocks.length).toBe(2);
    expect(message.blocks[0].text?.text).toBe('🤖 0 Novidades de IDEs com IA');
    expect(message.text).toBe('0 Novidades de IDEs com IA');
  });

  /**
   * Unit Test: Special characters in title and resumo
   * 
   * Edge case: Handles special characters and markdown syntax
   */
  test('handles special characters in title and resumo', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'News with *asterisks* and _underscores_',
        resumo: 'Summary with `code` and [links](url)',
        link: 'https://example.com/news',
        fonte: 'Cursor',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('*News with *asterisks* and _underscores_*');
    expect(sectionBlock.text?.text).toContain('Summary with `code` and [links](url)');
  });

  /**
   * Unit Test: Valid Slack Block Kit message structure
   * 
   * Validates: Requirements 9.1
   * - Message can be serialized to JSON
   * - All required fields are present
   */
  test('creates valid Slack Block Kit message structure', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'Valid Structure Test',
        resumo: 'Testing structure',
        link: 'https://example.com/news',
        fonte: 'Cursor',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);

    // Should be serializable to JSON
    expect(() => JSON.stringify(message)).not.toThrow();

    // Should have required structure
    expect(message).toHaveProperty('blocks');
    expect(message).toHaveProperty('text');
    expect(message.blocks[0]).toHaveProperty('type', 'header');
    expect(message.blocks[1]).toHaveProperty('type', 'section');
    expect(message.blocks[2]).toHaveProperty('type', 'context');
  });

  /**
   * Unit Test: Markdown formatting in section blocks
   * 
   * Validates: Requirements 5.2
   * - Section blocks use markdown formatting
   * - Title is bold
   * - Link is formatted as markdown link
   */
  test('uses markdown formatting in section blocks', () => {
    const newsItems = [
      {
        id: '123',
        titulo: 'Markdown Test',
        resumo: 'Testing markdown',
        link: 'https://example.com/news',
        fonte: 'Cursor',
        cor: null,
        logo: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const message = formatIdeNewsMessage(newsItems);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.type).toBe('mrkdwn');
    expect(sectionBlock.text?.text).toMatch(/\*Markdown Test\*/);
    expect(sectionBlock.text?.text).toMatch(/<https:\/\/example\.com\/news\|Ler mais>/);
  });
});
