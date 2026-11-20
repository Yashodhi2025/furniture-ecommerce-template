export const REVIEW_STORAGE_KEY = 'lumi-living-product-reviews';
export const REVIEW_CHANGE_EVENT = 'lumi-review-change';

export type ProductReview = {
  id: string;
  productId: string;
  rating: number;
  name: string;
  comment: string;
  createdAt: string;
};

export function readProductReviews(productId: string): ProductReview[] {
  try {
    const raw = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) ?? '{}');
    const stored = raw && typeof raw === 'object' ? (raw as Record<string, unknown>)[productId] : [];
    if (!Array.isArray(stored)) return [];
    return stored.filter((review): review is ProductReview =>
      Boolean(review) &&
      typeof review === 'object' &&
      typeof (review as ProductReview).id === 'string' &&
      typeof (review as ProductReview).name === 'string' &&
      typeof (review as ProductReview).comment === 'string' &&
      typeof (review as ProductReview).createdAt === 'string' &&
      Number.isInteger((review as ProductReview).rating) &&
      (review as ProductReview).rating >= 1 &&
      (review as ProductReview).rating <= 5
    );
  } catch {
    return [];
  }
}

export function addProductReview(review: Omit<ProductReview, 'id' | 'createdAt'>) {
  let groups: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) ?? '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) groups = parsed as Record<string, unknown>;
  } catch {
    groups = {};
  }

  const existing = readProductReviews(review.productId);
  const saved: ProductReview = {
    ...review,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  groups[review.productId] = [saved, ...existing];
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(groups));
  window.dispatchEvent(new Event(REVIEW_CHANGE_EVENT));
  return saved;
}
