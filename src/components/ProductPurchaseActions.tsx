'use client';

import { useEffect, useId, useState } from 'react';
import { EditableText, type ProductDetailItem } from '@deneb-ui/ui';
import { contentObject, contentText, isTemplateValidation, useSiteData } from '@/lib/siteDataContext';
import { addProductToCart, readSavedProducts, toggleProductWishlist, WISHLIST_CHANGE_EVENT, WISHLIST_KEY, type SavedProduct } from '@/lib/shoppingStorage';

export default function ProductPurchaseActions({ product }: { product: ProductDetailItem }) {
  const siteData = useSiteData();
  const preview = isTemplateValidation(siteData);
  const settings = contentObject(contentObject(siteData.content).productDetail);
  const text = (key: string, fallback: string) => key in settings ? contentText(settings[key]) : fallback;
  const quantityId = useId();
  const [quantity, setQuantity] = useState('1');
  const [wishlisted, setWishlisted] = useState(false);
  const [message, setMessage] = useState('');
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

  const addToCart = () => {
    try {
      addProductToCart(item, amount);
      setQuantity(String(amount));
      setMessage(`${amount} ${amount === 1 ? 'item' : 'items'} added to your cart.`);
    } catch { setMessage('Could not save your cart. Please allow browser storage and try again.'); }
  };

  const toggleWishlist = () => {
    try {
      const saved = toggleProductWishlist(item);
      setWishlisted(saved);
      setMessage(saved ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
    } catch { setMessage('Could not save your wishlist. Please allow browser storage and try again.'); }
  };

  return <div className="lr-purchase-actions">
    <label htmlFor={quantityId} data-preview-static="product-quantity-label">Quantity</label>
    <div className="lr-purchase-row">
      <div className="lr-quantity-selector">
        <button type="button" data-preview-static="product-decrease-quantity" aria-label="Decrease quantity" disabled={amount <= 1} onClick={() => setQuantity(String(amount - 1))}>−</button>
        <input data-preview-static="product-quantity-value" id={quantityId} type="number" min="1" max="99" step="1" inputMode="numeric" value={quantity} onChange={event => setQuantity(event.target.value)} onBlur={() => setQuantity(String(amount))} />
        <button type="button" data-preview-static="product-increase-quantity" aria-label="Increase quantity" disabled={amount >= 99} onClick={() => setQuantity(String(amount + 1))}>+</button>
      </div>
      <button type="button" className="lr-primary-button" disabled={product.isAvailable === false || !id} onClick={addToCart}>{product.isAvailable === false ? <EditableText as="span" fieldPath="productDetail.unavailableLabel" defaultValue={text('unavailableLabel', 'Unavailable')} /> : <EditableText as="span" fieldPath="productDetail.addToCartLabel" defaultValue={text('addToCartLabel', 'Add to Cart')} />}</button>
      {preview && <button type="button" className="lr-primary-button" disabled>{product.isAvailable === false ? <EditableText as="span" fieldPath="productDetail.addToCartLabel" defaultValue={text('addToCartLabel', 'Add to Cart')} /> : <EditableText as="span" fieldPath="productDetail.unavailableLabel" defaultValue={text('unavailableLabel', 'Unavailable')} />}</button>}
      <button type="button" className="lr-wishlist-button" aria-pressed={wishlisted} onClick={toggleWishlist} disabled={!id}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
        {wishlisted ? <EditableText as="span" fieldPath="productDetail.wishlistSavedLabel" defaultValue={text('wishlistSavedLabel', 'Saved to Wishlist')} /> : <EditableText as="span" fieldPath="productDetail.wishlistLabel" defaultValue={text('wishlistLabel', 'Wishlist')} />}
      </button>
      {preview && <button type="button" className="lr-wishlist-button" aria-pressed={!wishlisted} disabled>{wishlisted ? <EditableText as="span" fieldPath="productDetail.wishlistLabel" defaultValue={text('wishlistLabel', 'Wishlist')} /> : <EditableText as="span" fieldPath="productDetail.wishlistSavedLabel" defaultValue={text('wishlistSavedLabel', 'Saved to Wishlist')} />}</button>}
    </div>
    <p className="lr-purchase-status" role="status" data-preview-static="product-purchase-status">{message}</p>
  </div>;
}
