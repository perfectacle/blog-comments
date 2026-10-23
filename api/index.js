const { createHash } = require('node:crypto');

const Application = require('@waline/vercel');

const avatars = require('./avatars.json');

const backgrounds = ['#b6e3f4', '#c0aede', '#d1d4f9', '#ffd5dc', '#ffdfbf'];

// Waline calls this for every comment it returns (a user's own `avatar` takes precedence), so the icon is never
// stored and changing it here restyles existing comments too. Most comments carry no email (they came from Disqus
// or were left anonymously), so the default would hash an empty string and give everyone the same icon; seeding by
// email, else nickname, gives each commenter a stable icon of their own.
// The SVG is inlined so a page with many comments makes no extra requests.
const avatarUrl = ({ mail, nick }) => {
  const email = String(mail || '')
    .trim()
    .toLowerCase();
  const id = email || String(nick || '').trim();
  // Hashed so the email never appears in the response.
  const hash = createHash('sha256').update(id).digest();
  const { body } = avatars.icons[hash.readUInt32BE(0) % avatars.icons.length];
  const background = backgrounds[hash.readUInt32BE(4) % backgrounds.length];
  const { size } = avatars;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${background}"/>` +
    // Scaled so the corners of the square icon still fall inside the circle.
    `<g transform="translate(${size * 0.16} ${size * 0.16}) scale(0.68)">${body}</g></svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

module.exports = Application({
  plugins: [],
  avatarUrl,
});
