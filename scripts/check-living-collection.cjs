const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const filename = path.resolve(__dirname, '../src/lib/living-room.ts');
const loaded = new Module(filename, module);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { isLivingProduct, productPhotos, productHref } = loaded.exports;
const data = require('../src/data/site-data.json');
const catalog = data.content.products;
const living = catalog.map((product, index) => ({ product, index })).filter(({ product }) => isLivingProduct(product));
assert.equal(living.length, 4);
for (const { product, index } of living) {
  const photos = productPhotos(product, index);
  assert.equal(photos.length, 3, `${product.name} must have three photos`);
  assert.equal(new Set(photos.map(photo => photo.src)).size, 3, 'Three distinct photo assets are required');
  for (const photo of photos) {
    assert.ok(fs.existsSync(path.join(__dirname, '../public', photo.src)), `Missing photo: ${photo.src}`);
    assert.ok(photo.path.startsWith(`products[${index}].`), 'Keep original catalog index for editing');
  }
  assert.equal(productHref(product.id), product.ctaUrl, 'Use the existing stable details route');
}
assert.equal(isLivingProduct(catalog.find(product => product.id === 'elio-table')), false, 'Do not relabel an office desk as living-room furniture');
assert.equal(productPhotos({}, 0).length, 0, 'Missing photography must not create fake gallery entries');
assert.equal(productPhotos({ imageUrl: '/one.jpg', gallery: ['/one.jpg', '/two.jpg'] }, 2).length, 2, 'Avoid duplicating the primary photo');
const manifest = require('../fivora-template.json');
assert.ok(manifest.pages.some(page => page.route === '/collections/living-room'));
assert.equal(manifest.editorSchema.sections.find(section => section.path === 'products').fields.find(field => field.key === 'gallery').itemField.type, 'image');
console.log('PASS: four living-room products, three distinct local photos each, valid editor bindings, stable details links and gallery schema.');
