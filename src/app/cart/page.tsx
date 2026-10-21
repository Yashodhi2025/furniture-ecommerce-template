'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EditableSection, EditableText } from '@deneb-ui/ui';
import { contentObject, contentText, useSiteData } from '@/lib/siteDataContext';
import { productHref } from '@/lib/living-room';
import { withBasePath } from '@/lib/utils';
import './cart.css';

const CART_KEY = 'lumi-living-cart';
const defaults = {
  title: 'Your shopping cart',
  description: 'Thoughtful pieces, ready for your space.',
  emptyTitle: 'Make room for something lovely.',
  emptyDescription: 'Your cart is empty. Explore our collection to find your favourite pieces.',
  continueShoppingLabel: 'Continue Shopping',
  continueShoppingUrl: '/#shop',
  summaryTitle: 'Your collection',
  unitPriceLabel: 'Unit price',
  removeLabel: 'Remove',
  subtotalLabel: 'Subtotal',
  totalLabel: 'Total',
};
type CartItem = { id: string; name?: string; imageUrl?: string; price?: string | number; quantity: number };
const numericPrice = (value: CartItem['price']) => typeof value === 'number' ? value : Number(String(value ?? 0).replace(/[^0-9.-]/g, ''));
const money = (value: number) => `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(value)}`;

function readCart(): CartItem[] {
  const items: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
  if (!Array.isArray(items) || items.some(item => !item || typeof item.id !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(numericPrice(item.price)) || numericPrice(item.price) < 0)) {
    throw new Error('Invalid cart data');
  }
  return items;
}

export default function CartPage() {
  const siteData = useSiteData();
  const settings = contentObject(contentObject(siteData.content).cart);
  const text = (key: keyof typeof defaults) => key in settings ? contentText(settings[key]) : defaults[key];
  const copy = (key: keyof typeof defaults, as: 'span' | 'h1' | 'h2' | 'p' = 'span') => <EditableText as={as} fieldPath={`cart.${key}`} defaultValue={text(key)} />;
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => {
      try { setItems(readCart()); setError(''); }
      catch { setError('Your cart could not be loaded. Please allow browser storage and try again.'); }
      finally { setReady(true); }
    };
    const sync = (event: StorageEvent) => { if (event.key === CART_KEY || event.key === null) load(); };
    load();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const update = (change: (saved: CartItem[]) => CartItem[]) => {
    try {
      const next = change(readCart());
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      setItems(next);
      setError('');
    } catch { setError('Your cart could not be updated. Please allow browser storage and try again.'); }
  };
  const changeQuantity = (id: string, difference: number) => update(saved => saved.map(item => {
    if (item.id !== id) return item;
    const quantity = item.quantity + difference;
    return Number.isSafeInteger(quantity) && quantity >= 1 ? { ...item, quantity } : item;
  }));
  const subtotal = items.reduce((sum, item) => sum + Math.round(numericPrice(item.price) * 100) * item.quantity, 0) / 100;
  const continueShopping = <a href={withBasePath(text('continueShoppingUrl'))} data-preview-field-path="cart.continueShoppingUrl" className="lumi-cart-continue">{copy('continueShoppingLabel')}<span aria-hidden="true">↗</span></a>;

  return <div className="lumi-cart" data-preview-page-key="cart">
    <header className="lumi-cart-heading">{copy('title', 'h1')}{copy('description', 'p')}</header>
    {error && <p className="lumi-cart-error" role="alert" data-preview-static="cart-storage-error">{error}</p>}
    {!ready ? <p role="status" data-preview-static="cart-loading">Loading your cart…</p> : items.length ? <div className="lumi-cart-layout">
      <section className="lumi-cart-items" aria-label="Cart products">
        {items.map(item => <article className="lumi-cart-item" key={item.id}>
          <Link href={productHref(item.id)} className="lumi-cart-image" aria-label={`View ${item.name ?? 'product'}`} data-preview-static="cart-product-image"><img src={withBasePath(item.imageUrl || '/placeholder.svg')} alt={item.name ?? 'Product'} loading="lazy" /></Link>
          <div className="lumi-cart-item-info">
            <h2 data-preview-static="cart-product-name"><Link href={productHref(item.id)}>{item.name || 'Product'}</Link></h2>
            <p className="lumi-cart-unit-price">{copy('unitPriceLabel')} <span data-preview-static="cart-unit-price">{money(numericPrice(item.price))}</span></p>
            <div className="lumi-cart-item-controls">
              <div className="lumi-cart-quantity" role="group" aria-label={`Quantity of ${item.name ?? 'product'}`} data-preview-static="cart-quantity-controls">
                <button type="button" aria-label={`Decrease quantity of ${item.name ?? 'product'}`} disabled={item.quantity <= 1} onClick={() => changeQuantity(item.id, -1)}>−</button>
                <output aria-live="polite">{item.quantity}</output>
                <button type="button" aria-label={`Increase quantity of ${item.name ?? 'product'}`} disabled={item.quantity >= Number.MAX_SAFE_INTEGER} onClick={() => changeQuantity(item.id, 1)}>+</button>
              </div>
              <button className="lumi-cart-remove" type="button" aria-label={`Remove ${item.name ?? 'product'} from cart`} onClick={() => update(saved => saved.filter(entry => entry.id !== item.id))}>{copy('removeLabel')}</button>
            </div>
          </div>
          <div className="lumi-cart-item-subtotal">{copy('subtotalLabel')}<strong data-preview-static="cart-item-subtotal">{money(Math.round(numericPrice(item.price) * 100) * item.quantity / 100)}</strong></div>
        </article>)}
        {continueShopping}
      </section>
      <EditableSection name="cart-summary" padding="none" className="lumi-cart-summary">
        {copy('summaryTitle', 'h2')}
        <div>{copy('subtotalLabel')}<span data-preview-static="cart-subtotal">{money(subtotal)}</span></div>
        <div className="lumi-cart-total" aria-live="polite">{copy('totalLabel')}<strong data-preview-static="cart-total">{money(subtotal)}</strong></div>
      </EditableSection>
    </div> : !error && <EditableSection name="cart-empty" padding="none" className="lumi-cart-empty">
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7ZM9 8V6a3 3 0 0 1 6 0v2" /></svg>
      {copy('emptyTitle', 'h2')}{copy('emptyDescription', 'p')}{continueShopping}
    </EditableSection>}
    {ready && error && !items.length && continueShopping}
  </div>;
}
