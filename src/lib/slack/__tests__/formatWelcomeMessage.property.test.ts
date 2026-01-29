/**
 * Property-Based Tests for formatWelcomeMessage
 * 
 * Feature: slack-community-integration
 * Task: 2.11 Write property test for welcome message content
 * 
 * These property-based tests validate that the formatWelcomeMessage function
 * maintains correctness properties across all executions using fast-check
 * for randomized testing.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { formatWelcomeMessage } from '../formatters';

describe('formatWelcomeMessage - Property-Based Tests', () => {
  /**
   * Property 1: Welcome message delivery
   * 
   * For any new member join event, the Welcome_Bot should send a direct message
   * to that member containing links to #regras, #geral, and #ajuda channels,
   * formatted using Slack Block Kit.
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
   */
  test('Property 1: Welcome message delivery', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary number of invocations (simulating multiple new members)
        fc.integer({ min: 1, max: 100 }),
        (invocations) => {
          // Call the function multiple times to ensure consistency
          for (let i = 0; i < invocations; i++) {
            const message = formatWelcomeMessage();
            
            // Property 1: Should have blocks array
            expect(message).toHaveProperty('blocks');
            expect(Array.isArray(message.blocks)).toBe(true);
            
            // Property 2: Should have header block with welcome text
            const headerBlock = message.blocks.find(b => b.type === 'header');
            expect(headerBlock).toBeDefined();
            expect(headerBlock?.text?.text).toContain('Bem-vindo');
            expect(headerBlock?.text?.type).toBe('plain_text');
            expect(headerBlock?.text?.emoji).toBe(true);
            
            // Property 3: Should contain link to #regras channel
            const messageText = JSON.stringify(message);
            expect(messageText).toContain('#regras');
            expect(messageText).toContain('regras');
            
            // Property 4: Should contain link to #geral channel
            expect(messageText).toContain('#geral');
            expect(messageText).toContain('geral');
            
            // Property 5: Should contain link to #ajuda channel
            expect(messageText).toContain('#ajuda');
            expect(messageText).toContain('ajuda');
            
            // Property 6: Should use Slack Block Kit formatting
            expect(message.blocks.length).toBeGreaterThan(0);
            message.blocks.forEach((block) => {
              expect(block).toHaveProperty('type');
              expect(['header', 'section', 'actions', 'context', 'divider']).toContain(block.type);
            });
            
            // Property 7: Should have section blocks with markdown
            const sectionBlocks = message.blocks.filter(b => b.type === 'section');
            expect(sectionBlocks.length).toBeGreaterThan(0);
            sectionBlocks.forEach((block) => {
              expect(block.text?.type).toBe('mrkdwn');
            });
            
            // Property 8: Should have navigation guide
            expect(messageText).toContain('Canais importantes');
            
            // Property 9: Should have fallback text
            expect(message.text).toBeDefined();
            expect(message.text).toContain('Bem-vindo');
            expect(message.text).toContain('#regras');
            expect(message.text).toContain('#geral');
            expect(message.text).toContain('#ajuda');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message structure is always consistent
   * 
   * For any invocation, the welcome message should always have the same
   * structure and content (it's a static message).
   */
  test('Property: Message structure is always consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (iterations) => {
          const messages = Array.from({ length: iterations }, () => formatWelcomeMessage());
          
          // All messages should be identical
          const firstMessage = JSON.stringify(messages[0]);
          messages.forEach((message) => {
            expect(JSON.stringify(message)).toBe(firstMessage);
          });
          
          // All should have the same number of blocks
          const blockCount = messages[0].blocks.length;
          messages.forEach((message) => {
            expect(message.blocks.length).toBe(blockCount);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message always has valid Block Kit structure
   * 
   * For any invocation, the formatted message should always conform to
   * Slack Block Kit structure requirements.
   */
  test('Property: Message always has valid Block Kit structure', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed, function takes no parameters
        () => {
          const message = formatWelcomeMessage();
          
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
          expect(sectionBlocks.length).toBeGreaterThan(0);
          sectionBlocks.forEach((block) => {
            expect(block.text).toBeDefined();
            expect(block.text?.type).toBe('mrkdwn');
            expect(block.text?.text).toBeTruthy();
          });
          
          // Should be serializable to JSON
          expect(() => JSON.stringify(message)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All required channel links are present
   * 
   * For any invocation, the message should always contain links to all
   * three required channels: #regras, #geral, and #ajuda.
   */
  test('Property: All required channel links are present', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const message = formatWelcomeMessage();
          const messageText = JSON.stringify(message);
          
          // Should contain all three channel references
          const requiredChannels = ['regras', 'geral', 'ajuda'];
          requiredChannels.forEach((channel) => {
            expect(messageText).toContain(channel);
            expect(messageText).toContain(`#${channel}`);
          });
          
          // Should use Slack channel link format <#channel|#channel>
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          const navigationBlock = sectionBlocks.find(b => 
            b.text?.text?.includes('Canais importantes')
          );
          
          expect(navigationBlock).toBeDefined();
          expect(navigationBlock?.text?.text).toContain('<#regras|#regras>');
          expect(navigationBlock?.text?.text).toContain('<#geral|#geral>');
          expect(navigationBlock?.text?.text).toContain('<#ajuda|#ajuda>');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Navigation guide is present
   * 
   * For any invocation, the message should include a navigation guide
   * explaining what each channel is for.
   */
  test('Property: Navigation guide is present', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const message = formatWelcomeMessage();
          const sectionBlocks = message.blocks.filter(b => b.type === 'section');
          
          // Should have a section with navigation guide
          const navigationBlock = sectionBlocks.find(b => 
            b.text?.text?.includes('Canais importantes')
          );
          
          expect(navigationBlock).toBeDefined();
          expect(navigationBlock?.text?.text).toContain('Canais importantes');
          
          // Should explain each channel
          expect(navigationBlock?.text?.text).toContain('regras');
          expect(navigationBlock?.text?.text).toContain('geral');
          expect(navigationBlock?.text?.text).toContain('ajuda');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fallback text is always present and meaningful
   * 
   * For any invocation, the message should have a fallback text that
   * includes the welcome message and channel references.
   */
  test('Property: Fallback text is always present and meaningful', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const message = formatWelcomeMessage();
          
          // Should have fallback text
          expect(message.text).toBeDefined();
          expect(typeof message.text).toBe('string');
          
          // Should contain welcome message
          expect(message.text).toContain('Bem-vindo');
          
          // Should contain channel references
          expect(message.text).toContain('#regras');
          expect(message.text).toContain('#geral');
          expect(message.text).toContain('#ajuda');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message has exactly 3 blocks
   * 
   * For any invocation, the welcome message should have exactly 3 blocks:
   * header, welcome text section, and navigation guide section.
   */
  test('Property: Message has exactly 3 blocks', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const message = formatWelcomeMessage();
          
          // Should have exactly 3 blocks
          expect(message.blocks.length).toBe(3);
          
          // Block types should be in correct order
          expect(message.blocks[0].type).toBe('header');
          expect(message.blocks[1].type).toBe('section');
          expect(message.blocks[2].type).toBe('section');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Welcome message is in Portuguese
   * 
   * For any invocation, the message should be in Portuguese (Brazilian)
   * as indicated by the text content.
   */
  test('Property: Welcome message is in Portuguese', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const message = formatWelcomeMessage();
          const messageText = JSON.stringify(message);
          
          // Should contain Portuguese text
          const portugueseWords = ['Bem-vindo', 'Olá', 'você', 'aqui', 'Canais'];
          portugueseWords.forEach((word) => {
            expect(messageText).toContain(word);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message includes emoji
   * 
   * For any invocation, the header should include emoji and the emoji
   * flag should be set to true.
   */
  test('Property: Message includes emoji', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const message = formatWelcomeMessage();
          const headerBlock = message.blocks.find(b => b.type === 'header');
          
          // Header should have emoji flag set
          expect(headerBlock?.text?.emoji).toBe(true);
          
          // Header text should contain emoji
          expect(headerBlock?.text?.text).toMatch(/[\u{1F300}-\u{1F9FF}]/u);
        }
      ),
      { numRuns: 100 }
    );
  });
});
