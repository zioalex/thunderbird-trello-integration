const { expect, describe, test, beforeEach } = require('@jest/globals');
require('./setup.js');

describe('E2E: Thunderbird Tagging Feature', () => {
  let mockTrelloTaskCreator;
  let mockBoards, mockLists, mockLabels;

  beforeEach(() => {
    const mockElements = {
      'task-title': { value: '' },
      'task-description': { value: '' },
      'board-select': { value: '', addEventListener: jest.fn(), innerHTML: '', appendChild: jest.fn() },
      'list-select': { value: '', addEventListener: jest.fn(), innerHTML: '', appendChild: jest.fn() },
      'create-task': { addEventListener: jest.fn(), disabled: false, textContent: 'Create Task' },
      'open-options': { addEventListener: jest.fn() },
      'open-options-link': { addEventListener: jest.fn() },
      'config-needed': { style: { display: 'none' } },
      'task-form': { style: { display: 'block' } },
      'message': { textContent: '', className: '' }
    };

    global.document.getElementById = jest.fn((id) => mockElements[id] || { style: {} });
    global.document.createElement = jest.fn(() => ({
      value: '',
      textContent: '',
      selected: false,
      appendChild: jest.fn()
    }));

    mockBoards = [{ id: 'board1', name: 'Test Board 1' }];
    mockLists = [{ id: 'list1', name: 'Test List 1' }];
    mockLabels = []; // Start with no existing labels

    browser.storage.sync.get.mockResolvedValue({ 
      trelloApiKey: 'test-key', 
      trelloToken: 'test-token' 
    });
    browser.runtime.sendMessage.mockResolvedValue({});
  });

  test('should create Thunderbird label and attach it to new task', async () => {
    const { TrelloTaskCreator } = require('../popup.js');

    // Mock API calls
    fetch.mockImplementation((url) => {
      if (url.includes('/members/me/boards')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBoards) });
      }
      if (url.includes('/boards/board1/lists')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLists) });
      }
      if (url.includes('/boards/board1/labels')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLabels) });
      }
      if (url.includes('/labels?key=')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'label1', name: 'Thunderbird' }) });
      }
      if (url.includes('/cards?key=')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'card1', name: 'Test Task' }) });
      }
      if (url.includes('/cards/card1/idLabels')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    mockTrelloTaskCreator = new TrelloTaskCreator();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate task creation
    document.getElementById('board-select').value = 'board1';
    document.getElementById('list-select').value = 'list1';
    document.getElementById('task-title').value = 'Test Task';
    
    await mockTrelloTaskCreator.createTask();

    // Verify label creation was attempted
    const labelCreateCall = fetch.mock.calls.find(call => 
      call[0].includes('/labels?key=') && call[1]?.method === 'POST'
    );
    expect(labelCreateCall).toBeDefined();
    if (labelCreateCall) {
      const requestBody = JSON.parse(labelCreateCall[1].body);
      expect(requestBody.name).toBe('Thunderbird');
      expect(requestBody.color).toBe('blue');
      expect(requestBody.idBoard).toBe('board1');
    }

    // Verify label was attached to card
    const labelAttachCall = fetch.mock.calls.find(call => 
      call[0].includes('/cards/card1/idLabels') && call[1]?.method === 'POST'
    );
    expect(labelAttachCall).toBeDefined();
    if (labelAttachCall) {
      const requestBody = JSON.parse(labelAttachCall[1].body);
      expect(requestBody.value).toBe('label1');
    }
  });

  test('should reuse existing Thunderbird label', async () => {
    const { TrelloTaskCreator } = require('../popup.js');

    // Mock existing Thunderbird label
    mockLabels = [{ id: 'existing-label', name: 'Thunderbird', color: 'blue' }];

    fetch.mockImplementation((url) => {
      if (url.includes('/members/me/boards')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBoards) });
      }
      if (url.includes('/boards/board1/lists')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLists) });
      }
      if (url.includes('/boards/board1/labels')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLabels) });
      }
      if (url.includes('/cards?key=')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'card1', name: 'Test Task' }) });
      }
      if (url.includes('/cards/card1/idLabels')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    mockTrelloTaskCreator = new TrelloTaskCreator();
    await new Promise(resolve => setTimeout(resolve, 100));

    document.getElementById('board-select').value = 'board1';
    document.getElementById('list-select').value = 'list1';
    document.getElementById('task-title').value = 'Test Task';
    
    await mockTrelloTaskCreator.createTask();

    // Verify no new label was created
    const labelCreateCall = fetch.mock.calls.find(call => 
      call[0].includes('/labels?key=') && call[1]?.method === 'POST'
    );
    expect(labelCreateCall).toBeUndefined();

    // Verify existing label was attached to card
    const labelAttachCall = fetch.mock.calls.find(call => 
      call[0].includes('/cards/card1/idLabels') && call[1]?.method === 'POST'
    );
    expect(labelAttachCall).toBeDefined();
    if (labelAttachCall) {
      const requestBody = JSON.parse(labelAttachCall[1].body);
      expect(requestBody.value).toBe('existing-label');
    }
  });

  test('should handle label creation failures gracefully', async () => {
    const { TrelloTaskCreator } = require('../popup.js');

    fetch.mockImplementation((url) => {
      if (url.includes('/members/me/boards')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBoards) });
      }
      if (url.includes('/boards/board1/lists')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLists) });
      }
      if (url.includes('/boards/board1/labels')) {
        return Promise.resolve({ ok: false }); // Fail to fetch labels
      }
      if (url.includes('/cards?key=')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'card1', name: 'Test Task' }) });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    mockTrelloTaskCreator = new TrelloTaskCreator();
    await new Promise(resolve => setTimeout(resolve, 100));

    document.getElementById('board-select').value = 'board1';
    document.getElementById('list-select').value = 'list1';
    document.getElementById('task-title').value = 'Test Task';
    
    await mockTrelloTaskCreator.createTask();

    // Should still create the task successfully even if label operations fail
    expect(console.error).toHaveBeenCalledWith('Failed to fetch board labels');
    
    // Task should still be created
    const taskCreateCall = fetch.mock.calls.find(call => 
      call[0].includes('/cards?key=') && call[1]?.method === 'POST'
    );
    expect(taskCreateCall).toBeDefined();
  });

  test('should handle case-insensitive label matching', async () => {
    const { TrelloTaskCreator } = require('../popup.js');

    // Mock existing label with different case
    mockLabels = [{ id: 'existing-label', name: 'THUNDERBIRD', color: 'blue' }];

    fetch.mockImplementation((url) => {
      if (url.includes('/members/me/boards')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBoards) });
      }
      if (url.includes('/boards/board1/lists')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLists) });
      }
      if (url.includes('/boards/board1/labels')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLabels) });
      }
      if (url.includes('/cards?key=')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'card1', name: 'Test Task' }) });
      }
      if (url.includes('/cards/card1/idLabels')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    mockTrelloTaskCreator = new TrelloTaskCreator();
    await new Promise(resolve => setTimeout(resolve, 100));

    document.getElementById('board-select').value = 'board1';
    document.getElementById('list-select').value = 'list1';
    document.getElementById('task-title').value = 'Test Task';
    
    await mockTrelloTaskCreator.createTask();

    // Should reuse existing label despite case difference
    const labelCreateCall = fetch.mock.calls.find(call => 
      call[0].includes('/labels?key=') && call[1]?.method === 'POST'
    );
    expect(labelCreateCall).toBeUndefined();

    // Should attach existing label
    const labelAttachCall = fetch.mock.calls.find(call => 
      call[0].includes('/cards/card1/idLabels') && call[1]?.method === 'POST'
    );
    expect(labelAttachCall).toBeDefined();
  });
});
