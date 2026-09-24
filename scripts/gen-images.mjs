import fs from 'node:fs';
import path from 'node:path';

// VELORA EDIT image generator — elegant local placeholder imagery.
// These are mock catalog visuals for development, NOT AliExpress product images.
// Run: node scripts/gen-images.mjs  (reads src/content/products.json)

const dir = 'public/images';
fs.mkdirSync(dir, { recursive: true });

const bgs = ['#EAE3D5', '#E3DACA', '#EFE9DD', '#DDD3BF', '#E7DECF', '#DCCFB6', '#E5DCCB', '#D8CDB4'];
const inks = ['#111111', '#2A2723', '#3A352E'];
const gold = '#A88455';
const silverInk = '#6E6A63';

// Deterministic pseudo-random from string (stable across runs)
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Motif per category, varied by seed: rotation, scale, accent placement, band count
function motif(category, color, seed) {
  const metal = color === 'silver' ? silverInk : color === 'black' ? '#111111' : gold;
  const detail = color === 'silver' ? '#9a958c' : color === 'black' ? '#4a463f' : '#c2a166';
  const v = seed % 5;
  const rot = (seed % 24) - 12;
  const w = 2.5 + (seed % 3) * 0.5;
  const open = `<g transform="rotate(${rot} 200 200)">`;
  const close = `</g>`;
  let shape = '';
  if (category === 'rings') {
    const r = 58 + (seed % 4) * 6;
    const inner = v % 2 === 0
      ? `<circle cx="200" cy="200" r="${r - 16}" fill="none" stroke="${detail}" stroke-width="1.2" opacity="0.6"/>`
      : `<rect x="${200 - 22}" y="${200 - r - 34}" width="44" height="30" rx="3" fill="none" stroke="${metal}" stroke-width="${w}"/>`;
    const top = v === 3 ? `<circle cx="200" cy="${200 - r}" r="13" fill="none" stroke="${metal}" stroke-width="${w}"/>` : v === 4 ? `<path d="M178 ${200 - r} L222 ${200 - r} L200 ${200 - r - 30} Z" fill="none" stroke="${metal}" stroke-width="${w}"/>` : '';
    shape = `<circle cx="200" cy="200" r="${r}" fill="none" stroke="${metal}" stroke-width="${w}"/>${inner}${top}`;
  } else if (category === 'necklaces' || category === 'chains') {
    const sag = 200 + (seed % 5) * 14;
    const pendant = v === 0 ? `<circle cx="200" cy="${sag}" r="20" fill="none" stroke="${metal}" stroke-width="${w}"/>`
      : v === 1 ? `<rect x="186" y="${sag - 14}" width="28" height="34" rx="2" fill="none" stroke="${metal}" stroke-width="${w}"/>`
      : v === 2 ? `<circle cx="200" cy="${sag}" r="8" fill="${metal}" opacity="0.85"/>`
      : v === 3 ? `<path d="M200 ${sag - 18} L214 ${sag + 10} L200 ${sag + 22} L186 ${sag + 10} Z" fill="none" stroke="${metal}" stroke-width="${w}"/>`
      : '';
    shape = `<path d="M70 110 Q200 ${sag + 60} 330 110" fill="none" stroke="${detail}" stroke-width="${w}"/>${pendant}`;
  } else if (category === 'earrings') {
    const dx = 34 + (seed % 3) * 8;
    const r = 34 + (seed % 3) * 7;
    const right = v % 2 === 0
      ? `<circle cx="${200 + dx}" cy="200" r="${r}" fill="none" stroke="${metal}" stroke-width="${w}"/>`
      : `<line x1="${200 + dx}" y1="${200 - r}" x2="${200 + dx}" y2="${200 + r}" stroke="${metal}" stroke-width="${w}"/><circle cx="${200 + dx}" cy="${200 + r + 12}" r="9" fill="none" stroke="${metal}" stroke-width="${w}"/>`;
    shape = `<circle cx="${200 - dx}" cy="200" r="${r}" fill="none" stroke="${detail}" stroke-width="${w}"/>${right}`;
  } else { // bracelets
    const rx = 88 + (seed % 3) * 8;
    const inner = v % 2 === 0 ? `<ellipse cx="200" cy="200" rx="${rx - 18}" ry="46" fill="none" stroke="${detail}" stroke-width="1.2" opacity="0.6"/>` : '';
    const beads = v === 4 ? `<circle cx="${200 - rx}" cy="200" r="7" fill="${metal}"/><circle cx="${200 + rx}" cy="200" r="7" fill="${metal}"/>` : '';
    shape = `<ellipse cx="200" cy="200" rx="${rx}" ry="58" fill="none" stroke="${metal}" stroke-width="${w}"/>${inner}${beads}`;
  }
  return open + shape + close;
}

function frameMain(bg, ink, num, label) {
  return `<rect width="400" height="520" fill="${bg}"/>`
    + `<rect x="26" y="26" width="348" height="348" fill="none" stroke="${ink}" stroke-width="1" opacity="0.25"/>`
    + `${label}`
    + `<text x="200" y="432" font-family="Georgia, serif" font-size="24" letter-spacing="6" text-anchor="middle" fill="${ink}">VELORA</text>`
    + `<text x="200" y="458" font-family="Arial, sans-serif" font-size="10" letter-spacing="4" text-anchor="middle" fill="${ink}" opacity="0.6">EDIT · N°${num}</text>`
    + `<line x1="172" y1="476" x2="228" y2="476" stroke="${gold}" stroke-width="1.5"/>`;
}

function frameAlt(bg, ink, num, motifSvg) {
  // Detail view: zoomed crop of the motif on a deeper tone
  return `<rect width="400" height="520" fill="${bg}"/>`
    + `<g transform="translate(-70 -60) scale(1.35)">${motifSvg}</g>`
    + `<rect x="0" y="0" width="400" height="520" fill="none" stroke="${ink}" stroke-width="1" opacity="0.2"/>`
    + `<text x="200" y="470" font-family="Arial, sans-serif" font-size="10" letter-spacing="4" text-anchor="middle" fill="${ink}" opacity="0.55">DETAIL · N°${num}</text>`;
}

// ---- Per-product imagery (unique per record) ----
let products = [];
try { products = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8')); } catch { console.error('run node scripts/seed.mjs first'); process.exit(1); }
for (const p of products) {
  const num = p.id.replace('seed-', '');
  const s = hash(p.slug);
  const bg = bgs[s % bgs.length];
  const ink = inks[s % inks.length];
  const m = motif(p.category, p.color || 'gold', s);
  const main = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">${frameMain(bg, ink, num, `<g transform="translate(0 20)">${m}</g>`)}</svg>`;
  const altBg = bgs[(s + 3) % bgs.length];
  const alt = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">${frameAlt(altBg, ink, num, m)}</svg>`;
  fs.writeFileSync(path.join(dir, `p-${num}-main.svg`), main);
  fs.writeFileSync(path.join(dir, `p-${num}-alt.svg`), alt);
}

// ---- Hero (wide editorial) ----
const heroWide = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#ECE5D6"/><rect x="560" y="70" width="480" height="760" rx="240" fill="#E0D4BC"/><rect x="596" y="106" width="408" height="688" rx="204" fill="none" stroke="${gold}" stroke-width="2" opacity="0.7"/><circle cx="800" cy="400" r="110" fill="none" stroke="#111111" stroke-width="5"/><circle cx="800" cy="400" r="88" fill="none" stroke="#111111" stroke-width="1.5" opacity="0.4"/><path d="M120 720 Q800 840 1480 720" fill="none" stroke="${gold}" stroke-width="2"/><text x="800" y="800" font-family="Georgia, serif" font-size="36" letter-spacing="16" text-anchor="middle" fill="#111111">VELORA EDIT</text><text x="200" y="200" font-family="Georgia, serif" font-style="italic" font-size="30" fill="#111111" opacity="0.55">N°01 — Quiet</text><text x="1400" y="700" font-family="Georgia, serif" font-style="italic" font-size="30" text-anchor="end" fill="#111111" opacity="0.55">luxury</text></svg>`;
fs.writeFileSync(path.join(dir, 'hero-wide.svg'), heroWide);

// Keep legacy hero filename working
if (!fs.existsSync(path.join(dir, 'hero.svg'))) {
  fs.writeFileSync(path.join(dir, 'hero.svg'), heroWide);
}

// ---- New collection covers ----
for (const [name, tone] of [['edit-arrivals', '#E7DECF'], ['edit-minimal', '#EFE9DD'], ['edit-unisex', '#DDD3BF'], ['edit-statement', '#E3DACA'], ['edit-signature', '#E5DCCB']]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${tone}"/><rect x="250" y="60" width="300" height="480" rx="150" fill="none" stroke="#111111" stroke-width="2.5"/><circle cx="400" cy="280" r="54" fill="none" stroke="${gold}" stroke-width="3"/><circle cx="400" cy="280" r="34" fill="none" stroke="#111111" stroke-width="1.2" opacity="0.5"/><line x1="360" y1="470" x2="440" y2="470" stroke="${gold}" stroke-width="2"/><text x="400" y="520" font-family="Georgia, serif" font-size="24" letter-spacing="8" text-anchor="middle" fill="#111111">VELORA</text></svg>`;
  fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
}

// ---- Founder portraits (abstract editorial placeholders — not photographs) ----
function founderPortrait(accentBg, initial) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 760"><rect width="600" height="760" fill="${accentBg}"/><rect x="120" y="60" width="360" height="560" rx="180" fill="#EFE9DD"/><circle cx="300" cy="300" r="86" fill="none" stroke="#111111" stroke-width="3"/><path d="M180 620 Q300 470 420 620" fill="none" stroke="#111111" stroke-width="3"/><circle cx="300" cy="300" r="64" fill="none" stroke="${gold}" stroke-width="2" opacity="0.7"/><text x="300" y="690" font-family="Georgia, serif" font-size="34" letter-spacing="10" text-anchor="middle" fill="#111111">${initial}</text></svg>`;
}
fs.writeFileSync(path.join(dir, 'founder-sanae.svg'), founderPortrait('#E3DACA', 'S'));
fs.writeFileSync(path.join(dir, 'founder-salma.svg'), founderPortrait('#DCCFB6', 'S'));

console.log(`images generated for ${products.length} products + covers + founders`);
