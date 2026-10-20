# LUMI LIVING — Phase 1

Local Home page UI and Fivora editability. This is a demonstration furniture
collection, not a real merchant catalog. Product names, prices, and descriptions
are sample content. Stock photographs are illustrative, not verified product photos.

## Reused Deneb UI

Navbar, Footer, EditableSection, EditableText, EditableImage, EditableCard,
EditableDialog, SiteDataProvider, useProducts. FurnitureProductCard composes those
primitives with explicit collection paths because packaged ProductCard 2.0.125
uses fallback field names that fail this template's strict probe contract.
Actions place their URL marker on the visible anchor and the label on its nested
EditableText, following the current validator's contract (no hidden URL markers).
NewsletterSection only composes the existing editable primitives and an HTML form.

## Editing

- Home copy: `content.home`; brand/footer: `content.common`.
- Categories: `content.home.categories`; values: `content.home.features`.
- Products: `content.products`, independent from presentation. Numeric LKR prices.
- Matching fields are declared in `fivora-template.json`; configuration-only
  values are listed in `visualEditing.controlOnlyPaths`.
- Existing section, card and text style targets are supplied by Deneb primitives.
  Styles persist under the existing root `styles` tree. Home CSS uses Deneb
  typography variables so saved text overrides can apply.
- Local Lab: `npm run lab`; test both populated and empty collections, replace an
  image, edit text/price, adjust section background/spacing, save and reload.

## Phase boundaries

- Shop/category navigation goes to `/#shop`, the Home featured collection.
  Categories do not filter products yet. A full Shop route is future work.
- Product links use the existing stable `/products/detail/?id=...` route.
- Cart opens an explanatory Phase 1 dialog; no orders, totals, checkout or payments.
- Newsletter validates an email locally and explicitly reports that nothing was
  sent or stored. No network requests, subscribers, or claimed successful sign-up.
- Existing Contact page and submission handler are unchanged. No backend added.
- About/Services layouts remain starter layouts; their demo text is rebranded.

## Catalog 404 cause and fix

The copied `project.id/slug`, `siteInstance.slug` and `api.catalogUrl` identified
the unrelated `deneb-portfolio-showcase` merchant. Deneb 2.0.125's provider uses
these values to derive a live endpoint (including a localhost rewrite), and
retries failed requests. The unassigned template now has null platform identity
and API endpoints. With no candidate slug it uses local content and does not
start catalog hydration. Do not replace these with another fabricated merchant ID.
When Fivora assigns a real identity, the unchanged provider and catalog hooks
can receive the platform's live data normally. No dependency code is patched.

If a previously opened standalone preview still fetches the old slug, refresh it
and clear only this template's stale preview session storage. The connected
portal may also need its saved data refreshed from the updated JSON.

## Assets

Local JPGs sourced from images.unsplash.com (photo IDs below), downloaded for a
self-contained preview. Replace with merchant-owned, accurate product photography
before using this as a real store.

- living-room: photo-1600210492486-724fe5c67fb0
- sofa: photo-1555041469-a586c61ea9bc
- chair: photo-1567538096630-e0c55bd6374c
- table: photo-1499933374294-4584851497cc
- bed: photo-1505693416388-ac5ce068fe85
- storage: photo-1595428774223-ef52624120d2
- story: photo-1616486338812-3dadae4b4ace

## Checks

Stop Local Lab/dev before running production checks in this directory, because
Next.js dev and production builds share `.next`. Verification during this task
uses an isolated copy with the same installed dependencies, preserving the
original Next config and `out` export convention.

`npx tsc --noEmit`, `npm run build`, `npm run validate`.
No changes to install/build/validate/zip scripts, static export, or Lab integration.
