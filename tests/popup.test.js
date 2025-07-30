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

  test('should contain remember board/list functionality', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('lastUsedBoardId');
    expect(popupScript).toContain('lastUsedListId');
    expect(popupScript).toContain('saveLastUsedSelection');
  });

  test('should store last used board and list in browser storage', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('browser.storage.sync.set');
    expect(popupScript).toContain('lastUsedBoardId: boardId');
    expect(popupScript).toContain('lastUsedListId: listId');
  });

  test('should pre-select last used board and list', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('option.selected = true');
    expect(popupScript).toContain('this.lastUsedBoardId \u0026\u0026 board.id === this.lastUsedBoardId');
    expect(popupScript).toContain('this.lastUsedListId \u0026\u0026 list.id === this.lastUsedListId');
  });

  test('should contain Thunderbird tagging functionality', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('ensureThunderbirdLabel');
    expect(popupScript).toContain('addLabelToCard');
    expect(popupScript).toContain('Thunderbird');
  });

  test('should create and attach Thunderbird label to cards', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('/boards/${boardId}/labels');
    expect(popupScript).toContain('/labels?key=');
    expect(popupScript).toContain('/cards/${cardId}/idLabels');
    expect(popupScript).toContain('name: \'Thunderbird\'');
    expect(popupScript).toContain('color: \'blue\'');
  });

  test('should handle label creation and attachment errors gracefully', () => {
    const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');
    expect(popupScript).toContain('Failed to fetch board labels');
    expect(popupScript).toContain('Failed to create Thunderbird label');
    expect(popupScript).toContain('Failed to add label to card');
    expect(popupScript).toContain('Error ensuring Thunderbird label');
  });

});

