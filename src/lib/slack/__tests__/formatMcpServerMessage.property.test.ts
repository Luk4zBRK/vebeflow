/**
 * Property-Based Tests for formatMcpServerMessage
 * 
 * Feature: slack-community-integration
 * Task: 2.5 Write property test for MCP server message formatting
 * 
 * These property-based tests validate that the formatMcpServerMessage function
 * maintains correctness properties across all possible valid inputs using
 * fast-check for randomized testing.
 * 
 * **Validates: Requirements 3.2, 3.3**
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { formatMcpServerMessage } from '../formatters';

describe('formatMcpServerMessage - Property-Based Tests', () => {
  /**
   * Property 8: MCP server message content
   * 
   * For any MCP server, the formatted Slack message should include:
   * - The server name (title)
   * - The server description (if present)
   * - The npm package name (if present)
   * - The GitHub URL (if present)
   * - Up to 5 tags in a context block (if tags present)
   * - A "View Details" button with correct URL
   * - A "GitHub" button (if github_url present)
   * 
   * **Validates: Requirements 3.2, 3.3**
   */
  test('Property 8: MCP server message content', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary MCP server objects
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            // Ensure slug is URL-safe
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
          image_url: fc.option(
            fc.webUrl({ validSchemes: ['https'] }),
            { nil: null }
          ),
          author_id: fc.option(fc.uuid(), { nil: null }),
          author_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          category: fc.option(
            fc.constantFrom('tools', 'ai', 'automation', 'data', 'communication'),
            { nil: null }
          ),
          tags: fc.option(
            fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
            { nil: null }
          ),
          npm_package: fc.option(
            fc.string({ minLength: 1, maxLength: 100 }).map(s => `@${s}/mcp-server`),
            { nil: null }
          ),
          github_url: fc.option(
            fc.constant('https://github.com/test/repo'),
            { nil: null }
          ),
          install_command: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          is_published: fc.constant(true),
          views_count: fc.nat({ max: 10000 }),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (server) => {
          const message = formatMcpServerMessage(server);
          
          // Property 1: Should include the server name (title) in section block
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          expect(sectionBlock?.text?.text).toContain(server.title);
          
          // Property 2: Should include description if present
          if (server.description) {
            expect(sectionBlock?.text?.text).toContain(server.description);
          }
          
          // Property 3: Should include npm package if present
          if (server.npm_package) {
            expect(sectionBlock?.text?.text).toContain(server.npm_package);
            expect(sectionBlock?.text?.text).toContain('📦');
          }
          
          // Property 4: Should have "View Details" button with correct URL
          const actionsBlock = message.blocks.find(b => b.type === 'actions');
          expect(actionsBlock).toBeDefined();
          expect(actionsBlock?.elements).toBeDefined();
          expect(actionsBlock?.elements!.length).toBeGreaterThanOrEqual(1);
          
          const viewDetailsButton = actionsBlock?.elements?.[0];
          const expectedUrl = `https://vibeflow.site/mcp-servers/${server.slug}`;
          expect(viewDetailsButton?.url).toBe(expectedUrl);
          expect(viewDetailsButton?.text).toEqual({
            type: 'plain_text',
            text: 'Ver Detalhes',
            emoji: true,
          });
          expect(viewDetailsButton?.style).toBe('primary');
          
          // Property 5: Should have GitHub button if github_url present
          if (server.github_url) {
            expect(actionsBlock?.elements!.length).toBe(2);
            const githubButton = actionsBlock?.elements?.[1];
            expect(githubButton?.type).toBe('button');
            expect(githubButton?.text).toEqual({
              type: 'plain_text',
              text: 'GitHub',
              emoji: true,
            });
            expect(githubButton?.url).toBe(server.github_url);
          } else {
            // Should only have View Details button
            expect(actionsBlock?.elements!.length).toBe(1);
          }
          
          // Property 6: Should have context block with up to 5 tags if tags present
          if (server.tags && server.tags.length > 0) {
            const contextBlock = message.blocks.find(b => b.type === 'context');
            expect(contextBlock).toBeDefined();
            expect(contextBlock?.elements).toBeDefined();
            expect(contextBlock?.elements!.length).toBe(1);
            
            const tagsText = (contextBlock?.elements?.[0] as any).text;
            expect(tagsText).toBeDefined();
            
            // Should include up to 5 tags
            const tagsToInclude = server.tags.slice(0, 5);
            tagsToInclude.forEach(tag => {
              expect(tagsText).toContain(`\`${tag}\``);
            });
            
            // Should not include more than 5 tags
            if (server.tags.length > 5) {
              const extraTags = server.tags.slice(5);
              extraTags.forEach(tag => {
                expect(tagsText).not.toContain(`\`${tag}\``);
              });
            }
          } else {
            // Should not have context block if no tags
            const contextBlock = message.blocks.find(b => b.type === 'context');
            expect(contextBlock).toBeUndefined();
          }
          
          // Property 7: Should have header block with standard text
          const headerBlock = message.blocks[0];
          expect(headerBlock.type).toBe('header');
          expect(headerBlock.text?.text).toBe('🔌 Novo MCP Server Disponível!');
          expect(headerBlock.text?.type).toBe('plain_text');
          expect(headerBlock.text?.emoji).toBe(true);
          
          // Property 8: Section should use markdown formatting
          expect(sectionBlock?.text?.type).toBe('mrkdwn');
          
          // Property 9: Title should be bold in section text
          expect(sectionBlock?.text?.text).toContain(`*${server.title}*`);
          
          // Property 10: Should have fallback text
          expect(message.text).toBeDefined();
          expect(message.text).toContain(server.title);
          expect(message.text).toContain('Novo MCP Server Disponível');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message structure is always valid Block Kit format
   * 
   * For any MCP server, the formatted message should always conform to
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
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          author_id: fc.option(fc.uuid(), { nil: null }),
          author_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          tags: fc.option(
            fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
            { nil: null }
          ),
          npm_package: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          github_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          install_command: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          is_published: fc.boolean(),
          views_count: fc.nat({ max: 10000 }),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (server) => {
          const message = formatMcpServerMessage(server);
          
          // Should have blocks array
          expect(message).toHaveProperty('blocks');
          expect(Array.isArray(message.blocks)).toBe(true);
          expect(message.blocks.length).toBeGreaterThanOrEqual(3);
          
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
          
          // Button elements should have required properties
          actionsBlock?.elements?.forEach((element) => {
            expect(element.type).toBe('button');
            expect(element.text).toBeDefined();
            expect(element.url).toBeTruthy();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: URL construction is always valid
   * 
   * For any MCP server slug, the constructed URL should always be valid
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
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1 }),
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          author_id: fc.option(fc.uuid(), { nil: null }),
          author_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          tags: fc.option(
            fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
            { nil: null }
          ),
          npm_package: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          github_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          install_command: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          is_published: fc.boolean(),
          views_count: fc.nat({ max: 10000 }),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (server) => {
          const message = formatMcpServerMessage(server);
          const actionsBlock = message.blocks.find(b => b.type === 'actions');
          const viewDetailsButton = actionsBlock?.elements?.[0];
          
          // URL should be defined
          expect(viewDetailsButton?.url).toBeDefined();
          
          // URL should start with the base URL
          expect(viewDetailsButton?.url).toMatch(/^https:\/\/vibeflow\.site\/mcp-servers\//);
          
          // URL should end with the slug
          expect(viewDetailsButton?.url).toBe(`https://vibeflow.site/mcp-servers/${server.slug}`);
          
          // URL should be a valid URL
          expect(() => new URL(viewDetailsButton?.url || '')).not.toThrow();
          
          // If GitHub URL present, it should also be valid
          if (server.github_url) {
            const githubButton = actionsBlock?.elements?.[1];
            expect(githubButton?.url).toBe(server.github_url);
            expect(() => new URL(githubButton?.url || '')).not.toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tags are limited to 5 maximum
   * 
   * For any MCP server with tags, only the first 5 tags should be included
   * in the context block, regardless of how many tags are provided.
   */
  test('Property: Tags are limited to 5 maximum', () => {
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
          author_id: fc.option(fc.uuid(), { nil: null }),
          author_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          // Generate arrays with at least 6 tags to test the limit
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 6, maxLength: 15 }),
          npm_package: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          github_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          install_command: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          is_published: fc.boolean(),
          views_count: fc.nat({ max: 10000 }),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (server) => {
          const message = formatMcpServerMessage(server);
          const contextBlock = message.blocks.find(b => b.type === 'context');
          
          // Should have context block since we have tags
          expect(contextBlock).toBeDefined();
          
          const tagsText = (contextBlock?.elements?.[0] as any).text;
          
          // Should include first 5 tags
          const firstFiveTags = server.tags.slice(0, 5);
          firstFiveTags.forEach(tag => {
            expect(tagsText).toContain(`\`${tag}\``);
          });
          
          // Should NOT include tags beyond the 5th
          const extraTags = server.tags.slice(5);
          extraTags.forEach(tag => {
            expect(tagsText).not.toContain(`\`${tag}\``);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Context block presence matches tags presence
   * 
   * For any MCP server, the context block should be present if and only if
   * tags are provided and not null/empty.
   */
  test('Property: Context block presence matches tags presence', () => {
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
          author_id: fc.option(fc.uuid(), { nil: null }),
          author_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          tags: fc.option(
            fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
            { nil: null }
          ),
          npm_package: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          github_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          install_command: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          is_published: fc.boolean(),
          views_count: fc.nat({ max: 10000 }),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (server) => {
          const message = formatMcpServerMessage(server);
          const contextBlock = message.blocks.find(b => b.type === 'context');
          
          if (server.tags && server.tags.length > 0) {
            // Should have context block
            expect(contextBlock).toBeDefined();
            expect(contextBlock?.elements).toBeDefined();
            expect(contextBlock?.elements!.length).toBe(1);
            expect((contextBlock?.elements?.[0] as any).type).toBe('mrkdwn');
          } else {
            // Should not have context block
            expect(contextBlock).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Handles null and empty values gracefully
   * 
   * For any MCP server with null or empty optional fields, the message
   * should still be valid and not contain 'null', 'undefined', or empty strings.
   */
  test('Property: Handles null and empty values gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }).map(s => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          ),
          description: fc.constantFrom(null, '', undefined),
          content: fc.string({ minLength: 1 }),
          image_url: fc.constant(null),
          author_id: fc.constant(null),
          author_name: fc.constant(null),
          category: fc.constant(null),
          tags: fc.constantFrom(null, undefined),
          npm_package: fc.constantFrom(null, '', undefined),
          github_url: fc.constant(null),
          install_command: fc.constant(null),
          is_published: fc.boolean(),
          views_count: fc.nat({ max: 10000 }),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (server) => {
          const message = formatMcpServerMessage(server as any);
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          
          // Should have section text
          expect(sectionBlock?.text?.text).toBeDefined();
          
          // Should contain title
          expect(sectionBlock?.text?.text).toContain(server.title);
          
          // Should not contain 'null', 'undefined'
          expect(sectionBlock?.text?.text).not.toContain('null');
          expect(sectionBlock?.text?.text).not.toContain('undefined');
          
          // Should not have context block when tags are null/empty
          const contextBlock = message.blocks.find(b => b.type === 'context');
          expect(contextBlock).toBeUndefined();
          
          // Should only have View Details button (no GitHub button)
          const actionsBlock = message.blocks.find(b => b.type === 'actions');
          expect(actionsBlock?.elements?.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fallback text is always present and meaningful
   * 
   * For any MCP server, the message should have a fallback text that
   * includes the server name for notification purposes.
   */
  test('Property: Fallback text is always present and contains server name', () => {
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
          author_id: fc.option(fc.uuid(), { nil: null }),
          author_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          tags: fc.option(
            fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
            { nil: null }
          ),
          npm_package: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          github_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          install_command: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          is_published: fc.boolean(),
          views_count: fc.nat({ max: 10000 }),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
          updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (server) => {
          const message = formatMcpServerMessage(server);
          
          // Should have fallback text
          expect(message.text).toBeDefined();
          expect(typeof message.text).toBe('string');
          
          // Should contain the server name
          expect(message.text).toContain(server.title);
          
          // Should indicate it's a new MCP server
          expect(message.text).toContain('Novo MCP Server Disponível');
        }
      ),
      { numRuns: 100 }
    );
  });
});
