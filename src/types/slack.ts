/**
 * Slack Message Type Definitions
 * 
 * These types define the structure for Slack Block Kit messages used in the
 * Slack Community Integration feature. They follow the Slack Block Kit API
 * specification for rich message formatting.
 * 
 * @see https://api.slack.com/block-kit
 */

/**
 * Content types that can trigger Slack notifications
 */
export type ContentType = 'workflow' | 'mcp_server' | 'blog_post' | 'ide_news';

/**
 * Main Slack message structure using Block Kit format
 */
export interface SlackMessage {
  /** Array of Block Kit blocks that compose the message */
  blocks: SlackBlock[];
  /** Optional fallback text for notifications (plain text) */
  text?: string;
}

/**
 * Slack Block Kit block types
 * Blocks are the building blocks of messages in Slack
 */
export interface SlackBlock {
  /** Type of block */
  type: 'header' | 'section' | 'actions' | 'context' | 'divider';
  /** Text content for header and section blocks */
  text?: SlackText;
  /** Array of elements for actions and context blocks */
  elements?: SlackElement[];
  /** Accessory element for section blocks (e.g., image) */
  accessory?: SlackAccessory;
}

/**
 * Text object for Slack blocks
 */
export interface SlackText {
  /** Type of text formatting */
  type: 'plain_text' | 'mrkdwn';
  /** The actual text content */
  text: string;
  /** Whether to enable emoji parsing (plain_text only) */
  emoji?: boolean;
}

/**
 * Interactive and display elements for Slack blocks
 */
export interface SlackElement {
  /** Type of element */
  type: 'button' | 'mrkdwn' | 'image';
  /** Text for button elements (SlackText object) or mrkdwn elements (string) */
  text?: SlackText | string;
  /** URL for button and image elements */
  url?: string;
  /** Style for button elements */
  style?: 'primary' | 'danger';
  /** Image URL for image elements */
  image_url?: string;
  /** Alt text for image elements */
  alt_text?: string;
}

/**
 * Accessory elements that can be attached to section blocks
 */
export interface SlackAccessory {
  /** Type of accessory (currently only image is used) */
  type: 'image';
  /** URL of the image */
  image_url: string;
  /** Alt text for the image */
  alt_text: string;
}

/**
 * Button element for actions blocks
 */
export interface SlackButton extends SlackElement {
  type: 'button';
  text: SlackText;
  url: string;
  style?: 'primary' | 'danger';
}

/**
 * Image element for context blocks
 */
export interface SlackImageElement extends SlackElement {
  type: 'image';
  image_url: string;
  alt_text: string;
}

/**
 * Markdown text element for context blocks
 */
export interface SlackMarkdownElement extends SlackElement {
  type: 'mrkdwn';
  text: string;
}
