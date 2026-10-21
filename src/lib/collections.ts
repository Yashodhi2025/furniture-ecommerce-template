export const collections = {
  'living-room': { pageId: 'living_room', label: 'Living Room', title: 'Living Room Furniture', description: 'Made for good company. Chosen for everyday living.', categories: ['Sofas', 'Chairs', 'Storage', 'Lighting', 'Coffee Tables', 'Side Tables', 'TV Units', 'Shelving'] },
  bedroom: { pageId: 'bedroom', label: 'Bedroom', title: 'Bedroom Furniture', description: 'Create a softer place to land.', categories: ['Bedroom', 'Beds', 'Bedside Tables', 'Bedroom Storage', 'Bedroom Seating'] },
  'kitchen-dining': { pageId: 'kitchen_dining', label: 'Kitchen & Dining', title: 'Kitchen & Dining Furniture', description: 'Made for slow mornings and shared meals.', categories: ['Dining', 'Dining Tables', 'Dining Chairs', 'Sideboards', 'Dining Lighting', 'Kitchen'] },
  office: { pageId: 'office', label: 'Office Furniture', title: 'Office Furniture', description: 'Make space for your best ideas.', categories: ['Office', 'Tables', 'Desks', 'Office Seating', 'Office Storage', 'Desk Lighting'] },
  'lighting-decor': { pageId: 'lighting_decor', label: 'Lighting & Decor', title: 'Lighting & Decor', description: 'The finishing touches that feel like you.', categories: ['Lighting', 'Decor', 'Table Lamps', 'Wall Art', 'Room Styling', 'Decorative Storage'] },
  sale: { pageId: 'sale', label: 'Sale', title: 'Furniture Sale', description: 'Considered design, a little less.', categories: [] },
};
export type CollectionId = keyof typeof collections;

/** Menu groups include legacy sample categories without changing existing products. */
const filterGroups: Partial<Record<CollectionId, Record<string, string[]>>> = {
  'living-room': { 'Coffee Tables': ['Coffee Tables', 'Side Tables'], Storage: ['Storage', 'TV Units', 'Shelving'] },
  bedroom: { Beds: ['Beds', 'Bedroom'] },
  'kitchen-dining': { 'Dining Tables': ['Dining Tables', 'Dining'] },
  office: { Desks: ['Desks', 'Tables'] },
  'lighting-decor': { 'Table Lamps': ['Table Lamps', 'Lighting'] },
  sale: {
    Chairs: ['Chairs', 'Dining Chairs', 'Office Seating', 'Bedroom Seating'],
    Tables: ['Tables', 'Coffee Tables', 'Side Tables', 'Dining Tables', 'Desks'],
    Storage: ['Storage', 'TV Units', 'Shelving', 'Bedroom Storage', 'Office Storage', 'Sideboards', 'Decorative Storage'],
  },
};

export function matchesCollectionFilter(category: unknown, filter: string, collectionId: CollectionId) {
  if (!filter) return true;
  const allowed = filterGroups[collectionId]?.[filter] ?? [filter];
  return allowed.some(value => value.toLowerCase() === String(category ?? '').toLowerCase());
}

export function saleOriginalPrice(product: { price?: unknown; compareAtPrice?: unknown; originalPrice?: unknown }) {
  const price = Number(product.price);
  const original = Number(product.compareAtPrice ?? product.originalPrice);
  return Number.isFinite(price) && price > 0 && Number.isFinite(original) && original > price ? original : undefined;
}

export function isCollectionId(value: string | null | undefined): value is CollectionId {
  return Boolean(value && Object.hasOwn(collections, value));
}

export function productCollection(category: unknown, source?: string | null): CollectionId {
  if (isCollectionId(source)) return source;
  const normalized = String(category ?? '').toLowerCase();
  const candidates: CollectionId[] = ['bedroom', 'kitchen-dining', 'office', 'lighting-decor', 'living-room'];
  return candidates.find(id => collections[id].categories.some(value => value.toLowerCase() === normalized)) ?? 'living-room';
}
