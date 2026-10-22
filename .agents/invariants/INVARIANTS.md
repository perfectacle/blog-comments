# 불변식 카탈로그

이 저장소가 지키는 규칙의 목록이다. 이 파일에는 규칙의 요지와 **소유자**(규칙 본문이 있는 스킬의 절)만 있다. 본문·이유·예외는 소유자에서 읽는다. 규칙을 바꿀 때는 소유자 한 곳만 고치고, 이 표의 요지가 달라졌으면 이 줄도 고친다.

## 댓글 서버

| ID     | 요지                                                                                   | 소유자                                                                         |
| ------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| SRV-01 | 댓글은 블로그가 보내는 글 경로(`/2022/06/06/slug/`)로 묶인다. 서버에서 가공하지 않는다 | [waline-server §SRV-01](../skills/waline-server/SKILL.md#srv-01--댓글-경로)    |
| SRV-02 | 아바타 시드(이메일, 없으면 닉네임)를 바꾸면 모든 댓글의 아이콘이 바뀐다                | [waline-server §SRV-02](../skills/waline-server/SKILL.md#srv-02--아바타-시드)  |
| SRV-03 | `waline.pgsql` 은 Waline 공식 스키마 사본. 비밀값은 Vercel 환경 변수에만               | [waline-server §SRV-03](../skills/waline-server/SKILL.md#srv-03--db-와-비밀값) |

## 의존성·CI·git

| ID     | 요지                                                                        | 소유자                                                                            |
| ------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| DEP-01 | 릴리스된 지 7일 지난 버전만 쓴다(보안 수정만 예외)                          | [dependencies §DEP-01](../skills/dependencies/SKILL.md#dep-01--7일-쿨다운)        |
| DEP-02 | 의존성을 바꾸면 lockfile 과 `pnpm install --frozen-lockfile` 이 맞아야 한다 | [dependencies §DEP-02](../skills/dependencies/SKILL.md#dep-02--lockfile)          |
| DEP-03 | `audit` 예외는 실행되지 않는 코드의 advisory 에만, 이유와 함께              | [dependencies §DEP-03](../skills/dependencies/SKILL.md#dep-03--audit-예외)        |
| CI-01  | main 은 `ci-ok` 와 Vercel 미리보기 통과가 필수, 통과한 PR 은 자동 머지      | [ci §CI-01](../skills/ci/SKILL.md#ci-01--필수-체크와-자동-머지)                   |
| CI-02  | 실패하면 기준을 낮추지 말고 원인을 고친다                                   | [ci §CI-02](../skills/ci/SKILL.md#ci-02--실패는-원인을-고친다)                    |
| GIT-01 | 모든 변경은 브랜치 → PR, 머지 전 로컬 검증                                  | [git-workflow §GIT-01](../skills/git-workflow/SKILL.md#git-01--브랜치와-pr)       |
| GIT-02 | 작업마다 최신 `origin/main` 에서 워크트리를 파고, 머지·배포가 끝나면 지운다 | [git-workflow §GIT-02](../skills/git-workflow/SKILL.md#git-02--작업마다-워크트리) |
