'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EditableSection, EditableText } from '@deneb-ui/ui';
import { contentObject, contentText, isTemplateValidation, useProducts, useSiteData } from '@/lib/siteDataContext';
import { productHref } from '@/lib/living-room';
import { readSavedProducts, writeWishlist, WISHLIST_CHANGE_EVENT, WISHLIST_KEY, type SavedProduct } from '@/lib/shoppingStorage';
import { withBasePath } from '@/lib/utils';
import '../cart/cart.css';
import './wishlist.css';

const defaults = {
  title: 'Your wishlist',
  description: 'Keep the pieces you love close. Make room for them when you are ready.',
  emptyTitle: 'A little inspiration starts here.',
  emptyDescription: 'Save your favourite pieces using the heart on a product page. They will be waiting here for you.',
  continueShoppingLabel: 'Continue Shopping',
  continueShoppingUrl: '/#shop',
  removeLabel: 'Remove from Wishlist',
  removedMessage: 'Removed from your wishlist.',
};
const money = (price: SavedProduct['price']) => {
  const value = typeof price === 'number' ? price : Number(String(price ?? 0).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(value) ? `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(value)}` : '';
};

export default function WishlistPage() {
  const siteData = useSiteData();
  const preview = isTemplateValidation(siteData);
  const products = useProducts();
  const settings = contentObject(contentObject(siteData.content).wishlist);
  const text = (key: keyof typeof defaults) => key in settings ? contentText(settings[key]) : defaults[key];
  const copy = (key: keyof typeof defaults, as: 'span' | 'h1' | 'h2' | 'p' = 'span') => <EditableText as={as} fieldPath={`wishlist.${key}`} defaultValue={text(key)} />;
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<'removedMessage' | null>(null);
  const visibleItems: SavedProduct[] = preview && !items.length
    ? [{ id: String(products[0]?.id ?? ''), name: products[0]?.name, imageUrl: products[0]?.imageUrl, price: products[0]?.price ?? 0, currency: products[0]?.currency }]
    : items;

  useEffect(() => {
    const load = () => {
      try { setItems(readSavedProducts(WISHLIST_KEY)); setError(''); }
      catch { setError('Your wishlist could not be loaded. Please allow browser storage and try again.'); }
      finally { setReady(true); }
    };
    const sync = (event: StorageEvent) => { if (event.key === WISHLIST_KEY || event.key === null) load(); };
    load();
    window.addEventListener(WISHLIST_CHANGE_EVENT, load);
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', load);
    window.addEventListener('focus', load);
    return () => {
      window.removeEventListener(WISHLIST_CHANGE_EVENT, load);
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', load);
      window.removeEventListener('focus', load);
    };
  }, []);

  const remove = (id: string) => {
    try {
      const next = readSavedProducts(WISHLIST_KEY).filter(item => item.id !== id);
      writeWishlist(next);
      setItems(next);
      setError('');
      setNotice('removedMessage');
    } catch { setNotice(null); setError('Your wishlist could not be updated. Please allow browser storage and try again.'); }
  };
  const continueShopping = <a href={withBasePath(text('continueShoppingUrl'))} data-preview-field-path="wishlist.continueShoppingUrl" className="lumi-cart-continue">{copy('continueShoppingLabel')}<span aria-hidden="true">↗</span></a>;

  return <div className="lumi-cart lumi-wishlist" data-preview-page-key="wishlist">
    <header id="lumi-wishlist-heading" className="lumi-cart-heading">{copy('title', 'h1')}{copy('description', 'p')}</header>
    {error && <p role="alert" className="lumi-cart-error" data-preview-static="wishlist-storage-error">{error}</p>}
    <p role="status" className="lumi-wishlist-status">{notice ? copy(notice) : preview ? copy('removedMessage') : null}</p>
    {!ready && !preview ? <p role="status" data-preview-static="wishlist-loading">Loading your wishlist…</p> : visibleItems.length ? <>
      <section className="lumi-wishlist-grid" aria-labelledby="lumi-wishlist-heading">
        {visibleItems.map(item => <article className="lumi-wishlist-card" key={item.id}>
          <Link href={productHref(item.id)} className="lumi-wishlist-image" aria-label={`View ${item.name ?? 'product'}`} data-preview-static="wishlist-product-image"><img src={withBasePath(item.imageUrl || '/placeholder.svg')} alt={item.name ?? 'Product'} loading="lazy" /></Link>
          <div className="lumi-wishlist-info">
            <h2 data-preview-static="wishlist-product-name"><Link href={productHref(item.id)}>{item.name || 'Product'}</Link></h2>
            <p className="lumi-wishlist-price" data-preview-static="wishlist-product-price">{money(item.price)}</p>
            <button className="lumi-cart-remove" type="button" data-preview-field-path="wishlist.removeLabel" aria-label={`${text('removeLabel')}: ${item.name ?? 'product'}`} onClick={() => remove(item.id)}>{copy('removeLabel')}</button>
          </div>
        </article>)}
      </section>
      {continueShopping}
    </> : null}
    {(preview || (ready && !items.length && !error)) && <EditableSection name="wishlist-empty" padding="none" className="lumi-cart-empty lumi-wishlist-empty">
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      {copy('emptyTitle', 'h2')}{copy('emptyDescription', 'p')}{continueShopping}
    </EditableSection>}
    {ready && error && !items.length && continueShopping}
  </div>;
}
