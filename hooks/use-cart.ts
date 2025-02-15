// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { CartItem, MenuItem } from '@/app/types';

// interface CartStore {
//   items: CartItem[];
//   addItem: (item: MenuItem) => void;
//   removeItem: (itemId: string) => void;
//   updateQuantity: (itemId: string, quantity: number) => void;
//   clearCart: () => void;
//   total: number;
// }

// export const useCart = create<CartStore>()(
//   persist(
//     (set, get) => ({
//       items: [],
//       addItem: (item: MenuItem) =>
//         set((state) => {
//           const existingItem = state.items.find((i) => i.id === item.id);
//           if (existingItem) {
//             return {
//               items: state.items.map((i) =>
//                 i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
//               ),
//             };
//           }
//           return { items: [...state.items, { ...item, quantity: 1 }] };
//         }),
//       removeItem: (itemId: string) =>
//         set((state) => ({
//           items: state.items.filter((i) => i.id !== itemId),
//         })),
//       updateQuantity: (itemId: string, quantity: number) =>
//         set((state) => ({
//           items: state.items.map((i) =>
//             i.id === itemId ? { ...i, quantity: Math.max(0, quantity) } : i
//           ),
//         })),
//       clearCart: () => set({ items: [] }),
//       get total() {
//         return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
//       },
//     }),
//     {
//       name: 'cart-storage',
//     }
//   )
// );