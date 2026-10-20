const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-data.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'fivora-template.json'), 'utf8'));
const navigation = data.content.navigation;
const schema = manifest.editorSchema.sections.find(section => section.path === 'navigation');
assert.ok(schema, 'Navigation must have an editor schema');
assert.equal(navigation.categories.length, 6);
assert.equal(new Set(navigation.categories.map(category => category.id)).size, 6, 'Category IDs must be stable and unique');
function checkSchema(object, fields, prefix) {
  for (const [key, value] of Object.entries(object)) {
    const field = fields.find(field => field.key === key);
    assert.ok(field, `Missing editor control: ${prefix}.${key}`);
    if (Array.isArray(value)) for (const item of value) checkSchema(item, field.fields, `${prefix}.${key}[*]`);
  }
}
checkSchema(navigation, schema.fields, 'navigation');
for (const category of navigation.categories) {
  assert.ok(category.items.length > 0);
  assert.equal(new Set(category.items.map(item => item.id)).size, category.items.length);
  for (const item of category.items) {
    assert.ok(fs.existsSync(path.join(root, 'public', item.imageUrl)), `Missing preview image: ${item.imageUrl}`);
    assert.equal(item.url, '/#shop', 'Phase 1 links must use the existing collection, not unimplemented category pages');
    assert.ok(item.label.trim());
  }
  assert.equal(category.browseUrl, '/#shop');
}
const chrome = fs.readFileSync(path.join(root, 'src/components/SiteChrome.tsx'), 'utf8');
assert.match(chrome, /id:'about_us',label:'About',route:'\/about_us\/'/);
assert.match(chrome, /id:'contact',label:'Contact',route:'\/contact\/'/);
assert.match(chrome, /<Footer defaultLinks=\{navigation\}/);
assert.equal(data.project.slug, null, 'Do not restore starter catalog polling');
console.log('PASS: navigation schema coverage, stable IDs, all local preview assets, existing collection links, retained footer links and Local Lab configuration.');
