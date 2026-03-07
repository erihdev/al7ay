import { createContext } from 'react';
import { CartItem } from '@/types/cart';

export interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
