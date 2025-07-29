# Testing Guide

This document explains how to test the Thunderbird Trello Extension.

## Test Suite Overview

The extension includes comprehensive testing to ensure reliability and quality:

### 🧪 Test Types

1. **Unit Tests** - Test individual components and functions
2. **Integration Tests** - Test file structure and API integrations  
3. **Manifest Validation** - Ensure manifest.json is valid
4. **Code Quality** - ESLint for code standards
5. **Security Scanning** - Check for vulnerabilities

### 📁 Test Structure

```
tests/
├── setup.js           # Jest setup and mocks
├── manifest.test.js   # Manifest validation
├── integration.test.js # File structure and integration
├── popup.test.js      # Popup functionality (basic)
└── options.test.js    # Options page functionality (basic)
```

## Running Tests

### Local Testing

Install dependencies first:
```bash
npm install
```

Run all tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Run only linting:
```bash
npm run lint
```

### Using the Test Runner

The included test runner provides an easy way to run all checks:

```bash
# Run all tests
node test-runner.js

# Install dependencies first
node test-runner.js --install

# Run specific checks
node test-runner.js --lint-only
node test-runner.js --test-only
node test-runner.js --build-only
```

## GitHub Actions CI/CD

The repository includes a comprehensive GitHub Actions workflow that runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Release creation

### CI Pipeline Jobs

1. **Test** - Runs on Node.js 18.x and 20.x
   - ESLint validation
   - Jest unit tests
   - Coverage reporting

2. **Validate** - Extension structure validation
   - Manifest.json validation
   - Required files check
   - Icon files verification
   - HTML/JavaScript syntax validation

3. **Build** - Package creation
   - Creates extension ZIP file
   - Verifies package structure
   - Uploads artifacts

4. **Web-ext Lint** - Mozilla's web-ext validation
   - Official extension validation
   - Standards compliance

5. **Security Scan** - Security checks
   - npm audit for vulnerabilities
   - Code scanning for secrets

6. **Release** - Automated releases (on release events)
   - Builds final package
   - Attaches to GitHub release

## Test Results

Current test status:
- ✅ Manifest validation: PASSING
- ✅ File structure: PASSING  
- ✅ Integration tests: PASSING
- ⚠️ Unit tests: BASIC (mocking complexity)

## Test Coverage

The tests cover:
- ✅ Manifest.json structure and validity
- ✅ Required files existence
- ✅ HTML/JavaScript syntax
- ✅ API endpoint validation
- ✅ Extension structure integrity
- ⚠️ JavaScript functionality (limited due to browser API mocking)

## Limitations

Due to the nature of browser extensions, some testing limitations exist:

1. **Browser API Mocking**: Complex browser APIs are difficult to fully mock
2. **DOM Interaction**: Real DOM interaction testing is limited
3. **Trello API**: Real API calls require valid credentials

## Extending Tests

To add new tests:

1. Create test files in the `tests/` directory
2. Follow the naming pattern: `*.test.js`
3. Use the existing setup and mocks
4. Update the CI workflow if needed

## Debugging Tests

For debugging failed tests:

```bash
# Run tests in watch mode
npm run test:watch

# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test tests/manifest.test.js
```

## Manual Testing

For manual testing in Thunderbird:

1. Load the extension via the manifest file
2. Test the popup interface
3. Verify settings page functionality
4. Test Trello API integration with real credentials
5. Create actual Trello tasks

## Quality Gates

Before deployment, ensure:
- ✅ All automated tests pass
- ✅ ESLint validation passes
- ✅ Extension loads in Thunderbird
- ✅ Manual functionality testing completed
- ✅ No security vulnerabilities
