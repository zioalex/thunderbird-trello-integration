const { expect, describe, test } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('Manifest.json', () => {
  let manifest;

  beforeAll(() => {
    const manifestPath = path.join(__dirname, '../manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(manifestContent);
  });

  test('should be valid JSON', () => {
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe('object');
  });

  test('should have required fields', () => {
    expect(manifest.manifest_version).toBe(2);
    expect(manifest.name).toBe('Trello Task Creator');
    expect(manifest.version).toBe('1.0.2');
    expect(manifest.description).toBeDefined();
  });

  test('should have proper applications section', () => {
    expect(manifest.applications).toBeDefined();
    expect(manifest.applications.gecko).toBeDefined();
    expect(manifest.applications.gecko.id).toBe('trello-task-creator@thunderbird.addon');
    expect(manifest.applications.gecko.strict_min_version).toBe('78.0');
  });

  test('should have required permissions', () => {
    expect(manifest.permissions).toBeDefined();
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('https://api.trello.com/*');
  });

  test('should have browser_action defined', () => {
    expect(manifest.browser_action).toBeDefined();
    expect(manifest.browser_action.default_popup).toBe('popup.html');
    expect(manifest.browser_action.default_title).toBe('Create Trello Task');
    expect(manifest.browser_action.default_icon).toBeDefined();
  });

  test('should have valid icon paths', () => {
    const iconSizes = ['16', '32', '48', '128'];
    iconSizes.forEach(size => {
      expect(manifest.icons[size]).toBe(`icons/trello-${size}.png`);
      expect(manifest.browser_action.default_icon[size]).toBe(`icons/trello-${size}.png`);
    });
  });

  test('should have background script configured', () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.scripts).toContain('background.js');
    expect(manifest.background.persistent).toBe(false);
  });

  test('should have options_ui configured', () => {
    expect(manifest.options_ui).toBeDefined();
    expect(manifest.options_ui.page).toBe('options.html');
    expect(manifest.options_ui.open_in_tab).toBe(false);
  });

  test('should not have content_scripts (not needed for Thunderbird)', () => {
    expect(manifest.content_scripts).toBeUndefined();
  });

  test('should have valid Thunderbird permissions', () => {
    expect(manifest.permissions).toContain('messagesRead');
    expect(manifest.permissions).toContain('tabs');
    
    // Should not have browser-only permissions
    const invalidPermissions = ['activeTab', 'accountsRead'];
    invalidPermissions.forEach(permission => {
      expect(manifest.permissions).not.toContain(permission);
    });
  });
});
