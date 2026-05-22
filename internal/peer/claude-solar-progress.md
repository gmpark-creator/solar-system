# Claude Solar Project Progress Tracker

Last checked: 2026-05-22 KST

## Peer Repository

- Local folder: sibling `..\solar-system`
- Branch: `master`
- Remote: `https://github.com/gmpark-creator/solar-system.git`
- Local HEAD: `776f71fe4596d463412f9ba161c92268c0c78e32`
- Remote `origin/master`: `776f71fe4596d463412f9ba161c92268c0c78e32`
- Push status: local HEAD matches remote `origin/master`
- GitHub Pages URL documented in peer README: `https://gmpark-creator.github.io/solar-system/`

No `gh-pages` branch was reported by `git ls-remote`; the Pages URL is documented in README, likely served from the repository's configured Pages source.

## Report Source

Claude's project report is currently in:

- `..\solar-system\README.md`

Claude's current implementation is concentrated in:

- `..\solar-system\index.html`

## Claude Commit Timeline

- `b3a264b` - Initial solar project setup
- `ae94d19` - Step 1: space background, Sun, Earth, Moon real-time 3D simulator
- `05a94d0` - Step 2: 8 planets, Keplerian ephemeris, higher-quality Earth texture
- `28ce9e6` - Step 3: tide / water-level calculation and web deployment
- `776f71f` - Step 4: time machine, interaction, visual upgrade

## Reported Claude Feature Progress

### Step 1

- Space background
- Camera controls
- Sun, Earth, Moon real-time implementation
- Schlyter-style orbit calculations
- Moon perturbation terms

### Step 2

- 8-planet expansion
- Keplerian ephemeris
- Saturn rings
- NASA-style Earth texture usage

### Step 3

- Tide / water-level visualization
- 3D tidal bulge
- Tide panel
- 48-hour theoretical tide curve
- Six Korean coastal locations
- Web deployment noted in README

### Step 4

- Time-machine UI with `YYYY-MM-DD`
- Jump controls for +/- 1 week, 1 month, 3 months, 6 months, 1 year
- Play/pause
- Speed slider from reverse time to 1 year/second
- Visual vs true scale toggle
- Click interaction for Sun, planets, Moon, and labels
- Smooth camera tween focus
- Information sidebar with body profile
- Billboard labels
- Shadow map enabled from Sun point light
- Existing orbit lines, sun glow, and Saturn rings retained

## Codex Red-Team Notes

- Claude README describes reset as "today reset"; if the product requirement is fixed baseline `2026-05-22`, this should be confirmed in Claude lane.
- Claude Step 3 tide output is explicitly an equilibrium tide visualization. It should not be treated as an operational harbor tide table until harmonic constants and local bathymetric corrections are introduced.
- Claude implementation remains mostly single-file `index.html`; this is easy to run but harder to test and diff as the simulator grows.
- Claude texture/star generation still appears to use direct `Math.random()` in several places, so visual evidence may not be deterministic across reloads.
- Claude Earth rotation still appears to use a simplified `earthRotation(date, Ls)` formula rather than the Julian Date GMST formula used by Codex. This matters before tide/longitude precision is promoted.

## Tracking Rule

At the start and end of each Codex slice:

1. Check `..\solar-system` branch, status, log, and remote SHA.
2. Read `..\solar-system\README.md` for updated result-report text.
3. Inspect latest commit diff enough to identify new feature scope and risk.
4. Update this tracker and Codex handoff notes if Claude changed.
