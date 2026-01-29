/**
 * Property-Based Tests for Block Kit Format Compliance
 * 
 * Feature: slack-community-integration
 * Task: 2.14 Write property test for Block Kit format compliance
 * 
 * These property-based tests validate that all message formatters generate
 * messages that comply with Slack Block Kit JSON schema requirements.
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { 
  formatWorkflowMessage, 
  formatMcpServerMessage, 
  formatBlogPostMessage,
  formatIdeNewsMessage,
  formatWelcomeMessage 
} from '../formatters';

describe('Block Kit Format Compliance - Property-Based Tests', () => {
  /**
   * Property 11: Block Kit format compliance
   * 
   * For any generated Slack message, it should have a "blocks" array following
   * Slack Block Kit JSON schema, with appropriate block types (header, section,
   * actions, context) for the content type.
   * 
   * **Validates: Requirements 9.1, 9.2, 9.3**
   */
  test('Property 11: Block Kit format compliance - Workflow messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          
          // Property 1: Should have blocks array
          expect(message).toHaveProperty('blocks');
          expect(Array.isArray(message.blocks)).toBe(true);
          expect(message.blocks.length).toBeGreaterThan(0);
          
          // Property 2: All blocks should have valid type
          const validBlockTypes = ['header', 'section', 'actions', 'context', 'divider', 'image'];
          message.blocks.forEach((block) => {
            expect(block).toHaveProperty('type');
            expect(validBlockTypes).toContain(block.type);
          });
          
          // Property 3: Should have header block
          const headerBlocks = message.blocks.filter(b => b.type === 'header');
          expect(headerBlocks.length).toBeGreaterThan(0);
          
          // Property 4: Header blocks should have valid structure
          headerBlocks.forEach((block) => {
            expect(block.text).toBeDefined();
            expect(block.text?.type).toBe('plain_text');
            expect(block.text?.text).toBeTruthy();
          });
          
          // Property 5: Should have section block
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          expect(sectionBlocks.length).toBeGreaterThan(0);
          
          // Property 6: Section blocks should have valid structure
          sectionBlocks.forEach((block) => {
            expect(block.text).toBeDefined();
            expect(['plain_text', 'mrkdwn']).toContain(block.text?.type);
            expect(block.text?.text).toBeTruthy();
          });
          
          // Property 7: Should have actions block
          const actionsBlocks = message.blocks.filter(b => b.type === 'actions');
          expect(actionsBlocks.length).toBeGreaterThan(0);
          
          // Property 8: Actions blocks should have elements array
          actionsBlocks.forEach((block) => {
            expect(block.elements).toBeDefined();
            expect(Array.isArray(block.elements)).toBe(true);
            expect(block.elements?.length).toBeGreaterThan(0);
          });
          
          // Property 9: Button elements should have valid structure
          actionsBlocks.forEach((block) => {
            block.elements?.forEach((element) => {
              if (element.type === 'button') {
                expect(element.text).toBeDefined();
                // Button text should be a SlackText object
                if (typeof element.text === 'object' && element.text !== null) {
                  expect(element.text.type).toBe('plain_text');
                }
                expect(element.url).toBeTruthy();
              }
            });
          });
          
          // Property 10: Message should be JSON serializable
          expect(() => JSON.stringify(message)).not.toThrow();
          
          // Property 11: Should have fallback text
          expect(message.text).toBeDefined();
          expect(typeof message.text).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Block Kit format compliance - MCP Server messages
   */
  test('Property 11: Block Kit format compliance - MCP Server messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          author_id: fc.option(fc.uuid(), { nil: null }),
          author_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }), { nil: null }),
          npm_package: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          github_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          install_command: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          is_published: fc.boolean(),
          views_count: fc.integer({ min: 0, max: 100000 }),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (server) => {
          const message = formatMcpServerMessage(server);
          
          // Validate Block Kit structure
          expect(message).toHaveProperty('blocks');
          expect(Array.isArray(message.blocks)).toBe(true);
          
          const validBlockTypes = ['header', 'section', 'actions', 'context', 'divider', 'image'];
          message.blocks.forEach((block) => {
            expect(validBlockTypes).toContain(block.type);
          });
          
          // Should have header
          expect(message.blocks.some(b => b.type === 'header')).toBe(true);
          
          // Should have section
          expect(message.blocks.some(b => b.type === 'section')).toBe(true);
          
          // Should have actions
          expect(message.blocks.some(b => b.type === 'actions')).toBe(true);
          
          // Should be JSON serializable
          expect(() => JSON.stringify(message)).not.toThrow();
          
          // Should have fallback text
          expect(message.text).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Block Kit format compliance - Blog Post messages
   */
  test('Property 11: Block Kit format compliance - Blog Post messages', () => {
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
          cover_image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          status: fc.constantFrom('published', 'draft'),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (post) => {
          const message = formatBlogPostMessage(post);
          
          // Validate Block Kit structure
          expect(message).toHaveProperty('blocks');
          expect(Array.isArray(message.blocks)).toBe(true);
          
          const validBlockTypes = ['header', 'section', 'actions', 'context', 'divider', 'image'];
          message.blocks.forEach((block) => {
            expect(validBlockTypes).toContain(block.type);
          });
          
          // Should have required block types
          expect(message.blocks.some(b => b.type === 'header')).toBe(true);
          expect(message.blocks.some(b => b.type === 'section')).toBe(true);
          expect(message.blocks.some(b => b.type === 'actions')).toBe(true);
          
          // Should be JSON serializable
          expect(() => JSON.stringify(message)).not.toThrow();
          
          // Should have fallback text
          expect(message.text).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Block Kit format compliance - IDE News messages
   */
  test('Property 11: Block Kit format compliance - IDE News messages', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.string({ minLength: 1, maxLength: 50 }),
            cor: fc.option(fc.string({ minLength: 7, maxLength: 7 }), { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          
          // Validate Block Kit structure
          expect(message).toHaveProperty('blocks');
          expect(Array.isArray(message.blocks)).toBe(true);
          
          const validBlockTypes = ['header', 'section', 'actions', 'context', 'divider', 'image'];
          message.blocks.forEach((block) => {
            expect(validBlockTypes).toContain(block.type);
          });
          
          // Should have header
          expect(message.blocks.some(b => b.type === 'header')).toBe(true);
          
          // Should have context
          expect(message.blocks.some(b => b.type === 'context')).toBe(true);
          
          // Should be JSON serializable
          expect(() => JSON.stringify(message)).not.toThrow();
          
          // Should have fallback text
          expect(message.text).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Block Kit format compliance - Welcome messages
   */
  test('Property 11: Block Kit format compliance - Welcome messages', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const message = formatWelcomeMessage();
          
          // Validate Block Kit structure
          expect(message).toHaveProperty('blocks');
          expect(Array.isArray(message.blocks)).toBe(true);
          
          const validBlockTypes = ['header', 'section', 'actions', 'context', 'divider', 'image'];
          message.blocks.forEach((block) => {
            expect(validBlockTypes).toContain(block.type);
          });
          
          // Should have header
          expect(message.blocks.some(b => b.type === 'header')).toBe(true);
          
          // Should have section
          expect(message.blocks.some(b => b.type === 'section')).toBe(true);
          
          // Should be JSON serializable
          expect(() => JSON.stringify(message)).not.toThrow();
          
          // Should have fallback text
          expect(message.text).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All text blocks have valid text objects
   * 
   * For any message, all blocks with text should have properly structured
   * text objects with type and text content.
   */
  test('Property: All text blocks have valid text objects', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1 }),
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          
          message.blocks.forEach((block) => {
            if (block.text) {
              // Text object should have type
              expect(block.text).toHaveProperty('type');
              expect(['plain_text', 'mrkdwn']).toContain(block.text.type);
              
              // Text object should have text content
              expect(block.text).toHaveProperty('text');
              expect(typeof block.text.text).toBe('string');
              expect(block.text.text.length).toBeGreaterThan(0);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All action blocks have valid elements
   * 
   * For any message with actions blocks, all elements should be properly
   * structured with type and required properties.
   */
  test('Property: All action blocks have valid elements', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1 }),
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          
          const actionsBlocks = message.blocks.filter(b => b.type === 'actions');
          actionsBlocks.forEach((block) => {
            // Should have elements array
            expect(block.elements).toBeDefined();
            expect(Array.isArray(block.elements)).toBe(true);
            
            // Each element should have type
            block.elements?.forEach((element) => {
              expect(element).toHaveProperty('type');
              
              // Buttons should have text and url
              if (element.type === 'button') {
                expect(element.text).toBeDefined();
                expect(element.url).toBeTruthy();
              }
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All context blocks have valid elements
   * 
   * For any message with context blocks, all elements should be properly
   * structured.
   */
  test('Property: All context blocks have valid elements', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1, maxLength: 200 }),
            resumo: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            link: fc.webUrl({ validSchemes: ['https'] }),
            fonte: fc.string({ minLength: 1, maxLength: 50 }),
            cor: fc.option(fc.string({ minLength: 7, maxLength: 7 }), { nil: null }),
            logo: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
            created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (newsItems) => {
          const message = formatIdeNewsMessage(newsItems);
          
          const contextBlocks = message.blocks.filter(b => b.type === 'context');
          contextBlocks.forEach((block) => {
            // Should have elements array
            expect(block.elements).toBeDefined();
            expect(Array.isArray(block.elements)).toBe(true);
            expect(block.elements?.length).toBeGreaterThan(0);
            
            // Each element should have type
            block.elements?.forEach((element) => {
              expect(element).toHaveProperty('type');
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
