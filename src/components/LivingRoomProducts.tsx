'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { EditableCard, EditableSection, EditableText } from '@deneb-ui/ui';
import { contentObject, contentText, useProducts, useSiteData } from '@/lib/siteDataContext';
import { formatPrice, isLivingProduct, productHref } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import ProductPhotoGallery from './ProductPhotoGallery';
import { collections, type CollectionId } from '@/lib/collections';

const sortOptions = <><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></>;
export default function LivingRoomProducts({ collectionId = 'living-room' }: { collectionId?: CollectionId }) {
  const products = useProducts();
  const collection = collections[collectionId];
  const siteData = useSiteData();
  const heading = contentObject(contentObject(contentObject(siteData.content).collectionHeadings)[collectionId]);
  const headingPath = `collectionHeadings.${collectionId}`;
  const catalog = useMemo(() => products.map((product, index) => ({ product, index })).filter(({ product }) => collectionId === 'living-room' ? isLivingProduct(product) : collectionId === 'sale' ? Number(product.compareAtPrice) > Number(product.price) : collection.categories.some(category => category.toLowerCase() === String(product.category ?? '').toLowerCase())), [products, collectionId, collection]);
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
  const priceLimit = maxPrice ?? ceiling;
  const filtered = catalog.filter(({ product }) => (!category || product.category === category) && Number(product.price) <= priceLimit).sort((a, b) => sort === 'price-low' ? Number(a.product.price) - Number(b.product.price) : sort === 'price-high' ? Number(b.product.price) - Number(a.product.price) : sort === 'name' ? String(a.product.name).localeCompare(String(b.product.name)) : a.index - b.index);
  const draftCount = catalog.filter(({ product }) => (!draftCategory || product.category === draftCategory) && Number(product.price) <= (draftPrice ?? ceiling)).length;
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
  return <div className="lr-collection" data-preview-page-key="living_room">
    <header className="lr-heading"><nav className="lr-breadcrumbs" aria-label="Breadcrumb"><a href={withBasePath('/')} aria-label="Home">⌂</a><span>/</span><a href={withBasePath('/#categories')}>Collections</a><span>/</span><span aria-current="page">{collection.label}</span></nav><EditableSection as="div" name={`${collectionId}-heading`} padding="none" bg="var(--deneb-section-bg, #EADBC8)" className="lr-title-band"><h1><EditableText as="span" fieldPath={`${headingPath}.title`} defaultValue={contentText(heading.title) || collection.title} /></h1><EditableText as="p" fieldPath={`${headingPath}.description`} defaultValue={contentText(heading.description) || collection.description} /></EditableSection></header>
    <section aria-label={`${collection.label} products`}>
      <div className="lr-collection-toolbar"><button type="button" className="lr-filter-button" ref={trigger} aria-haspopup="dialog" onClick={() => { setDraftCategory(category); setDraftPrice(maxPrice); setOpen(true); }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18M8 3v6M16 9v6M10 15v6" /></svg>Show filters{(category || maxPrice !== null) && <span className="lr-filter-indicator" />}</button><span className="lr-product-count" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'product' : 'products'}</span><label className="lr-sort">Sort by:<select aria-label="Sort products" value={sort} onChange={event => setSort(event.target.value)}>{sortOptions}</select></label></div>
      {(category || maxPrice !== null) && <div className="lr-active-filters">{category && <button type="button" onClick={() => setCategory('')}>{category} ×</button>}{maxPrice !== null && <button type="button" onClick={() => setMaxPrice(null)}>Up to {formatPrice(maxPrice)} ×</button>}<button type="button" onClick={clear}>Clear filters</button></div>}
      <div className="lr-product-grid" data-preview-list-path="products">{filtered.map(({ product, index }) => <EditableCard key={String(product.id)} item={{}} itemPath={`products[${index}]`} data-preview-item-path={`products[${index}]`} as="article" className="lr-product-card">
        <ProductPhotoGallery product={product} index={index} href={productHref(product.id)} />
        <div className="lr-product-caption"><span className="lr-brand">LUMI LIVING</span><a href={withBasePath(productHref(product.id))}><EditableText as="h2" data-preview-field-path={`products[${index}].name`} defaultValue={product.name} /></a><EditableText as="p" data-preview-field-path={`products[${index}].price`} defaultValue={formatPrice(product.price)} /></div>
      </EditableCard>)}</div>
      {!filtered.length && <div className="lr-empty"><h2>A little more room to explore.</h2><p>No products match these filters.</p><button type="button" className="lr-filter-button" onClick={clear}>View all products</button></div>}
      <p className="lr-sample-note">A sample collection for LUMI LIVING. Additional product views are AI-generated illustrations.</p>
    </section>
    <dialog ref={dialog} className={`lr-filter-drawer${closing ? ' is-closing' : ''}`} aria-label={`Filter ${collection.label.toLowerCase()} furniture`} onKeyDown={trapFocus} onCancel={event => { event.preventDefault(); closeFilters(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX > rect.right || event.clientX < rect.left || event.clientY < rect.top || event.clientY > rect.bottom) closeFilters(); } }}>
      <div className="lr-drawer-heading"><h2>Refine your collection</h2><button type="button" aria-label="Close filters" onClick={closeFilters} autoFocus>×</button></div>
      <div className="lr-drawer-content"><fieldset><legend>Product type</legend><label><input type="radio" name="category" checked={!draftCategory} onChange={() => setDraftCategory('')} />All {collection.label.toLowerCase()}</label>{categories.map(value => <label key={value}><input type="radio" name="category" checked={draftCategory === value} onChange={() => setDraftCategory(value)} />{value}</label>)}</fieldset><label className="lr-price-filter">Maximum price<strong>{formatPrice(draftPrice ?? ceiling)}</strong><input type="range" min="0" max={ceiling} step="1" value={Math.min(draftPrice ?? ceiling, ceiling)} onChange={event => setDraftPrice(Number(event.target.value))} /><span>LKR 0 <span>{formatPrice(ceiling)}</span></span></label></div>
      <div className="lr-drawer-bottom"><p aria-live="polite">{draftCount} matching {draftCount === 1 ? 'product' : 'products'}</p><button type="button" className="lr-primary-button" onClick={() => { setCategory(draftCategory); setMaxPrice(draftPrice); closeFilters(); }}>Show products ↗</button><button type="button" className="lr-clear-button" onClick={clear}>Clear filters</button></div>
    </dialog>
  </div>;
}
