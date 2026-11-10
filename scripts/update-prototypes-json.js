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

const jsonPath = path.join(__dirname, '..', 'json', 'prototypes.json');

const DATE_LINE = /^date:\s*(\d{4}-\d{2}-\d{2})\s*$/i;

const readChangesFile = (versionPath) => {
  const file = path.join(versionPath, 'changes.txt');
  if (!fs.existsSync(file)) return null;
  let date = '';
  const changes = [];
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const m = line.match(DATE_LINE);
      if (m) date = m[1];
      else changes.push(line.replace(/^[-*]\s+/, '').trim());
    });
  return { date, changes };
};

const isVersionDir = (dir, name) =>
  isDir(path.join(dir, name)) && /^v\d+(\.\d+)*$/.test(name);

const scan = (dir, rel) => {
  const names = fs.readdirSync(dir).filter(n => isDir(path.join(dir, n))).sort();
  const versions = names.filter(n => isVersionDir(dir, n)).sort(compareVersions);

  if (versions.length > 0) {
    const slug = path.basename(dir);
    return [{
      name: prettify(slug),
      slug,
      group: rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '',
      path: rel,
      versions: versions.map((v, i) => {
        const info = readChangesFile(path.join(dir, v));
        return {
          version: v,
          date: info ? info.date : '',
          tag: i === versions.length - 1 ? 'latest' : '',
          changes: info ? info.changes : []
        };
      })
    }];
  }

  return names.flatMap(n => scan(path.join(dir, n), rel ? `${rel}/${n}` : n));
};

const prototypes = fs.readdirSync(prototypesDir)
  .filter(n => isDir(path.join(prototypesDir, n)))
  .sort()
  .flatMap(n => scan(path.join(prototypesDir, n), n));

fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(
  jsonPath,
  JSON.stringify(prototypes, null, 2) + '\n'
);
