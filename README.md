# SpaceX Company Profile Demo

Static company profile prototype for GitHub Pages. There is no build step and no backend service in this repository.

## What This Page Does

The page renders a company profile with these sections:

- Company facts
- Business Overview
- Revenue Mix
- Business segment explanations
- Related Section
- Executive profile
- Optional company intro video

The page currently loads English data only.

## Important Files

- `index.html`: default GitHub Pages entry.
- `spacex_profile_decoupled.html`: alternate entry kept for local compatibility with earlier preview links.
- `assets/profile.css`: all page styles.
- `assets/profile.js`: rendering logic and JSON adapter.
- `data/profile.en.json`: active data file loaded by the page.
- `data/profile.zh.json`: reserved Chinese data file. The current page does not load it because language switching was removed.
- `.nojekyll`: keeps GitHub Pages from running Jekyll processing.

## Local Preview

Run from the project root:

```powershell
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/
```

Do not open `index.html` directly with `file://`, because the browser may block `fetch()` loading the JSON file.

## Data Contract

The frontend expects the backend-style JSON shape used in `data/profile.en.json`.

Top-level keys:

```json
{
  "locale": "en-US",
  "company_card": {},
  "business_analysis": {},
  "related_concepts": [],
  "executive_profile": {}
}
```

The Business Overview module is driven by:

```json
{
  "business_analysis": {
    "subject": {
      "market": "185",
      "code": "SPCX",
      "sec_id": "S021462152",
      "org_id": "T000190211"
    },
    "summary": {
      "headline": "One concise explanation of how the business works.",
      "description": "Plain-language business model explanation for retail investors."
    },
    "introVideo": {
      "hasVideo": true,
      "videoURL": "https://example.com/video.mp4",
      "pictureURL": "https://example.com/poster.png"
    },
    "revenueMix": {
      "label": "Revenue Mix",
      "unit": "USD_BILLION",
      "period": "2025",
      "items": [
        {
          "id": "connectivity",
          "name": "Connectivity",
          "share": 61,
          "revenue": 11.39,
          "colorKey": "connectivity"
        }
      ]
    },
    "business_segments": [
      {
        "name": "Connectivity",
        "tagline": "Largest revenue line",
        "headline": "Connectivity is SpaceX selling internet from space.",
        "business_intro": "Plain-language segment explanation.",
        "customer": "Who pays the company.",
        "revenue_mode": "How this segment makes money.",
        "focus_metrics": "What investors should track."
      }
    ]
  }
}
```

## Rendering Notes

`assets/profile.js` contains `normalizeProfileData(raw)`. That function maps backend-style fields into the UI renderer. If the backend field names change, update this adapter first instead of rewriting every render function.

The page currently sets:

```js
const DEFAULT_LANG = 'en';
```

So it always loads:

```text
./data/profile.en.json
```

## Video Behavior

The video module supports:

- Remote MP4 URL through `introVideo.videoURL`
- Remote poster image through `introVideo.pictureURL`
- Large centered play overlay on the poster
- Replay button in the video frame

If there is no video for a company, set:

```json
"introVideo": {
  "hasVideo": false,
  "videoURL": "",
  "pictureURL": ""
}
```

The layout will switch to a no-video state.

## GitHub Pages

This repo is intended to publish from the `main` branch root.

GitHub Pages URL:

```text
https://scott19930819-hub.github.io/newprofile/
```

After changes:

```powershell
git add .
git commit -m "Describe the change"
git push
```

GitHub Pages usually updates within 1-3 minutes.

## Current Design Direction

Keep the page close to AInvest-style profile pages:

- White background
- Minimal borders
- Dense but readable facts grid
- No top stock quote/header/tabs in this standalone prototype
- Business Overview should be plain-language, retail-investor friendly, and SEO-readable
- Avoid showing explanatory text about the feature itself to end users

## Safe Cleanup Rules

Keep these files:

- `index.html`
- `spacex_profile_decoupled.html`
- `assets/profile.css`
- `assets/profile.js`
- `data/profile.en.json`
- `data/profile.zh.json`
- `.gitignore`
- `.nojekyll`
- `README.md`

Do not re-add local video or poster files unless explicitly requested. The current page uses hosted media URLs.
