# SOLAR-STEP1 Receipt

## Scope

Step 1 implementation for the Codex lane:

- Space background
- OrbitControls camera rotation and zoom
- Sun, Earth, and Moon 3D bodies
- Current-time Earth orbital position
- GMST-based Earth rotation
- Current-time Moon position relative to Earth
- Visual scale and true-ratio scale toggle

## Changed Files

- `index.html`
- `src/styles.css`
- `src/app.js`
- `tools/serve-local.mjs`
- `tools/verify-playwright.mjs`
- `package.json`
- `package-lock.json`
- `.gitignore`
- `README.md`
- `CODEX_SYNC.md`
- `internal/planning/IMPLEMENTATION.md`
- `internal/notes/HANDOFF.md`

## Verification

Command:

```powershell
npm run verify
```

Result: PASS

Raw highlights:

- Desktop `1440x900`: canvas `1440x900`, lit ratio `0.0468125`, color buckets `53`, loading hidden `true`
- Mobile `390x844`: canvas `390x844`, lit ratio `0.1478125`, color buckets `83`, loading hidden `true`

Screenshots:

- `internal/notes/verification/step1-desktop.png`
- `internal/notes/verification/step1-mobile.png`

Screenshots are local evidence artifacts and are intentionally gitignored.

## UI Impact

The first screen is the actual 3D simulator. HUD shows current simulation time, UTC, speed, Earth rotation angle, Moon phase, Earth-Moon distance, and Earth-Sun distance. Bottom controls provide speed, pause, now, Earth/Sun focus, scale mode, and orbit visibility.

## Remaining Work

- Add the remaining major planets.
- Add a higher-precision ephemeris option if tide-related precision requires it.
- Add source attribution notes for the chosen astronomical formulas before using outputs for operational tide calculations.
