// Build icons/camp.svg from the DeLorean photo: frame on the car, embed as a
// data URI in the rounded tile, and apply a light "less real" grade + theme wash.
// Usage: node scripts/build-photo-icon.mjs [sx] [sy] [S]
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "icons/delorean-icon.jpg");

// source crop square (in the 1320x887 photo) mapped onto the 128 tile
const sx = Number(process.argv[2] ?? 170);
const sy = Number(process.argv[3] ?? 90);
const S  = Number(process.argv[4] ?? 780);
const IMG_W = 1320, IMG_H = 887;

const scale = 128 / S;
const w = (IMG_W * scale).toFixed(2);
const h = (IMG_H * scale).toFixed(2);
const x = (-sx * scale).toFixed(2);
const y = (-sy * scale).toFixed(2);

const b64 = (await readFile(src)).toString("base64");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <clipPath id="tile"><rect width="128" height="128" rx="28"/></clipPath>
    <linearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a6fd6"/><stop offset="1" stop-color="#3a2767"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.46" r="0.74">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset=".72" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#190f2e" stop-opacity=".55"/>
    </radialGradient>
    <filter id="grade" color-interpolation-filters="sRGB">
      <feColorMatrix type="saturate" values="0.85"/>
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1"/>
        <feFuncG type="discrete" tableValues="0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1"/>
        <feFuncB type="discrete" tableValues="0 .11 .22 .33 .44 .55 .64 .74 .84 .92 1"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <g clip-path="url(#tile)">
    <image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"
           filter="url(#grade)" href="data:image/jpeg;base64,${b64}"/>
    <rect width="128" height="128" fill="url(#wash)" opacity=".2" style="mix-blend-mode:soft-light"/>
    <rect width="128" height="128" fill="#5b3fa6" opacity=".08" style="mix-blend-mode:overlay"/>
    <rect width="128" height="128" fill="url(#vig)"/>
  </g>
</svg>
`;

await writeFile(resolve(root, "icons/camp.svg"), svg);
console.log(`wrote icons/camp.svg  crop sx=${sx} sy=${sy} S=${S}`);
