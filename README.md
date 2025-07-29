# Trello Task Creator for Thunderbird

A Thunderbird WebExtension that allows you to create Trello tasks directly from Thunderbird.

## Features

- Create Trello tasks with custom titles and descriptions
- Select from your Trello boards and lists
- Simple popup interface
- Secure API credential storage
- Connection testing

## Installation

### Method 1: Temporary Installation (for testing)
1. Open Thunderbird
2. Go to **Tools** → **Add-ons and Themes** (or press `Ctrl+Shift+A`)
3. Click the gear icon (⚙️) in the top-right corner
4. Select **"Debug Add-ons"**
5. Click **"Load Temporary Add-on"**
6. Navigate to the extension folder and select `manifest.json`

### Method 2: Install from ZIP (recommended)
1. Open Thunderbird
2. Go to **Tools** → **Add-ons and Themes** (or press `Ctrl+Shift+A`)
3. Click the gear icon (⚙️) in the top-right corner  
4. Select **"Install Add-on From File"**
5. Select the `trello-task-creator-extension.zip` file

## Setup

### 1. Get Trello API Credentials

1. Go to [Trello Power-Ups Admin](https://trello.com/power-ups/admin)
2. Click **"Create a Power-Up"**
3. Fill in the basic information:
   - **Power-Up name**: "Thunderbird Extension" (or any name you prefer)
   - **Workspace**: Select your workspace
   - **Iframe connector URL**: You can put any placeholder URL like `https://example.com`
4. After creating, copy your **API Key**

### 2. Generate Access Token

1. Replace `YOUR_API_KEY` in the following URL with your actual API key:
   ```
   https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=Thunderbird%20Extension&key=YOUR_API_KEY
   ```
2. Visit the URL in your browser
3. Click **"Allow"** to authorize the application
4. Copy the token that appears

### 3. Configure Extension

1. In Thunderbird, click the Trello extension icon in the toolbar
2. Click **"Settings"** link
3. Enter your API Key and Token
4. Click **"Save Settings"**
5. Click **"Test Connection"** to verify everything works

## Usage

1. Click the Trello icon in the Thunderbird toolbar
2. Select a **Board** from the dropdown
3. Select a **List** from the dropdown
4. Enter a **Task Title** (required)
5. Optionally enter a **Description**
6. Click **"Create Task"**

The task will be created in your selected Trello board and list.

## Troubleshooting

### "Connection failed" errors
- Verify your API key and token are correct
- Check that your token has read/write permissions
- Ensure you have internet connectivity

### "Error loading boards" 
- Your API credentials may be invalid
- Try regenerating your token with the correct permissions

### Extension not appearing
- Make sure you've installed it correctly
- Try restarting Thunderbird
- Check that the extension is enabled in Add-ons manager

## Building the Extension

### Prerequisites

To build the extension from source, you'll need:
- Node.js (version 18 or higher)
- npm (comes with Node.js)
- zip utility (available on most systems)

### Building Steps

1. **Clone or download the source code**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run tests and validation** (optional but recommended):
   ```bash
   npm test
   npm run lint
   ```

4. **Build the extension package**:
   ```bash
   npm run package
   ```
   This creates `trello-task-creator-extension.zip` ready for installation.

### Manual ZIP Creation

If you prefer to create the ZIP manually:

```bash
# From the extension directory
zip -r trello-task-creator-extension.zip . -x node_modules/\* package*.json *.svg .git/\* .github/\* tests/\* jest.config.js .eslintrc.js coverage/\*
```

**Important**: The `manifest.json` file must be at the root level of the ZIP file, not inside a subdirectory.

### Automated Testing

Use the included test runner for comprehensive validation:

```bash
# Run all tests and build
node test-runner.js

# Install dependencies and run tests
node test-runner.js --install

# Build only
node test-runner.js --build-only
```

### Continuous Integration

The project includes GitHub Actions workflows that automatically:
- Run tests on push/pull requests
- Validate extension structure
- Create release packages
- Perform security scans

See `.github/workflows/ci.yml` for details.

## Development

The extension consists of:
- `manifest.json` - Extension configuration
- `popup.html/js` - Main interface for creating tasks
- `options.html/js` - Settings page for API credentials
- `background.js` - Background script (minimal for this version)
- `tests/` - Test suite for validation
- `package.json` - Node.js dependencies and scripts

## Security Notes

- API credentials are stored locally using browser.storage.sync
- All communication with Trello uses HTTPS
- The extension only requests necessary permissions

## Future Enhancements

- Auto-populate task details from email content
- Add due dates and labels to tasks
- Bulk task creation
- Email-to-task parsing improvements
- Integration with Thunderbird's compose window

## License

This extension is provided as-is for personal use.
