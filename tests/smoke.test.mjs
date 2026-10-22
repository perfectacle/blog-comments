// Boots the real server against a PostgreSQL loaded with waline.pgsql and walks the path the blog uses:
// post a comment, then list the thread. Dependency updates auto-merge on green, so this is what stops one
// that hangs the boot or breaks the comment API.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';

const require = createRequire(import.meta.url);

// Same shape as the blog's post paths, unique per run so reruns against one database do not see old comments.
const path = `/2022/06/06/smoke-${Date.now()}/`;
let base;
let server;

before(async () => {
  server = createServer(require('../index.cjs'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

const post = async nick => {
  const res = await fetch(`${base}/api/comment`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ comment: `smoke from ${nick}`, nick, url: path }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.errno, 0, body.errmsg);
};

test('anonymous comments are stored under the post path with a per-commenter avatar', async () => {
  await post('alice');
  await post('bob');

  const res = await fetch(`${base}/api/comment?path=${encodeURIComponent(path)}`);
  assert.equal(res.status, 200);
  const { errno, data } = await res.json();
  assert.equal(errno, 0);

  const comments = data.data;
  assert.equal(comments.length, 2);
  for (const { avatar } of comments) assert.match(avatar, /^data:image\/svg\+xml/);
  assert.notEqual(comments[0].avatar, comments[1].avatar);
});
