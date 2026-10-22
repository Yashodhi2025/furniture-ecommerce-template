'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import EnquiryWhatsApp from './EnquiryWhatsApp';
import EnquiryDrawer from './EnquiryDrawer';
import { withBasePath } from '@/lib/utils';
import { formatPrice } from '@/lib/living-room';
import { EditableText, type ProductDetailItem } from '@deneb-ui/ui';
import { contentObject, contentText, isTemplateValidation, useSiteData } from '@/lib/siteDataContext';
import { addProductToCart, CART_KEY, CART_CHANGE_EVENT, readSavedProducts, toggleProductWishlist, WISHLIST_CHANGE_EVENT, WISHLIST_KEY, type SavedProduct } from '@/lib/shoppingStorage';

export default function ProductPurchaseActions({ product, productIndex = -1 }: { product: ProductDetailItem; productIndex?: number }) {
  const siteData = useSiteData();
  const preview = isTemplateValidation(siteData);
  const settings = contentObject(contentObject(siteData.content).productDetail);
  const text = (key: string, fallback: string) => key in settings ? contentText(settings[key]) : fallback;
  const quantityId = useId();
  const [quantity, setQuantity] = useState('1');
  const [wishlisted, setWishlisted] = useState(false);
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addedQuantity, setAddedQuantity] = useState(1);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [listError, setListError] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const actions = useRef<HTMLDivElement>(null);
  const id = String(product.id ?? '');
  const amount = Math.min(99, Math.max(1, Math.floor(Number(quantity) || 1)));
  const item: SavedProduct = { id, name: product.name, price: product.price, currency: product.currency, imageUrl: product.imageUrl };

  useEffect(() => {
    const sync = () => {
      try { setWishlisted(readSavedProducts(WISHLIST_KEY).some(saved => saved.id === id)); }
      catch { setMessage('Saved items are unavailable. Please allow browser storage and try again.'); }
    };
    sync();
    window.addEventListener(WISHLIST_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);
    return () => {
      window.removeEventListener(WISHLIST_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, [id]);

  useEffect(() => {
    setMounted(true);
    const sync = () => {
      try { setItems(readSavedProducts(CART_KEY)); setListError(false); }
      catch { setListError(true); }
    };
    const edit = (event: MessageEvent) => {
      if (event.source === window.parent && ['FIVORA_PREVIEW_EDIT_MODE', 'MARKETPLACE_PREVIEW_EDIT_MODE'].includes(event.data?.type)) {
        setEditing(Boolean(event.data.editMode));
        if (event.data.editMode) setDrawerOpen(false);
      }
    };
    const observer = new IntersectionObserver(([entry]) => setSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    const footerObserver = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting));
    if (actions.current) observer.observe(actions.current);
    const footer = document.querySelector('footer');
    if (footer) footerObserver.observe(footer);
    sync();
    window.addEventListener(CART_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('message', edit);
    return () => {
      observer.disconnect();
      footerObserver.disconnect();
      window.removeEventListener(CART_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('message', edit);
    };
  }, []);
  const count = items.reduce((sum, entry) => sum + (Number.isSafeInteger(entry.quantity) && Number(entry.quantity) > 0 ? Number(entry.quantity) : 1), 0);
  const addToCart = () => {
    try {
      addProductToCart(item, amount);
      setQuantity(String(amount));
      setAdded(value => value + 1);
      setAddedQuantity(amount);
      if (!editing && !preview && !document.querySelector('[data-fivora-edit-badge], [data-fivora-local-selected-target], [data-marketplace-local-selected-target]')) setDrawerOpen(true);
      setMessage('');
    } catch { setMessage('Could not save your enquiry list. Please allow browser storage and try again.'); }
  };

  const toggleWishlist = () => {
    try {
      const saved = toggleProductWishlist(item);
      setWishlisted(saved);
      setMessage(saved ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
    } catch { setMessage('Could not save your wishlist. Please allow browser storage and try again.'); }
  };

  return <div ref={actions} className="lr-purchase-actions">
    <label htmlFor={quantityId} data-preview-static="product-quantity-label">Quantity</label>
    <div className="lr-purchase-row">
      <div className="lr-quantity-selector">
        <button type="button" data-preview-static="product-decrease-quantity" aria-label="Decrease quantity" disabled={amount <= 1} onClick={() => setQuantity(String(amount - 1))}>−</button>
        <input data-preview-static="product-quantity-value" id={quantityId} type="number" min="1" max="99" step="1" inputMode="numeric" value={quantity} onChange={event => setQuantity(event.target.value)} onBlur={() => setQuantity(String(amount))} />
        <button type="button" data-preview-static="product-increase-quantity" aria-label="Increase quantity" disabled={amount >= 99} onClick={() => setQuantity(String(amount + 1))}>+</button>
      </div>
      <button type="button" className={`lr-primary-button lr-add-enquiry${added ? ' is-added' : ''}`} disabled={product.isAvailable === false || !id} onClick={addToCart}>{product.isAvailable === false ? <EditableText as="span" fieldPath="productDetail.unavailableLabel" defaultValue={text('unavailableLabel', 'Unavailable')} /> : added ? <EditableText as="span" fieldPath="productDetail.addSuccessLabel" defaultValue={text('addSuccessLabel', 'Added to Enquiry List')} /> : <EditableText as="span" fieldPath="productDetail.addToCartLabel" defaultValue={text('addToCartLabel', 'Add to Enquiry List')} />}</button>
      {preview && <button type="button" className="lr-primary-button" disabled>{product.isAvailable === false ? <EditableText as="span" fieldPath="productDetail.addToCartLabel" defaultValue={text('addToCartLabel', 'Add to Enquiry List')} /> : <EditableText as="span" fieldPath="productDetail.unavailableLabel" defaultValue={text('unavailableLabel', 'Unavailable')} />}</button>}
      <button type="button" className="lr-wishlist-button" aria-label={`${text(wishlisted ? 'wishlistSavedLabel' : 'wishlistLabel', wishlisted ? 'Saved to Wishlist' : 'Wishlist')} - ${product.name || 'product'}`} title={text(wishlisted ? 'wishlistSavedLabel' : 'wishlistLabel', wishlisted ? 'Saved to Wishlist' : 'Wishlist')} aria-pressed={wishlisted} onClick={toggleWishlist} disabled={!id}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
        <span className="sr-only">{wishlisted ? <EditableText as="span" fieldPath="productDetail.wishlistSavedLabel" defaultValue={text('wishlistSavedLabel', 'Saved to Wishlist')} /> : <EditableText as="span" fieldPath="productDetail.wishlistLabel" defaultValue={text('wishlistLabel', 'Wishlist')} />}</span>
      </button>
      {preview && <button type="button" className="lr-wishlist-button" aria-pressed={!wishlisted} disabled>{wishlisted ? <EditableText as="span" fieldPath="productDetail.wishlistLabel" defaultValue={text('wishlistLabel', 'Wishlist')} /> : <EditableText as="span" fieldPath="productDetail.wishlistSavedLabel" defaultValue={text('wishlistSavedLabel', 'Saved to Wishlist')} />}</button>}
    </div>
    <EnquiryWhatsApp direct items={[{ ...item, quantity: amount }]} disabled={product.isAvailable === false || !id} />
    <a href={withBasePath('/cart/')} className="lr-review-list"><EditableText as="span" fieldPath="productDetail.reviewListLabel" defaultValue={text('reviewListLabel', 'Review your enquiry list')} /><span>{count} {count === 1 ? 'piece' : 'pieces'} ↗</span></a>
    {listError && <p role="alert">Your saved list could not be loaded. Please allow browser storage and try again.</p>}
    <p className={`lr-purchase-status${message ? ' has-message' : ''}`} role="status" data-preview-static="product-purchase-status">{message}</p>
    {mounted && drawerOpen && !editing && !preview && createPortal(<EnquiryDrawer open={drawerOpen} onClose={closeDrawer} product={product} productIndex={productIndex} quantity={addedQuantity} items={items} listError={listError} editing={editing} />, document.body)}
    {mounted && !preview && createPortal(<aside className={`lr-sticky-enquiry${sticky && !editing && !footerVisible ? ' is-visible' : ''}`} aria-label="Enquiry shortcuts" aria-hidden={!sticky || editing || footerVisible} inert={!sticky || editing || footerVisible}>
      <div className="lr-sticky-piece"><strong>{product.name}</strong><span>{product.price !== undefined && formatPrice(product.price)} &#183; Qty {amount}</span></div>
      <button className="lr-sticky-add" type="button" disabled={product.isAvailable === false || !id} onClick={addToCart}><EditableText as="span" fieldPath={`productDetail.${added ? 'addAnotherLabel' : 'addToCartLabel'}`} defaultValue={added ? text('addAnotherLabel', 'Add another') : text('addToCartLabel', 'Add to Enquiry List')} /> <span aria-hidden="true">+</span></button>
      <a className="lr-sticky-review" href={withBasePath('/cart/')}><EditableText as="span" fieldPath="productDetail.stickyListLabel" defaultValue={text('stickyListLabel', 'View enquiry list')} /><span className="lr-sticky-count">{count}</span><span aria-hidden="true">&#8599;</span></a>
      <span className="lr-sticky-status" role="status">{message}</span>
    </aside>, document.body)}
  </div>;
}
