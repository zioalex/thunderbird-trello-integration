# Trello Task Creator for Thunderbird

A Thunderbird WebExtension that allows you to create Trello tasks directly from Thunderbird.

## Features

- **Email Integration**: Auto-populate task title and description from currently displayed email
- **Smart Email Formatting**: Converts email HTML to Markdown with proper formatting
  - Email metadata (from, to, date) included in card description
  - Quoted text and signatures automatically detected and formatted
  - Unicode and emoji support
- **Board & List Selection**: Choose from your Trello boards and lists with caching for fast loading
- **Due Date Support**: Set task due dates with quick-select buttons (tomorrow, next week, next month)
- **Label Management**:
  - Select existing labels or create new ones on-the-fly
  - Automatic "thunderbird-email" label for tracking email-created tasks
- **Remember Last Selection**: Automatically remembers your last used board and list
- **Performance Caching**: 5-minute cache for boards and lists with manual refresh option
- **Secure Storage**: API credentials stored securely using browser.storage.sync
- **Connection Testing**: Verify your Trello API credentials work correctly

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

### Creating a Task from an Email

1. Open or select an email in Thunderbird
2. Click the Trello icon in the Thunderbird toolbar
3. The popup will automatically:
   - Pre-fill the task title with the email subject
   - Pre-fill the description with formatted email content
   - Remember your last used board and list (if any)
4. Select a **Board** from the dropdown (or keep the remembered selection)
5. Select a **List** from the dropdown (or keep the remembered selection)
6. Optionally select or create a **Label**
7. Optionally set a **Due Date** using quick buttons or date picker
8. Modify the **Task Title** or **Description** if needed
9. Click **"Create Task"**

The task will be created in your selected Trello board and list with:
- Your custom title and description
- Email metadata (from, to, date) in the card description
- Automatically formatted content (links, lists, quotes, etc.)
- Selected label (if any)
- Automatic "thunderbird-email" label for tracking
- Due date (if set)

### Quick Date Selection

Use the quick date buttons for common due dates:
- **Tomorrow**: Sets due date to next day
- **Next Week**: Sets due date to 7 days from now
- **Next Month**: Sets due date to 30 days from now

Or use the date picker to select any specific date.

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
- `popup.html/js` - Main interface for creating tasks with caching and label management
- `options.html/js` - Settings page for API credentials
- `background.js` - Email content extraction and HTML-to-Markdown conversion
- `tests/` - Comprehensive test suite with 144+ tests across 10 test files
- `package.json` - Node.js dependencies and scripts
- `scripts/bump-version.sh` - Automated version management script
- `.github/workflows/` - CI/CD pipeline for testing, validation, and releases

### Version Management

The project includes an automated version bump system that handles updating both `package.json` and `manifest.json`, committing changes, and triggering CI releases.

#### Quick Version Bumps

```bash
# Patch version bump (1.1.0 → 1.1.1)
npm run version:patch

# Minor version bump (1.1.0 → 1.2.0)
npm run version:minor

# Major version bump (1.1.0 → 2.0.0)
npm run version:major

# Default patch bump
npm run version
```

#### Manual Script Usage

```bash
# Using the script directly
./scripts/bump-version.sh patch
./scripts/bump-version.sh minor
./scripts/bump-version.sh major
./scripts/bump-version.sh 1.2.3  # Set specific version

# Show help
./scripts/bump-version.sh --help
```

#### What the Version Script Does

1. **Validates** git status (warns about uncommitted changes)
2. **Calculates** new version based on semantic versioning
3. **Checks** if git tag already exists (prevents duplicates)
4. **Updates** both `package.json` and `manifest.json` versions
5. **Verifies** the updates were successful
6. **Commits** changes with standardized commit message
7. **Pushes** to remote repository
8. **Triggers** CI to create git tag and release artifacts

#### Safety Features

- **Confirmation prompt** before making any changes
- **Git status validation** with warnings for uncommitted changes
- **Tag existence checking** to prevent duplicate releases
- **Version verification** ensures both files are updated correctly
- **Colored output** for better visibility of the process

#### Version Numbering

The project follows [Semantic Versioning](https://semver.org/):
- **Major** (X.0.0): Breaking changes or major new features
- **Minor** (1.X.0): New features that are backward compatible
- **Patch** (1.1.X): Bug fixes and small improvements

Both `package.json` and `manifest.json` are automatically kept in sync.

## Security Notes

- API credentials are stored locally using browser.storage.sync (encrypted by browser)
- All communication with Trello uses HTTPS
- The extension only requests necessary permissions (storage, Trello API, message reading)
- No API credentials are ever transmitted outside of Trello's official API endpoints
- Regular security audits via npm audit in CI/CD pipeline

## Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run full validation (lint + test)
npm run validate
```

### Test Coverage

- **popup-simple.test.js** - Basic popup functionality
- **options.test.js** - Settings page logic
- **background.test.js** - Email extraction and formatting
- **html-extraction.test.js** - HTML to Markdown conversion
- **due-date.test.js** - Due date functionality
- **popup-cache.test.js** - Board/list caching
- **manifest.test.js** - Extension manifest validation
- **integration.test.js** - Cross-component integration
- **e2e-prefill.test.js** - Email auto-fill feature
- **e2e-remember.test.js** - Remember last selection feature

All tests run automatically in CI/CD on every push and pull request.

## License

This extension is provided as-is for personal use.
