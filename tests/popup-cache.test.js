const { expect, describe, test, beforeEach } = require('@jest/globals');
require('./setup.js');

// Mock Date.now() for consistent timestamp testing
const MOCK_NOW = 1000000000;
const ORIGINAL_DATE_NOW = Date.now;

describe('Popup.js - Caching Functionality', () => {
  let mockBoards;
  let mockLists;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  beforeEach(() => {
    // Mock Date.now to return consistent values
    Date.now = jest.fn(() => MOCK_NOW);

    // Setup mock data
    mockBoards = [
      { id: 'board1', name: 'Test Board 1' },
      { id: 'board2', name: 'Test Board 2' }
    ];

    mockLists = [
      { id: 'list1', name: 'To Do' },
      { id: 'list2', name: 'In Progress' }
    ];

    // Mock successful API responses
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockBoards)
    });

    // Mock browser.storage.sync for credentials
    browser.storage.sync.get.mockResolvedValue({
      trelloApiKey: 'test-api-key',
      trelloToken: 'test-token'
    });

    // Mock browser.storage.local for cache (default: empty cache)
    browser.storage.local.get.mockResolvedValue({});
    browser.storage.local.set.mockResolvedValue(undefined);

    // Setup DOM elements that the TrelloTaskCreator expects
    const mockElement = {
      addEventListener: jest.fn(),
      style: { display: '' },
      value: '',
      textContent: '',
      className: '',
      classList: {
        add: jest.fn(),
        remove: jest.fn()
      },
      innerHTML: '',
      appendChild: jest.fn(),
      disabled: false
    };

    global.document.getElementById = jest.fn((id) => {
      // Return mock elements for specific IDs we need
      if (id === 'board-select' || id === 'list-select' || id === 'label-select' ||
          id === 'task-title' || id === 'task-description' || id === 'task-due-date' ||
          id === 'create-task' || id === 'open-options' || id === 'open-options-link' ||
          id === 'refresh-boards' || id === 'due-tomorrow' || id === 'due-next-week' ||
          id === 'due-next-month' || id === 'due-clear' || id === 'message' ||
          id === 'config-needed' || id === 'task-form' || id === 'new-label-group' ||
          id === 'new-label-name' || id === 'new-label-color') {
        return { ...mockElement };
      }
      return null;
    });
  });

  afterEach(() => {
    // Restore original Date.now
    Date.now = ORIGINAL_DATE_NOW;
  });

  describe('Board Caching', () => {
    test('should fetch boards from API when cache is empty', async () => {
      // Import after mocks are set up
      const { TrelloTaskCreator } = require('../popup.js');

      // Cache is empty by default
      browser.storage.local.get.mockResolvedValue({});

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();
      await creator.loadBoards();

      // Should call API
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.trello.com/1/members/me/boards')
      );

      // Should cache the results
      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          cached_boards: mockBoards,
          cached_boards_timestamp: MOCK_NOW
        })
      );
    });

    test('should use cached boards when cache is valid', async () => {
      const { TrelloTaskCreator } = require('../popup.js');

      // Setup valid cache (1 minute old)
      browser.storage.local.get.mockResolvedValue({
        cached_boards: mockBoards,
        cached_boards_timestamp: MOCK_NOW - (1 * 60 * 1000) // 1 minute ago
      });

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();
      await creator.loadBoards();

      // Should NOT call API
      expect(fetch).not.toHaveBeenCalled();

      // Should have boards from cache
      expect(creator.boards).toEqual(mockBoards);
    });

    test('should fetch boards from API when cache is expired', async () => {
      const { TrelloTaskCreator } = require('../popup.js');

      // Setup expired cache (6 minutes old)
      browser.storage.local.get.mockResolvedValue({
        cached_boards: [{ id: 'old-board', name: 'Old Board' }],
        cached_boards_timestamp: MOCK_NOW - (6 * 60 * 1000) // 6 minutes ago
      });

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();
      await creator.loadBoards();

      // Should call API to refresh
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.trello.com/1/members/me/boards')
      );

      // Should update cache with new data
      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          cached_boards: mockBoards,
          cached_boards_timestamp: MOCK_NOW
        })
      );
    });

    test('should force refresh when forceRefresh is true', async () => {
      const { TrelloTaskCreator } = require('../popup.js');

      // Setup valid cache (1 minute old)
      browser.storage.local.get.mockResolvedValue({
        cached_boards: [{ id: 'old-board', name: 'Old Board' }],
        cached_boards_timestamp: MOCK_NOW - (1 * 60 * 1000)
      });

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();
      await creator.loadBoards(true); // Force refresh

      // Should call API even though cache is valid
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.trello.com/1/members/me/boards')
      );

      // Should update cache
      expect(browser.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('List Caching', () => {
    test('should fetch lists from API when cache is empty', async () => {
      const { TrelloTaskCreator } = require('../popup.js');

      // Mock lists API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockLists)
      });

      browser.storage.local.get.mockResolvedValue({});

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();
      await creator.loadLists('board1');

      // Should call API
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.trello.com/1/boards/board1/lists')
      );

      // Should cache the results with board-specific key
      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          cached_lists_board1: mockLists,
          cached_lists_timestamp_board1: MOCK_NOW
        })
      );
    });

    test('should use cached lists when cache is valid', async () => {
      const { TrelloTaskCreator } = require('../popup.js');

      // Setup caches for both boards (so init doesn't call API) and lists
      browser.storage.local.get.mockImplementation((keys) => {
        const result = {};
        if (keys.includes('cached_boards')) {
          result.cached_boards = mockBoards;
          result.cached_boards_timestamp = MOCK_NOW - (1 * 60 * 1000);
        }
        if (keys.includes('cached_lists_board1')) {
          result.cached_lists_board1 = mockLists;
          result.cached_lists_timestamp_board1 = MOCK_NOW - (2 * 60 * 1000);
        }
        return Promise.resolve(result);
      });

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();

      // Clear fetch calls from initialization
      fetch.mockClear();

      await creator.loadLists('board1');

      // Should NOT call API
      expect(fetch).not.toHaveBeenCalled();

      // Should have lists from cache
      expect(creator.lists).toEqual(mockLists);
    });

    test('should cache lists separately for different boards', async () => {
      const { TrelloTaskCreator } = require('../popup.js');

      const board1Lists = [{ id: 'list1', name: 'Board 1 List' }];
      const board2Lists = [{ id: 'list2', name: 'Board 2 List' }];

      // First load board1 lists
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(board1Lists)
      });

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();
      await creator.loadLists('board1');

      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          cached_lists_board1: board1Lists
        })
      );

      // Then load board2 lists
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(board2Lists)
      });

      await creator.loadLists('board2');

      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          cached_lists_board2: board2Lists
        })
      );
    });
  });

  describe('Cache Validation', () => {
    test('isCacheValid should return false for missing timestamp', () => {
      const { TrelloTaskCreator } = require('../popup.js');
      const creator = new TrelloTaskCreator();

      expect(creator.isCacheValid(null)).toBe(false);
      expect(creator.isCacheValid(undefined)).toBe(false);
      expect(creator.isCacheValid(0)).toBe(false);
    });

    test('isCacheValid should return true for recent timestamp', () => {
      const { TrelloTaskCreator } = require('../popup.js');
      const creator = new TrelloTaskCreator();

      const recentTimestamp = MOCK_NOW - (2 * 60 * 1000); // 2 minutes ago
      expect(creator.isCacheValid(recentTimestamp)).toBe(true);
    });

    test('isCacheValid should return false for expired timestamp', () => {
      const { TrelloTaskCreator } = require('../popup.js');
      const creator = new TrelloTaskCreator();

      const expiredTimestamp = MOCK_NOW - (6 * 60 * 1000); // 6 minutes ago
      expect(creator.isCacheValid(expiredTimestamp)).toBe(false);
    });

    test('isCacheValid should return false for exactly expired cache', () => {
      const { TrelloTaskCreator } = require('../popup.js');
      const creator = new TrelloTaskCreator();

      const exactlyExpired = MOCK_NOW - CACHE_DURATION;
      expect(creator.isCacheValid(exactlyExpired)).toBe(false);
    });

    test('isCacheValid should return true for cache at edge of validity', () => {
      const { TrelloTaskCreator } = require('../popup.js');
      const creator = new TrelloTaskCreator();

      const almostExpired = MOCK_NOW - CACHE_DURATION + 1; // 1ms before expiry
      expect(creator.isCacheValid(almostExpired)).toBe(true);
    });
  });

  describe('Error Handling with Cache', () => {
    test('should handle API errors gracefully when loading boards', async () => {
      const { TrelloTaskCreator } = require('../popup.js');

      // Mock API failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500
      });

      browser.storage.local.get.mockResolvedValue({});

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();
      await creator.loadBoards();

      // Should have called API
      expect(fetch).toHaveBeenCalled();

      // Should not have cached anything
      expect(browser.storage.local.set).not.toHaveBeenCalled();
    });

    test('should handle cache read errors gracefully', async () => {
      const { TrelloTaskCreator } = require('../popup.js');

      // Mock cache read failure
      browser.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const creator = new TrelloTaskCreator();
      await creator.loadConfig();

      // Should fall back to API call without throwing
      await expect(creator.loadBoards()).resolves.not.toThrow();
    });
  });
});
