export const collections = {
  'living-room': { label: 'Living Room', title: 'Living Room Furniture', description: 'Made for good company. Chosen for everyday living.', categories: ['Sofas', 'Chairs', 'Storage', 'Lighting'] },
  bedroom: { label: 'Bedroom', title: 'Bedroom Furniture', description: 'Create a softer place to land.', categories: ['Bedroom', 'Beds', 'Bedside Tables', 'Bedroom Storage', 'Bedroom Seating'] },
  'kitchen-dining': { label: 'Kitchen & Dining', title: 'Kitchen & Dining Furniture', description: 'Made for slow mornings and shared meals.', categories: ['Dining', 'Dining Tables', 'Dining Chairs', 'Sideboards', 'Dining Lighting', 'Kitchen'] },
  office: { label: 'Office Furniture', title: 'Office Furniture', description: 'Make space for your best ideas.', categories: ['Office', 'Tables', 'Desks', 'Office Seating', 'Office Storage', 'Desk Lighting'] },
  'lighting-decor': { label: 'Lighting & Decor', title: 'Lighting & Decor', description: 'The finishing touches that feel like you.', categories: ['Lighting', 'Decor', 'Table Lamps', 'Wall Art', 'Room Styling', 'Decorative Storage'] },
  sale: { label: 'Sale', title: 'Furniture Sale', description: 'Considered design, a little less.', categories: [] },
};
export type CollectionId = keyof typeof collections;
