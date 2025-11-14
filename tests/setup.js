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
    },
    local: {
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
  tabs: {
    query: jest.fn(),
  },
  messageDisplay: {
    getDisplayedMessage: jest.fn(),
  },
  messages: {
    getFull: jest.fn(),
  },
};

// Mock DOM methods and global objects
global.document = {
  addEventListener: jest.fn(),
  getElementById: jest.fn(() => ({
    addEventListener: jest.fn(),
    style: { display: '' },
    value: '',
    textContent: '',
    className: '',
    innerHTML: '',
    appendChild: jest.fn(),
    disabled: false
  })),
  createElement: jest.fn(() => ({
    value: '',
    textContent: '',
    appendChild: jest.fn(),
    addEventListener: jest.fn()
  }))
};

global.window = {
  close: jest.fn(),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  location: {
    href: 'http://localhost',
    pathname: '/',
    search: '',
    hash: ''
  }
};

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

  // Reset browser storage mocks
  browser.storage.sync.get.mockResolvedValue({});
  browser.storage.sync.set.mockResolvedValue(undefined);
  browser.storage.local.get.mockResolvedValue({});
  browser.storage.local.set.mockResolvedValue(undefined);
});
