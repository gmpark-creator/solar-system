# SOLAR-STEP4 Receipt

## Scope

Step 4 implementation for the Codex lane:

- Set the simulation baseline/reset date to `2026-05-22`.
- Show the current simulation date as `YYYY-MM-DD`.
- Add requested calendar time-machine jump buttons.
- Add 1x, 10x, and 100x speed controls.
- Add mouse click body selection with smooth OrbitControls camera focus.
- Add an HTML/CSS body profile panel and overview return.
- Keep planet positions calculated from `Date` objects rather than incremental per-frame orbit angles.
- Improve visual details with shadow settings, sun glow, textured Saturn rings, orbit lines, and persistent billboard labels.

## Changed Files

- `index.html`
- `src/styles.css`
- `src/app.js`
- `tools/verify-playwright.mjs`
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

- Desktop `1440x900`: canvas `1440x900`, lit ratio `0.049625`, color buckets `68`, date label `2026-05-22`, jump buttons `10`, speed presets `3`
- Mobile `390x844`: canvas `390x844`, lit ratio `0.1445625`, color buckets `84`, date label `2026-05-22`, jump buttons `10`, speed presets `3`
- Reset label: `2026-05-22`
- `+1w` label: `2026-05-29`
- 100x speed preset readout: `100x`
- Click focus/info panel: `Earth`
- Overview return: info panel hidden, focus value `sun`

Screenshots:

- `internal/notes/verification/step4-desktop.png`
- `internal/notes/verification/step4-mobile.png`

Screenshots are local evidence artifacts and are intentionally gitignored.

## UI Impact

The first screen still opens into the live simulator, now at baseline date `2026-05-22`. The time-machine controls occupy a dedicated strip above the main toolbar. Clicking a body opens a right-side profile panel on desktop and a compact lower panel on mobile. The overview button returns the camera to the whole-system view.

## Remaining Work

- Add an accuracy/source panel for ephemeris formulas.
- Build high-precision lunar/tide mode before presenting tide results as anything beyond a visual approximation.
- Add a real remote/deployment flow once a repository remote is chosen.
