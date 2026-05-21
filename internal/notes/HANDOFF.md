# Handoff Notes

## 2026-05-21

Codex workspace was created as a separate sibling folder:

```text
C:\Users\User A\Desktop\새 폴더\태양계프로젝트 - codex
```

This folder is intended to stay separate from Claude's implementation folder. Cross-review should be done by reading the sibling folder only.

No app code has been written yet because the project requirements and stack have not been specified.

Peer check was verified with:

```powershell
.\tools\peer-status.ps1
```

The script currently finds `..\solar-system` as the first existing peer candidate after the preferred Claude folder names. Treat that folder as read-only from the Codex lane unless 박사 explicitly says otherwise.
