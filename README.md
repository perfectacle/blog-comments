# blog-comments

[perfectacle.github.io](https://perfectacle.github.io) 의 댓글 서버. [Waline](https://waline.js.org) 을 Vercel 에서 돌리고, 댓글은 PostgreSQL 에 저장한다. PR 을 올리면 Vercel 이 미리보기를 만들고, `main` 에 머지되면 운영(https://blog-comments-perfectacle.vercel.app)에 배포한다.

Waline 기본 동작에서 바꾼 것은 아바타 하나다. 이메일이 없는 옛 댓글(Disqus 이관분, 익명 댓글)도 사람마다 다른 아이콘이 나오게 이메일, 없으면 닉네임으로 Noto Emoji 동물 아이콘 하나를 고른다(`api/index.js`). 아이콘 SVG 는 `scripts/build-avatars.mjs` 가 `@iconify-json/noto` 에서 뽑아 `api/avatars.json` 에 넣는다(Apache-2.0).

## 로컬 실행

Node 는 `.node-version`, pnpm 은 `package.json` 의 `packageManager` 에 고정된 버전을 쓴다(`corepack enable pnpm` 으로 활성화).

```sh
pnpm install
docker run -d --name waline-db -e POSTGRES_DB=waline -e POSTGRES_PASSWORD=waline -p 55432:5432 postgres:17-alpine
docker exec -i waline-db psql -U postgres -d waline < waline.pgsql
PG_HOST=127.0.0.1 PG_PORT=55432 PG_DB=waline PG_USER=postgres PG_PASSWORD=waline AKISMET_KEY=false IPQPS=0 pnpm test
```

작업 규칙은 [AGENTS.md](AGENTS.md) 에 있다.
