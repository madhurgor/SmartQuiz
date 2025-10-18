# Tabs Tracker Chrome Extension

A Chrome extension that shows information about all open tabs and highlights the current tab.

## Features

- Displays all open tabs across all Chrome windows
- Highlights the currently active tab
- Groups tabs by window
- Includes search functionality to filter tabs
- Shows tab favicons
- Click on any tab to switch to it
- Refresh button to update the tab list

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click on "Load unpacked" button
4. Select the `chrome-tabs-extension` folder
5. The extension should now appear in your extensions list and in the toolbar

## Usage

1. Click on the extension icon in the toolbar to see all your open tabs
2. The current active tab will be highlighted
3. Use the search box to filter tabs by title or URL
4. Click on any tab in the list to switch to it
5. Click the refresh button to update the list of tabs

## Files Structure

- `manifest.json` - Extension configuration
- `popup.html` - Main extension popup UI
- `css/styles.css` - Styles for the extension
- `js/popup.js` - JavaScript functionality
- `create-icons.html` - Tool to generate extension icons

## Customization

You can customize the appearance of the extension by modifying the `styles.css` file. 
The color scheme, fonts, and other visual elements can be adjusted there.
