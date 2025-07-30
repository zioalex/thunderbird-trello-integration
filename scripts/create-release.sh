#!/bin/bash

# Manual release creation script for existing tags
# Usage: ./scripts/create-release.sh [tag_name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if GitHub CLI is authenticated
check_gh_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        print_error "GitHub CLI is not authenticated!"
        echo "Please run: gh auth login"
        exit 1
    fi
}

# Function to create release
create_release() {
    local tag_name=$1
    local version=${tag_name#v}
    
    print_status "Creating release for tag $tag_name..."
    
    # Build the extension package
    print_status "Building extension package..."
    npm ci
    npm run package
    
    # Generate release notes
    local release_notes="## Changes in $tag_name

### Features
- Create Trello tasks directly from Thunderbird
- Select from your Trello boards and lists  
- Simple popup interface with settings page
- Secure API credential storage
- Create new Trello labels on the fly
- Automatic 'thunderbird-email' label tagging
- Enhanced email body extraction and formatting

### Installation
Download the ZIP file below and install it in Thunderbird via Tools → Add-ons → Install Add-on From File.

### Requirements
- Thunderbird 78.0 or higher
- Trello API key and token (see README for setup instructions)"

    # Create the release
    print_status "Creating GitHub release..."
    gh release create "$tag_name" \
        --title "Trello Task Creator $tag_name" \
        --notes "$release_notes" \
        trello-task-creator-extension.zip
        
    print_success "Release $tag_name created successfully!"
    print_success "Release URL: $(gh browse --no-browser --print)/releases/tag/$tag_name"
}

# Main function
main() {
    local tag_name=${1:-""}
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository!"
        exit 1
    fi
    
    # Check GitHub CLI authentication
    check_gh_auth
    
    # If no tag specified, get the latest tag
    if [[ -z "$tag_name" ]]; then
        tag_name=$(git tag --list --sort=-version:refname | grep '^v[0-9]' | head -n1)
        if [[ -z "$tag_name" ]]; then
            print_error "No version tags found!"
            exit 1
        fi
        print_status "No tag specified, using latest: $tag_name"
    fi
    
    # Validate tag format
    if [[ ! $tag_name =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid tag format: $tag_name"
        echo "Expected format: v1.2.3"
        exit 1
    fi
    
    # Check if tag exists
    if ! git tag --list | grep -q "^$tag_name$"; then
        print_error "Tag $tag_name does not exist!"
        echo "Available tags:"
        git tag --list --sort=-version:refname | grep '^v' | head -5
        exit 1
    fi
    
    # Check if release already exists
    if gh release view "$tag_name" >/dev/null 2>&1; then
        print_warning "Release $tag_name already exists!"
        read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deleting existing release..."
            gh release delete "$tag_name" --yes
        else
            print_status "Cancelled."
            exit 0
        fi
    fi
    
    # Checkout the tag
    print_status "Checking out tag $tag_name..."
    git checkout "$tag_name"
    
    # Create the release
    create_release "$tag_name"
    
    # Switch back to main branch
    print_status "Switching back to main branch..."
    git checkout main
}

# Show usage if help is requested
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    echo "Usage: $0 [tag_name]"
    echo
    echo "Creates a GitHub release for the specified tag."
    echo "If no tag is specified, uses the latest version tag."
    echo
    echo "Examples:"
    echo "  $0 v1.1.1    # Create release for specific tag"
    echo "  $0           # Create release for latest tag"
    echo
    echo "Requirements:"
    echo "  - GitHub CLI (gh) must be installed and authenticated"
    echo "  - Must be run from the repository root"
    exit 0
fi

# Run main function
main "$@"
