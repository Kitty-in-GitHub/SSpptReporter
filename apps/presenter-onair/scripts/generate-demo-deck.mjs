import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/decks/demo');
fs.mkdirSync(outDir, { recursive: true });

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);

for (let pageIndex = 1; pageIndex <= 4; pageIndex += 1) {
  const page = doc.addPage([1280, 720]);
  page.drawText(`SSreporter Demo / Slide ${pageIndex}`, {
    x: 72,
    y: 400,
    size: 42,
    font,
    color: rgb(0.15, 0.35, 0.7),
  });
  page.drawText('Office -> PDF (static slides for Present mode)', {
    x: 72,
    y: 330,
    size: 22,
    font,
  });
}

fs.writeFileSync(path.join(outDir, 'slides.pdf'), await doc.save());
fs.writeFileSync(
  path.join(outDir, 'deck.json'),
  `${JSON.stringify(
    {
      id: 'demo',
      title: '答辩示例',
      slideSource: {
        type: 'pdf',
        url: '/decks/demo/slides.pdf',
      },
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${outDir}`);
