# CODEX_SYNC

## Project

- Name: 태양계프로젝트 - codex
- Owner lane: Codex
- Repo type: standalone local git repository
- Peer lane: Claude, expected sibling folder

## Current Status

- Step 4 implemented in the Codex lane.
- Stack: HTML5 + JavaScript + Three.js CDN, with local Node static server for development.
- Entry point: `index.html`
- App code: `src/app.js`, `src/styles.css`
- Verification: `npm run verify` passed for desktop and mobile viewports.
- Implemented bodies: Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Uranus, Neptune.
- Current focus UI supports Sun, Moon, and all major planets.
- Time navigation UI supports direct local datetime input, ±1 day steps, ±2 year slider, and live reset.
- Baseline reset date is `2026-05-22`.
- Added time jump buttons, speed presets, click-to-focus, smooth camera focus, and object information panel.
- Visual upgrades: shadow map enabled, textured Saturn rings, persistent billboard labels, and strengthened sun glow.

## Peer Review Setup

Codex can inspect a sibling Claude folder in read-only mode with:

```powershell
.\tools\peer-status.ps1
```

The script checks common sibling names and reports branch, status, recent commits, and changed files when the peer folder is a git repo.

Current detected peer candidate:

- `..\solar-system`
- Branch: `master`
- Remote: `https://github.com/gmpark-creator/solar-system.git`
- Latest seen local/remote commit: `776f71f Step 4: 타임머신·인터랙션·비주얼 고도화`
- Peer progress tracker: `internal/peer/claude-solar-progress.md`

## Next Needed Input

- Step 5 범위 결정: 고정밀 달/조석 계산 기반 모듈, 정확도/출처 패널, 또는 실제 배포 파이프라인
- Claude lane과의 구현 비교 후 반영할 항목 선택
