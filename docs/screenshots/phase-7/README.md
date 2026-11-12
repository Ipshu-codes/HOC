# Phase 7 — 3D map screenshots

Captured on 12 Nov 2026 in Microsoft Edge. Unless noted otherwise, they are from `npm run build:preview` (Mhepi Ajima draft excluded).

| File | What it shows |
|---|---|
| `map-en-1440.jpg`, `map-en-768.jpg`, `map-ne-375.jpg` | The 3D map page with OpenFreeMap tiles, AWS terrain, 3D buildings and the side panel. In the preview build the only place on the map is the ward office (approximate). |
| `dev-map-mhepi-en-1440.jpg` | `npm run dev`, opened at `/en/map/?site=mhepi-ajima`. The map flies to Mhepi Ajima and opens its popup (photo, summary, "Read more"). |
| `floating-map-button-en-375.jpg`, `floating-map-button-ne-375.jpg` | The floating "🗺 3D Map" button, bottom-right as in the sketch. The headless browser has no colour-emoji font, so 🗺 shows as a plain glyph; phones show the emoji. |

Why Nanak Math is not on the map: the coordinates supplied for it point to a temple in Nagarjun Municipality, outside Ward 16 (see MISSING_INFO.md). It will appear once a corrected point is set in its content files.

Checked:

- **Attribution** reads "Terrain: AWS Terrain Tiles (Mapzen) | OpenFreeMap © OpenMapTiles Data from OpenStreetMap".
- **Controls:** the side panel and the markers are keyboard-reachable buttons. The zoom, compass and fullscreen controls have Nepali labels on `/ne/`.
- **Errors:** no page errors.
