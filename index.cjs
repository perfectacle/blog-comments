const { createHash } = require('node:crypto');

const Application = require('@waline/vercel');

// DiceBear is ESM-only. Requiring it at the top makes the Waline (thinkjs) boot hang, so it is imported on first use.
let dicebear;
const loadDicebear = () => {
  dicebear ??= Promise.all([import('@dicebear/core'), import('@dicebear/fun-emoji')]);
  return dicebear;
};

// Waline calls this for every comment it returns (a user's own `avatar` takes precedence), so the icon is never
// stored and changing it here restyles existing comments too. Most comments carry no email (they came from Disqus
// or were left anonymously), so the default would hash an empty string and give everyone the same icon; seeding by
// email, else nickname, gives each commenter a stable icon of their own.
// The SVG is inlined because the hosted DiceBear API rate-limits a page that requests many icons at once.
const avatarUrl = async ({ mail, nick }) => {
  const [{ createAvatar }, funEmoji] = await loadDicebear();
  const email = String(mail || '')
    .trim()
    .toLowerCase();
  const id = email || String(nick || '').trim();

  return createAvatar(funEmoji, {
    // Hashed so the email never appears in the response.
    seed: createHash('sha256').update(id).digest('hex'),
    radius: 50,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  }).toDataUri();
};

module.exports = Application({
  plugins: [],
  avatarUrl,
});
