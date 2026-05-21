# CODEX_SYNC

## Project

- Name: 태양계프로젝트 - codex
- Owner lane: Codex
- Repo type: standalone local git repository
- Peer lane: Claude, expected sibling folder

## Current Status

- Step 2 implemented in the Codex lane.
- Stack: HTML5 + JavaScript + Three.js CDN, with local Node static server for development.
- Entry point: `index.html`
- App code: `src/app.js`, `src/styles.css`
- Verification: `npm run verify` passed for desktop and mobile viewports.
- Implemented bodies: Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Uranus, Neptune.
- Current focus UI supports Sun, Moon, and all major planets.

## Peer Review Setup

Codex can inspect a sibling Claude folder in read-only mode with:

```powershell
.\tools\peer-status.ps1
```

The script checks common sibling names and reports branch, status, recent commits, and changed files when the peer folder is a git repo.

Current detected peer candidate:

- `..\solar-system`
- Branch: `master`
- Latest seen commit: `b3a264b 태양계 프로젝트 초기 세팅 — git init, .gitignore, README`

## Next Needed Input

- Step 3 범위 결정: 고정밀 달/조석 계산 기반 모듈, 행성 텍스처/조명 고도화, 또는 날짜 탐색 UI
- Claude lane과의 구현 비교 후 반영할 항목 선택
