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

## 실행

현재 구현은 HTML5 + JavaScript + Three.js CDN 기반의 3D 태양계 시뮬레이터입니다.

```powershell
npm install
npm run serve
```

브라우저에서 엽니다.

```text
http://127.0.0.1:5178/
```

Codex/Claude 비교 보고서는 같은 서버에서 엽니다.

```text
http://127.0.0.1:5178/report.html
```

검증은 다음 명령으로 실행합니다. 로컬 서버가 먼저 떠 있어야 합니다.

```powershell
npm run verify
```

## 구현 범위

- 우주 배경 별 필드
- OrbitControls 기반 회전/줌
- 태양, 지구, 달 3D 모델
- 현재 시각 기반 지구 공전 위치
- GMST 기반 지구 자전
- 간소화 천체력과 섭동 보정을 적용한 달의 지구 상대 위치
- 수성, 금성, 화성, 목성, 토성, 천왕성, 해왕성의 현재 위치와 공전 궤도
- 행성 포커스 드롭다운과 토성 고리 표시
- 날짜/시간 직접 입력, ±1일 이동, ±2년 범위 슬라이더, 실시간 복귀
- 2026-05-22 기준 리셋과 ±1주/±1개월/±3개월/±6개월/±1년 날짜 점프
- 1x, 10x, 100x 배속 프리셋
- 행성 클릭 포커스, 부드러운 카메라 이동, 천체 정보 패널
- 시각화 스케일과 실제 비율 스케일 토글
- 태양 글로우, 토성 고리 텍스처, Three.js shadow map 설정
- Claude README/GitHub Pages 기준 비교 보고서 페이지
- 데스크톱/모바일 Playwright 캔버스 렌더 및 보고서 페이지 검증
