const { expect, describe, test, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
require('./setup.js');

// Import the functions from background.js
const { getCurrentMessage, formatEmailForTrello, extractBodyFromParts } = require('../background.js');

describe('Background.js - Email Pre-fill Feature', () => {

  beforeEach(() => {
    // Mock default successful responses
    global.browser.tabs.query.mockResolvedValue([{ id: 1 }]);
    global.browser.messageDisplay.getDisplayedMessage.mockResolvedValue({
      id: 'msg1',
      subject: 'Test Subject',
    });
    global.browser.messages.getFull.mockResolvedValue({
      parts: [
        {
          contentType: 'text/plain',
          body: 'Test Body'
        }
      ]
    });
  });

  describe('formatEmailForTrello function', () => {
    test('should format metadata correctly', () => {
      const body = 'This is a test body.';
      const testDate = new Date('2025-07-30T21:56:56Z');
      const message = {
        author: 'John Doe <john@example.com>',
        recipients: ['jane@example.com'],
        ccList: ['cc@example.com'],
        date: testDate,
      };
      const result = formatEmailForTrello(body, message);
      expect(result).toContain('**From:** John Doe <john@example.com>');
      expect(result).toContain('**To:** jane@example.com');
      expect(result).toContain('**CC:** cc@example.com');
      // Test date format more flexibly to handle timezone differences
      expect(result).toContain('**Date:**');
      expect(result).toContain('7/30/2025');
    });

    test('should format quoted text correctly', () => {
      const body = '\n> Quote\n> Another Quote';
      const message = {};
      const result = formatEmailForTrello(body, message);
      expect(result).toContain('**Previous conversation:**');
      expect(result).toContain('> Quote');
    });

    test('should detect and format signatures correctly', () => {
      const body = 'This is a test body.\n\n-- \nSignature\nJohn';
      const message = {};
      const result = formatEmailForTrello(body, message);
      expect(result).toContain('**Signature:**\n-- \nSignature\nJohn');
    });

    test('should handle empty message object', () => {
      const body = 'Simple body text';
      const message = {};
      const result = formatEmailForTrello(body, message);
      expect(result).toContain('## Email Details');
      expect(result).toContain('Simple body text');
      expect(result).not.toContain('**From:**');
      expect(result).not.toContain('**To:**');
      expect(result).not.toContain('**CC:**');
      expect(result).not.toContain('**Date:**');
    });

    test('should clean up excessive whitespace', () => {
      const body = 'Line 1\n\n\n\n\nLine 2';
      const message = {};
      const result = formatEmailForTrello(body, message);
      expect(result).not.toMatch(/\n{4,}/);
    });

    test('should handle email addresses in recipients correctly', () => {
      const body = 'Test body';
      const message = {
        recipients: ['John Doe <john@example.com>', 'jane@example.com'],
        ccList: ['CC Person <cc@example.com>']
      };
      const result = formatEmailForTrello(body, message);
      expect(result).toContain('**To:** john@example.com, jane@example.com');
      expect(result).toContain('**CC:** cc@example.com');
    });
    
    test('should format date independently of timezone', () => {
      const body = 'Test body';
      const testDate = new Date('2025-12-25T12:00:00Z'); // Christmas noon UTC
      const message = { date: testDate };
      const result = formatEmailForTrello(body, message);
      
      // Should contain the date field
      expect(result).toContain('**Date:**');
      // Should contain the date in some format
      expect(result).toMatch(/\*\*Date:\*\*\s+.+/); 
      // Date should be formatted as a valid date string
      const dateMatch = result.match(/\*\*Date:\*\*\s+(.+)/m);
      expect(dateMatch).toBeTruthy();
      if (dateMatch) {
        const dateString = dateMatch[1].trim();
        // Should be a valid date string that contains 2025 and 12 (December)
        expect(dateString).toMatch(/2025/);
        expect(dateString).toMatch(/12/);
      }
    });
  });

  describe('extractBodyFromParts function', () => {
    // Mock console.log to suppress output during tests
    const originalConsoleLog = console.log;
    beforeEach(() => {
      console.log = jest.fn();
    });
    
    afterEach(() => {
      console.log = originalConsoleLog;
    });

    test('should extract text/plain content', () => {
      const parts = [
        {
          contentType: 'text/plain',
          body: 'This is plain text content'
        }
      ];
      const result = extractBodyFromParts(parts);
      expect(result).toBe('This is plain text content');
    });

    test('should extract and strip text/html content when no plain text', () => {
      const parts = [
        {
          contentType: 'text/html',
          body: '<p>This is <b>HTML</b> content</p>'
        }
      ];
      const result = extractBodyFromParts(parts);
      expect(result).toBe('This is HTML content');
    });

    test('should concatenate all text content found', () => {
      const parts = [
        {
          contentType: 'text/html',
          body: '<p>HTML content</p>'
        },
        {
          contentType: 'text/plain',
          body: 'Plain text content'
        }
      ];
      const result = extractBodyFromParts(parts);
      expect(result).toBe('HTML contentPlain text content');
    });

    test('should handle nested parts recursively', () => {
      const parts = [
        {
          contentType: 'multipart/mixed',
          parts: [
            {
              contentType: 'text/plain',
              body: 'Nested plain text'
            }
          ]
        }
      ];
      const result = extractBodyFromParts(parts);
      expect(result).toBe('Nested plain text');
    });

    test('should handle empty parts array', () => {
      const parts = [];
      const result = extractBodyFromParts(parts);
      expect(result).toBe('');
    });

    test('should skip parts without usable content', () => {
      const parts = [
        {
          contentType: 'application/pdf',
          body: 'binary data'
        },
        {
          contentType: 'text/plain',
          body: 'Plain text content'
        }
      ];
      const result = extractBodyFromParts(parts);
      expect(result).toBe('Plain text content');
    });

    test('should handle &nbsp; entities in HTML', () => {
      const parts = [
        {
          contentType: 'text/html',
          body: 'Text&nbsp;with&nbsp;spaces'
        }
      ];
      const result = extractBodyFromParts(parts);
      expect(result).toBe('Text with spaces');
    });
  });

  test('should contain getCurrentMessage function', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('getCurrentMessage');
    expect(backgroundScript).toContain('async function getCurrentMessage()');
  });

  test('should use correct Thunderbird API for message retrieval', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('browser.tabs.query');
    expect(backgroundScript).toContain('browser.messageDisplay.getDisplayedMessage');
    expect(backgroundScript).toContain('browser.messages.getFull');
  });

  test('should handle message display window type correctly', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain("windowType: 'messageDisplay'");
    expect(backgroundScript).toContain('active: true');
  });

  test('should have message listener for popup communication', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('browser.runtime.onMessage.addListener');
    expect(backgroundScript).toContain('get_current_message');
  });

  test('should return subject and body from message', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('subject: message.subject');
    expect(backgroundScript).toContain('body: body');
  });

  test('should handle errors gracefully', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('try {');
    expect(backgroundScript).toContain('catch (error)');
    expect(backgroundScript).toContain('return null');
  });

  test('should return null when no message is displayed', async () => {
    browser.messageDisplay.getDisplayedMessage.mockResolvedValue(null);
    const message = await getCurrentMessage();
    expect(message).toBeNull();
  });

  test('should handle empty message body', async () => {
    browser.messages.getFull.mockResolvedValue({ parts: [] });
    const { body } = await getCurrentMessage();
    expect(body).toBe('');
  });

  test('should return null when tabs query fails', async () => {
    browser.tabs.query.mockRejectedValue(new Error('test error'));
    const message = await getCurrentMessage();
    expect(message).toBeNull();
  });

  test('should return null when message display fails', async () => {
    browser.messageDisplay.getDisplayedMessage.mockRejectedValue(new Error('test error'));
    const message = await getCurrentMessage();
    expect(message).toBeNull();
  });

  test('should return empty body when getFull fails', async () => {
    browser.messages.getFull.mockRejectedValue(new Error('test error'));
    const message = await getCurrentMessage();
    expect(message).toHaveProperty('subject', 'Test Subject');
    expect(message).toHaveProperty('body', '');
  });

  test('should return correct message structure', async () => {
    const message = await getCurrentMessage();
    expect(message).toHaveProperty('subject');
    expect(message).toHaveProperty('body');
    expect(message.subject).toBe('Test Subject');
    // Body should now be formatted with email details header
    expect(message.body).toContain('## Email Details');
    expect(message.body).toContain('Test Body');
  });

  test('should validate syntax', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(() => {
      new Function(backgroundScript);
    }).not.toThrow();
  });

});
