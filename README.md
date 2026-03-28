# Zipcode Map Selector

A single-page, frontend-only web app for visually selecting US zip codes on an interactive Leaflet map. Click zip code polygons to select them, then copy the resulting JSON array to your clipboard.

## How to Run

No build step or dependencies to install. Just serve the file:

```bash
npx serve
```

Then visit `http://localhost:3000` (clipboard requires HTTPS or localhost).

## Usage

1. Pick a state from the dropdown (defaults to Maryland).
2. Click zip code polygons on the map to toggle selection (blue = selected).
3. The sidebar shows the live JSON array of selected zip codes.
4. Click **Copy to Clipboard** to copy the array.
5. Click **Clear All** to reset.

## Data Source

Zip code boundaries are fetched per-state from [OpenDataDE/State-zip-code-GeoJSON](https://github.com/OpenDataDE/State-zip-code-GeoJSON) on GitHub. These are ZCTA (Zip Code Tabulation Area) polygons derived from US Census Bureau TIGER/Line shapefiles.

**To change the data source**, edit the `geoJsonUrl()` function and `STATES` array in the `<script>` block of `index.html`. The zip code is read from `feature.properties.ZCTA5CE10` — update the `getZip()` function if your source uses a different property name.

## Stack

- [Leaflet.js](https://leafletjs.com/) v1.9.4 via CDN
- [OpenStreetMap](https://www.openstreetmap.org/) tiles
- Vanilla HTML/CSS/JS — no frameworks, no build tools
