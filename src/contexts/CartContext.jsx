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
  const [payload, setPayload] = useState({});

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      const savedPayload = localStorage.getItem('order_payload');
      if (savedPayload) {
        setPayload(JSON.parse(savedPayload));
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
            // Preserve the data URL and name so previews persist, but remove File objects
            const { file, ...restOfDesign } = uploadedDesigns[key] || {};
            const preserved = {};
            if (restOfDesign.url) preserved.url = restOfDesign.url;
            if (restOfDesign.name) preserved.name = restOfDesign.name;
            sanitizedDesigns[key] = preserved;
          }
        }
        return { ...restOfItem, uploadedDesigns: sanitizedDesigns };
      });
      localStorage.setItem('cart', JSON.stringify(cartToSave));
    try {
      // persist payload as well
      localStorage.setItem('order_payload', JSON.stringify(payload || {}));
    } catch (err) {
      // ignore
    }
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  // Persist payload whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('order_payload', JSON.stringify(payload || {}));
    } catch (err) {
      console.error('Failed to persist payload', err);
    }
  }, [payload]);

  const addToCart = (item) => {
    const newItem = {
      id: Date.now().toString(),
      ...item,
      timestamp: new Date().toISOString()
    };
    setCartItems(prev => {
      const next = [...prev, newItem];
      if (import.meta && import.meta.env && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('DEV addToCart payload', newItem, { nextCount: next.length });
      }
      // persist immediately (sanitized) to avoid race conditions when navigating
      try {
        const cartToSave = next.map(i => {
          const { uploadedDesigns, ...restOfItem } = i;
          const sanitizedDesigns = {};
          if (uploadedDesigns) {
            for (const key in uploadedDesigns) {
              const { file, ...restOfDesign } = uploadedDesigns[key] || {};
              const preserved = {};
              if (restOfDesign.url) preserved.url = restOfDesign.url;
              if (restOfDesign.name) preserved.name = restOfDesign.name;
              sanitizedDesigns[key] = preserved;
            }
          }
          return { ...restOfItem, uploadedDesigns: sanitizedDesigns };
        });
        localStorage.setItem('cart', JSON.stringify(cartToSave));
      } catch (error) {
        console.error('Failed to persist cart immediately', error);
      }
      return next;
    });
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

  // Payload helpers
  const mergePayload = (partial) => {
    setPayload(prev => {
      const next = { ...(prev || {}), ...(partial || {}) };
      try {
        localStorage.setItem('order_payload', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const clearPayload = () => {
    setPayload({});
    try { localStorage.removeItem('order_payload'); } catch (e) {}
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
      ,
      payload,
      setPayload,
      mergePayload,
      clearPayload
    }}>
      {children}
    </CartContext.Provider>
  );
};