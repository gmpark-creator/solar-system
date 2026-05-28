# Receipt — Busan Moon Widget Fix

## Scope
- Fixed the Claude solar simulator lower-left Moon widget so the rendered Moon reflects the selected observer location, with Busan as the default.

## Changed
- `claude/index.html`
  - Added Busan observer horizontal coordinates for the Moon: altitude and azimuth.
  - Added sidereal-time, equatorial conversion, parallactic angle, and bright-limb rotation calculations.
  - Rotated the real Moon texture + phase mask on the canvas using the Busan observer view.
  - Added `고도·방위` readout to the Moon widget.
  - Invalidates the Moon widget immediately when the tide location or time-travel target changes.

## Verification
- Served locally at `http://127.0.0.1:8899/claude/`.
- Playwright browser probe:
  - No console/page errors.
  - Default observer label: `부산`.
  - Moon widget reported altitude/azimuth and updated after a 1-week time jump.
- Screenshot:
  - `internal/notes/screenshots-solar-moon/busan-moon-widget-1440x900.png`

## Remaining Work
- The Moon texture is still a 2D canvas projection, not a full libration-aware lunar globe render.
- Astronomical calculation is suitable for the simulator display; precision-critical tide/navigation output still needs a dedicated high-precision lunar module.
