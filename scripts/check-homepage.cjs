const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-data.json'),'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'fivora-template.json'),'utf8'));
const home = data.content.home;
const products = data.content.products;
const homeSchema = manifest.editorSchema.sections.find(section => section.path === 'home');
const productsSchema = manifest.editorSchema.sections.find(section => section.path === 'products');
function checkFields(value, fields, prefix) {
  for (const [key, item] of Object.entries(value)) {
    const field = fields.find(field => field.key === key);
    assert.ok(field, `Missing Inspector field: ${prefix}.${key}`);
    if (Array.isArray(item)) item.forEach(child => checkFields(child, field.fields, `${prefix}.${key}[*]`));
    else if (item && typeof item === 'object') checkFields(item, field.fields, `${prefix}.${key}`);
  }
}
checkFields(home, homeSchema.fields, 'home');
for (const product of products) checkFields(product, productsSchema.fields, 'products[*]');
assert.equal(new Set(products.map(item => item.id)).size, products.length, 'Catalog IDs must be unique');
assert.ok(products.some(item => item.homeCollection==='best-sellers'));
assert.ok(products.some(item => item.homeCollection==='new-arrivals'));
for (const item of [...products, ...home.categories, {imageUrl:home.look.imageUrl}]) {
  assert.ok(fs.existsSync(path.join(root,'public',item.imageUrl)), `Missing image ${item.imageUrl}`);
}
for (const product of products) {
  assert.equal(typeof product.price,'number');
  assert.ok(product.price >= 0);
  assert.equal(product.ctaUrl,`/products/detail/?id=${product.id}`);
}
for (const hotspot of home.look.hotspots) {
  assert.ok(products.some(product => product.id===hotspot.productId), `Dangling hotspot ${hotspot.id}`);
  for (const axis of ['x','y']) assert.ok(Number.isFinite(hotspot[axis]) && hotspot[axis]>=0 && hotspot[axis]<=100);
  assert.ok(hotspot.label.trim());
}
assert.match(home.sampleNote,/sample/i);
assert.equal(data.project.slug,null);
const source = fs.readFileSync(path.join(root,'src/components/ShopTheLook.tsx'),'utf8');
assert.ok(!/\bfetch\s*\(/.test(source),'Room preview must not introduce a backend');
assert.match(source,/String\(product.id\) === contentText\(selected.productId\)/,'Resolve hotspots by stable catalog ID');
assert.match(source,/index=\{productIndex\}/,'Preview bindings must use original catalog indices');
console.log('PASS: Home/catalog Inspector schema coverage, unique sample products, local images, stable links and hotspot references, valid coordinates, original catalog bindings and no backend.');
