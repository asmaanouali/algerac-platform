const fs = require('fs');
const path = require('path');
const root = 'client/src';
const files = [];
const locales = ['fr', 'en', 'ar'];

function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const n of fs.readdirSync(d)) {
        const p = path.join(d, n);
        const s = fs.statSync(p);
        if (s.isDirectory()) walk(p);
        else if (/\.(ts|tsx|js|jsx)$/.test(n)) files.push(p);
    }
}

walk(root);

const used = new Set();
for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    const re = /\bt\(\s*(['"`])([^'"`$]+)\1/g;
    let m;
    while ((m = re.exec(c))) {
        used.add(m[2]);
    }
}

function flatten(obj, p = '', out = {}) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const k of Object.keys(obj)) {
            const np = p ? (p + '.' + k) : k;
            flatten(obj[k], np, out);
        }
    } else if (p) {
        out[p] = obj;
    }
    return out;
}

console.log('USED_KEYS ' + used.size);

let hasMissing = false;

for (const l of locales) {
    const lp = path.join('client/src/locales', l + '.json');
    let subData = {};
    if (fs.existsSync(lp)) {
        try {
            subData = flatten(JSON.parse(fs.readFileSync(lp, 'utf8')));
        } catch (e) {}
    }
    const missing = Array.from(used).filter(k => !(k in subData)).sort();
    if (missing.length > 0) hasMissing = true;
    console.log('MISSING_' + l.toUpperCase() + ' ' + missing.length);
    for (const k of missing) {
        console.log(k);
    }
}

if (hasMissing) {
    process.exitCode = 1;
}
