# Pull Request: Improve HTML extraction, add due date support, fix security issues, and enhance documentation

**Base branch:** main
**Compare branch:** claude/test-branch-visibility-011MToxFDCF5ER2vuinKwfYU

## Summary

This PR includes comprehensive improvements to the Thunderbird Trello Extension across multiple areas:

### 🐛 HTML Extraction Fixes
- **Fixed ordered list conversion**: Previously all lists were converted to bullets, now `<ol>` elements properly convert to numbered lists (1. 2. 3.)
- **Fixed code block formatting**: `<pre>` tags now correctly convert to markdown code blocks with backticks
- **Fixed unicode emoji support**: Changed from `String.fromCharCode` to `String.fromCodePoint` to properly decode emoji and unicode characters above 0xFFFF

### ✨ Due Date Feature
- Added comprehensive due date functionality with quick-select buttons
- Quick date options: Tomorrow, Next Week (7 days), Next Month (30 days)
- Date picker for custom date selection
- ISO 8601 format conversion for Trello API compatibility
- Created comprehensive test suite (tests/due-date.test.js) with 15 tests covering all scenarios

### 🔧 ESLint Configuration
- Updated ESLint to support ES2022 (from ES2021)
- Fixed parsing errors for static class fields
- Updated all static field references to use proper syntax

### 🔒 Security Improvements
- **Eliminated all npm audit vulnerabilities** (23 → 0)
  - Fixed tmp vulnerability via npm audit fix
  - Added npm overrides for js-yaml ^4.1.1
  - Updated web-ext to 9.1.0
- Added security auditing guidelines to CLAUDE.md

### 🚀 CI/CD Pipeline Enhancements
- **Improved error handling**: All steps now properly fail on errors (previously some continued despite failures)
- Added explicit error messages for npm audit failures
- Added clear exit codes and helpful debugging instructions
- Applied fixes to both ci.yml and release.yml workflows

### 📚 Documentation Updates
- **README.md**: Complete overhaul reflecting all current features
  - Updated Features section with email integration, smart formatting, due dates, labels, caching
  - Added detailed Usage section with workflow
  - Removed outdated "Future Enhancements" (features now implemented)
  - Added comprehensive Testing section
- **CLAUDE.md**: Added security audit guidelines and workflows

### 📦 Version Management
- Bumped version to 1.2.1
- All version files synchronized (package.json, manifest.json, tests)

## Test Results

All 144 tests passing across 10 test suites:
- ✅ popup-simple.test.js
- ✅ options.test.js
- ✅ background.test.js
- ✅ html-extraction.test.js (4 previously failing tests now fixed)
- ✅ due-date.test.js (15 new tests)
- ✅ popup-cache.test.js
- ✅ manifest.test.js
- ✅ integration.test.js
- ✅ e2e-prefill.test.js
- ✅ e2e-remember.test.js

## Security

- 0 vulnerabilities (down from 23)
- All moderate and higher severity issues resolved
- Regular security audits enforced in CI/CD

## Files Changed

**Core Functionality:**
- background.js - HTML extraction fixes and improvements
- popup.js - Static class field updates and due date logic
- popup.html - Due date UI elements

**Testing:**
- tests/html-extraction.test.js - HTML conversion tests
- tests/due-date.test.js - NEW comprehensive due date test suite
- tests/background.test.js - Updated for new functionality

**Configuration:**
- .eslintrc.js - ES2022 support
- package.json - Security overrides and version bump
- package-lock.json - Dependency updates

**CI/CD:**
- .github/workflows/ci.yml - Enhanced error handling
- .github/workflows/release.yml - Enhanced error handling

**Documentation:**
- README.md - Complete feature documentation update
- CLAUDE.md - Security audit guidelines

## Breaking Changes

None - all changes are backward compatible.

## Migration Notes

No migration needed. Users will benefit from:
- Better email formatting in Trello cards
- Ability to set due dates on tasks
- More reliable extension behavior

## How to Review

1. **Functionality**: Test the extension with various email formats
2. **Due Dates**: Verify quick date buttons and date picker work correctly
3. **Tests**: Run `npm run validate` to confirm all tests pass
4. **Security**: Run `npm audit` to verify 0 vulnerabilities
5. **Documentation**: Review README.md and CLAUDE.md for accuracy
