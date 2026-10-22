# 에이전트 진입 문서

이 저장소는 블로그 https://perfectacle.github.io 의 댓글 서버다([Waline](https://waline.js.org) 을 Vercel 에서 돌린다, 주소 https://blog-comments-perfectacle.vercel.app). 블로그 소스는 [perfectacle/perfectacle.github.io](https://github.com/perfectacle/perfectacle.github.io) 에 따로 있다. 이 문서는 모든 코딩 에이전트(Claude Code, Codex, Cursor 등)가 처음 읽는 곳이다. 규칙의 정본은 `.agents/` 에 한 벌만 있고, 여기에는 요약과 "무엇을 하려면 어디를 읽나" 만 있다.

도구별 경로는 정본을 가리킨다: `CLAUDE.md` 는 이 파일을 import 하고, `.claude/skills` 는 `.agents/skills` 의 심볼릭 링크다. 스킬을 고칠 때는 `.agents/skills/` 실경로를 쓴다 — 심볼릭 링크 너머 경로는 `git add` 가 거부한다.

## 절대 규칙

어떤 도구를 쓰든 지킨다. 각 줄의 링크가 정본이다.

- **댓글 스레드 키(블로그가 보내는 글 경로)를 서버에서 가공하지 않는다** — 바꾸면 그 글의 댓글이 통째로 안 보인다. [SRV-01](.agents/skills/waline-server/SKILL.md#srv-01--댓글-경로)
- **비밀값(DB 접속 정보·JWT 키 등)은 Vercel 환경 변수에만 둔다** — 저장소는 공개다. [SRV-03](.agents/skills/waline-server/SKILL.md#srv-03--db-와-비밀값)
- **릴리스된 지 7일 안 된 의존성을 들이지 않는다** — 보안 수정만 예외다. [DEP-01](.agents/skills/dependencies/SKILL.md#dep-01--7일-쿨다운)
- **작업마다 최신 `origin/main` 에서 워크트리를 파고, 머지·배포가 끝나면 지운다** — 다른 에이전트 세션과 체크아웃을 나눠 쓰지 않는다. [GIT-02](.agents/skills/git-workflow/SKILL.md#git-02--작업마다-워크트리)
- **모든 변경은 브랜치 → PR, `ci-ok` 와 Vercel 미리보기 배포를 통과시킨다** — main 에 머지되면 바로 운영 배포다. [GIT-01](.agents/skills/git-workflow/SKILL.md#git-01--브랜치와-pr), [CI-01](.agents/skills/ci/SKILL.md#ci-01--필수-체크와-자동-머지)
- **검사가 실패하면 기준을 낮추지 말고 원인을 고친다** — [CI-02](.agents/skills/ci/SKILL.md#ci-02--실패는-원인을-고친다)

전체 목록: [불변식 카탈로그](.agents/invariants/INVARIANTS.md)

## 무엇을 하려면 어디를 읽나

| 하려는 일                                                                  | 읽을 정본                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------ |
| 서버 코드(`index.cjs`)·Vercel 설정(`vercel.json`)·DB 스키마를 바꾼다       | [waline-server](.agents/skills/waline-server/SKILL.md) |
| 의존성·pnpm·Node·Actions 버전을 바꾸거나 Renovate PR·`audit` 실패를 고친다 | [dependencies](.agents/skills/dependencies/SKILL.md)   |
| 워크플로를 바꾸거나 CI 실패를 고친다                                       | [ci](.agents/skills/ci/SKILL.md)                       |
| 워크트리·브랜치·커밋·PR 을 만들거나 정리한다                               | [git-workflow](.agents/skills/git-workflow/SKILL.md)   |

명령은 `package.json` 의 `scripts`, CI 구성은 `.github/workflows/ci.yml` 에서 바로 확인한다.
