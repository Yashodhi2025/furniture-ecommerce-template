import type { ProductItem } from '@deneb-ui/ui';
import type { CollectionId } from './collections';

export const livingCategories = ['Sofas', 'Chairs', 'Storage', 'Lighting'];
export function isLivingProduct(product: ProductItem) {
  return livingCategories.some(category => category.toLowerCase() === String(product.category ?? '').toLowerCase()) || ['armchairs', 'coffee tables', 'side tables', 'tv units', 'shelving'].includes(String(product.category ?? '').toLowerCase());
}
export function productPhotos(product: Pick<ProductItem, 'imageUrl' | 'gallery'>, index: number) {
  return [
    ...(product.imageUrl ? [{ src: product.imageUrl, path: `products[${index}].imageUrl` }] : []),
    // Keep every string slot, including empty uploads and duplicate URLs, bound
    // to its original array index so the editor can replace or remove it.
    ...(Array.isArray(product.gallery) ? product.gallery.flatMap((src, photoIndex) => typeof src === 'string' ? [{ src, path: `products[${index}].gallery[${photoIndex}]` }] : []) : []),
  ];
}
export const productHref = (id: ProductItem['id'], collectionId?: CollectionId) => `/products/detail/?id=${encodeURIComponent(String(id ?? ''))}${collectionId ? `&collection=${encodeURIComponent(collectionId)}` : ''}`;
export const formatPrice = (value: unknown) => Number.isFinite(Number(value)) ? `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(Number(value))}` : '';
