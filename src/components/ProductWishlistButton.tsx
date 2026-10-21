'use client';

import { useEffect, useState } from 'react';
import type { ProductItem } from '@deneb-ui/ui';
import { readSavedProducts, toggleProductWishlist, WISHLIST_CHANGE_EVENT, WISHLIST_KEY } from '@/lib/shoppingStorage';

export default function ProductWishlistButton({ product }: { product: ProductItem }) {
  const id = product.id == null ? '' : String(product.id);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const label = `${saved ? 'Remove' : 'Save'} ${product.name || 'product'} ${saved ? 'from' : 'to'} wishlist`;

  useEffect(() => {
    const sync = () => {
      try { setSaved(readSavedProducts(WISHLIST_KEY).some(item => item.id === id)); }
      catch { /* Keep the current state if browser storage is unavailable. */ }
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

  return <>
    <button type="button" className="lumi-product-heart" aria-label={label} title={label} aria-pressed={saved} disabled={!id} data-preview-static="product-wishlist-toggle" onClick={event => {
      event.preventDefault();
      event.stopPropagation();
      try {
        setSaved(toggleProductWishlist({ id, name: product.name, price: product.price, currency: product.currency, imageUrl: product.imageUrl }));
        setError('');
      } catch { setError('Could not update your wishlist. Please allow browser storage and try again.'); }
    }}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
    </button>
    <span className="sr-only" role="status" data-preview-static="wishlist-toggle-feedback">{error}</span>
  </>;
}
