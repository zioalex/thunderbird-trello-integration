#!/usr/bin/env node

/**
 * Test runner script for local development
 * This allows testing the extension without GitHub Actions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Thunderbird Trello Extension Tests');
console.log('=' .repeat(50));

// Function to run command and handle errors
function runCommand(command, description) {
    console.log(`\n📋 ${description}...`);
    try {
        const output = execSync(command, { 
            encoding: 'utf8', 
            stdio: 'inherit',
            cwd: __dirname 
        });
        console.log(`✅ ${description} passed`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} failed`);
        console.error(error.message);
        return false;
    }
}

// Function to check file existence
function checkFiles() {
    console.log('\n📋 Checking required files...');
    
    const requiredFiles = [
        'manifest.json',
        'popup.html',
        'popup.js',
        'options.html',
        'options.js',
        'background.js',
        'README.md'
    ];
    
    const iconSizes = ['16', '32', '48', '128'];
    
    let allFilesExist = true;
    
    // Check main files
    requiredFiles.forEach(file => {
        if (fs.existsSync(path.join(__dirname, file))) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} is missing`);
            allFilesExist = false;
        }
    });
    
    // Check icon files
    iconSizes.forEach(size => {
        const iconPath = path.join(__dirname, 'icons', `trello-${size}.png`);
        if (fs.existsSync(iconPath)) {
            console.log(`✅ icons/trello-${size}.png exists`);
        } else {
            console.log(`❌ icons/trello-${size}.png is missing`);
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

// Function to validate manifest
function validateManifest() {
    console.log('\n📋 Validating manifest.json...');
    try {
        const manifestContent = fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        // Check required fields
        const requiredFields = ['manifest_version', 'name', 'version', 'description'];
        let valid = true;
        
        requiredFields.forEach(field => {
            if (manifest[field]) {
                console.log(`✅ ${field}: ${manifest[field]}`);
            } else {
                console.log(`❌ ${field} is missing`);
                valid = false;
            }
        });
        
        return valid;
    } catch (error) {
        console.error('❌ Invalid JSON in manifest.json');
        console.error(error.message);
        return false;
    }
}

// Main execution
async function main() {
    let overallSuccess = true;
    
    // Check if npm dependencies are installed
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
        console.log('📦 Installing npm dependencies...');
        if (!runCommand('npm install', 'Installing dependencies')) {
            overallSuccess = false;
        }
    }
    
    // Run all checks
    const checks = [
        () => checkFiles(),
        () => validateManifest(),
        () => runCommand('npm run lint', 'ESLint validation'),
        () => runCommand('npm test', 'Jest unit tests'),
        () => runCommand('npm run package', 'Building extension package')
    ];
    
    for (const check of checks) {
        if (!check()) {
            overallSuccess = false;
        }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    if (overallSuccess) {
        console.log('🎉 All tests passed! Extension is ready for deployment.');
        console.log('📦 Extension package: trello-task-creator-extension.zip');
    } else {
        console.log('💥 Some tests failed. Please fix the issues above.');
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node test-runner.js [options]

Options:
  --help, -h     Show this help message
  --install      Install dependencies first
  --lint-only    Run only ESLint
  --test-only    Run only Jest tests
  --build-only   Run only package build

Examples:
  node test-runner.js           # Run all tests
  node test-runner.js --install # Install deps then run all tests
  node test-runner.js --lint-only # Run only ESLint
    `);
    process.exit(0);
}

if (args.includes('--install')) {
    runCommand('npm install', 'Installing dependencies');
} else if (args.includes('--lint-only')) {
    runCommand('npm run lint', 'ESLint validation');
} else if (args.includes('--test-only')) {
    runCommand('npm test', 'Jest unit tests');
} else if (args.includes('--build-only')) {
    runCommand('npm run package', 'Building extension package');
} else {
    main().catch(console.error);
}
