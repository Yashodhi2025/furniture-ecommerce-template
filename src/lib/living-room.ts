import type { ProductItem } from '@deneb-ui/ui';

export const livingCategories = ['Sofas', 'Chairs', 'Storage', 'Lighting'];
export function isLivingProduct(product: ProductItem) {
  return livingCategories.some(category => category.toLowerCase() === String(product.category ?? '').toLowerCase()) || ['armchairs', 'coffee tables', 'side tables', 'tv units', 'shelving'].includes(String(product.category ?? '').toLowerCase());
}
export function productPhotos(product: Pick<ProductItem, 'imageUrl' | 'gallery'>, index: number) {
  return [
    ...(product.imageUrl ? [{ src: product.imageUrl, path: `products[${index}].imageUrl` }] : []),
    ...(Array.isArray(product.gallery) ? product.gallery.flatMap((src, photoIndex) => typeof src === 'string' && src && src !== product.imageUrl ? [{ src, path: `products[${index}].gallery[${photoIndex}]` }] : []) : []),
  ];
}
export const productHref = (id: ProductItem['id']) => `/products/detail/?id=${encodeURIComponent(String(id ?? ''))}`;
export const formatPrice = (value: unknown) => Number.isFinite(Number(value)) ? `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(Number(value))}` : '';
