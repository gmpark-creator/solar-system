# Agent Workflow

이 문서는 `태양계프로젝트 - codex` repo 전용 규칙입니다.

## 역할 분리

- Codex는 이 폴더에서만 작업합니다.
- Claude는 별도 sibling 폴더에서 작업합니다.
- 서로의 폴더는 검토 목적으로만 읽습니다.
- 상대 폴더에 파일 생성, 수정, 삭제, commit, branch 변경을 하지 않습니다.

## Git 규칙

- 이 폴더는 독립 git repo입니다.
- 기본 작업 브랜치는 `codex`입니다.
- 원격 저장소가 없으면 local commit까지만 수행합니다.
- 원격 저장소가 생긴 뒤에만 push합니다.
- 다른 프로젝트 repo의 branch나 worktree를 조작하지 않습니다.

## 상호 검토

상대 작업을 확인해야 할 때:

```powershell
.\tools\peer-status.ps1
```

기본 후보 경로:

- `..\태양계프로젝트 - claude`
- `..\태양계프로젝트 - Claude`
- `..\solar-system`

특정 경로를 직접 지정할 수도 있습니다.

```powershell
.\tools\peer-status.ps1 -PeerPath "..\태양계프로젝트 - claude"
```

## 기록

- 현재 상태 요약: `CODEX_SYNC.md`
- 진행 큐: `internal/planning/IMPLEMENTATION.md`
- 핸드오프와 피드백: `internal/notes/HANDOFF.md`
