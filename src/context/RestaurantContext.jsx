import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { 
  DEMO_RESTAURANT, 
  DEMO_CATEGORIES, 
  DEMO_MENU_ITEMS, 
  DEMO_TABLES, 
  DEMO_ORDERS 
} from '../data/demoData';
import { playOrderAlert, testNotificationSound } from '../utils/sound';

const RestaurantContext = createContext(null);

export function RestaurantProvider({ children }) {
  const [activeSlug, setActiveSlug] = useState('naachi-cafe');

  // Restaurant details & settings
  const [restaurant, setRestaurant] = useState(() => {
    const saved = localStorage.getItem(`qr_rest_${activeSlug}`);
    return saved ? JSON.parse(saved) : DEMO_RESTAURANT;
  });

  // Categories
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem(`qr_cats_${activeSlug}`);
    return saved ? JSON.parse(saved) : DEMO_CATEGORIES;
  });

  // Menu Items (with prepTime in minutes)
  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem(`qr_menu_${activeSlug}`);
    return saved ? JSON.parse(saved) : DEMO_MENU_ITEMS;
  });

  // Tables
  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem(`qr_tables_${activeSlug}`);
    return saved ? JSON.parse(saved) : DEMO_TABLES;
  });

  // Orders
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(`qr_orders_${activeSlug}`);
    return saved ? JSON.parse(saved) : DEMO_ORDERS;
  });

  // Notification sound preference
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('qr_notification_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Track acknowledged order IDs to prevent repeat alert audio
  const [seenOrderIds, setSeenOrderIds] = useState(() => new Set(orders.map(o => o.id)));

  // Persist local state whenever changes happen
  useEffect(() => {
    localStorage.setItem(`qr_rest_${activeSlug}`, JSON.stringify(restaurant));
  }, [restaurant, activeSlug]);

  useEffect(() => {
    localStorage.setItem(`qr_cats_${activeSlug}`, JSON.stringify(categories));
  }, [categories, activeSlug]);

  useEffect(() => {
    localStorage.setItem(`qr_menu_${activeSlug}`, JSON.stringify(menuItems));
  }, [menuItems, activeSlug]);

  useEffect(() => {
    localStorage.setItem(`qr_tables_${activeSlug}`, JSON.stringify(tables));
  }, [tables, activeSlug]);

  useEffect(() => {
    localStorage.setItem(`qr_orders_${activeSlug}`, JSON.stringify(orders));
  }, [orders, activeSlug]);

  useEffect(() => {
    localStorage.setItem('qr_notification_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Real-time listener for Orders on reception laptop (Firebase or local event bus)
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      try {
        const ordersRef = collection(db, 'restaurants', activeSlug, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedOrders = [];
          snapshot.forEach((doc) => {
            fetchedOrders.push({ id: doc.id, ...doc.data() });
          });

          // Ring reception alert chime for newly arriving table orders
          setSeenOrderIds((prevSeen) => {
            const newOrders = fetchedOrders.filter(o => !prevSeen.has(o.id) && !o.isBilled);
            if (newOrders.length > 0 && soundEnabled) {
              playOrderAlert();
            }
            return new Set(fetchedOrders.map(o => o.id));
          });

          setOrders(fetchedOrders);
        }, (err) => {
          console.warn('Firestore orders onSnapshot warning:', err);
        });

        return () => unsubscribe();
      } catch (err) {
        console.warn('Firestore listener setup failed:', err);
      }
    } else {
      // Local event listener for cross-tab or same-window order notification to reception
      const handleCustomOrderEvent = (e) => {
        if (e.detail && e.detail.order) {
          const newOrder = e.detail.order;
          setOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
          if (soundEnabled) {
            playOrderAlert();
          }
        }
      };

      const handleStorageEvent = (e) => {
        if (e.key === `qr_orders_${activeSlug}` && e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            setOrders(updated);
          } catch (err) {}
        }
      };

      window.addEventListener('qr_new_order_placed', handleCustomOrderEvent);
      window.addEventListener('storage', handleStorageEvent);

      return () => {
        window.removeEventListener('qr_new_order_placed', handleCustomOrderEvent);
        window.removeEventListener('storage', handleStorageEvent);
      };
    }
  }, [activeSlug, isFirebaseConfigured, soundEnabled]);

  // Derive Table occupancy dynamically based on active orders
  const tablesWithLiveStatus = useMemo(() => {
    const activeTableIds = new Set(
      orders
        .filter(o => !o.isBilled)
        .map(o => o.tableId)
    );

    return tables.map(t => ({
      ...t,
      status: activeTableIds.has(t.id) ? 'occupied' : 'available',
      hasActiveOrder: activeTableIds.has(t.id)
    }));
  }, [tables, orders]);

  // Submit Customer Order: calculates waiting time for the customer and routes order to reception laptop
  const submitCustomerOrder = useCallback(async ({
    customerName,
    customerPhone,
    tableId,
    tableName,
    items,
    specialInstructions = ''
  }) => {
    if (!items || items.length === 0) {
      throw new Error('Your cart is empty.');
    }
    if (!customerName || !customerName.trim()) {
      throw new Error('Please enter your name.');
    }
    if (!customerPhone || !/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }
    if (!tableId) {
      throw new Error('Please select or scan a valid table QR code.');
    }

    // 1. Validate cart items against current menu snapshot & compute waiting times
    const validatedItems = [];
    let calculatedSubtotal = 0;
    let maxWaitMinutes = 10;

    for (const cartItem of items) {
      const liveItem = menuItems.find(m => m.id === cartItem.id);
      if (!liveItem) {
        throw new Error(`Item "${cartItem.name}" is no longer available on our menu.`);
      }
      if (!liveItem.isAvailable) {
        throw new Error(`Item "${liveItem.name}" is currently sold out.`);
      }

      const verifiedPrice = Number(liveItem.price);
      const prepTime = Number(liveItem.prepTime) || 10;
      if (prepTime > maxWaitMinutes) {
        maxWaitMinutes = prepTime;
      }

      const qty = Math.max(1, parseInt(cartItem.quantity, 10));
      const lineTotal = verifiedPrice * qty;

      calculatedSubtotal += lineTotal;

      validatedItems.push({
        menuItemId: liveItem.id,
        itemName: liveItem.name,
        priceAtOrder: verifiedPrice,
        prepTime,
        quantity: qty,
        lineTotal,
        foodType: liveItem.foodType,
        specialInstructions: cartItem.specialInstructions || ''
      });
    }

    // 2. Accurate Tax and Charge Calculations from Restaurant Billing Settings
    const billingConfig = restaurant.billing || {};
    const gstEnabled = billingConfig.gstEnabled ?? true;
    const cGstRate = gstEnabled ? (billingConfig.cGstRate ?? 2.5) : 0;
    const sGstRate = gstEnabled ? (billingConfig.sGstRate ?? 2.5) : 0;
    const serviceChargeRate = billingConfig.serviceChargeRate ?? 0;
    const discountRate = billingConfig.discountRate ?? 0;

    const discountAmount = Number(((calculatedSubtotal * discountRate) / 100).toFixed(2));
    const taxableAmount = Math.max(0, calculatedSubtotal - discountAmount);

    const cGstAmount = Number(((taxableAmount * cGstRate) / 100).toFixed(2));
    const sGstAmount = Number(((taxableAmount * sGstRate) / 100).toFixed(2));
    const totalTax = Number((cGstAmount + sGstAmount).toFixed(2));
    const serviceChargeAmount = Number(((taxableAmount * serviceChargeRate) / 100).toFixed(2));

    const grandTotal = Number((taxableAmount + totalTax + serviceChargeAmount).toFixed(2));

    // 3. Generate sequential order number
    const maxExisting = orders.reduce((max, o) => {
      const match = o.orderNumber?.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 1000;
      return Math.max(max, num);
    }, 1048);

    const nextNumber = maxExisting + 1;
    const orderNumber = `ORD-${nextNumber}`;
    const orderId = `${orderNumber.toLowerCase()}-${Date.now().toString(36)}`;

    const now = new Date();
    const readyAtDate = new Date(now.getTime() + maxWaitMinutes * 60 * 1000);

    const newOrder = {
      id: orderId,
      orderNumber,
      restaurantId: activeSlug,
      tableId,
      tableName: tableName || `Table ${tableId}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: validatedItems,
      itemCount: validatedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: calculatedSubtotal,
      taxDetails: {
        gstEnabled,
        cGstRate,
        cGstAmount,
        sGstRate,
        sGstAmount,
        totalTax
      },
      serviceCharge: serviceChargeAmount,
      discount: discountAmount,
      total: grandTotal,
      
      // Waiting time replacing multi-stage status
      estimatedWaitTime: maxWaitMinutes,
      readyAt: readyAtDate.toISOString(),
      
      // Reception billing indicator
      isBilled: false,
      billedAt: null,
      
      specialInstructions: specialInstructions.trim(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // 4. Save to Firestore or Local Storage
    if (isFirebaseConfigured && db) {
      try {
        const orderDocRef = doc(db, 'restaurants', activeSlug, 'orders', orderId);
        await setDoc(orderDocRef, newOrder);
      } catch (err) {
        console.error('Firestore order write error:', err);
      }
    }

    // Update local state & broadcast to reception laptop
    setOrders(prev => [newOrder, ...prev]);
    setSeenOrderIds(prev => new Set([...prev, orderId]));

    window.dispatchEvent(new CustomEvent('qr_new_order_placed', {
      detail: { order: newOrder }
    }));

    if (soundEnabled) {
      playOrderAlert();
    }

    return {
      success: true,
      orderId,
      orderNumber,
      order: newOrder
    };
  }, [menuItems, orders, activeSlug, restaurant, soundEnabled]);

  // Reception laptop marks order as Billed & Sent to Kitchen
  const markOrderBilled = async (orderId) => {
    const timestamp = new Date().toISOString();
    const updatePayload = {
      isBilled: true,
      billedAt: timestamp,
      updatedAt: timestamp
    };

    if (isFirebaseConfigured && db) {
      try {
        const orderRef = doc(db, 'restaurants', activeSlug, 'orders', orderId);
        await updateDoc(orderRef, updatePayload);
      } catch (err) {
        console.warn('Firestore markOrderBilled error:', err);
      }
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatePayload } : o));
  };

  // Generate / Reprint Bill & Kitchen Order Ticket (KOT)
  const generateBill = (orderId, customTaxConfig = null) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const billingConfig = customTaxConfig || restaurant.billing || {};
    const billNumber = `BILL-${order.orderNumber.replace('ORD-', '')}`;

    return {
      billNumber,
      orderNumber: order.orderNumber,
      orderId: order.id,
      restaurant: {
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        gstin: billingConfig.gstin || restaurant.billing?.gstin || '',
        logo: restaurant.logo,
        footerMessage: billingConfig.billFooterMessage || "Thank you! Please pay directly at the counter."
      },
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        table: order.tableName
      },
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      taxDetails: order.taxDetails,
      serviceCharge: order.serviceCharge || 0,
      total: order.total,
      estimatedWaitTime: order.estimatedWaitTime || 10,
      isBilled: order.isBilled,
      billedAt: order.billedAt,
      date: order.createdAt,
      generatedAt: new Date().toISOString()
    };
  };

  // Menu Items Management (CRUD) with Prep Time support
  const addMenuItem = async (itemData) => {
    const newItem = {
      id: `item-${Date.now().toString(36)}`,
      restaurantId: activeSlug,
      isAvailable: true,
      isBestseller: false,
      prepTime: Number(itemData.prepTime) || 10,
      order: menuItems.length + 1,
      ...itemData,
      price: Number(itemData.price),
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'restaurants', activeSlug, 'menuItems', newItem.id), newItem);
      } catch (err) {}
    }

    setMenuItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updateMenuItem = async (itemId, updates) => {
    const parsedUpdates = {
      ...updates,
      ...(updates.price !== undefined ? { price: Number(updates.price) } : {}),
      ...(updates.prepTime !== undefined ? { prepTime: Number(updates.prepTime) } : {}),
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'restaurants', activeSlug, 'menuItems', itemId), parsedUpdates);
      } catch (err) {}
    }

    setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, ...parsedUpdates } : item));
  };

  const deleteMenuItem = async (itemId) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'restaurants', activeSlug, 'menuItems', itemId));
      } catch (err) {}
    }
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Categories Management (CRUD)
  const addCategory = async (catData) => {
    const newCat = {
      id: `cat-${Date.now().toString(36)}`,
      restaurantId: activeSlug,
      isActive: true,
      order: categories.length + 1,
      ...catData
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'restaurants', activeSlug, 'categories', newCat.id), newCat);
      } catch (err) {}
    }

    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = async (catId, updates) => {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'restaurants', activeSlug, 'categories', catId), updates);
      } catch (err) {}
    }
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, ...updates } : c));
  };

  const deleteCategory = async (catId) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'restaurants', activeSlug, 'categories', catId));
      } catch (err) {}
    }
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  // Tables Management (CRUD)
  const addTable = async (tableData) => {
    const newTable = {
      id: `T${(tables.length + 1).toString().padStart(2, '0')}`,
      restaurantId: activeSlug,
      isActive: true,
      capacity: 4,
      ...tableData
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'restaurants', activeSlug, 'tables', newTable.id), newTable);
      } catch (err) {}
    }

    setTables(prev => [...prev, newTable]);
    return newTable;
  };

  const updateTable = async (tableId, updates) => {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'restaurants', activeSlug, 'tables', tableId), updates);
      } catch (err) {}
    }
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
  };

  const deleteTable = async (tableId) => {
    const hasActiveOrder = orders.some(o => o.tableId === tableId && !o.isBilled);
    if (hasActiveOrder) {
      throw new Error('Cannot delete a table with an active unbilled order. Please generate bill or clear order first.');
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'restaurants', activeSlug, 'tables', tableId));
      } catch (err) {}
    }

    setTables(prev => prev.filter(t => t.id !== tableId));
  };

  // Restaurant Settings
  const updateRestaurantSettings = async (updates) => {
    const merged = { ...restaurant, ...updates };
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'restaurants', activeSlug), updates);
      } catch (err) {}
    }
    setRestaurant(merged);
  };

  // Reset demo
  const resetDemoData = () => {
    setRestaurant(DEMO_RESTAURANT);
    setCategories(DEMO_CATEGORIES);
    setMenuItems(DEMO_MENU_ITEMS);
    setTables(DEMO_TABLES);
    setOrders(DEMO_ORDERS);
    localStorage.removeItem(`qr_rest_${activeSlug}`);
    localStorage.removeItem(`qr_cats_${activeSlug}`);
    localStorage.removeItem(`qr_menu_${activeSlug}`);
    localStorage.removeItem(`qr_tables_${activeSlug}`);
    localStorage.removeItem(`qr_orders_${activeSlug}`);
  };

  return (
    <RestaurantContext.Provider value={{
      activeSlug,
      setActiveSlug,
      restaurant,
      updateRestaurantSettings,
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      menuItems,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      tables: tablesWithLiveStatus,
      rawTables: tables,
      addTable,
      updateTable,
      deleteTable,
      orders,
      submitCustomerOrder,
      markOrderBilled,
      generateBill,
      soundEnabled,
      setSoundEnabled,
      testNotificationSound,
      resetDemoData
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
