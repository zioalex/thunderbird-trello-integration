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
