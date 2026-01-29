/**
 * Type Definition Tests for Slack Message Types
 * Feature: slack-community-integration
 * Task: 2.1 Create Slack message type definitions
 * 
 * These tests validate that the TypeScript type definitions are correctly
 * structured and can be used to create valid Slack Block Kit messages.
 */

import {
  ContentType,
  SlackMessage,
  SlackBlock,
  SlackText,
  SlackElement,
  SlackAccessory,
  SlackButton,
  SlackImageElement,
  SlackMarkdownElement,
} from '../slack';

describe('Slack Message Type Definitions', () => {
  /**
   * Test that ContentType union includes all expected values
   */
  test('ContentType includes all valid content types', () => {
    const validTypes: ContentType[] = ['workflow', 'mcp_server', 'blog_post', 'ide_news'];
    
    // This test validates that the type definition accepts all expected values
    validTypes.forEach(type => {
      const contentType: ContentType = type;
      expect(['workflow', 'mcp_server', 'blog_post', 'ide_news']).toContain(contentType);
    });
  });

  /**
   * Test that SlackMessage structure is valid
   */
  test('SlackMessage can be created with blocks array', () => {
    const message: SlackMessage = {
      blocks: [],
    };
    
    expect(message.blocks).toBeDefined();
    expect(Array.isArray(message.blocks)).toBe(true);
  });

  /**
   * Test that SlackMessage can include optional text field
   */
  test('SlackMessage can include optional fallback text', () => {
    const message: SlackMessage = {
      blocks: [],
      text: 'Fallback text for notifications',
    };
    
    expect(message.text).toBe('Fallback text for notifications');
  });

  /**
   * Test that SlackBlock supports all block types
   */
  test('SlackBlock supports all block types', () => {
    const blockTypes: Array<SlackBlock['type']> = [
      'header',
      'section',
      'actions',
      'context',
      'divider',
    ];
    
    blockTypes.forEach(type => {
      const block: SlackBlock = { type };
      expect(block.type).toBe(type);
    });
  });

  /**
   * Test that SlackText supports both plain_text and mrkdwn
   */
  test('SlackText supports plain_text and mrkdwn types', () => {
    const plainText: SlackText = {
      type: 'plain_text',
      text: 'Plain text content',
      emoji: true,
    };
    
    const markdown: SlackText = {
      type: 'mrkdwn',
      text: '*Bold* and _italic_ text',
    };
    
    expect(plainText.type).toBe('plain_text');
    expect(plainText.emoji).toBe(true);
    expect(markdown.type).toBe('mrkdwn');
  });

  /**
   * Test that SlackElement supports all element types
   */
  test('SlackElement supports button, mrkdwn, and image types', () => {
    const button: SlackElement = {
      type: 'button',
      text: { type: 'plain_text', text: 'Click me' },
      url: 'https://example.com',
      style: 'primary',
    };
    
    const markdown: SlackElement = {
      type: 'mrkdwn',
      text: 'Markdown text',
    };
    
    const image: SlackElement = {
      type: 'image',
      image_url: 'https://example.com/image.png',
      alt_text: 'Image description',
    };
    
    expect(button.type).toBe('button');
    expect(markdown.type).toBe('mrkdwn');
    expect(image.type).toBe('image');
  });

  /**
   * Test that SlackAccessory can be created for section blocks
   */
  test('SlackAccessory can be created with image type', () => {
    const accessory: SlackAccessory = {
      type: 'image',
      image_url: 'https://example.com/accessory.png',
      alt_text: 'Accessory image',
    };
    
    expect(accessory.type).toBe('image');
    expect(accessory.image_url).toBeDefined();
    expect(accessory.alt_text).toBeDefined();
  });

  /**
   * Test that a complete SlackMessage with header, section, and actions can be created
   */
  test('Complete SlackMessage with multiple block types can be created', () => {
    const message: SlackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚀 New Workflow Published!',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Workflow Title*\nWorkflow description goes here.',
          },
          accessory: {
            type: 'image',
            image_url: 'https://example.com/workflow.png',
            alt_text: 'Workflow image',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Workflow',
              },
              url: 'https://example.com/workflows/test',
              style: 'primary',
            },
          ],
        },
      ],
      text: 'New Workflow Published!',
    };
    
    expect(message.blocks).toHaveLength(3);
    expect(message.blocks[0].type).toBe('header');
    expect(message.blocks[1].type).toBe('section');
    expect(message.blocks[2].type).toBe('actions');
    expect(message.text).toBe('New Workflow Published!');
  });

  /**
   * Test that SlackButton type is correctly defined
   */
  test('SlackButton type enforces required fields', () => {
    const button: SlackButton = {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Click me',
      },
      url: 'https://example.com',
      style: 'primary',
    };
    
    expect(button.type).toBe('button');
    expect(button.text).toBeDefined();
    expect(button.url).toBeDefined();
  });

  /**
   * Test that SlackImageElement type is correctly defined
   */
  test('SlackImageElement type enforces required fields', () => {
    const image: SlackImageElement = {
      type: 'image',
      image_url: 'https://example.com/image.png',
      alt_text: 'Image description',
    };
    
    expect(image.type).toBe('image');
    expect(image.image_url).toBeDefined();
    expect(image.alt_text).toBeDefined();
  });

  /**
   * Test that SlackMarkdownElement type is correctly defined
   */
  test('SlackMarkdownElement type enforces required fields', () => {
    const markdown: SlackMarkdownElement = {
      type: 'mrkdwn',
      text: '*Bold* text',
    };
    
    expect(markdown.type).toBe('mrkdwn');
    expect(markdown.text).toBeDefined();
  });

  /**
   * Test that context block with multiple elements can be created
   */
  test('Context block with multiple elements can be created', () => {
    const contextBlock: SlackBlock = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Tag 1',
        },
        {
          type: 'mrkdwn',
          text: 'Tag 2',
        },
        {
          type: 'image',
          image_url: 'https://example.com/icon.png',
          alt_text: 'Icon',
        },
      ],
    };
    
    expect(contextBlock.type).toBe('context');
    expect(contextBlock.elements).toHaveLength(3);
  });

  /**
   * Test that divider block can be created
   */
  test('Divider block can be created', () => {
    const divider: SlackBlock = {
      type: 'divider',
    };
    
    expect(divider.type).toBe('divider');
  });
});
