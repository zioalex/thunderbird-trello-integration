const { expect, describe, test, beforeEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
require('./setup.js');

// Import the getCurrentMessage function from background.js
const { getCurrentMessage } = require('../background.js');

describe('Background.js - Email Pre-fill Feature', () => {

  beforeEach(() => {
    // Mock default successful responses
    global.browser.tabs.query.mockResolvedValue([{ id: 1 }]);
    global.browser.messageDisplay.getDisplayedMessage.mockResolvedValue({
      id: 'msg1',
      subject: 'Test Subject',
    });
    global.browser.messages.getPlainBody.mockResolvedValue({
      value: 'Test Body'
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
    expect(backgroundScript).toContain('browser.messages.getPlainBody');
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
    expect(backgroundScript).toContain('console.error');
    expect(backgroundScript).toContain('return null');
  });

  test('should return null when no message is displayed', async () => {
    browser.messageDisplay.getDisplayedMessage.mockResolvedValue(null);
    const message = await getCurrentMessage();
    expect(message).toBeNull();
  });

  test('should handle empty message body', async () => {
    browser.messages.getPlainBody.mockResolvedValue(null);
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

  test('should return null when plain body fails', async () => {
    browser.messages.getPlainBody.mockRejectedValue(new Error('test error'));
    const message = await getCurrentMessage();
    expect(message).toBeNull();
  });

  test('should return correct message structure', async () => {
    const message = await getCurrentMessage();
    expect(message).toHaveProperty('subject');
    expect(message).toHaveProperty('body');
    expect(message.subject).toBe('Test Subject');
    expect(message.body).toBe('Test Body');
  });

  test('should validate syntax', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(() => {
      new Function(backgroundScript);
    }).not.toThrow();
  });

});
