// Test setup file for Jest
// Mock browser APIs that are used in the extension

// Mock fetch API
global.fetch = jest.fn();

// Mock browser extension APIs
global.browser = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    openOptionsPage: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
};

// Mock DOM methods
global.document.addEventListener = jest.fn();
global.document.getElementById = jest.fn();
global.document.createElement = jest.fn();

// Mock console to avoid noise in tests
global.console.log = jest.fn();
global.console.error = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset fetch mock to return successful responses by default
  fetch.mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({})
  });
  
  // Reset browser storage mock
  browser.storage.sync.get.mockResolvedValue({});
  browser.storage.sync.set.mockResolvedValue(undefined);
});
