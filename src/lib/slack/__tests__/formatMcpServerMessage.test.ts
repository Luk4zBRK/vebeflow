/**
 * Unit Tests for formatMcpServerMessage
 * 
 * Feature: slack-community-integration
 * Task: 2.4 Implement formatMcpServerMessage function
 * 
 * These tests validate that the formatMcpServerMessage function correctly
 * formats MCP server data into Slack Block Kit messages according to the
 * design specification.
 */

import { describe, test, expect } from '@jest/globals';
import { formatMcpServerMessage } from '../formatters';

describe('formatMcpServerMessage', () => {
  /**
   * Unit Test: Basic MCP server message structure
   * 
   * Validates that the message has the required blocks:
   * - Header block
   * - Section block
   * - Context block (if tags present)
   * - Actions block
   */
  test('creates message with header, section, context, and actions blocks', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: ['ai', 'automation'],
      npm_package: '@test/mcp-server',
      github_url: 'https://github.com/test/mcp-server',
      install_command: 'npm install @test/mcp-server',
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);

    // Should have blocks array
    expect(message.blocks).toBeDefined();
    expect(Array.isArray(message.blocks)).toBe(true);
    expect(message.blocks.length).toBeGreaterThanOrEqual(3);

    // Should have header block
    const headerBlock = message.blocks[0];
    expect(headerBlock.type).toBe('header');
    expect(headerBlock.text?.type).toBe('plain_text');
    expect(headerBlock.text?.text).toContain('MCP Server');

    // Should have section block
    const sectionBlock = message.blocks[1];
    expect(sectionBlock.type).toBe('section');
    expect(sectionBlock.text?.type).toBe('mrkdwn');

    // Should have context block with tags
    const contextBlock = message.blocks[2];
    expect(contextBlock.type).toBe('context');

    // Should have actions block
    const actionsBlock = message.blocks[3];
    expect(actionsBlock.type).toBe('actions');
  });

  /**
   * Unit Test: Section block content
   * 
   * Validates that the section block includes:
   * - Server name (title)
   * - Description
   * - NPM package
   */
  test('includes server name, description, and npm package in section block', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: null,
      npm_package: '@test/mcp-server',
      github_url: null,
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('Test MCP Server');
    expect(sectionBlock.text?.text).toContain('A test MCP server');
    expect(sectionBlock.text?.text).toContain('@test/mcp-server');
  });

  /**
   * Unit Test: Context block with tags
   * 
   * Validates that up to 5 tags are included in the context block
   */
  test('includes up to 5 tags in context block', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: ['ai', 'automation', 'tools', 'mcp', 'server', 'extra', 'more'],
      npm_package: '@test/mcp-server',
      github_url: null,
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);
    const contextBlock = message.blocks.find(b => b.type === 'context');

    expect(contextBlock).toBeDefined();
    expect(contextBlock?.elements).toBeDefined();
    expect(contextBlock?.elements?.length).toBe(1);

    const tagsText = (contextBlock?.elements?.[0] as any).text;
    expect(tagsText).toContain('`ai`');
    expect(tagsText).toContain('`automation`');
    expect(tagsText).toContain('`tools`');
    expect(tagsText).toContain('`mcp`');
    expect(tagsText).toContain('`server`');
    // Should not include 6th and 7th tags
    expect(tagsText).not.toContain('`extra`');
    expect(tagsText).not.toContain('`more`');
  });

  /**
   * Unit Test: No context block when no tags
   * 
   * Validates that context block is omitted when tags are null or empty
   */
  test('does not include context block when tags are null', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: null,
      npm_package: '@test/mcp-server',
      github_url: null,
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);
    const contextBlock = message.blocks.find(b => b.type === 'context');

    expect(contextBlock).toBeUndefined();
  });

  /**
   * Unit Test: Actions block with View Details button
   * 
   * Validates that the actions block includes a "View Details" button
   * with the correct URL
   */
  test('includes View Details button with correct URL', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: null,
      npm_package: '@test/mcp-server',
      github_url: null,
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);
    const actionsBlock = message.blocks.find(b => b.type === 'actions');
    const button = actionsBlock?.elements?.[0];

    expect(button).toBeDefined();
    expect((button as any).type).toBe('button');
    expect((button as any).text.text).toBe('Ver Detalhes');
    expect((button as any).url).toBe('https://vibeflow.site/mcp-servers/test-mcp-server');
    expect((button as any).style).toBe('primary');
  });

  /**
   * Unit Test: GitHub button when github_url is present
   * 
   * Validates that a GitHub button is included when github_url is provided
   */
  test('includes GitHub button when github_url is present', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: null,
      npm_package: '@test/mcp-server',
      github_url: 'https://github.com/test/mcp-server',
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);
    const actionsBlock = message.blocks.find(b => b.type === 'actions');

    expect(actionsBlock?.elements?.length).toBe(2);

    const githubButton = actionsBlock?.elements?.[1];
    expect((githubButton as any).type).toBe('button');
    expect((githubButton as any).text.text).toBe('GitHub');
    expect((githubButton as any).url).toBe('https://github.com/test/mcp-server');
  });

  /**
   * Unit Test: No GitHub button when github_url is null
   * 
   * Validates that GitHub button is omitted when github_url is null
   */
  test('does not include GitHub button when github_url is null', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: null,
      npm_package: '@test/mcp-server',
      github_url: null,
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);
    const actionsBlock = message.blocks.find(b => b.type === 'actions');

    expect(actionsBlock?.elements?.length).toBe(1);
  });

  /**
   * Unit Test: Fallback text
   * 
   * Validates that the message includes fallback text for notifications
   */
  test('includes fallback text for notifications', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: null,
      npm_package: '@test/mcp-server',
      github_url: null,
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);

    expect(message.text).toBeDefined();
    expect(message.text).toContain('Test MCP Server');
  });

  /**
   * Unit Test: Handles null description
   * 
   * Validates that the function handles null description gracefully
   */
  test('handles null description', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: null,
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: null,
      npm_package: '@test/mcp-server',
      github_url: null,
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('Test MCP Server');
    expect(sectionBlock.text?.text).toContain('@test/mcp-server');
  });

  /**
   * Unit Test: Handles null npm_package
   * 
   * Validates that the function handles null npm_package gracefully
   */
  test('handles null npm_package', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: null,
      npm_package: null,
      github_url: null,
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);
    const sectionBlock = message.blocks[1];

    expect(sectionBlock.text?.text).toContain('Test MCP Server');
    expect(sectionBlock.text?.text).toContain('A test MCP server');
    expect(sectionBlock.text?.text).not.toContain('📦');
  });

  /**
   * Unit Test: Valid Slack Block Kit structure
   * 
   * Validates that the generated message conforms to Slack Block Kit
   * JSON schema requirements
   */
  test('creates valid Slack Block Kit message structure', () => {
    const server = {
      id: '123',
      title: 'Test MCP Server',
      slug: 'test-mcp-server',
      description: 'A test MCP server',
      content: 'Test content',
      image_url: null,
      author_id: null,
      author_name: null,
      category: 'tools',
      tags: ['ai', 'automation'],
      npm_package: '@test/mcp-server',
      github_url: 'https://github.com/test/mcp-server',
      install_command: null,
      is_published: true,
      views_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = formatMcpServerMessage(server);

    // Should be serializable to JSON
    expect(() => JSON.stringify(message)).not.toThrow();

    // Should have required top-level properties
    expect(message).toHaveProperty('blocks');
    expect(message).toHaveProperty('text');

    // All blocks should have a type
    message.blocks.forEach(block => {
      expect(block).toHaveProperty('type');
      expect(['header', 'section', 'actions', 'context', 'divider']).toContain(block.type);
    });
  });
});
