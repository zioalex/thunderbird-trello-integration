# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Thunderbird WebExtension that creates Trello tasks directly from emails. The extension uses browser.storage.sync for credential storage, communicates with Trello's REST API, and includes auto-fill functionality to pre-populate tasks from currently displayed emails.

## Essential Commands

### Testing & Validation
```bash
npm test                    # Run Jest test suite
npm run test:coverage       # Run tests with coverage report
npm run lint               # Run ESLint on JavaScript files
npm run lint:fix           # Auto-fix linting issues
npm run validate           # Run both lint and test
```

### Security Auditing

**IMPORTANT**: Always run npm audit after making changes to dependencies or at the start of any work session.

```bash
npm audit                   # Check for security vulnerabilities
npm audit fix              # Automatically fix vulnerabilities without breaking changes
npm audit fix --force      # Fix all vulnerabilities (may include breaking changes)
```

**When to run npm audit:**
- After installing or updating any dependencies
- At the beginning of each work session
- Before committing changes
- Before creating releases

**Target security level:**
- **Zero vulnerabilities** is the goal
- All moderate and higher severity issues must be fixed
- Use npm overrides in package.json if direct updates aren't available
- Document any remaining low severity issues that can't be fixed

**If vulnerabilities are found:**
1. Run `npm audit fix` first (safe, non-breaking fixes)
2. Review remaining vulnerabilities
3. Update specific packages if needed
4. Use package.json "overrides" field for transitive dependencies
5. Verify all tests still pass after fixes
6. Commit security fixes separately with clear message

**Example workflow:**
```bash
# 1. Check for vulnerabilities
npm audit

# 2. Fix what can be fixed safely
npm audit fix

# 3. Check if more vulnerabilities remain
npm audit

# 4. If needed, update specific packages or add overrides
npm install --save-dev package-name@latest

# 5. Verify everything still works
npm run validate

# 6. Commit the fixes
git add package.json package-lock.json
git commit -m "Fix security vulnerabilities - 0 vulnerabilities remaining"
```

### Building & Packaging
```bash
npm run package            # Create extension ZIP file
npm run build              # Run validation then package
```

### Version Management

**IMPORTANT**: Always run version bump after completing and committing your changes.

```bash
npm run version:patch      # Bump patch version (1.1.0 → 1.1.1) - Bug fixes
npm run version:minor      # Bump minor version (1.1.0 → 1.2.0) - New features
npm run version:major      # Bump major version (1.1.0 → 2.0.0) - Breaking changes
```

**When to use each version type:**
- **patch**: Bug fixes, small improvements, test additions (no new features)
- **minor**: New features, enhancements (backwards compatible)
- **major**: Breaking changes, major refactors

**The version script (`scripts/bump-version.sh`) automatically:**
1. Updates package.json version
2. Updates manifest.json version
3. Updates tests/manifest.test.js expected version
4. Commits changes with message "Bump version to X.Y.Z"
5. Pushes to remote repository
6. Triggers CI/CD to create git tags and releases

**Interactive Process:**
- Script will show a confirmation prompt before proceeding
- Type `y` to confirm or `n` to cancel
- Use `echo "y" | npm run version:patch` for automated confirmation

**Example workflow:**
```bash
# 1. Make your changes and commit them
git add .
git commit -m "Fix HTML extraction bugs"

# 2. Bump version (this creates a new commit)
npm run version:patch

# 3. Version is now updated and pushed automatically
```

## Architecture

### Core Components

**popup.js (TrelloTaskCreator class)**
- Main user interface logic
- Manages board/list/label selection with caching for performance
- Handles task creation workflow
- Implements "remember last selection" feature
- Pre-fills task form from currently displayed email via background script
- Automatically adds "thunderbird-email" label to created cards
- Provides due date selection with quick date buttons (tomorrow, next week, next month)
- Implements board/list caching with 5-minute TTL using browser.storage.local
- Includes refresh button to bypass cache and force-reload boards/lists

**background.js**
- Retrieves current email content using browser.messages.getFull() API
- Recursively extracts text from message parts (prefers text/plain, falls back to stripped HTML)
- Formats email content as Markdown for Trello cards
- Includes email metadata (from, to, date) in card description
- Handles message display detection across different window types

**options.js (OptionsManager class)**
- Manages Trello API credentials in browser.storage.sync
- Validates API key format (32-character hex string)
- Tests connection to Trello API
- Dynamically generates token authorization URL

### Data Flow

1. User opens popup → loads stored credentials and preferences
2. Popup requests current message from background script
3. Background script queries active tab and extracts email content
4. Popup pre-fills form with subject/body and restores last board/list selection
5. User creates task → API call to Trello with formatted content
6. Extension adds automatic "thunderbird-email" label for tracking

### Storage Schema

Stored in `browser.storage.sync`:
- `trelloApiKey` - User's Trello API key
- `trelloToken` - User's Trello access token
- `lastUsedBoardId` - Last selected board ID
- `lastUsedListId` - Last selected list ID

Stored in `browser.storage.local` (for caching):
- `cached_boards` - Cached board list from Trello API
- `cached_boards_timestamp` - Timestamp of when boards were cached
- `cached_lists_{boardId}` - Cached list data for specific board
- `cached_lists_timestamp_{boardId}` - Timestamp of when lists were cached

**Cache Configuration:**
- Cache duration: 5 minutes (300,000 milliseconds)
- Cache is automatically checked on each load
- Refresh button in UI allows users to bypass cache and force-reload data
- Separate cache entries maintained for each board's lists

## Testing Strategy

The test suite uses Jest with jsdom environment:

- **popup-simple.test.js** - Basic popup functionality
- **options.test.js** - Settings page logic
- **background.test.js** - Email extraction and formatting
- **manifest.test.js** - Extension manifest validation
- **integration.test.js** - Cross-component integration
- **e2e-prefill.test.js** - Email auto-fill feature
- **e2e-remember.test.js** - "Remember selection" feature
- **popup-cache.test.js** - Board/list caching functionality
- **html-extraction.test.js** - HTML to Markdown conversion
- **due-date.test.js** - Due date functionality

Test setup mocks browser APIs (browser.storage, browser.runtime, browser.messages) in tests/setup.js.

## CI/CD Pipeline

GitHub Actions workflow (.github/workflows/ci.yml) runs on push/PR:

1. **Test** - Runs on Node 18.x and 20.x with coverage
2. **Validate** - Checks manifest, HTML, icons, and JS syntax
3. **Build** - Creates extension package ZIP
4. **Web-ext lint** - Mozilla extension validation
5. **Security scan** - npm audit and secret detection
6. **Auto-tag** - Creates git tags from manifest version (main branch only)

Tags trigger release workflow (.github/workflows/release.yml) that creates GitHub releases with artifacts.

## Important Patterns

### Security Considerations

- API credentials stored using browser.storage.sync (encrypted by browser)
- All Trello communication uses HTTPS
- DOM manipulation in options.js uses element creation to prevent XSS
- API key validation prevents malformed inputs

### Email Content Extraction

The background script uses browser.messages.getFull() to retrieve message parts and recursively extracts body content:
```javascript
browser.messages.getFull(messageId) → extractBodyFromParts(parts)
```

The extraction function:
- Prefers text/plain parts for body content
- Falls back to text/html with markdown conversion if no plain text available
- Recursively traverses nested message parts

Content is formatted with:
- Email metadata (from, to, date) as header
- Quoted text detection and formatting
- Signature extraction and labeling
- Markdown-style structure for readability

### Label Management

Two types of labels are applied to cards:
1. **User-selected label** - Optional, chosen by user or created on-the-fly
2. **"thunderbird-email" label** - Automatically added to all cards for tracking

The extension checks for existing "thunderbird-email" label on the board before creating a new one.

## Version Synchronization

Both package.json and manifest.json must maintain identical version numbers. The scripts/bump-version.sh handles this synchronization with validation to ensure consistency.

## Manifest Requirements

- manifest_version: 2 (compatible with Thunderbird 78+)
- Required permissions: storage, https://api.trello.com/*, messagesRead, tabs
- Non-persistent background script for better performance
- Icons in 16, 32, 48, and 128px sizes required

## Contribution Guidelines

- Always create a new branch for each feature or bugfix
- Be sure to run tests and validation before submitting PRs
- Follow existing code style and patterns
- Update documentation as needed for new features
- Use descriptive commit messages for clarity
- Create a pull request