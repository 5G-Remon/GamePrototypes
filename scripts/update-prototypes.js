const fs = require('fs');
const path = require('path');

const prototypesDir = path.join(__dirname, '..', 'prototypes');

const isDir = (p) => fs.statSync(p).isDirectory();

const compareVersions = (a, b) => {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const prettify = (slug) =>
  slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const prototypes = fs.readdirSync(prototypesDir)
  .filter(name => isDir(path.join(prototypesDir, name)))
  .sort()
  .map(slug => {
    const prototypePath = path.join(prototypesDir, slug);
    const versions = fs.readdirSync(prototypePath)
      .filter(name => isDir(path.join(prototypePath, name)) && /^v\d/.test(name))
      .sort(compareVersions);

    return {
      name: prettify(slug),
      slug,
      versions: versions.map((v, i) => ({
        version: v,
        tag: i === versions.length - 1 ? 'latest' : ''
      }))
    };
  })
  .filter(g => g.versions.length > 0);

fs.writeFileSync(
  path.join(__dirname, '..', 'prototypes.json'),
  JSON.stringify(prototypes, null, 2) + '\n'
);