import type { ProductItem } from '@deneb-ui/ui';
import type { CollectionId } from './collections';

export const livingCategories = ['Sofas', 'Chairs', 'Storage', 'Lighting'];
export function isLivingProduct(product: ProductItem) {
  return livingCategories.some(category => category.toLowerCase() === String(product.category ?? '').toLowerCase()) || ['armchairs', 'coffee tables', 'side tables', 'tv units', 'shelving'].includes(String(product.category ?? '').toLowerCase());
}
export function productPhotos(product: Pick<ProductItem, 'imageUrl' | 'gallery'>, index: number, editorSlots = false) {
  const gallery = Array.isArray(product.gallery) ? product.gallery : [];
  return [
    ...(product.imageUrl || editorSlots ? [{ src: product.imageUrl || '', path: `products[${index}].imageUrl` }] : []),
    // Cover + two additional slots. Filter empty uploads only for shoppers,
    // without renumbering real array indices or copying image URLs.
    ...Array.from({ length: editorSlots ? Math.max(2, gallery.length) : gallery.length }, (_, photoIndex) => {
      const src = typeof gallery[photoIndex] === 'string' ? gallery[photoIndex] : '';
      return { src, path: `products[${index}].gallery[${photoIndex}]` };
    }).filter(photo => editorSlots || photo.src.trim()),
  ];
}
export const productHref = (id: ProductItem['id'], collectionId?: CollectionId) => `/products/detail/?id=${encodeURIComponent(String(id ?? ''))}${collectionId ? `&collection=${encodeURIComponent(collectionId)}` : ''}`;
export const formatPrice = (value: unknown) => Number.isFinite(Number(value)) ? `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(Number(value))}` : '';
