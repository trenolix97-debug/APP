import { create } from 'zustand';
import { CartItem, Restaurant } from '../types';

interface StoreState {
  cart: CartItem[];
  currentRestaurant: Restaurant | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemName: string) => void;
  updateQuantity: (itemName: string, quantity: number) => void;
  clearCart: () => void;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  getTotalPrice: () => number;
}

export const useStore = create<StoreState>((set, get) => ({
  cart: [],
  currentRestaurant: null,

  addToCart: (item: CartItem) => {
    const cart = get().cart;
    const existingItem = cart.find((i) => i.name === item.name);
    
    if (existingItem) {
      set({
        cart: cart.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }] });
    }
  },

  removeFromCart: (itemName: string) => {
    set({ cart: get().cart.filter((item) => item.name !== itemName) });
  },

  updateQuantity: (itemName: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(itemName);
    } else {
      set({
        cart: get().cart.map((item) =>
          item.name === itemName ? { ...item, quantity } : item
        ),
      });
    }
  },

  clearCart: () => set({ cart: [], currentRestaurant: null }),

  setCurrentRestaurant: (restaurant: Restaurant | null) =>
    set({ currentRestaurant: restaurant }),

  getTotalPrice: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
