# Universal Image Library

Reusable educational visuals mapped by curriculum context (not exact documentary history photos).

## Build (no API key)

```bash
node tools/image_library/download_universal_images.mjs --total 800
```

Small test:

```bash
node tools/image_library/download_universal_images.mjs --total 30
```

## Sources

- Wikimedia Commons (Action API, no key)
- LoremFlickr keyword images (no key)

## Verification before keeping an image

- Topic/title keyword relevance check
- Minimum file size (`--min-bytes`, default 40KB)
- Must be an image content-type (rejects HTML/SVG junk)
- Rejects icons/logos by filename heuristics
- Saves twisted names as: `<topic>__<query>__<id>.jpg`

## Outputs

- Topic folders: `war/`, `history/`, `body/`, `ocean/`, `energy/`, `tech/`, ...
- `manifest.csv`
- `index.json`
