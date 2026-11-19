'use client';

import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProductItem, ProductDetailItem } from '@deneb-ui/ui';
import { addProductToCart, CART_KEY, readSavedProducts, type SavedProduct } from '@/lib/shoppingStorage';
import { readFivoraEditMode } from '@/lib/useFivoraEditMode';
import EnquiryDrawer from './EnquiryDrawer';

/** Shares the existing cart format and Product Details confirmation drawer. */
export default function CardCartAction({ product, index }: { product: ProductItem; index: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [message, setMessage] = useState('');
  const close = useCallback(() => setOpen(false), []);
  const unavailable = product.isAvailable === false || product.id == null || String(product.id) === '';
  return <>
    <div className="product-card-action">
      <button type="button" className="product-card-cart" data-preview-static="card-add-to-cart" disabled={unavailable}
        aria-label={`${unavailable ? 'Unavailable' : 'Add to Cart'}: ${product.name || 'product'}`}
        onClick={() => {
          if (readFivoraEditMode()) return;
          try {
            addProductToCart({ id: String(product.id), name: product.name, price: product.price, currency: product.currency, imageUrl: product.imageUrl });
            setItems(readSavedProducts(CART_KEY));
            setMessage(`${product.name || 'Product'} added to your cart.`);
            setOpen(true);
          } catch { setMessage('Could not save your cart. Please allow browser storage and try again.'); }
        }}>{unavailable ? 'Unavailable' : 'Add to Cart'}</button>
    </div>
    <span className="sr-only" role="status">{message}</span>
    {open && createPortal(<EnquiryDrawer open onClose={close} product={product as ProductDetailItem} productIndex={index}
      quantity={1} items={items} listError={false} editing={false} />, document.body)}
  </>;
}
