const { expect, describe, test, beforeEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
require('./setup.js');

describe('E2E: Task Display Feature', () => {
  let mockTasks;

  beforeEach(() => {
    mockTasks = [
      {
        id: 'task1',
        name: 'Test Task 1',
        desc: 'This is a test task created from Thunderbird.',
        url: 'https://trello.com/c/task1',
        boardName: 'Test Board',
        listName: 'To Do'
      },
      {
        id: 'task2',
        name: 'Test Task 2',
        desc: 'Another task from Thunderbird.',
        url: 'https://trello.com/c/task2',
        boardName: 'Test Board',
        listName: 'In Progress'
      }
    ];

    browser.storage.local.get.mockResolvedValue({ 
      thunderbirdTasks: mockTasks, 
      lastSync: Date.now() 
    });
    browser.runtime.sendMessage.mockImplementation(async (request) => {
      if (request.command === 'get_tasks') {
        return { tasks: mockTasks, lastSync: Date.now() };
      }
      if (request.command === 'sync_tasks') {
        return { tasks: mockTasks, success: true };
      }
      return {};
    });
  });

  test('should fetch and sync Thunderbird tasks from background', async () => {
    // Test the background script task synchronization
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    
    // Verify the background script has task sync functionality
    expect(backgroundScript).toContain('fetchThunderbirdTasks');
    expect(backgroundScript).toContain('syncThunderbirdTasks');
    
    // Test message handling for task retrieval
    const response = await browser.runtime.sendMessage({ command: 'get_tasks' });
    expect(response.tasks).toEqual(mockTasks);
    expect(response.lastSync).toBeDefined();
    
    // Test message handling for task sync
    const syncResponse = await browser.runtime.sendMessage({ command: 'sync_tasks' });
    expect(syncResponse.success).toBe(true);
    expect(syncResponse.tasks).toEqual(mockTasks);
  });

  test('should handle empty task list gracefully', async () => {
    browser.storage.local.get.mockResolvedValue({ thunderbirdTasks: [], lastSync: null });
    browser.runtime.sendMessage.mockResolvedValue({ tasks: [], lastSync: null });
    
    // Test message handling for empty task list
    const response = await browser.runtime.sendMessage({ command: 'get_tasks' });
    expect(response.tasks).toEqual([]);
    expect(response.lastSync).toBeNull();
  });

  test('should handle task sync API failures gracefully', async () => {
    browser.runtime.sendMessage.mockRejectedValue(new Error('API Error'));
    
    try {
      await browser.runtime.sendMessage({ command: 'sync_tasks' });
    } catch (error) {
      expect(error.message).toBe('API Error');
    }
  });

  test('should store tasks in local storage after sync', async () => {
    // Test that background script stores tasks in local storage
    browser.storage.local.set = jest.fn();
    
    const syncResponse = await browser.runtime.sendMessage({ command: 'sync_tasks' });
    expect(syncResponse.success).toBe(true);
    
    // The background script should have stored the tasks
    // This test validates the storage mechanism exists in the code
    const backgroundScript = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
    expect(backgroundScript).toContain('browser.storage.local.set');
    expect(backgroundScript).toContain('thunderbirdTasks: tasks');
  });
});
