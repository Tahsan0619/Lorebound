# Lorebound

Lorebound is a browser-based AI curriculum-to-game compiler. It takes educational text or PDF chapter content, identifies the structure of the material, and turns it into a playable learning game matched to that structure.

## What It Does

- Accepts pasted text or PDF-based curriculum input
- Classifies the content structure, such as timeline, cycle, cause-and-effect, or comparison
- Selects a matching game mechanic automatically
- Renders the result as an interactive web experience

## Project Files

- `index.html` - main application shell and UI
- `styles.css` - visual styling
- `app.js` - app coordinator and content pipeline
- `games.js` - game mechanic renderers
- `Lorebound_PRD.md` - product requirements document

## Running Locally

This project is a static frontend with no build step.

1. Open `index.html` in a modern browser.
2. Or serve the folder with any local static server if you prefer.

## Demo Content

The app includes preloaded sample chapters for testing the different mechanic types.

## Notes

This repository is prepared for the SciBlitz AI Challenge 2026 submission for Track C: Education & Accessibility.