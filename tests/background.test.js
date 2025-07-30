const { expect, describe, test } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('Background.js - Email Pre-fill Feature', () => {

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
    expect(backgroundScript).toContain('windowType: "messageDisplay"');
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

  test('should validate syntax', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(() => {
      new Function(backgroundScript);
    }).not.toThrow();
  });

});

describe('Background.js - Task Sync Feature', () => {

  test('should contain task sync functions', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('fetchThunderbirdTasks');
    expect(backgroundScript).toContain('syncThunderbirdTasks');
  });

  test('should use correct Trello API endpoints for task fetching', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('/members/me/boards');
    expect(backgroundScript).toContain('/boards/${board.id}/labels');
    expect(backgroundScript).toContain('/boards/${board.id}/cards');
  });

  test('should store synced tasks in browser local storage', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('browser.storage.local.set');
    expect(backgroundScript).toContain('thunderbirdTasks');
    expect(backgroundScript).toContain('lastSync');
  });

  test('should have message listeners for task retrieval and sync commands', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('get_tasks');
    expect(backgroundScript).toContain('sync_tasks');
  });

  test('should handle task sync errors gracefully', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('Error fetching Thunderbird tasks');
    expect(backgroundScript).toContain('Error syncing Thunderbird tasks');
    expect(backgroundScript).toContain('Error processing board');
  });

  test('should have periodic task syncing', () => {
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('setInterval(syncThunderbirdTasks');
  });

});
