// Plans defined in the app. The database `plans` table is seeded with the
// same values (src/lib/schema.sql); the demo account uses these directly.

export interface PlanRow {
  id: number;
  name: string;
  price: number;
  original_price: number;
  duration_days: number;
  description: string;
}

export const DEFAULT_PLANS: PlanRow[] = [
  { id: 1, name: '3 Day Pass', price: 167, original_price: 167, duration_days: 3, description: 'Quick binge access' },
  { id: 2, name: 'Fortnight', price: 1, original_price: 199, duration_days: 15, description: '15 din ka pura mazza' },
  { id: 3, name: 'Monthly', price: 299, original_price: 299, duration_days: 30, description: 'Poora mahine ka mazza' },
  { id: 4, name: 'Quarterly', price: 499, original_price: 499, duration_days: 90, description: '3 mahine, ek saath bachat' },
];
