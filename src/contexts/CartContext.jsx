import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
      localStorage.removeItem('cart');
    }
  }, []);

  useEffect(() => {
    try {
      const cartToSave = cartItems.map(item => {
        const { uploadedDesigns, ...restOfItem } = item;
        const sanitizedDesigns = {};
        if (uploadedDesigns) {
          for (const key in uploadedDesigns) {
            const { file, url, ...restOfDesign } = uploadedDesigns[key];
            sanitizedDesigns[key] = restOfDesign;
          }
        }
        return { ...restOfItem, uploadedDesigns: sanitizedDesigns };
      });
      localStorage.setItem('cart', JSON.stringify(cartToSave));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = (item) => {
    const newItem = {
      id: Date.now().toString(),
      ...item,
      timestamp: new Date().toISOString()
    };
    setCartItems(prev => [...prev, newItem]);
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateCartItem = (itemId, updates) => {
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = Object.values(item.sizeMatrix || {}).reduce((sum, qty) => sum + qty, 0);
      return total + itemTotal;
    }, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      getTotalItems,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};