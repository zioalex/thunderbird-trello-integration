const { expect } = require('@jest/globals');

// Import the necessary modules for testing
require('./setup.js'); // Mocks and setup
const fs = require('fs');
const path = require('path');

// Define a test suite for the popup functionality
describe('Popup.js', () => {

  test('should contain TrelloTaskCreator class', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('class TrelloTaskCreator');
    expect(popupScript).toContain('loadConfig');
    expect(popupScript).toContain('createTask');
  });

  test('should use correct API endpoints', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('https://api.trello.com/1/members/me/boards');
    expect(popupScript).toContain('https://api.trello.com/1/cards');
  });

  test('should use browser storage API', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('browser.storage.sync.get');
    expect(popupScript).toContain('trelloApiKey');
    expect(popupScript).toContain('trelloToken');
  });

  test('should have DOM event handlers', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('addEventListener');
    expect(popupScript).toContain('DOMContentLoaded');
  });

  test('should contain pre-fill functionality', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('prefillTaskForm');
    expect(popupScript).toContain('get_current_message');
    expect(popupScript).toContain('browser.runtime.sendMessage');
  });

  test('should handle email subject and body in pre-fill', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('task-title');
    expect(popupScript).toContain('task-description');
    expect(popupScript).toContain('message.subject');
    expect(popupScript).toContain('message.body');
  });

});

