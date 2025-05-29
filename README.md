# Obsidian 'Custom File Viewer' Pligin

A plugin for [Obsidian](https://obsidian.md) that allows you to open non-markdown files using custom external applications, based on file extensions.

## Features

- Automatically opens files (e.g., `.py`, `.sh`, `.yaml`, etc.) with the application you specify.
- Configurable mapping of file extensions to application paths.
- Separate default app for all unmapped extensions.
- Optional ignore list for specific file types (e.g., `.md`, images, video).
- Seamless integration into the Obsidian file explorer — just click a file, and it opens in your external app.

## Installation

1. Clone or download this repository.
2. Build the plugin (see below) or use the pre-built version if available.
3. Copy `main.js` to your Obsidian plugins directory:
4. Enable the plugin in Obsidian → Settings → Community Plugins → Installed plugins.

## Build Instructions

If you're modifying the source:

```bash
npm install
npm run build
```
