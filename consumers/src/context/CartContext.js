import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_KEY = "consumer_cart";
const CartContext = createContext(null);

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (error) {
      // ignore storage errors (private browsing, quota, etc.)
    }
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const maxQty = product.inventory;
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, maxQty) }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          mrp: product.mrp,
          inventory: product.inventory,
          retailerName: product.retailer?.companyName,
          quantity: Math.min(quantity, maxQty),
        },
      ];
    });
  };

  const removeItem = (productId) =>
    setItems((prev) => prev.filter((item) => item.productId !== productId));

  const updateQuantity = (productId, quantity) =>
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, Math.min(quantity, item.inventory)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );

  const clearCart = () => setItems([]);

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
