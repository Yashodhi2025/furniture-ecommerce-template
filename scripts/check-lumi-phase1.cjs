const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-data.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'fivora-template.json'), 'utf8'));
assert.equal(data.content.common.websiteTitle, 'LUMI LIVING');
assert.equal(data.project.id, null);
assert.equal(data.project.slug, null);
assert.equal(data.siteInstance.slug, null);
assert.equal(data.api.catalogUrl, null);
assert.equal(data.api.baseUrl, null);
assert.equal(data.content.home.categories.length, 5);
assert.equal(data.content.products.length, 4);
for (const item of [...data.content.home.categories, ...data.content.products]) {
  assert.ok(fs.existsSync(path.join(root, 'public', item.imageUrl)), item.imageUrl);
}
for (const item of data.content.products) {
  assert.equal(typeof item.price, 'number');
  assert.equal(item.currency, 'LKR');
  assert.ok(item.ctaUrl.startsWith('/products/detail/?id='));
}
const homeSchema = manifest.editorSchema.sections.find(section => section.path === 'home');
for (const key of Object.keys(data.content.home)) {
  assert.ok(homeSchema.fields.some(field => field.key === key), key);
}
assert.equal(manifest.siteDataFile, 'src/data/site-data.json');
assert.equal(manifest.outputDirectory, 'out');
const newsletter = fs.readFileSync(path.join(root, 'src/components/NewsletterSection.tsx'), 'utf8');
assert.ok(!/\bfetch\s*\(/.test(newsletter));
assert.ok(data.content.home.newsletterPreviewMessage.includes('not been sent or saved'));
console.log('PASS: LUMI data/schema, images, numeric prices, stable links, local-only configuration and newsletter boundary.');
