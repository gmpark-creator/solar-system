# 태양계프로젝트 - codex

Codex 전용 태양계 프로젝트 작업 폴더입니다.

## 폴더 원칙

- 이 폴더는 Codex 작업 전용입니다.
- Claude 작업물은 sibling 폴더로 분리합니다. 권장 이름은 `태양계프로젝트 - claude`입니다.
- 두 폴더는 서로의 파일을 직접 수정하지 않습니다.
- 상호 피드백이 필요하면 상대 폴더를 읽기 전용으로 확인합니다.

권장 배치:

```text
C:\Users\User A\Desktop\새 폴더\
  태양계프로젝트 - codex\
  태양계프로젝트 - claude\
```

현재 이 repo는 별도 git repo로 관리합니다. 원격 저장소가 생기면 이 repo에만 remote를 연결합니다.

## 작업 흐름

1. Codex는 이 폴더 안에서만 구현합니다.
2. 의미 있는 변경은 한 번에 하나의 commit으로 남깁니다.
3. Claude 작업 검토가 필요하면 `tools/peer-status.ps1`로 상대 폴더 상태를 먼저 확인합니다.
4. 피드백 내용은 `internal/notes/HANDOFF.md` 또는 별도 receipt에 남깁니다.

## 초기 구조

```text
assets/                 이미지, 모델, 음원 등 정적 자산
src/                    실제 구현 코드
tests/                  테스트 코드
tools/                  로컬 점검 스크립트
internal/planning/      진행 계획
internal/notes/         핸드오프 및 피드백 메모
```
