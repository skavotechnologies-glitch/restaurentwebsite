import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      localStorage.removeItem('qr_restaurant_cart');
    } catch {}
    return [];
  });

  const [tableInfo, setTableInfo] = useState(() => {
    const saved = localStorage.getItem('qr_restaurant_table');
    return saved ? JSON.parse(saved) : null;
  });

  const [customerInfo, setCustomerInfo] = useState(() => {
    return { name: '', phone: '', instructions: '' };
  });

  // Track all order IDs placed in this customer's dining session
  const [sessionOrderIds, setSessionOrderIds] = useState(() => {
    try {
      const saved = localStorage.getItem('qr_restaurant_session_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addSessionOrder = (orderId) => {
    if (!orderId) return;
    setSessionOrderIds(prev => {
      const updated = prev.includes(orderId) ? prev : [...prev, orderId];
      try {
        localStorage.setItem('qr_restaurant_session_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearSessionOrders = () => {
    setSessionOrderIds([]);
    try {
      localStorage.removeItem('qr_restaurant_session_orders');
    } catch {}
  };

  useEffect(() => {
    localStorage.setItem('qr_restaurant_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (tableInfo) {
      localStorage.setItem('qr_restaurant_table', JSON.stringify(tableInfo));
    }
  }, [tableInfo]);

  useEffect(() => {
    localStorage.setItem('qr_restaurant_customer', JSON.stringify(customerInfo));
  }, [customerInfo]);

  const addToCart = (menuItem, quantity = 1, specialInstructions = '') => {
    if (!menuItem.isAvailable) return false;

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === menuItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + quantity,
          specialInstructions: specialInstructions || existing.specialInstructions
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: menuItem.id,
            name: menuItem.name,
            price: Number(menuItem.price),
            prepTime: Number(menuItem.prepTime) || 10,
            image: menuItem.image,
            foodType: menuItem.foodType,
            quantity: Math.max(1, quantity),
            specialInstructions: specialInstructions || ''
          }
        ];
      }
    });
    return true;
  };

  const updateQuantity = (itemId, newQuantity) => {
    setCartItems(prev => {
      if (newQuantity <= 0) {
        return prev.filter(item => item.id !== itemId);
      }
      return prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const updateItemInstructions = (itemId, instructions) => {
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, specialInstructions: instructions } : item
    ));
  };

  const removeItem = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('qr_restaurant_cart');
  };

  const getItemQuantity = (itemId) => {
    const item = cartItems.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const totalItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  // Max prep time among items in the cart
  const estimatedOrderWaitTime = useMemo(() => {
    if (cartItems.length === 0) return 0;
    return Math.max(...cartItems.map(i => i.prepTime || 10));
  }, [cartItems]);

  // Calculations based on active restaurant billing configuration
  const calculateTotals = (billingConfig = {}) => {
    const gstEnabled = billingConfig.gstEnabled ?? true;
    const cGstRate = gstEnabled ? (billingConfig.cGstRate ?? 2.5) : 0;
    const sGstRate = gstEnabled ? (billingConfig.sGstRate ?? 2.5) : 0;
    const serviceChargeRate = billingConfig.serviceChargeRate ?? 0;
    const discountRate = billingConfig.discountRate ?? 0;

    const discountAmount = Number(((subtotal * discountRate) / 100).toFixed(2));
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    
    const cGstAmount = Number(((taxableAmount * cGstRate) / 100).toFixed(2));
    const sGstAmount = Number(((taxableAmount * sGstRate) / 100).toFixed(2));
    const totalTax = Number((cGstAmount + sGstAmount).toFixed(2));

    const serviceChargeAmount = Number(((taxableAmount * serviceChargeRate) / 100).toFixed(2));
    const grandTotal = Number((taxableAmount + totalTax + serviceChargeAmount).toFixed(2));

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cGstRate,
      cGstAmount,
      sGstRate,
      sGstAmount,
      totalTax,
      serviceChargeRate,
      serviceChargeAmount,
      grandTotal,
      estimatedOrderWaitTime
    };
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      totalItemCount,
      subtotal,
      estimatedOrderWaitTime,
      tableInfo,
      setTableInfo,
      customerInfo,
      setCustomerInfo,
      sessionOrderIds,
      addSessionOrder,
      clearSessionOrders,
      addToCart,
      updateQuantity,
      updateItemInstructions,
      removeItem,
      clearCart,
      getItemQuantity,
      calculateTotals
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
