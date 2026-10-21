# Living Room collection

Open `/collections/living-room/`. The homepage Living Room tile and the navbar's Living Room menu link here. Category links support `?category=Chairs`, `?category=Sofas` and `?category=Storage`. Categories with no matching catalog products show a resettable empty state.

The reference informed the spacious heading, compact filter/sort controls, four-column desktop grid, rounded square photographs and centered product names. The existing LUMI LIVING navbar and footer are retained. Mobile uses two columns, with one column on very narrow screens.

Each of the four existing living-room sample products has three distinct photos: its original primary image and two additional generated demo views. Photo arrows and thumbnail buttons work independently from the product link. Clicking the main photo or name opens `/products/detail/?id=PRODUCT_ID`.

The product page uses Deneb's `PlatformProductDetail` resolver with a custom gallery renderer. URL parsing, catalog lookup and missing-product handling remain with Deneb. Products without additional gallery images retain their original Deneb details renderer. Original catalog indices are retained in editor bindings after sorting/filtering. The additional images are editable through the `gallery` image list in the manifest.

Category and maximum-price filters, a dynamic count, sorting, keyboard modal focus trapping, Escape and outside-click dismissal are implemented. No dependencies or backend services were added.

Verification commands:

- `npm run build`
- `node scripts/check-homepage.cjs`
- `node scripts/check-navbar.cjs`
- `node scripts/check-living-collection.cjs`
- `node scripts/check-living-browser.cjs` — runs headless Chrome against `out/`, follows a real card link, exercises all three photos and checks desktop/mobile layouts. Set `CHROME_PATH` if Chrome is installed elsewhere. Profiles and screenshots are saved under ignored `.next/`.

Generated assets and their prompts are recorded in [docs/living-room-assets.json](docs/living-room-assets.json). Eight additional photos were created using the built-in imagegen tool, based on this project's existing product references, then encoded as WebP without changing their composition. The eight files total approximately 846 KB and are saved in `public/images/products/`. They are illustrative sample views, not verified merchant product photographs.
