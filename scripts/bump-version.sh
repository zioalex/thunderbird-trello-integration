#!/bin/bash

# Version bump script for Thunderbird Trello Extension
# Usage: ./scripts/bump-version.sh [major|minor|patch|<version>]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get current version from package.json
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to calculate next version
calculate_next_version() {
    local current_version=$1
    local bump_type=$2
    
    if [[ $bump_type =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # Explicit version provided
        echo $bump_type
        return
    fi
    
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $bump_type in
        "major")
            echo "$((major + 1)).0.0"
            ;;
        "minor")
            echo "${major}.$((minor + 1)).0"
            ;;
        "patch")
            echo "${major}.${minor}.$((patch + 1))"
            ;;
        *)
            print_error "Invalid bump type: $bump_type"
            echo "Usage: $0 [major|minor|patch|<version>]"
            exit 1
            ;;
    esac
}

# Function to update package.json version
update_package_json() {
    local new_version=$1
    print_status "Updating package.json to version $new_version..."
    
    # Use node to update the version in package.json
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = '$new_version';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
}

# Function to update manifest.json version
update_manifest_json() {
    local new_version=$1
    print_status "Updating manifest.json to version $new_version..."
    
    # Use sed to update the version in manifest.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" manifest.json
    else
        # Linux
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" manifest.json
    fi
}

# Function to check if tag exists
tag_exists() {
    local tag=$1
    git tag --list | grep -q "^$tag$"
}

# Function to validate git status
check_git_status() {
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. Please commit or stash them first."
        git status --short
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Main function
main() {
    local bump_type=${1:-"patch"}
    
    print_status "Starting version bump process..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository!"
        exit 1
    fi
    
    # Check git status
    check_git_status
    
    # Get current version
    local current_version=$(get_current_version)
    print_status "Current version: $current_version"
    
    # Calculate new version
    local new_version=$(calculate_next_version "$current_version" "$bump_type")
    print_status "New version: $new_version"
    
    # Check if tag already exists
    local tag="v$new_version"
    if tag_exists "$tag"; then
        print_error "Tag $tag already exists!"
        exit 1
    fi
    
    # Confirm with user
    echo
    print_warning "This will:"
    echo "  1. Update package.json version to $new_version"
    echo "  2. Update manifest.json version to $new_version"
    echo "  3. Commit the changes with message 'Bump version to $new_version'"
    echo "  4. Push the changes to remote"
    echo
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Version bump cancelled."
        exit 0
    fi
    
    # Update version files
    update_package_json "$new_version"
    update_manifest_json "$new_version"
    
    # Verify the changes
    print_status "Verifying changes..."
    local pkg_version=$(get_current_version)
    local manifest_version=$(node -p "require('./manifest.json').version")
    
    if [[ "$pkg_version" != "$new_version" ]] || [[ "$manifest_version" != "$new_version" ]]; then
        print_error "Version update failed!"
        print_error "package.json: $pkg_version, manifest.json: $manifest_version, expected: $new_version"
        exit 1
    fi
    
    # Stage the changes
    print_status "Staging changes..."
    git add package.json manifest.json
    
    # Commit the changes
    print_status "Committing changes..."
    git commit -m "Bump version to $new_version"
    
    # Push the changes
    print_status "Pushing changes..."
    git push
    
    print_success "Version successfully bumped to $new_version!"
    print_success "The CI will now create tag $tag and build the release."
}

# Show usage if help is requested
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    echo "Usage: $0 [major|minor|patch|<version>]"
    echo
    echo "Examples:"
    echo "  $0 patch    # 1.0.0 -> 1.0.1"
    echo "  $0 minor    # 1.0.0 -> 1.1.0"
    echo "  $0 major    # 1.0.0 -> 2.0.0"
    echo "  $0 1.2.3    # Set specific version"
    echo
    echo "If no argument is provided, 'patch' is used by default."
    exit 0
fi

# Run main function
main "$@"
