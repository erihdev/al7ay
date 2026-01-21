import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

interface ProviderCartContextType {
  items: CartItem[];
  providerId: string | null;
  providerName: string | null;
  addItem: (item: Omit<CartItem, 'id'>, providerId: string, providerName: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const ProviderCartContext = createContext<ProviderCartContextType | undefined>(undefined);

export function ProviderCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('provider-cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setProviderId(parsed.providerId || null);
        setProviderName(parsed.providerName || null);
      } catch {
        // Silent fail for parse errors
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('provider-cart', JSON.stringify({
      items,
      providerId,
      providerName
    }));
  }, [items, providerId, providerName]);

  const addItem = useCallback((item: Omit<CartItem, 'id'>, newProviderId: string, newProviderName: string) => {
    // If cart has items from different provider, clear it first
    setProviderId((currentProviderId) => {
      if (currentProviderId && currentProviderId !== newProviderId) {
        setItems([]);
      }
      return newProviderId;
    });
    
    setProviderName(newProviderName);

    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i => 
          i.productId === item.productId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.id !== id);
      if (newItems.length === 0) {
        setProviderId(null);
        setProviderName(null);
      }
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => {
        const newItems = prev.filter(i => i.id !== id);
        if (newItems.length === 0) {
          setProviderId(null);
          setProviderName(null);
        }
        return newItems;
      });
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setProviderId(null);
    setProviderName(null);
  }, []);

  // Memoize calculated values
  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
    [items]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      items,
      providerId,
      providerName,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }),
    [items, providerId, providerName, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice]
  );

  return (
    <ProviderCartContext.Provider value={value}>
      {children}
    </ProviderCartContext.Provider>
  );
}

export function useProviderCart() {
  const context = useContext(ProviderCartContext);
  if (!context) {
    throw new Error('useProviderCart must be used within a ProviderCartProvider');
  }
  return context;
}
