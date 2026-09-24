import fs from 'node:fs';
import path from 'node:path';

const dir = 'public/images';
fs.mkdirSync(dir, { recursive: true });

const bgs = ['#EAE3D5', '#E3DACA', '#EFE9DD', '#DDD3BF', '#E7DECF', '#DCCFB6'];
const inks = ['#111111', '#2A2723', '#3A352E'];
const gold = '#B08D57';

function ringSVG(bg, ink, variant) {
  const shapes = [
    `<circle cx="200" cy="170" r="70" fill="none" stroke="${ink}" stroke-width="3"/><rect x="178" y="82" width="44" height="30" rx="3" fill="none" stroke="${gold}" stroke-width="3"/>`,
    `<circle cx="200" cy="180" r="62" fill="none" stroke="${gold}" stroke-width="3"/><circle cx="200" cy="105" r="16" fill="none" stroke="${ink}" stroke-width="3"/>`,
    `<ellipse cx="200" cy="175" rx="70" ry="60" fill="none" stroke="${ink}" stroke-width="3"/><path d="M165 110 L235 110 L200 75 Z" fill="none" stroke="${gold}" stroke-width="3"/>`,
    `<circle cx="200" cy="175" r="66" fill="none" stroke="${ink}" stroke-width="2.5"/><circle cx="200" cy="175" r="52" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.5"/>`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520"><rect width="400" height="520" fill="${bg}"/>${shapes[variant % shapes.length]}<text x="200" y="360" font-family="Georgia, serif" font-size="26" letter-spacing="6" text-anchor="middle" fill="${ink}">VELORA</text><text x="200" y="388" font-family="Arial, sans-serif" font-size="11" letter-spacing="4" text-anchor="middle" fill="${ink}" opacity="0.6">EDIT · N°${String(variant + 1).padStart(2, '0')}</text><line x1="170" y1="410" x2="230" y2="410" stroke="${gold}" stroke-width="1.5"/></svg>`;
}

function chainSVG(bg, ink, variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520"><rect width="400" height="520" fill="${bg}"/><path d="M80 120 Q200 300 320 120" fill="none" stroke="${ink}" stroke-width="3"/><circle cx="200" cy="238" r="22" fill="none" stroke="${gold}" stroke-width="3"/><circle cx="200" cy="238" r="10" fill="none" stroke="${gold}" stroke-width="1.5"/><text x="200" y="360" font-family="Georgia, serif" font-size="26" letter-spacing="6" text-anchor="middle" fill="${ink}">VELORA</text><text x="200" y="388" font-family="Arial, sans-serif" font-size="11" letter-spacing="4" text-anchor="middle" fill="${ink}" opacity="0.6">EDIT · N°${String(variant + 1).padStart(2, '0')}</text><line x1="170" y1="410" x2="230" y2="410" stroke="${gold}" stroke-width="1.5"/></svg>`;
}

function hoopSVG(bg, ink, variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520"><rect width="400" height="520" fill="${bg}"/><circle cx="150" cy="200" r="48" fill="none" stroke="${ink}" stroke-width="3"/><circle cx="250" cy="200" r="48" fill="none" stroke="${gold}" stroke-width="3"/><text x="200" y="360" font-family="Georgia, serif" font-size="26" letter-spacing="6" text-anchor="middle" fill="${ink}">VELORA</text><text x="200" y="388" font-family="Arial, sans-serif" font-size="11" letter-spacing="4" text-anchor="middle" fill="${ink}" opacity="0.6">EDIT · N°${String(variant + 1).padStart(2, '0')}</text><line x1="170" y1="410" x2="230" y2="410" stroke="${gold}" stroke-width="1.5"/></svg>`;
}

for (let i = 0; i < 12; i++) {
  const bg = bgs[i % bgs.length];
  const ink = inks[i % inks.length];
  const kind = i % 3;
  const svg = kind === 0 ? ringSVG(bg, ink, i) : kind === 1 ? chainSVG(bg, ink, i) : hoopSVG(bg, ink, i);
  fs.writeFileSync(path.join(dir, `product-${String(i + 1).padStart(2, '0')}.svg`), svg);
}

// Hero — editorial still life: large arch + ring
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#ECE6D9"/><rect x="330" y="90" width="540" height="720" rx="270" fill="#E2D8C3"/><rect x="370" y="130" width="460" height="640" rx="230" fill="none" stroke="#B08D57" stroke-width="2" opacity="0.7"/><circle cx="600" cy="420" r="120" fill="none" stroke="#111111" stroke-width="5"/><rect x="562" y="258" width="76" height="52" rx="4" fill="none" stroke="#111111" stroke-width="5"/><circle cx="600" cy="420" r="96" fill="none" stroke="#111111" stroke-width="1.5" opacity="0.4"/><path d="M180 700 Q600 820 1020 700" fill="none" stroke="#B08D57" stroke-width="2"/><text x="600" y="800" font-family="Georgia, serif" font-size="34" letter-spacing="14" text-anchor="middle" fill="#111111">VELORA EDIT</text></svg>`;
fs.writeFileSync(path.join(dir, 'hero.svg'), hero);

// Collection edits — minimal arches/tones
const edits = ['under20', 'quiet', 'gold', 'silver', 'him', 'her', 'everyday', 'date', 'gift', 'new', 'value'];
edits.forEach((name, i) => {
  const bg = bgs[i % bgs.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><rect x="250" y="60" width="300" height="480" rx="150" fill="none" stroke="#111111" stroke-width="2.5"/><circle cx="400" cy="280" r="54" fill="none" stroke="${gold}" stroke-width="3"/><line x1="360" y1="470" x2="440" y2="470" stroke="${gold}" stroke-width="2"/><text x="400" y="520" font-family="Georgia, serif" font-size="24" letter-spacing="8" text-anchor="middle" fill="#111111">VELORA</text></svg>`;
  const names = { under20: 'edit-under20.svg', quiet: 'edit-quiet.svg', gold: 'edit-gold.svg', silver: 'edit-silver.svg', him: 'edit-him.svg', her: 'edit-her.svg', everyday: 'edit-everyday.svg', date: 'edit-date.svg', gift: 'edit-gift.svg', new: 'edit-new.svg', value: 'edit-value.svg' };
  fs.writeFileSync(path.join(dir, names[name]), svg);
});

// Journal covers
for (let i = 1; i <= 5; i++) {
  const bg = bgs[(i + 2) % bgs.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="${bg}"/><line x1="120" y1="120" x2="680" y2="120" stroke="#111111" stroke-width="1.5"/><line x1="120" y1="380" x2="680" y2="380" stroke="#111111" stroke-width="1.5"/><circle cx="400" cy="250" r="70" fill="none" stroke="${gold}" stroke-width="3"/><circle cx="400" cy="250" r="46" fill="none" stroke="#111111" stroke-width="1.5"/><text x="400" y="440" font-family="Georgia, serif" font-size="22" letter-spacing="6" text-anchor="middle" fill="#111111">JOURNAL · N°${i}</text></svg>`;
  fs.writeFileSync(path.join(dir, `journal-${i}.svg`), svg);
}

// OG default
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#111111"/><text x="600" y="290" font-family="Georgia, serif" font-size="96" letter-spacing="18" text-anchor="middle" fill="#F6F3EE">VELORA EDIT</text><text x="600" y="360" font-family="Arial, sans-serif" font-size="26" letter-spacing="6" text-anchor="middle" fill="#B08D57">CURATED JEWELRY · NOTHING EXCESSIVE</text><line x1="520" y1="400" x2="680" y2="400" stroke="#B08D57" stroke-width="2"/></svg>`;
fs.writeFileSync(path.join(dir, 'og-default.svg'), og);

console.log('images generated');
