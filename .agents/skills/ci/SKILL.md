---
name: ci
description: GitHub Actions 워크플로를 바꾸거나 CI 가 실패했을 때. 필수 체크 ci-ok 와 Vercel, 자동 머지, 실패 대응 원칙.
---

# CI

이 스킬이 CI-01, CI-02 의 정본이다. 워크플로는 `.github/workflows/ci.yml` 하나다. 잡 목록은 워크플로 파일을 본다. 배포는 Actions 가 아니라 Vercel Git 연동이 한다.

## 절차 — CI 가 실패했을 때

1. **실패한 잡과 로그를 본다** — `gh run view <run-id> --log-failed`. `Vercel` 체크가 실패했으면 PR 의 Vercel 링크에서 빌드 로그를 본다.
   완료: 실패 원인을 한 문장으로 말할 수 있다.
2. **로컬에서 재현한다** — 같은 명령을 깨끗한 설치에서 돌린다(`rm -rf node_modules && pnpm install --frozen-lockfile`). `test` 잡은 [waline-server 절차](../waline-server/SKILL.md#절차)대로 DB 를 띄워 돌린다.
   완료: 재현되거나, 로컬에서는 통과한다.
3. **원인을 고치고 같은 PR 에 push 한다**(CI-02). `audit` 실패는 [dependencies](../dependencies/SKILL.md) 를 따른다.
   완료: 새 커밋의 `ci-ok` 와 `Vercel` 이 초록.

## 규칙

### CI-01 — 필수 체크와 자동 머지

main 은 `ci-ok` 와 `Vercel`(미리보기 배포) 체크 통과가 필수다(저장소 ruleset). `ci-ok` 는 모든 잡을 모아 하나라도 실패·취소·skip 이면 실패한다. 통과한 PR 은 GitHub 자동 머지로 머지되고, 머지되면 Vercel 이 바로 운영에 배포한다.

- 새 잡을 추가하면 `ci-ok` 의 `needs` 에 넣는다. 빠지면 그 잡이 실패해도 머지된다.
- 이 워크플로에는 일부러 skip 되는 잡이 없어서 `ci-ok` 는 skip 도 실패로 본다. 조건부 잡을 넣으면 이 판정을 함께 고친다.
- 자동 머지는 체크가 통과하는 순간 일어난다. PR 에 커밋을 더 올릴 계획이면 다 올린 뒤에 `gh pr merge --auto --merge` 를 건다.
- Renovate PR 도 같은 체크로 자동 머지된다. 렌더 결과 비교가 없는 대신 `test` 잡이 실제 서버를 띄워 댓글 쓰기·읽기와 아바타 생성을 확인한다.

### CI-02 — 실패는 원인을 고친다

검사가 실패하면 기준(audit 수준·규칙)을 낮추지 않고 원인을 고친다. 기준을 바꾸는 것은 측정 방식 자체가 틀렸다는 근거가 있을 때뿐이고, 그 근거를 PR 에 적는다.

- 예: Waline 의 간접 의존성이 high advisory 로 `audit` 를 막았을 때 수준을 내리지 않고, 실제로 실행되는 경로는 override 로 고치고 실행되지 않는 저장소 어댑터의 advisory 만 이유를 달아 예외로 넣었다([DEP-03](../dependencies/SKILL.md#dep-03--audit-예외)).

## 참고

- **결과 재사용**: `verify`(format:check)와 `test` 는 입력 파일 해시로 "통과 표식"을 캐시해, 같은 입력으로 이미 통과했으면 설치·DB 기동·실행을 건너뛴다. `test` 의 입력에서는 문서(`**/*.md`, `.agents/`, `.claude/`)를 뺐다. `audit` 는 파일이 그대로여도 새 advisory 로 결과가 바뀌어 재사용하지 않는다. 대신 PR 에서는 의존성 파일을 바꾼 PR 에서만 돌고, 새 advisory 는 매일 도는 `audit.yml` 이 수정 PR 을 열어 고친다([dependencies](../dependencies/SKILL.md#절차--audit-이-새-advisory-로-실패했을-때)). 입력 범위를 바꾸는 변경(테스트가 새 파일을 읽는 등)은 그 잡의 fingerprint 패턴도 같이 고친다. 블로그와 달리 main 재검사 생략(`tested`)은 두지 않았다. 배포를 Vercel 이 따로 해서 main 검사를 건너뛰어도 배포가 빨라지지 않는다.
- **보안 점검**: `zizmor` 잡이 워크플로를 검사한다. checkout 에는 `persist-credentials: false`(이 워크플로는 push 하지 않는다). 외부 액션은 커밋 SHA 로 고정한다(저장소 설정이 강제한다).
- **공용 구성**: `.github/actions/setup`, `actionlint.yaml`, `zizmor.yml`, 러너 라벨은 블로그 저장소와 같은 것을 쓴다. 한쪽을 고치면 다른 쪽도 맞출지 본다.
