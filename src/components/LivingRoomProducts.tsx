'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { EditableText } from '@deneb-ui/ui';
import { useProducts, useSiteData, contentObject, contentText } from '@/lib/siteDataContext';
import { formatPrice, isLivingProduct } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import FurnitureProductCard from './FurnitureProductCard';
import CollectionHero from './CollectionHero';
import { collections, matchesCollectionFilter, saleDiscountPercent, saleOriginalPrice, type CollectionId } from '@/lib/collections';
import './SaleCollection.css';

function isFlagOn(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value) !== 'false';
}

function clampNum(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(num) || value === '' || value === null || value === undefined) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

export default function LivingRoomProducts({ collectionId = 'living-room' }: { collectionId?: CollectionId }) {
  const products = useProducts();
  const collection = collections[collectionId];
  const siteData = useSiteData();
  const heading = contentObject(contentObject(contentObject(siteData.content).collectionHeadings)[collectionId]);
  const headingPath = `collectionHeadings.${collectionId}`;
  const catalog = useMemo(() => products.map((product, index) => ({ product, index })).filter(({ product }) => collectionId === 'living-room' ? isLivingProduct(product) : collectionId === 'sale' ? saleOriginalPrice(product) !== undefined : collection.categories.some(category => category.toLowerCase() === String(product.category ?? '').toLowerCase())), [products, collectionId, collection]);
  const categories = [...new Set(catalog.map(({ product }) => String(product.category)))];
  const ceiling = Math.max(1, ...catalog.map(({ product }) => Number(product.price) || 0));
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState('featured');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftPrice, setDraftPrice] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const drawerAnimation = useRef<Animation | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isSale = collectionId === 'sale';

  // Sale-only Fivora settings
  const saleAnimationsOn = !isSale || isFlagOn(heading.animationsEnabled, true);
  const saleAnimSpeed = isSale ? clampNum(heading.animationSpeed, 50, 200, 100) : 100;
  const showProductBadges = !isSale || isFlagOn(heading.showProductBadges, true);
  const productBadgePrefix = isSale ? contentText(heading.productBadgePrefix) || 'SALE' : 'SALE';
  const showSaleOnlyPill = isSale && isFlagOn(heading.showSaleOnlyPill, true);
  const sortFeaturedLabel = isSale ? contentText(heading.sortFeaturedLabel) || 'Featured' : 'Featured';
  const sortPriceLowLabel = isSale ? contentText(heading.sortPriceLowLabel) || 'Price: low to high' : 'Price: low to high';
  const sortPriceHighLabel = isSale ? contentText(heading.sortPriceHighLabel) || 'Price: high to low' : 'Price: high to low';
  const sortNameLabel = isSale ? contentText(heading.sortNameLabel) || 'Name: A–Z' : 'Name: A–Z';
  const filterDrawerHeading = isSale ? contentText(heading.filterDrawerHeading) || 'Refine your collection' : 'Refine your collection';

  const saleStyle = isSale
    ? ({
        '--sale-terracotta': contentText(heading.accentColor) || '#B84335',
        '--sale-terracotta-soft': contentText(heading.accentSoftColor) || '#C65344',
        '--sale-badge-text': contentText(heading.badgeTextColor) || '#fff9f5',
        '--sale-original-color': contentText(heading.originalPriceColor) || '#8c6e58',
        '--sale-anim-scale': String(100 / saleAnimSpeed),
        '--sale-section-bg': contentText(heading.sectionBackground) || '#F7F0E6',
        '--sale-pt': `${clampNum(heading.sectionPaddingTop, 16, 120, 42)}px`,
        '--sale-pb': `${clampNum(heading.sectionPaddingBottom, 24, 140, 65)}px`,
        '--sale-grid-gap': `${clampNum(heading.gridGap, 12, 48, 21)}px`,
      } as CSSProperties)
    : undefined;

  const maxDiscount = useMemo(() => {
    if (!isSale) return undefined;
    const values = catalog.map(({ product }) => saleDiscountPercent(product) ?? 0);
    const highest = Math.max(0, ...values);
    return highest > 0 ? highest : undefined;
  }, [catalog, isSale]);
  const priceLimit = maxPrice ?? ceiling;
  const filtered = catalog.filter(({ product }) => matchesCollectionFilter(product.category, category, collectionId) && Number(product.price) <= priceLimit).sort((a, b) => sort === 'price-low' ? Number(a.product.price) - Number(b.product.price) : sort === 'price-high' ? Number(b.product.price) - Number(a.product.price) : sort === 'name' ? String(a.product.name).localeCompare(String(b.product.name)) : a.index - b.index);
  const draftCount = catalog.filter(({ product }) => matchesCollectionFilter(product.category, draftCategory, collectionId) && Number(product.price) <= (draftPrice ?? ceiling)).length;
  useEffect(() => {
    if (!isSale || !gridRef.current) return;
    const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>('.product-card'));
    if (!cards.length) return;
    if (!saleAnimationsOn || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      cards.forEach(card => { card.dataset.saleVisible = 'true'; });
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.saleVisible = 'true';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [isSale, saleAnimationsOn, filtered.length, sort, category, maxPrice]);
  const closeFilters = () => {
    if (closing) return;
    const element = dialog.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOpen(false); setClosing(false); return;
    }
    // Start from the current position, including when closing during the entrance.
    const { transform, opacity } = getComputedStyle(element);
    drawerAnimation.current?.cancel();
    setClosing(true);
    const animation = element.animate([
      { transform, opacity },
      { transform: 'translateX(-100%)', opacity: 0 },
    ], { duration: 420, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    drawerAnimation.current = animation;
    animation.finished.then(() => { setOpen(false); setClosing(false); }).catch(() => {});
  };
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('category');
    setCategory(initial || '');
  }, [collectionId]);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const opener = trigger.current;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawerAnimation.current = element.animate([
        { transform: 'translateX(-100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    return () => { drawerAnimation.current?.cancel(); element.close(); document.body.style.overflow = overflow; opener?.focus(); };
  }, [open]);
  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button,input,select')).filter(element => !element.hasAttribute('disabled'));
    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
  };
  const clear = () => { setCategory(''); setMaxPrice(null); setDraftCategory(''); setDraftPrice(null); };
  return <div className={`lr-collection${isSale ? ' lr-collection-sale' : ''}`} data-preview-page-key={collection.pageId} data-sale-animations={isSale ? (saleAnimationsOn ? 'on' : 'off') : undefined} style={saleStyle}>
    <header className="lr-heading">
      <nav className="lr-breadcrumbs" aria-labelledby={`${collectionId}-breadcrumbs-label`}>
        <span id={`${collectionId}-breadcrumbs-label`} className="sr-only" data-preview-static="breadcrumb-accessible-label">Breadcrumb</span>
        <a href={withBasePath('/')} aria-label="Home" data-preview-static="collection-home-link">⌂</a><span>/</span>
        <a href={withBasePath('/#categories')} data-preview-static="collection-index-link">Collections</a><span>/</span>
        <span aria-current="page" data-preview-static="collection-route-label">{collection.label}</span>
      </nav>
      <CollectionHero key={collectionId} collectionId={collectionId} heading={heading} headingPath={headingPath} maxDiscount={maxDiscount} />
    </header>
    <section id={`${collectionId}-products`} aria-labelledby={`${collectionId}-title`}>
      <div className="lr-collection-toolbar">
        <button type="button" className="lr-filter-button" ref={trigger} aria-haspopup="dialog" data-preview-static={isSale ? undefined : 'collection-open-filters'} onClick={() => { setDraftCategory(category); setDraftPrice(maxPrice); setOpen(true); }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18M8 3v6M16 9v6M10 15v6" /></svg>{isSale ? <EditableText as="span" fieldPath={`${headingPath}.filterButtonLabel`} defaultValue={contentText(heading.filterButtonLabel) || 'Show filters'} /> : 'Show filters'}{(category || maxPrice !== null) && <span className="lr-filter-indicator" />}</button>
        <span className="lr-product-count" role="status" aria-live="polite" data-preview-static="collection-result-count">{filtered.length} {filtered.length === 1 ? 'product' : 'products'}</span>
        {showSaleOnlyPill && <span className="sale-toolbar-pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82ZM7 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" /></svg>
          <EditableText as="span" fieldPath={`${headingPath}.saleOnlyLabel`} defaultValue={contentText(heading.saleOnlyLabel) || 'Sale Only'} />
        </span>}
        <label className="lr-sort">{isSale ? <EditableText as="span" fieldPath={`${headingPath}.sortLabel`} defaultValue={contentText(heading.sortLabel) || 'Sort by:'} /> : <span data-preview-static="collection-sort-label">Sort by:</span>}<select aria-label="Sort products" data-preview-static="collection-sort-options" value={sort} onChange={event => setSort(event.target.value)}><option value="featured">{sortFeaturedLabel}</option><option value="price-low">{sortPriceLowLabel}</option><option value="price-high">{sortPriceHighLabel}</option><option value="name">{sortNameLabel}</option></select></label>
      </div>
      {(category || maxPrice !== null) && <div className="lr-active-filters">{category && <button type="button" onClick={() => setCategory('')}>{category} ×</button>}{maxPrice !== null && <button type="button" onClick={() => setMaxPrice(null)}>Up to {formatPrice(maxPrice)} ×</button>}<button type="button" onClick={clear}>Clear filters</button></div>}
      <div ref={gridRef} className="lr-product-grid" data-preview-list-path="products">{filtered.map(({ product, index }) => {
        const discount = isSale && showProductBadges ? saleDiscountPercent(product) : undefined;
        return <FurnitureProductCard key={String(product.id)} product={product} index={index} collectionId={collectionId} saleBadge={discount ? `${productBadgePrefix} · ${discount}% OFF` : undefined} />;
      })}</div>
      {!filtered.length && <div className="lr-empty"><h2 data-preview-static="collection-empty-heading">A little more room to explore.</h2><p data-preview-static="collection-empty-message">No products match these filters.</p><button type="button" className="lr-filter-button" data-preview-static="collection-reset-action" onClick={clear}>View all products</button></div>}
      {isSale ? (
        <EditableText as="p" className="lr-sample-note" fieldPath={`${headingPath}.sampleNote`} defaultValue={contentText(heading.sampleNote) || 'A sample collection for LUMI LIVING. Additional product views are AI-generated illustrations.'} />
      ) : (
        <p className="lr-sample-note" data-preview-static="sample-collection-disclosure">A sample collection for LUMI LIVING. Additional product views are AI-generated illustrations.</p>
      )}
    </section>
    <dialog ref={dialog} className={`lr-filter-drawer${closing ? ' is-closing' : ''}`} aria-labelledby={`${collectionId}-filters-title`} onKeyDown={trapFocus} onCancel={event => { event.preventDefault(); closeFilters(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX > rect.right || event.clientX < rect.left || event.clientY < rect.top || event.clientY > rect.bottom) closeFilters(); } }}>
      <div className="lr-drawer-heading"><h2 id={`${collectionId}-filters-title`} data-preview-static="collection-filter-heading">{filterDrawerHeading}</h2><button type="button" aria-label="Close filters" data-preview-static="collection-close-filters" onClick={closeFilters} autoFocus>×</button></div>
      <div className="lr-drawer-content"><fieldset><legend data-preview-static="collection-filter-type-label">Product type</legend><label><input type="radio" name="category" checked={!draftCategory} onChange={() => setDraftCategory('')} /><span data-preview-static="collection-filter-all-option">All {collection.label.toLowerCase()}</span></label>{categories.map(value => <label key={value}><input type="radio" name="category" checked={draftCategory === value} onChange={() => setDraftCategory(value)} /><span data-preview-static="derived-product-type-option">{value}</span></label>)}</fieldset><label className="lr-price-filter"><span data-preview-static="collection-price-limit-label" style={{ display: 'inline', fontSize: 'inherit', color: 'inherit' }}>Maximum price</span><strong data-preview-static="collection-price-limit-value">{formatPrice(draftPrice ?? ceiling)}</strong><input type="range" min="0" max={ceiling} step="1" data-preview-static="collection-price-limit-control" value={Math.min(draftPrice ?? ceiling, ceiling)} onChange={event => setDraftPrice(Number(event.target.value))} /><span data-preview-static="collection-price-range">LKR 0 <span>{formatPrice(ceiling)}</span></span></label></div>
      <div className="lr-drawer-bottom"><p aria-live="polite" data-preview-static="collection-filter-result-count">{draftCount} matching {draftCount === 1 ? 'product' : 'products'}</p><button type="button" className="lr-primary-button" data-preview-static="collection-apply-filters" onClick={() => { setCategory(draftCategory); setMaxPrice(draftPrice); closeFilters(); }}>Show products ↗</button><button type="button" className="lr-clear-button" data-preview-static="collection-clear-filters" onClick={clear}>Clear filters</button></div>
    </dialog>
  </div>;
}
