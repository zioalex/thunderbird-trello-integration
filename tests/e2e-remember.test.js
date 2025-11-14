const { expect, describe, test, beforeEach } = require('@jest/globals');
require('./setup.js');

describe('E2E: Remember Board/List Feature', () => {
  let mockTrelloTaskCreator;
  let mockBoards, mockLists;

  beforeEach(() => {
    const mockElements = {
      'task-title': { value: '' },
      'task-description': { value: '' },
      'board-select': { value: '', addEventListener: jest.fn(), innerHTML: '', appendChild: jest.fn(), querySelector: jest.fn() },
      'list-select': { value: '', addEventListener: jest.fn(), innerHTML: '', appendChild: jest.fn(), querySelector: jest.fn() },
      'create-task': { addEventListener: jest.fn(), disabled: false, textContent: 'Create Task' },
      'refresh-boards': {
        addEventListener: jest.fn(),
        disabled: false,
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      },
      'task-due-date': { value: '' },
      'due-tomorrow': { addEventListener: jest.fn() },
      'due-next-week': { addEventListener: jest.fn() },
      'due-next-month': { addEventListener: jest.fn() },
      'due-clear': { addEventListener: jest.fn() },
      'open-options': { addEventListener: jest.fn() },
      'open-options-link': { addEventListener: jest.fn() },
      'config-needed': { style: { display: 'none' } },
      'task-form': { style: { display: 'block' } },
      'message': { textContent: '', className: '' },
      'label-select': {
        addEventListener: jest.fn(),
        value: '',
        innerHTML: '',
        appendChild: jest.fn()
      },
      'new-label-name': { value: '' },
      'new-label-color': { value: 'green' },
      'new-label-group': { style: { display: 'none' } }
    };

    global.document.getElementById = jest.fn((id) => mockElements[id] || { style: {} });
    global.document.createElement = jest.fn((type) => ({
      type: type,
      value: '',
      textContent: '',
      selected: false,
      appendChild: jest.fn()
    }));

    mockBoards = [{ id: 'board1', name: 'Test Board 1' }, { id: 'board2', name: 'Test Board 2' }];
    mockLists = [{ id: 'list1', name: 'Test List 1' }, { id: 'list2', name: 'Test List 2' }];

    browser.storage.sync.get.mockResolvedValue({
      trelloApiKey: 'test-key',
      trelloToken: 'test-token'
    });
    browser.storage.local.get.mockResolvedValue({});
    browser.storage.local.set.mockResolvedValue(undefined);
    browser.runtime.sendMessage.mockResolvedValue({});
  });

  test('should save and pre-select the last used board and list', async () => {
    const { TrelloTaskCreator } = require('../popup.js');

    // Mock API calls to return boards and lists
    fetch.mockImplementation((url) => {
      if (url.includes('/members/me/boards')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBoards) });
      if (url.includes('/boards/board1/lists')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLists) });
      if (url.includes('/cards')) return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    // Simulate first run - no pre-selection
    mockTrelloTaskCreator = new TrelloTaskCreator();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // User makes a selection and creates a task
    document.getElementById('board-select').value = 'board1';
    document.getElementById('list-select').value = 'list1';
    document.getElementById('task-title').value = 'Test Task';
    await mockTrelloTaskCreator.createTask();

    // Verify that the selection was saved to storage
    expect(browser.storage.sync.set).toHaveBeenCalledWith({ 
      lastUsedBoardId: 'board1', 
      lastUsedListId: 'list1' 
    });

    // Simulate second run - should have pre-selection
    browser.storage.sync.get.mockResolvedValue({ 
      trelloApiKey: 'test-key', 
      trelloToken: 'test-token', 
      lastUsedBoardId: 'board1', 
      lastUsedListId: 'list1' 
    });

    const secondInstance = new TrelloTaskCreator();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify that the board and list are pre-selected
    expect(document.getElementById('board-select').value).toBe('board1');
    expect(document.getElementById('list-select').value).toBe('list1');
  });

  test('should handle no last selection being stored', async () => {
    const { TrelloTaskCreator } = require('../popup.js');
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockBoards) });

    mockTrelloTaskCreator = new TrelloTaskCreator();
    await new Promise(resolve => setTimeout(resolve, 100));

    // No selection should be made
    expect(document.getElementById('board-select').value).toBe('');
    expect(document.getElementById('list-select').value).toBe('');
  });

  test('should handle errors during storage operations gracefully', async () => {
    const { TrelloTaskCreator } = require('../popup.js');
    browser.storage.sync.get.mockRejectedValue(new Error('Storage read error'));

    mockTrelloTaskCreator = new TrelloTaskCreator();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(console.error).toHaveBeenCalledWith('Error loading config:', expect.any(Error));

    browser.storage.sync.set.mockRejectedValue(new Error('Storage write error'));
    await mockTrelloTaskCreator.saveLastUsedSelection('b1', 'l1');
    expect(console.error).toHaveBeenCalledWith('Error saving last used selection:', expect.any(Error));
  });
});

