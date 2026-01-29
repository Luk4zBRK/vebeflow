/**
 * Property-Based Tests for formatIdeNewsMessage
 * 
 * Feature: slack-community-integration
 * Task: 2.9 Write property test for IDE news batching
 * 
 * These property-based tests validate that the formatIdeNewsMessage function
 * maintains correctness properties across all possible valid inputs using
 * fast-check for randomized testing.
 * 
 * **Validates: Requirements 5.2, 5.3**
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { formatIdeNewsMessage } from '../formatters';

// Helper to generate hex color strings
const hexColorArb = fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s.substring(0, 6)}`);

describe('formatIdeNewsMessage - Property-Based Tests', () => {
  /**
   * Property 10: IDE news batching
   * 
   * For any set of N IDE news items synced simultaneously, they should be
   * batched into messages containing at most 10 items each, with each item
   * showing title, source, and link.
   * 
   * **Validates: Requirements 5.2, 5.3**
   */
  test('Property 10: IDE news batching', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary arrays of IDE news items (0 to 20 items)
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.constantFrom('Cursor', 'Windsurf', 'Cline', 'Aider', 'GitHub Copilot'),
            cor: fc.option(hexColorArb, { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          
          // Property 1: Should batch maximum 10 items
          const expectedCount = Math.min(newsItems.length, 10);
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          expect(sectionBlocks.length).toBe(expectedCount);
          
          // Property 2: Header should show correct count
          const headerBlock = message.blocks.find(b => b.type === 'header');
          expect(headerBlock?.text?.text).toBe(`🤖 ${expectedCount} Novidades de IDEs com IA`);
          
          // Property 3: Each section block should contain title, link, and fonte
          const itemsToCheck = newsItems.slice(0, 10);
          itemsToCheck.forEach((news, index) => {
            const sectionBlock = sectionBlocks[index];
            
            // Should contain title (bold)
            expect(sectionBlock.text?.text).toContain(`*${news.titulo}*`);
            
            // Should contain link
            expect(sectionBlock.text?.text).toContain(news.link);
            
            // Should contain fonte
            expect(sectionBlock.text?.text).toContain(news.fonte);
            
            // Should contain "Ler mais" text
            expect(sectionBlock.text?.text).toContain('Ler mais');
            
            // Should contain resumo if present
            if (news.resumo) {
              expect(sectionBlock.text?.text).toContain(news.resumo);
            }
          });
          
          // Property 4: Should always have header block
          expect(headerBlock).toBeDefined();
          expect(headerBlock?.type).toBe('header');
          expect(headerBlock?.text?.type).toBe('plain_text');
          expect(headerBlock?.text?.emoji).toBe(true);
          
          // Property 5: Should always have context block at the end
          const contextBlock = message.blocks[message.blocks.length - 1];
          expect(contextBlock.type).toBe('context');
          expect(contextBlock.elements?.[0].type).toBe('mrkdwn');
          expect(contextBlock.elements?.[0].text).toContain('Sincronizado automaticamente');
          expect(contextBlock.elements?.[0].text).toContain('https://vibeflow.site/ide-news');
          
          // Property 6: Total blocks should be header + sections + context
          expect(message.blocks.length).toBe(expectedCount + 2);
          
          // Property 7: Fallback text should contain count
          expect(message.text).toBe(`${expectedCount} Novidades de IDEs com IA`);
          
          // Property 8: Section blocks should use markdown
          sectionBlocks.forEach((block) => {
            expect(block.text?.type).toBe('mrkdwn');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message structure is always valid Block Kit format
   * 
   * For any array of IDE news items, the formatted message should always
   * conform to Slack Block Kit structure requirements.
   */
  test('Property: Message always has valid Block Kit structure', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.string({ minLength: 1, maxLength: 50 }),
            cor: fc.option(hexColorArb, { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          
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
          
          // Section blocks should have text with type and text content
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          sectionBlocks.forEach((block) => {
            expect(block.text).toBeDefined();
            expect(block.text?.type).toBe('mrkdwn');
            expect(block.text?.text).toBeTruthy();
          });
          
          // Context block should have elements array
          const contextBlock = message.blocks.find(b => b.type === 'context');
          expect(contextBlock).toBeDefined();
          expect(contextBlock?.elements).toBeDefined();
          expect(Array.isArray(contextBlock?.elements)).toBe(true);
          expect(contextBlock?.elements?.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Batching limit is strictly enforced
   * 
   * For any array with more than 10 items, exactly 10 items should be
   * included in the message (no more, no less).
   */
  test('Property: Batching limit of 10 is strictly enforced', () => {
    fc.assert(
      fc.property(
        // Generate arrays with 11 to 50 items
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.string({ minLength: 1, maxLength: 50 }),
            cor: fc.option(hexColorArb, { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 11, maxLength: 50 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          
          // Should have exactly 10 section blocks
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          expect(sectionBlocks.length).toBe(10);
          
          // Header should show count of 10
          const headerBlock = message.blocks.find(b => b.type === 'header');
          expect(headerBlock?.text?.text).toBe('🤖 10 Novidades de IDEs com IA');
          
          // Total blocks should be 12 (header + 10 sections + context)
          expect(message.blocks.length).toBe(12);
          
          // Fallback text should show 10
          expect(message.text).toBe('10 Novidades de IDEs com IA');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty array handling
   * 
   * For an empty array, the message should still be valid with header
   * and context blocks but no section blocks.
   */
  test('Property: Empty array produces valid message', () => {
    const emptyArray: any[] = [];
    const message = formatIdeNewsMessage(emptyArray);
    
    // Should have 2 blocks (header + context)
    expect(message.blocks.length).toBe(2);
    
    // Should have header
    expect(message.blocks[0].type).toBe('header');
    expect(message.blocks[0].text?.text).toBe('🤖 0 Novidades de IDEs com IA');
    
    // Should have context
    expect(message.blocks[1].type).toBe('context');
    
    // Should have no section blocks
    const sectionBlocks = message.blocks.filter(b => b.type === 'section');
    expect(sectionBlocks.length).toBe(0);
    
    // Fallback text should show 0
    expect(message.text).toBe('0 Novidades de IDEs com IA');
  });

  /**
   * Property: Null resumo handling
   * 
   * For any news item with null resumo, the section block should still
   * be valid and contain title, link, and fonte.
   */
  test('Property: Null resumo is handled correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.constant(null),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.string({ minLength: 1, maxLength: 50 }),
            cor: fc.option(hexColorArb, { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          
          // Each section should not contain 'null' string
          sectionBlocks.forEach((block) => {
            expect(block.text?.text).not.toContain('null');
            expect(block.text?.text).toBeTruthy();
          });
          
          // Each section should still contain title, link, and fonte
          newsItems.forEach((news, index) => {
            const sectionBlock = sectionBlocks[index];
            expect(sectionBlock.text?.text).toContain(news.titulo);
            expect(sectionBlock.text?.text).toContain(news.link);
            expect(sectionBlock.text?.text).toContain(news.fonte);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Special characters are preserved
   * 
   * For any news item with special characters in title or resumo,
   * those characters should be preserved in the message.
   */
  test('Property: Special characters are preserved in text', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.string({ minLength: 1, maxLength: 50 }),
            cor: fc.option(hexColorArb, { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          
          // Each section should contain the original title and resumo
          newsItems.slice(0, 10).forEach((news, index) => {
            const sectionBlock = sectionBlocks[index];
            
            // Title should be present
            expect(sectionBlock.text?.text).toContain(news.titulo);
            
            // Resumo should be present if it exists
            if (news.resumo) {
              expect(sectionBlock.text?.text).toContain(news.resumo);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fallback text is always present and meaningful
   * 
   * For any array of news items, the message should have a fallback text
   * that includes the count for notification purposes.
   */
  test('Property: Fallback text is always present and contains count', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.string({ minLength: 1, maxLength: 50 }),
            cor: fc.option(hexColorArb, { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          const expectedCount = Math.min(newsItems.length, 10);
          
          // Should have fallback text
          expect(message.text).toBeDefined();
          expect(typeof message.text).toBe('string');
          
          // Should contain the count
          expect(message.text).toBe(`${expectedCount} Novidades de IDEs com IA`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: First 10 items are always selected
   * 
   * For any array with more than 10 items, the first 10 items (by array order)
   * should be the ones included in the message.
   */
  test('Property: First 10 items are selected when array is larger', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.string({ minLength: 1, maxLength: 50 }),
            cor: fc.option(hexColorArb, { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 11, maxLength: 20 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          
          // Should contain first 10 items
          const first10 = newsItems.slice(0, 10);
          first10.forEach((news, index) => {
            const sectionBlock = sectionBlocks[index];
            expect(sectionBlock.text?.text).toContain(news.titulo);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
