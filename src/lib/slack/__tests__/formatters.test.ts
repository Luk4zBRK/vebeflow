/**
 * Tests for Slack Message Formatters
 * 
 * Feature: slack-community-integration
 * Task: 2.2 Implement formatWorkflowMessage function
 * 
 * These tests validate that the formatWorkflowMessage function correctly
 * formats workflow data into Slack Block Kit messages according to the
 * design specification.
 */

import { describe, test, expect } from '@jest/globals';
import { formatWorkflowMessage } from '../formatters';

describe('formatWorkflowMessage', () => {
  /**
   * Unit Test: Basic workflow message structure
   */
  test('creates message with header, section, and actions blocks', () => {
    const workflow = {
      id: '123',
      title: 'Test Workflow',
      slug: 'test-workflow',
      description: 'A test workflow description',
      content: 'Workflow content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);

    // Should have blocks array
    expect(message.blocks).toBeDefined();
    expect(Array.isArray(message.blocks)).toBe(true);
    expect(message.blocks.length).toBe(3);

    // Should have header block
    expect(message.blocks[0].type).toBe('header');
    expect(message.blocks[0].text?.type).toBe('plain_text');
    expect(message.blocks[0].text?.text).toBe('🚀 Novo Workflow Publicado!');
    expect(message.blocks[0].text?.emoji).toBe(true);

    // Should have section block
    expect(message.blocks[1].type).toBe('section');
    expect(message.blocks[1].text?.type).toBe('mrkdwn');

    // Should have actions block
    expect(message.blocks[2].type).toBe('actions');
    expect(message.blocks[2].elements).toBeDefined();
    expect(message.blocks[2].elements?.length).toBe(1);
  });

  /**
   * Unit Test: Title and description in section block
   */
  test('includes workflow title and description in section block', () => {
    const workflow = {
      id: '456',
      title: 'My Awesome Workflow',
      slug: 'my-awesome-workflow',
      description: 'This workflow does amazing things',
      content: 'Content here',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('My Awesome Workflow');
    expect(sectionBlock.text?.text).toContain('This workflow does amazing things');
    // Title should be bold (markdown format)
    expect(sectionBlock.text?.text).toContain('*My Awesome Workflow*');
  });

  /**
   * Unit Test: Handles null description
   */
  test('handles workflow with null description', () => {
    const workflow = {
      id: '789',
      title: 'Workflow Without Description',
      slug: 'no-description',
      description: null,
      content: 'Content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const sectionBlock = message.blocks[1];

    // Should still have title
    expect(sectionBlock.text?.text).toContain('Workflow Without Description');
    // Should not have undefined or null in text
    expect(sectionBlock.text?.text).not.toContain('null');
    expect(sectionBlock.text?.text).not.toContain('undefined');
  });

  /**
   * Unit Test: Image accessory when image_url present
   */
  test('includes image accessory when image_url is present', () => {
    const workflow = {
      id: '101',
      title: 'Workflow With Image',
      slug: 'with-image',
      description: 'Has an image',
      content: 'Content',
      image_url: 'https://example.com/workflow-image.jpg',
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.accessory).toBeDefined();
    expect(sectionBlock.accessory?.type).toBe('image');
    expect(sectionBlock.accessory?.image_url).toBe('https://example.com/workflow-image.jpg');
    expect(sectionBlock.accessory?.alt_text).toBe('Workflow With Image');
  });

  /**
   * Unit Test: No image accessory when image_url is null
   */
  test('does not include image accessory when image_url is null', () => {
    const workflow = {
      id: '102',
      title: 'Workflow Without Image',
      slug: 'no-image',
      description: 'No image here',
      content: 'Content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.accessory).toBeUndefined();
  });

  /**
   * Unit Test: View Workflow button with correct URL
   */
  test('includes View Workflow button with correct URL', () => {
    const workflow = {
      id: '103',
      title: 'Test Workflow',
      slug: 'test-workflow-slug',
      description: 'Description',
      content: 'Content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const actionsBlock = message.blocks[2];

    expect(actionsBlock.elements).toBeDefined();
    expect(actionsBlock.elements?.length).toBe(1);

    const button = actionsBlock.elements![0];
    expect(button.type).toBe('button');
    expect(button.text).toEqual({
      type: 'plain_text',
      text: 'Ver Workflow',
      emoji: true,
    });
    expect(button.url).toBe('https://vibeflow.site/workflows/test-workflow-slug');
    expect(button.style).toBe('primary');
  });

  /**
   * Unit Test: Fallback text for notifications
   */
  test('includes fallback text for notifications', () => {
    const workflow = {
      id: '104',
      title: 'Notification Test',
      slug: 'notification-test',
      description: 'Testing notifications',
      content: 'Content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);

    expect(message.text).toBeDefined();
    expect(message.text).toBe('Novo Workflow Publicado: Notification Test');
  });

  /**
   * Edge Case: Empty string description
   */
  test('handles empty string description', () => {
    const workflow = {
      id: '105',
      title: 'Empty Description',
      slug: 'empty-desc',
      description: '',
      content: 'Content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const sectionBlock = message.blocks[1];

    // Empty string is falsy, so should only show title
    expect(sectionBlock.text?.text).toBe('*Empty Description*');
  });

  /**
   * Edge Case: Very long title
   */
  test('handles very long workflow title', () => {
    const longTitle = 'A'.repeat(200);
    const workflow = {
      id: '106',
      title: longTitle,
      slug: 'long-title',
      description: 'Description',
      content: 'Content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const sectionBlock = message.blocks[1];

    // Should still include the full title
    expect(sectionBlock.text?.text).toContain(longTitle);
  });

  /**
   * Edge Case: Special characters in title and description
   */
  test('handles special characters in title and description', () => {
    const workflow = {
      id: '107',
      title: 'Workflow with *special* _chars_ & symbols',
      slug: 'special-chars',
      description: 'Description with <html> & "quotes"',
      content: 'Content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const sectionBlock = message.blocks[1];

    // Should preserve special characters
    expect(sectionBlock.text?.text).toContain('*special*');
    expect(sectionBlock.text?.text).toContain('_chars_');
    expect(sectionBlock.text?.text).toContain('&');
    expect(sectionBlock.text?.text).toContain('<html>');
    expect(sectionBlock.text?.text).toContain('"quotes"');
  });

  /**
   * Edge Case: URL with special characters in slug
   */
  test('constructs URL correctly with special slug characters', () => {
    const workflow = {
      id: '108',
      title: 'Test',
      slug: 'workflow-with-numbers-123',
      description: 'Description',
      content: 'Content',
      image_url: null,
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);
    const actionsBlock = message.blocks[2];
    const button = actionsBlock.elements![0];

    expect(button.url).toBe('https://vibeflow.site/workflows/workflow-with-numbers-123');
  });

  /**
   * Integration Test: Complete message structure validation
   */
  test('creates valid Slack Block Kit message structure', () => {
    const workflow = {
      id: '109',
      title: 'Complete Test',
      slug: 'complete-test',
      description: 'Full validation test',
      content: 'Content',
      image_url: 'https://example.com/image.jpg',
      is_published: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const message = formatWorkflowMessage(workflow);

    // Validate overall structure
    expect(message).toHaveProperty('blocks');
    expect(message).toHaveProperty('text');

    // Validate blocks array
    expect(Array.isArray(message.blocks)).toBe(true);
    expect(message.blocks.length).toBe(3);

    // Validate each block has required type
    message.blocks.forEach((block) => {
      expect(block).toHaveProperty('type');
      expect(['header', 'section', 'actions']).toContain(block.type);
    });

    // Validate header block structure
    const headerBlock = message.blocks[0];
    expect(headerBlock.type).toBe('header');
    expect(headerBlock.text).toBeDefined();
    expect(headerBlock.text?.type).toBe('plain_text');
    expect(headerBlock.text?.text).toBeTruthy();

    // Validate section block structure
    const sectionBlock = message.blocks[1];
    expect(sectionBlock.type).toBe('section');
    expect(sectionBlock.text).toBeDefined();
    expect(sectionBlock.text?.type).toBe('mrkdwn');
    expect(sectionBlock.accessory).toBeDefined();
    expect(sectionBlock.accessory?.type).toBe('image');

    // Validate actions block structure
    const actionsBlock = message.blocks[2];
    expect(actionsBlock.type).toBe('actions');
    expect(actionsBlock.elements).toBeDefined();
    expect(Array.isArray(actionsBlock.elements)).toBe(true);
    expect(actionsBlock.elements?.length).toBeGreaterThan(0);

    // Validate button element
    const button = actionsBlock.elements![0];
    expect(button.type).toBe('button');
    expect(button.text).toBeDefined();
    expect(button.url).toBeTruthy();
  });
});
