// Writes api/avatars.json: the animal faces from Noto Emoji that the server picks commenter avatars from. The full
// icon set is 25 MB, too much to parse on every cold start, so only these are copied out.
// Reordering, adding or removing names reassigns every commenter's icon, old comments included.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const names = [
  'dog-face',
  'cat-face',
  'rabbit-face',
  'fox',
  'bear',
  'panda',
  'koala',
  'tiger-face',
  'lion',
  'frog',
  'hamster',
  'mouse-face',
  'pig-face',
  'cow-face',
  'monkey-face',
  'penguin',
  'baby-chick',
  'owl',
  'unicorn',
  'hedgehog',
  'otter',
  'sloth',
  'polar-bear',
  'hatching-chick',
];

const set = JSON.parse(await readFile(require.resolve('@iconify-json/noto/icons.json'), 'utf8'));
const { version } = JSON.parse(await readFile(require.resolve('@iconify-json/noto/package.json'), 'utf8'));
const icons = names.map(name => {
  const icon = set.icons[name];
  if (!icon) throw new Error(`@iconify-json/noto has no icon named ${name}`);
  return { name, body: icon.body };
});

const out = {
  source: `Noto Emoji (https://github.com/googlefonts/noto-emoji) via @iconify-json/noto ${version}`,
  license: 'Apache-2.0',
  size: set.width,
  icons,
};
await writeFile(new URL('../api/avatars.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
