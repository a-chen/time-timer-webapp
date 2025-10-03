#!/bin/bash

# Setup script to install git hooks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_DIR="$SCRIPT_DIR"
GIT_HOOKS_DIR=".git/hooks"

echo "Installing git hooks..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
  echo "Error: Not in a git repository root directory"
  exit 1
fi

# Copy hooks to .git/hooks
cp "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
cp "$HOOKS_DIR/pre-push" "$GIT_HOOKS_DIR/pre-push"

# Make hooks executable
chmod +x "$GIT_HOOKS_DIR/pre-commit"
chmod +x "$GIT_HOOKS_DIR/pre-push"

echo "Git hooks installed successfully!"
echo ""
echo "Installed hooks:"
echo "  - pre-commit: Auto-increments version on commit"
echo "  - pre-push: Runs Playwright tests before push"
