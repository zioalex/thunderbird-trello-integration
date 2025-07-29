const { expect } = require('@jest/globals');

// Import the necessary modules for testing
require('./setup.js'); // Mocks and setup
const fs = require('fs');
const path = require('path');

// Load the popup script as a string
const popupScript = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');

// Define a test suite for the popup functionality
describe('Popup.js', () => {

  beforeAll(() => {
    // Evaluate the popup script in a simulated browser context
    const script = new Function('document', 'browser', popupScript);
    script(global.document, global.browser);
  });

  it('should initialize without errors', () => {
    expect(global.console.error).not.toHaveBeenCalled();
  });

  test('should have event listeners set up', () => {
    expect(global.document.addEventListener).toHaveBeenCalled();
  });

  test('should handle empty API key and token', async () => {
    // Simulate no API key or token
    global.browser.storage.sync.get.mockResolvedValue({
      trelloApiKey: '',
      trelloToken: ''
    });
    
    // Re-run the init method to simulate an extension reload
    global.document.dispatchEvent(new Event('DOMContentLoaded'));

    // Verify error message on empty credentials
    await new Promise(process.nextTick);  // Wait for promises to resolve
    expect(global.console.error).toHaveBeenCalled();
  });

});

