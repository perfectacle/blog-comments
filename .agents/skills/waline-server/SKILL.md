---
name: waline-server
description: 댓글 서버 코드(api/index.js), Vercel 설정(vercel.json), DB 스키마(waline.pgsql)를 바꾸거나 로컬에서 서버를 띄울 때. 댓글 경로, 아바타 시드, 비밀값, Vercel 빌드 구성.
---

# 댓글 서버

이 스킬이 SRV-01, SRV-02, SRV-03 의 정본이다. 서버는 `@waline/vercel` 을 그대로 쓰고, `api/index.js` 에서 아바타 생성만 바꾼다. 클라이언트는 블로그 저장소의 `src/components/Comments.astro` 다.

## 절차

1. **로컬 DB 를 띄운다** — 아무 PostgreSQL 에 `waline.pgsql` 을 넣는다.
   ```sh
   docker run -d --name waline-db -e POSTGRES_DB=waline -e POSTGRES_PASSWORD=waline -p 55491:5432 postgres:17-alpine
   docker exec -i waline-db psql -U postgres -d waline < waline.pgsql
   ```
   완료: `wl_comment`·`wl_counter`·`wl_users` 테이블이 있다.
2. **바꾸고 smoke 테스트를 돌린다** — CI 의 `test` 잡과 같은 환경 변수로 돌린다. `NODE_OPTIONS` 까지 CI 와 같게 하려면 `NODE_OPTIONS="--no-experimental-require-module $(jq -r '.env.NODE_OPTIONS // ""' vercel.json)"` 를 앞에 붙인다.
   ```sh
   PG_HOST=127.0.0.1 PG_PORT=55491 PG_DB=waline PG_USER=postgres PG_PASSWORD=waline AKISMET_KEY=false IPQPS=0 pnpm test
   ```
   `--test-force-exit` 는 Waline 이 DB 연결 풀을 닫지 않아 프로세스가 끝나지 않기 때문에 붙어 있다. 새 동작은 `tests/` 에 테스트를 더한다.
   완료: 전부 통과.
3. **Vercel 미리보기에서 확인한다** — PR 을 올리면 Vercel 이 미리보기 배포를 만든다(PR 의 `Vercel` 체크). 미리보기는 운영과 같은 DB 를 쓰므로 댓글을 쓰지 말고 읽기만 한다.
   ```sh
   curl -s "<미리보기 URL>/api/comment?path=<댓글이 있는 글 경로>" | head -c 300
   ```
   완료: `errno: 0` 이고 댓글의 `avatar` 가 `data:image/svg+xml` 로 시작한다. 미리보기 보호가 걸려 있으면 사용자에게 확인을 넘긴다.

## 규칙

### SRV-01 — 댓글 경로

Waline 은 클라이언트가 보낸 `path`(`/2022/06/06/slug/`)를 `wl_comment.url` 에 그대로 넣고, 그 값으로 스레드를 묶는다. 블로그의 [CMT-01](https://github.com/perfectacle/perfectacle.github.io/blob/main/.agents/skills/site-code/SKILL.md#cmt-01--댓글-경로) 이 클라이언트 쪽 규칙이다.

- 이유: 서버에서 끝 슬래시·대소문자·쿼리를 정규화하면 기존 행과 키가 달라져 그 글의 댓글이 통째로 안 보인다. Disqus 에서 옮겨 온 옛 댓글도 이 경로로 들어 있다.
- 경로를 바꿔야 하면 DB 의 `url` 을 함께 옮기는 마이그레이션을 블로그 저장소와 짝으로 계획한다.

### SRV-02 — 아바타 시드

`avatarUrl` 은 이메일(소문자·trim)을, 없으면 닉네임을 sha256 해 그 해시로 `api/avatars.json` 의 동물 아이콘과 배경색을 고른다. 아이콘은 저장하지 않고 응답마다 만든다.

- 이유: 시드·아이콘 목록(순서 포함)·배경색을 바꾸면 옛 댓글을 포함한 모든 댓글의 아이콘이 바뀐다. 의도한 변경일 때만 바꾸고 PR 에 적는다.
- 이메일은 해시로만 쓴다. 응답에 원문 이메일이 나가지 않아야 한다.
- `api/avatars.json` 은 손으로 고치지 않는다. `scripts/build-avatars.mjs` 의 목록을 고치고 `node scripts/build-avatars.mjs` 로 다시 만든다. Noto 전체 세트(25MB)를 런타임에 읽지 않으려고 쓰는 아이콘만 저장소에 둔다.

### SRV-03 — DB 와 비밀값

`waline.pgsql` 은 Waline 공식 PostgreSQL 스키마 사본이다. CI 의 smoke 테스트가 이 파일로 DB 를 만든다.

- 스키마는 Waline 업그레이드 노트가 요구할 때만, 공식 스키마에 맞춰 바꾼다. 운영 DB 에는 사람이 직접 적용한다(에이전트가 운영 DB 에 쓰지 않는다).
- DB 접속 정보, `JWT_TOKEN`, 메일·Akismet 키 같은 비밀값은 Vercel 프로젝트 환경 변수에만 둔다. 저장소는 공개이고 `.env*` 는 git 에서 제외돼 있다.

## 참고

- **Vercel 구성**: `api/index.js` 하나가 함수이고, `rewrites` 가 `public/` 에 없는 모든 경로를 그 함수로 보낸다. 정적 파일은 `outputDirectory` 인 `public/` 만 나가므로 저장소의 다른 파일(`waline.pgsql` 등)은 공개되지 않는다. `framework`·`installCommand`·`outputDirectory` 를 `vercel.json` 에 적어 대시보드 설정이 바뀌어도 배포가 흔들리지 않게 한다. 리전은 `sin1`. 레거시 `builds`·`build.env` 는 쓰지 않는다. Vercel 은 `api/*.cjs` 를 함수로 인식하지 않으므로 진입점은 `.js`(`package.json` 에 `"type"` 이 없어 CommonJS)다.
- **NODE_OPTIONS**: `vercel.json` 의 `env.NODE_OPTIONS=--experimental-require-module` 을 지우지 않는다. Waline 이 ESM 전용 패키지(`@mdit/plugin-emoji` 등)를 `require()` 하는데, Vercel 런타임은 이 플래그 없이는 require(esm) 이 꺼져 있어 모든 요청이 `500 FUNCTION_INVOCATION_FAILED` 로 죽는다. 로컬 Node 24 는 기본으로 켜져 있어 재현되지 않으므로, CI `test` 잡은 플래그를 끈 상태에서 이 값을 더해 돌린다.
- **includeFiles**: Waline 이 실행 중에 파일 경로로 읽는 패키지(MathJax 폰트, mhchemparser, ip2region 데이터)는 번들러가 못 따라가서 `includeFiles` 로 넣는다. 평탄한 `node_modules` 경로를 가리키므로 `pnpm-workspace.yaml` 의 `nodeLinker: hoisted` 를 지운다면 이 경로도 고친다.
- **pnpm**: Vercel 프로젝트 환경 변수 `ENABLE_EXPERIMENTAL_COREPACK=1`(Production·Preview)이 있어야 Vercel 이 `packageManager` 의 pnpm 버전을 쓴다. 빌드 로그의 `Detected ENABLE_EXPERIMENTAL_COREPACK=1 and "pnpm@…"` 줄로 확인한다. 빠지면 Vercel 이 lockfile 기준 pnpm 을 골라 쿨다운·`allowBuilds` 설정을 조용히 무시할 수 있다.
- **배포**: Vercel Git 연동이 PR 마다 미리보기를, main 머지마다 운영 배포를 만든다(`github.silent` 로 PR 댓글은 끔). GitHub Actions 는 검사만 한다.
