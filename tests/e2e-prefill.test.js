const { expect, describe, test, beforeEach } = require('@jest/globals');
require('./setup.js');

describe('E2E: Email Pre-fill Feature', () => {
  let mockTrelloTaskCreator;
  let mockMessageData;

  beforeEach(() => {
    // Mock DOM elements with proper style objects
    const mockElements = {
      'task-title': { value: '' },
      'task-description': { value: '' },
      'board-select': { 
        value: '', 
        addEventListener: jest.fn(),
        innerHTML: '',
        appendChild: jest.fn()
      },
      'list-select': { 
        value: '',
        innerHTML: '',
        appendChild: jest.fn()
      },
      'create-task': { 
        addEventListener: jest.fn(),
        disabled: false,
        textContent: 'Create Task'
      },
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
      appendChild: jest.fn()
    }));

    // Mock sample email data
    mockMessageData = {
      subject: 'Test Email Subject',
      body: 'This is the email body content that should be pre-filled into the task description.'
    };

    // Mock browser runtime message response
    global.browser.runtime.sendMessage.mockResolvedValue(mockMessageData);
    global.browser.storage.sync.get.mockResolvedValue({
      trelloApiKey: 'test-api-key',
      trelloToken: 'test-token'
    });

    // Mock successful fetch responses
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([])
    });
  });

  test('should complete full workflow from email to pre-filled task form', async () => {
    // Load the popup script and get the TrelloTaskCreator class
    const { TrelloTaskCreator } = require('../popup.js');
    
    // This would normally be done by the browser when popup is opened
    mockTrelloTaskCreator = new TrelloTaskCreator();
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that browser.runtime.sendMessage was called with correct command
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      command: 'get_current_message'
    });

    // Verify that the form fields were populated with email data
    const titleField = document.getElementById('task-title');
    const descriptionField = document.getElementById('task-description');
    
    expect(titleField.value).toBe(mockMessageData.subject);
    expect(descriptionField.value).toBe(mockMessageData.body);
  });

  test('should handle missing email data gracefully', async () => {
    // Mock scenario where no email is currently displayed
    browser.runtime.sendMessage.mockResolvedValue(null);
    
    const { TrelloTaskCreator } = require('../popup.js');
    mockTrelloTaskCreator = new TrelloTaskCreator();
    
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not crash, form should remain empty
    const titleField = document.getElementById('task-title');
    const descriptionField = document.getElementById('task-description');
    
    expect(titleField.value).toBe('');
    expect(descriptionField.value).toBe('');
  });

  test('should handle communication errors with background script', async () => {
    // Mock runtime message to reject
    browser.runtime.sendMessage.mockRejectedValue(new Error('Communication failed'));
    
    const { TrelloTaskCreator } = require('../popup.js');
    mockTrelloTaskCreator = new TrelloTaskCreator();
    
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should log error but not crash
    expect(console.error).toHaveBeenCalled();
    
    // Form should remain empty
    const titleField = document.getElementById('task-title');
    const descriptionField = document.getElementById('task-description');
    
    expect(titleField.value).toBe('');
    expect(descriptionField.value).toBe('');
  });

  test('should handle partial email data', async () => {
    // Mock scenario with only subject, no body
    const partialMessageData = {
      subject: 'Only Subject Available',
      body: null
    };
    browser.runtime.sendMessage.mockResolvedValue(partialMessageData);
    
    const { TrelloTaskCreator } = require('../popup.js');
    mockTrelloTaskCreator = new TrelloTaskCreator();
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const titleField = document.getElementById('task-title');
    const descriptionField = document.getElementById('task-description');
    
    expect(titleField.value).toBe(partialMessageData.subject);
    expect(descriptionField.value).toBe(''); // Should remain empty
  });

  test('should integrate with existing task creation workflow', async () => {
    // Setup mock for successful task creation
    global.fetch.mockImplementation((url) => {
      if (url.includes('/boards')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'board1', name: 'Test Board' }])
        });
      }
      if (url.includes('/lists')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'list1', name: 'Test List' }])
        });
      }
      if (url.includes('/cards')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'card1', name: 'Test Task' })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { TrelloTaskCreator } = require('../popup.js');
    mockTrelloTaskCreator = new TrelloTaskCreator();
    
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that pre-filled data is available for task creation
    const titleField = document.getElementById('task-title');
    const descriptionField = document.getElementById('task-description');
    
    expect(titleField.value).toBe(mockMessageData.subject);
    expect(descriptionField.value).toBe(mockMessageData.body);

    // Simulate user selecting board and list, then creating task
    document.getElementById('board-select').value = 'board1';
    document.getElementById('list-select').value = 'list1';
    
    // The create task function should work with pre-filled data
    await mockTrelloTaskCreator.createTask();
    
    // Verify task creation API was called with pre-filled data
    const createTaskCall = global.fetch.mock.calls.find(call => 
      call[0].includes('/cards') && call[1]?.method === 'POST'
    );
    
    expect(createTaskCall).toBeDefined();
    if (createTaskCall) {
      const requestBody = JSON.parse(createTaskCall[1].body);
      expect(requestBody.name).toBe(mockMessageData.subject);
      expect(requestBody.desc).toBe(mockMessageData.body);
    }
  });

});
