# Tab Switcher Firefox Extension

A clean and elegant tab switcher for Firefox with search and keyboard navigation.

## Features

- **Quick Access**: `Ctrl+Q` or `Ctrl+Shift+Y` to open
- **Search**: Type to filter tabs by title or URL
- **Keyboard Navigation**: Arrow keys to navigate, Enter to switch
- **Close Tabs**: Click × or press Shift+Enter
- **Modern UI**: Rounded design with smooth animations

## Installation

1. Open Firefox
2. Go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on..."
5. Select `manifest.json` from this directory

## Usage

1. Press `Ctrl+Q` or `Ctrl+Shift+Y` to open the tab switcher
2. Type to search tabs
3. Use ↑↓ arrow keys to navigate
4. Press Enter to switch to selected tab
5. Click × or press Shift+Enter to close tabs
6. Press Escape to cancel

## Files

- `manifest.json` - Extension configuration
- `background.js` - Handles tab operations
- `content.js` - Main tab switcher UI and logic