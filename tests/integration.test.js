const { expect, describe, test } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('Extension File Structure', () => {
  const extensionRoot = path.join(__dirname, '..');

  test('should have all required files', () => {
    const requiredFiles = [
      'manifest.json',
      'popup.html',
      'popup.js',
      'options.html',
      'options.js',
      'background.js',
      'README.md'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(extensionRoot, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('should have all required icon files', () => {
    const iconSizes = ['16', '32', '48', '128'];
    
    iconSizes.forEach(size => {
      const iconPath = path.join(extensionRoot, 'icons', `trello-${size}.png`);
      expect(fs.existsSync(iconPath)).toBe(true);
    });
  });

  test('should have valid HTML files', () => {
    const htmlFiles = ['popup.html', 'options.html'];
    
    htmlFiles.forEach(file => {
      const filePath = path.join(extensionRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic HTML validation
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html>');
      expect(content).toContain('</html>');
      expect(content).toContain('<head>');
      expect(content).toContain('</head>');
      expect(content).toContain('<body>');
      expect(content).toContain('</body>');
    });
  });

  test('should have valid JavaScript files', () => {
    const jsFiles = ['popup.js', 'options.js', 'background.js'];
    
    jsFiles.forEach(file => {
      const filePath = path.join(extensionRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic JavaScript validation - should not have syntax errors
      expect(() => {
        new Function(content);
      }).not.toThrow();
    });
  });

  test('popup.html should reference popup.js', () => {
    const popupHtml = fs.readFileSync(path.join(extensionRoot, 'popup.html'), 'utf8');
    expect(popupHtml).toContain('popup.js');
  });

  test('options.html should reference options.js', () => {
    const optionsHtml = fs.readFileSync(path.join(extensionRoot, 'options.html'), 'utf8');
    expect(optionsHtml).toContain('options.js');
  });

  test('should have proper file sizes (not empty)', () => {
    const filesToCheck = [
      'manifest.json',
      'popup.html',
      'popup.js',
      'options.html',
      'options.js'
    ];

    filesToCheck.forEach(file => {
      const filePath = path.join(extensionRoot, file);
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  test('should handle errors in prefill workflow gracefully', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    const backgroundJs = fs.readFileSync(path.join(extensionRoot, 'background.js'), 'utf8');
    
    // Both scripts should have error handling
    expect(popupJs).toContain('catch (e)');
    expect(backgroundJs).toContain('catch (error)');
    
    // Should log errors but not crash
    expect(popupJs).toContain('console.error');
    expect(backgroundJs).toContain('console.error');
  });
});

describe('Remember Board/List Integration', () => {
  const extensionRoot = path.join(__dirname, '..');

  test('should save last-used board and list IDs to storage after task creation', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('saveLastUsedSelection');
    expect(popupJs).toContain('browser.storage.sync.set');
    expect(popupJs).toContain('lastUsedBoardId');
    expect(popupJs).toContain('lastUsedListId');
  });

  test('should load last-used board and list IDs from storage on startup', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('browser.storage.sync.get');
    expect(popupJs).toContain('lastUsedBoardId');
    expect(popupJs).toContain('lastUsedListId');
  });

  test('should pre-select board and list from stored IDs', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('option.selected = true');
    expect(popupJs).toContain('this.lastUsedBoardId');
    expect(popupJs).toContain('this.lastUsedListId');
  });

  test('should handle cases where no previous selection is stored', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('this.lastUsedBoardId = result.lastUsedBoardId || \'\'');
    expect(popupJs).toContain('this.lastUsedListId = result.lastUsedListId || \'\'');
  });

  test('should handle errors in storage operations gracefully', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('catch (error)');
    expect(popupJs).toContain('console.error');
    expect(popupJs).toContain('Error loading config');
    expect(popupJs).toContain('Error saving last used selection');
  });
});

describe('Thunderbird Tagging Integration', () => {
  const extensionRoot = path.join(__dirname, '..');

  test('should add a Thunderbird label to new tasks', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('ensureThunderbirdLabel');
    expect(popupJs).toContain('addLabelToCard');
  });

  test('should check for existing labels and create new ones if needed', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('/boards/${boardId}/labels'); // Fetching existing labels
    expect(popupJs).toContain('find(label =>'); // Checking for existing label
    expect(popupJs).toContain('/labels?key='); // Creating new label
  });

  test('should handle API errors gracefully during label management', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('Failed to fetch board labels');
    expect(popupJs).toContain('Failed to create Thunderbird label');
    expect(popupJs).toContain('Failed to add label to card');
  });
});

describe('Extension API Integration', () => {
  test('popup.js should contain TrelloTaskCreator class', () => {
    const popupJs = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupJs).toContain('class TrelloTaskCreator');
    expect(popupJs).toContain('loadConfig');
    expect(popupJs).toContain('createTask');
    expect(popupJs).toContain('loadBoards');
  });

  test('options.js should contain OptionsManager class', () => {
    const optionsJs = fs.readFileSync(path.join(__dirname, '../options.js'), 'utf8');
    expect(optionsJs).toContain('class OptionsManager');
    expect(optionsJs).toContain('saveSettings');
    expect(optionsJs).toContain('testConnection');
    expect(optionsJs).toContain('loadSettings');
  });

  test('should use correct Trello API endpoints', () => {
    const popupJs = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    const optionsJs = fs.readFileSync(path.join(__dirname, '../options.js'), 'utf8');
    
    // Check for correct API endpoints
    expect(popupJs).toContain('https://api.trello.com/1/members/me/boards');
    expect(popupJs).toContain('https://api.trello.com/1/boards/');
    expect(popupJs).toContain('https://api.trello.com/1/cards');
    expect(optionsJs).toContain('https://api.trello.com/1/members/me');
  });

  test('should use browser.storage.sync for configuration', () => {
    const popupJs = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    const optionsJs = fs.readFileSync(path.join(__dirname, '../options.js'), 'utf8');
    
    expect(popupJs).toContain('browser.storage.sync.get');
    expect(optionsJs).toContain('browser.storage.sync.get');
    expect(optionsJs).toContain('browser.storage.sync.set');
  });
});

describe('Email Pre-fill Integration', () => {
  const extensionRoot = path.join(__dirname, '..');

  test('manifest should include required permissions for email access', () => {
    const manifestPath = path.join(extensionRoot, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    expect(manifest.permissions).toContain('messageDisplay');
    expect(manifest.permissions).toContain('messages.read');
  });

  test('background script should handle message requests', () => {
    const backgroundJs = fs.readFileSync(path.join(extensionRoot, 'background.js'), 'utf8');
    
    expect(backgroundJs).toContain('browser.runtime.onMessage.addListener');
    expect(backgroundJs).toContain('get_current_message');
    expect(backgroundJs).toContain('browser.messageDisplay.getDisplayedMessage');
    expect(backgroundJs).toContain('browser.messages.getPlainBody');
  });

  test('popup script should send message requests to background', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    
    expect(popupJs).toContain('browser.runtime.sendMessage');
    expect(popupJs).toContain('get_current_message');
    expect(popupJs).toContain('prefillTaskForm');
  });

  test('should handle email content prefilling workflow', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    const backgroundJs = fs.readFileSync(path.join(extensionRoot, 'background.js'), 'utf8');
    
    // Check popup initiates prefill during initialization
    expect(popupJs).toContain('await this.prefillTaskForm();');
    
    // Check background script extracts subject and body
    expect(backgroundJs).toContain('subject: message.subject');
    expect(backgroundJs).toContain('body: body');
    
    // Check popup populates form fields
    expect(popupJs).toContain('task-title');
    expect(popupJs).toContain('task-description');
  });

  test('should handle errors in prefill workflow gracefully', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    const backgroundJs = fs.readFileSync(path.join(extensionRoot, 'background.js'), 'utf8');
    
    // Both scripts should have error handling
    expect(popupJs).toContain('catch (e)');
    expect(backgroundJs).toContain('catch (error)');
    
    // Should log errors but not crash
    expect(popupJs).toContain('console.error');
    expect(backgroundJs).toContain('console.error');
  });
});

describe('Remember Board/List Integration', () => {
  const extensionRoot = path.join(__dirname, '..');

  test('should save last-used board and list IDs to storage after task creation', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('saveLastUsedSelection');
    expect(popupJs).toContain('browser.storage.sync.set');
    expect(popupJs).toContain('lastUsedBoardId');
    expect(popupJs).toContain('lastUsedListId');
  });

  test('should load last-used board and list IDs from storage on startup', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('browser.storage.sync.get');
    expect(popupJs).toContain('lastUsedBoardId');
    expect(popupJs).toContain('lastUsedListId');
  });

  test('should pre-select board and list from stored IDs', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('option.selected = true');
    expect(popupJs).toContain('this.lastUsedBoardId');
    expect(popupJs).toContain('this.lastUsedListId');
  });

  test('should handle cases where no previous selection is stored', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('this.lastUsedBoardId = result.lastUsedBoardId || \'\'');
    expect(popupJs).toContain('this.lastUsedListId = result.lastUsedListId || \'\'');
  });

  test('should handle errors in storage operations gracefully', () => {
    const popupJs = fs.readFileSync(path.join(extensionRoot, 'popup.js'), 'utf8');
    expect(popupJs).toContain('catch (error)');
    expect(popupJs).toContain('console.error');
    expect(popupJs).toContain('Error loading config');
    expect(popupJs).toContain('Error saving last used selection');
  });
});
