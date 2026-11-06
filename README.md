# Transposable Piano

A lightweight, browser-based piano keyboard with adjustable pitch transposition. Play notes directly in your browser and see the current key signature update as you transpose.

## Features

- Two-octave virtual piano keyboard
- Play notes with a mouse, touch screen, or other pointer input
- Transpose notes up or down by up to 24 semitones
- View the transposition amount and corresponding key signature
- Generate piano tones in real time with the Web Audio API
- Responsive layout for desktop and mobile screens
- Installable as an app (PWA) that also works offline

## Getting started

No dependencies or build tools are required.

1. Download or clone this repository.
2. Open `index.html` in a modern web browser.
3. Select a key to play a note. Use the arrow buttons to transpose the keyboard.

### Installing as an app

Installation needs the files served over HTTPS (or `http://localhost`), not opened from disk. For a quick local test, run `python -m http.server` in this folder and visit `http://localhost:8000`. Then use your browser's **Install** option (the install icon in the address bar on desktop Chrome/Edge, or **Add to Home Screen** on mobile).

When you change app files, bump `CACHE_VERSION` in `sw.js` so installed copies pick up the update.

Your browser may require a user interaction before it allows audio playback. Click a key to enable audio.

## Project files

- `index.html` — Page structure and controls
- `styles.css` — Keyboard styling and responsive layout
- `app.js` — Keyboard rendering, transposition, key signatures, and audio
- `manifest.webmanifest`, `sw.js`, `icons/` — App install metadata, offline service worker, and app icons

## Built with

- HTML
- CSS
- JavaScript
- Web Audio API
