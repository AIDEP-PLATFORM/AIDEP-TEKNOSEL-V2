const pptxgen = require('pptxgenjs');
const path = require('path');

// 1550px / 96dpi = 16.145833"   800px / 96dpi = 8.333333"
const W = 1550 / 96;   // 16.145833...
const H = 800  / 96;   // 8.333333...

const pres = new pptxgen();

pres.defineLayout({ name: 'POSTER', width: W, height: H });
pres.layout = 'POSTER';
pres.author = 'AIDEP';
pres.title  = 'AIDEP Afis';

const slide = pres.addSlide();

slide.addImage({
  path: path.resolve(__dirname, 'AIDEP-Afis-1550x800.png'),
  x: 0, y: 0,
  w: W, h: H,
});

const out = path.resolve(__dirname, 'AIDEP-Afis-1550x800.pptx');
pres.writeFile({ fileName: out }).then(() => {
  console.log('✔ PPTX:', out);
});
