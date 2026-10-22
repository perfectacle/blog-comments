---
name: dependencies
description: npm 의존성·pnpm·Node·GitHub Actions 버전을 추가하거나 올릴 때, Renovate PR 이나 audit 잡이 실패했을 때. 7일 쿨다운, lockfile, override, audit 예외.
---

# 의존성

이 스킬이 DEP-01, DEP-02, DEP-03 의 정본이다. 평소 업데이트는 Renovate 가 PR 로 올리고 CI 가 통과하면 자동 머지된다(`renovate.json`). 사람이나 에이전트가 직접 손대는 것은 새 의존성 추가, Renovate PR 실패, `audit` 실패다. 급한 업데이트는 Renovate 대시보드 이슈에서 체크해 바로 PR 을 만들게 한다.

## 절차 — 의존성 추가·변경

1. **설치한다** — `pnpm add --save-exact <pkg>`(개발용이면 `-D`). `pnpm-workspace.yaml` 의 쿨다운이 7일 안 된 버전을 알아서 건너뛴다.
   완료: `package.json` 에 정확한 버전이 들어갔다.
2. **깨끗한 설치로 검증한다** — `rm -rf node_modules && pnpm install --frozen-lockfile` 후 `pnpm run audit`, `pnpm format:check`, smoke 테스트([waline-server 절차](../waline-server/SKILL.md#절차))를 돌린다.
   완료: 전부 통과.

## 규칙

### DEP-01 — 7일 쿨다운

릴리스된 지 7일이 지난 버전만 쓴다. pnpm(`minimumReleaseAge: 10080`)과 Renovate(`minimumReleaseAge: 7 days`) 양쪽에 걸려 있고, CI 의 frozen 설치도 lockfile 의 모든 항목을 다시 검사해 7일 안 된 버전이 있으면 `ERR_PNPM_NO_MATURE_MATCHING_VERSION` 으로 실패한다.

- 이유: 공급망 공격은 대개 배포 직후 며칠 안에 발견·회수된다.
- 예외는 보안 수정 하나다. 그 버전(과 그 버전이 새로 끌어오는 의존성)을 `pnpm-workspace.yaml` 의 `minimumReleaseAgeExclude` 에 advisory 와 함께 넣는다. `minimumReleaseAgeExcludePrune` 이 lockfile 이 더 쓰지 않는 항목을 지우므로, 설치가 실패한 채로 다시 설치하면 넣은 항목이 사라진다. 지워졌으면 다시 넣는다.
- GitHub Actions·컨테이너 이미지도 같은 기준이다. 액션은 커밋 SHA 와 `# vX.Y.Z` 주석으로, 컨테이너 이미지는 digest 로 고정한다(postgres 는 `태그@digest`). 같은 태그도 digest 가 자주 바뀌므로 손으로 고를 때는 7일 지난 digest 를 고르고, 이후 갱신 시점은 Renovate 의 `minimumReleaseAge` 가 정한다. CI 의 postgres 이미지는 `test` 잡 env `POSTGRES_IMAGE` 에 있고 customManager 가 올린다. 메이저는 운영 DB 에 맞춰 사람이 올린다(Renovate 는 메이저를 올리지 않는다). pipx 로 도는 zizmor 는 잡 env 의 `ZIZMOR` 한 곳에 버전을 두고 `renovate.json` 의 customManager 가 올린다.

### DEP-02 — lockfile

`package.json`·`pnpm-workspace.yaml` 을 바꾸면 lockfile 도 같이 바뀌어야 하고 `pnpm install --frozen-lockfile` 이 통과해야 한다.

- 충돌이 나면 main 의 lockfile 을 가져와(`git checkout origin/main -- pnpm-lock.yaml`) `pnpm install` 로 다시 만든다. 손으로 고치지 않는다.
- 빌드 스크립트는 `allowBuilds` 에 패키지마다 허용·거부를 적는다. 적지 않은 패키지가 스크립트를 가지면 설치가 `ERR_PNPM_IGNORED_BUILDS` 로 실패한다.

### DEP-03 — audit 예외

`audit` 잡은 운영 의존성의 high 이상 advisory 로 실패한다. 고치는 순서는 다음과 같다.

1. 같은 메이저 안에 수정 버전이 있으면 `pnpm-workspace.yaml` 의 `overrides` 로 올린다. Waline 의 peer 로 들어온 패키지는 lockfile 갱신으로 다시 풀리지 않아 override 가 필요하다. Waline 이 수정 버전을 직접 요구하게 되면 override 를 지운다.
2. 수정이 메이저 변경을 요구하거나 수정 버전이 없고, 그 코드가 이 서버에서 실행되지 않을 때만 `auditConfig.ignoreGhsas` 에 넣는다. 지금은 LeanCloud·CloudBase 저장소 어댑터가 그렇다. 이 서버는 PostgreSQL 을 쓰므로 두 어댑터는 자격 증명이 없어 호출되지 않는다.
3. 실행되는 코드인데 수정이 없으면 PR 에 advisory 와 영향 여부를 적고 저장소 주인에게 넘긴다.

- 이유: 실행되는 경로의 취약점을 예외로 숨기면 audit 잡이 있으나 마나다.

## 참고

- **Waline 과 DiceBear**: `@dicebear/core` 와 `@dicebear/fun-emoji` 는 Renovate 가 한 PR 로 묶는다. 버전이 어긋나면 아바타 생성이 깨진다.
- **pnpm·Node 버전**은 `package.json` 의 `packageManager`(해시 포함)와 `.node-version` 이 정한다. 블로그 저장소와 같은 값을 쓴다. corepack 으로 활성화한다(`corepack enable pnpm`). Vercel 은 `engines.node` 의 메이저만 읽는다.
