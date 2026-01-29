/**
 * Property-Based Tests for Slack Message Formatters
 * 
 * Feature: slack-community-integration
 * Task: 2.3 Write property test for workflow message formatting
 * 
 * These property-based tests validate that the formatWorkflowMessage function
 * maintains correctness properties across all possible valid inputs using
 * fast-check for randomized testing.
 * 
 * **Validates: Requirements 2.2**
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { formatWorkflowMessage } from '../formatters';

describe('formatWorkflowMessage - Property-Based Tests', () => {
  /**
   * Property 7: Workflow message content
   * 
   * For any workflow, the formatted Slack message should include:
   * - The workflow title
   * - The workflow description (if present)
   * - An image accessory (if image_url present)
   * - A "View Workflow" button with correct URL
   * 
   * **Validates: Requirements 2.2**
   */
  test('Property 7: Workflow message content', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary workflow objects
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
          is_published: fc.constant(true),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          
          // Property 1: Should include the workflow title in section block
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          expect(sectionBlock?.text?.text).toContain(workflow.title);
          
          // Property 2: Should include description if present
          if (workflow.description) {
            expect(sectionBlock?.text?.text).toContain(workflow.description);
          }
          
          // Property 3: Should have "View Workflow" button with correct URL
          const actionsBlock = message.blocks.find(b => b.type === 'actions');
          const button = actionsBlock?.elements?.[0];
          const expectedUrl = `https://vibeflow.site/workflows/${workflow.slug}`;
          expect(button?.url).toBe(expectedUrl);
          expect(button?.text).toEqual({
            type: 'plain_text',
            text: 'Ver Workflow',
            emoji: true,
          });
          
          // Property 4: Should have image accessory if image_url present
          if (workflow.image_url) {
            expect(sectionBlock?.accessory).toBeDefined();
            expect(sectionBlock?.accessory?.type).toBe('image');
            expect(sectionBlock?.accessory?.image_url).toBe(workflow.image_url);
            expect(sectionBlock?.accessory?.alt_text).toBe(workflow.title);
          }
          
          // Property 5: Should not have image accessory if image_url is null
          if (!workflow.image_url) {
            expect(sectionBlock?.accessory).toBeUndefined();
          }
          
          // Property 6: Should have exactly 3 blocks (header, section, actions)
          expect(message.blocks).toHaveLength(3);
          
          // Property 7: Block types should be in correct order
          expect(message.blocks[0].type).toBe('header');
          expect(message.blocks[1].type).toBe('section');
          expect(message.blocks[2].type).toBe('actions');
          
          // Property 8: Header should have the standard text
          expect(message.blocks[0].text?.text).toBe('🚀 Novo Workflow Publicado!');
          expect(message.blocks[0].text?.type).toBe('plain_text');
          expect(message.blocks[0].text?.emoji).toBe(true);
          
          // Property 9: Section should use markdown formatting
          expect(sectionBlock?.text?.type).toBe('mrkdwn');
          
          // Property 10: Title should be bold in section text
          expect(sectionBlock?.text?.text).toContain(`*${workflow.title}*`);
          
          // Property 11: Actions block should have exactly one button
          expect(actionsBlock?.elements).toHaveLength(1);
          expect(button?.type).toBe('button');
          
          // Property 12: Button should be primary style
          expect(button?.style).toBe('primary');
          
          // Property 13: Should have fallback text
          expect(message.text).toBeDefined();
          expect(message.text).toContain(workflow.title);
          expect(message.text).toContain('Novo Workflow Publicado');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message structure is always valid Block Kit format
   * 
   * For any workflow, the formatted message should always conform to
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
          image_url: fc.option(
            fc.webUrl({ validSchemes: ['https'] }),
            { nil: null }
          ),
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          
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
   * For any workflow slug, the constructed URL should always be valid
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
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          const actionsBlock = message.blocks.find(b => b.type === 'actions');
          const button = actionsBlock?.elements?.[0];
          
          // URL should be defined
          expect(button?.url).toBeDefined();
          
          // URL should start with the base URL
          expect(button?.url).toMatch(/^https:\/\/vibeflow\.site\/workflows\//);
          
          // URL should end with the slug
          expect(button?.url).toBe(`https://vibeflow.site/workflows/${workflow.slug}`);
          
          // URL should be a valid URL
          expect(() => new URL(button?.url || '')).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Special characters are preserved
   * 
   * For any workflow with special characters in title or description,
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
          description: fc.option(
            fc.string({ minLength: 1, maxLength: 500 }),
            { nil: null }
          ),
          content: fc.string({ minLength: 1 }),
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          
          // Title should be present in section text
          expect(sectionBlock?.text?.text).toContain(workflow.title);
          
          // Description should be present if it exists
          if (workflow.description) {
            expect(sectionBlock?.text?.text).toContain(workflow.description);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty or null description handling
   * 
   * For any workflow with null or empty description, the message should
   * still be valid and contain only the title in the section block.
   */
  test('Property: Handles null and empty descriptions correctly', () => {
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
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          
          // Should have section text
          expect(sectionBlock?.text?.text).toBeDefined();
          
          // Should contain title
          expect(sectionBlock?.text?.text).toContain(workflow.title);
          
          // Should not contain 'null', 'undefined', or empty description
          expect(sectionBlock?.text?.text).not.toContain('null');
          expect(sectionBlock?.text?.text).not.toContain('undefined');
          
          // For null/empty description, text should be just the bold title
          if (!workflow.description) {
            expect(sectionBlock?.text?.text).toBe(`*${workflow.title}*`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Image accessory is conditional
   * 
   * For any workflow, the image accessory should be present if and only if
   * image_url is provided and not null.
   */
  test('Property: Image accessory presence matches image_url presence', () => {
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
          image_url: fc.option(
            fc.webUrl({ validSchemes: ['https'] }),
            { nil: null }
          ),
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          const sectionBlock = message.blocks.find(b => b.type === 'section');
          
          if (workflow.image_url) {
            // Should have accessory
            expect(sectionBlock?.accessory).toBeDefined();
            expect(sectionBlock?.accessory?.type).toBe('image');
            expect(sectionBlock?.accessory?.image_url).toBe(workflow.image_url);
            expect(sectionBlock?.accessory?.alt_text).toBe(workflow.title);
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
   * For any workflow, the message should have a fallback text that
   * includes the workflow title for notification purposes.
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
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          content: fc.string({ minLength: 1 }),
          image_url: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
          is_published: fc.boolean(),
          created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        (workflow) => {
          const message = formatWorkflowMessage(workflow);
          
          // Should have fallback text
          expect(message.text).toBeDefined();
          expect(typeof message.text).toBe('string');
          
          // Should contain the workflow title
          expect(message.text).toContain(workflow.title);
          
          // Should indicate it's a new workflow
          expect(message.text).toContain('Novo Workflow Publicado');
        }
      ),
      { numRuns: 100 }
    );
  });
});
