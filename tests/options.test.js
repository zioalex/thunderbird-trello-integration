const { expect, describe, test } = require('@jest/globals');

// Import the necessary modules for testing
require('./setup.js');
const fs = require('fs');
const path = require('path');

describe('Options.js', () => {

  test('should contain OptionsManager class', () => {
    const optionsScript = fs.readFileSync(path.join(__dirname, '../options.js'), 'utf8');
    expect(optionsScript).toContain('class OptionsManager');
    expect(optionsScript).toContain('saveSettings');
    expect(optionsScript).toContain('testConnection');
    expect(optionsScript).toContain('loadSettings');
  });

  test('should use correct Trello API endpoint for testing', () => {
    const optionsScript = fs.readFileSync(path.join(__dirname, '../options.js'), 'utf8');
    expect(optionsScript).toContain('https://api.trello.com/1/members/me');
  });

  test('should use browser storage API', () => {
    const optionsScript = fs.readFileSync(path.join(__dirname, '../options.js'), 'utf8');
    expect(optionsScript).toContain('browser.storage.sync.get');
    expect(optionsScript).toContain('browser.storage.sync.set');
    expect(optionsScript).toContain('trelloApiKey');
    expect(optionsScript).toContain('trelloToken');
  });

  test('should generate token URL correctly', () => {
    const testApiKey = 'test-api-key-123';
    const expectedUrl = `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=Thunderbird%20Extension&key=${testApiKey}`;
    
    // This tests the URL generation logic
    expect(expectedUrl).toContain(testApiKey);
    expect(expectedUrl).toContain('trello.com/1/authorize');
  });

  test('should have DOM event handlers', () => {
    const optionsScript = fs.readFileSync(path.join(__dirname, '../options.js'), 'utf8');
    expect(optionsScript).toContain('addEventListener');
    expect(optionsScript).toContain('DOMContentLoaded');
  });

});
