import type { ProductDetailItem } from '@deneb-ui/ui';

export const CART_CHANGE_EVENT = 'lumi-cart-change';
export const CART_KEY = 'lumi-living-cart';
export const WISHLIST_KEY = 'lumi-living-wishlist';
export const WISHLIST_CHANGE_EVENT = 'lumi-wishlist-change';

export type SavedProduct = {
  id: string;
  name: ProductDetailItem['name'];
  price: ProductDetailItem['price'];
  currency: ProductDetailItem['currency'];
  imageUrl: ProductDetailItem['imageUrl'];
  quantity?: number;
};

export function readSavedProducts(key: string): SavedProduct[] {
  const items: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
  if (!Array.isArray(items) || items.some(item => !item || typeof item.id !== 'string')) {
    throw new Error('Invalid saved shopping data');
  }
  return items;
}

export function writeWishlist(items: SavedProduct[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  // The native storage event only notifies other browser tabs.
  window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
}

export function toggleProductWishlist(item: SavedProduct) {
  const items = readSavedProducts(WISHLIST_KEY);
  const saved = items.some(entry => entry.id === item.id);
  writeWishlist(saved ? items.filter(entry => entry.id !== item.id) : [...items, item]);
  return !saved;
}

/** Shared by Product Details and Wishlist; preserves the existing cart format. */
export function addProductToCart(item: SavedProduct, amount = 1) {
  const items = readSavedProducts(CART_KEY);
  const existing = items.find(saved => saved.id === item.id);
  const previous = existing && Number.isSafeInteger(existing.quantity) && Number(existing.quantity) > 0 ? Number(existing.quantity) : 0;
  if (!Number.isSafeInteger(amount) || amount < 1 || !Number.isSafeInteger(previous + amount)) throw new Error('Invalid quantity');
  const entry = { ...item, quantity: previous + amount };
  localStorage.setItem(CART_KEY, JSON.stringify(existing ? items.map(saved => saved.id === item.id ? entry : saved) : [...items, entry]));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}
