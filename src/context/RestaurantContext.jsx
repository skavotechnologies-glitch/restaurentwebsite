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
import { db, isFirebaseConfigured, ensureGuestAuth } from '../firebase/config';
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

  // Orders (starts completely clean with 0 orders, purges all sample/demo orders)
  const [orders, setOrders] = useState(() => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('qr_orders_') || key.includes('session_orders') || key.includes('cart'))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
    return [];
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

  // Ensure guest session is authenticated on client startup
  useEffect(() => {
    if (isFirebaseConfigured) {
      ensureGuestAuth().catch(() => {});
    }
  }, [isFirebaseConfigured]);

  // Real-time listener for Orders on reception laptop (Firebase or local event bus)
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      try {
        const ordersRef = collection(db, 'restaurants', activeSlug, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedOrders = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const isLegacyDemo = ['ORD-1048', 'ORD-1047', 'ORD-1040'].includes(doc.id) ||
              ['ORD-1048', 'ORD-1047', 'ORD-1040'].includes(data.orderNumber) ||
              doc.id.startsWith('test-probe-');
            if (!isLegacyDemo) {
              fetchedOrders.push({ id: doc.id, ...data });
            }
          });

          // Ring reception alert chime for newly arriving table orders
          setSeenOrderIds((prevSeen) => {
            const newOrders = fetchedOrders.filter(o => !prevSeen.has(o.id) && !o.isBilled);
            if (newOrders.length > 0 && soundEnabled) {
              playOrderAlert();
            }
            return new Set(fetchedOrders.map(o => o.id));
          });

          // Seamless merge: ensure freshly placed in-flight local orders are not prematurely dropped
          setOrders((currentOrders) => {
            const remoteMap = new Map(fetchedOrders.map(o => [o.id, o]));
            const pendingLocalOrders = currentOrders.filter(localOrder => {
              if (remoteMap.has(localOrder.id)) return false;
              if (localOrder.createdAt) {
                const ageSeconds = (Date.now() - new Date(localOrder.createdAt).getTime()) / 1000;
                return ageSeconds < 600; // Keep local order if created within last 10 minutes
              }
              return true;
            });

            return [...pendingLocalOrders, ...fetchedOrders];
          });
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
    return tables.map(t => {
      // Find all orders placed at this table (matching tableId, tableName, or tableNumber)
      const tableOrders = orders.filter(o => 
        o.tableId === t.id || 
        (o.tableName && t.name && o.tableName.toLowerCase() === t.name.toLowerCase()) ||
        (t.tableNumber && o.tableName && o.tableName.toLowerCase() === `table ${t.tableNumber}`.toLowerCase())
      );

      // Active orders are any orders not yet paid/settled
      const activeOrders = tableOrders.filter(o => 
        !(o.isPaid || o.paymentStatus === 'paid' || o.status === 'paid')
      );

      const isOccupied = activeOrders.length > 0;
      const pendingTotal = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        ...t,
        status: isOccupied ? 'occupied' : 'available',
        hasActiveOrder: isOccupied,
        activeOrders,
        activeOrdersCount: activeOrders.length,
        allTableOrders: tableOrders,
        pendingTotal
      };
    });
  }, [tables, orders]);

  // Submit Customer Order: calculates waiting time for the customer and routes order to reception laptop
  const submitCustomerOrder = useCallback(async ({
    customerName,
    customerPhone,
    tableId,
    tableName,
    items,
    specialInstructions = '',
    paymentMethod = 'cash',
    paymentStatus = null,
    upiRef = '',
    upiDetails = null
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

      // Payment details (Option B: Cash on Delivery or Direct Owner UPI)
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus || (paymentMethod === 'upi' ? 'pending_verification' : 'unpaid'),
      upiRef: upiRef ? upiRef.trim() : '',
      upiDetails: upiDetails || (paymentMethod === 'upi' ? {
        upiId: billingConfig.upiId || 'naachicafe@okaxis',
        payeeName: billingConfig.upiPayeeName || restaurant.name || 'Restaurant Owner',
        amount: grandTotal,
        upiRef: upiRef ? upiRef.trim() : ''
      } : null),
      autoPrintRequested: paymentMethod === 'cash',
      
      specialInstructions: specialInstructions.trim(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // 4. Optimistically update local state & broadcast to reception laptop IMMEDIATELY
    setOrders(prev => [newOrder, ...prev]);
    setSeenOrderIds(prev => new Set([...prev, orderId]));

    window.dispatchEvent(new CustomEvent('qr_new_order_placed', {
      detail: { order: newOrder }
    }));

    if (soundEnabled) {
      playOrderAlert();
    }

    // 5. Cloud Firestore synchronization (reliable real-time cloud write)
    if (isFirebaseConfigured && db) {
      try {
        await ensureGuestAuth();
        const orderDocRef = doc(db, 'restaurants', activeSlug, 'orders', orderId);
        await Promise.race([
          setDoc(orderDocRef, newOrder),
          new Promise((resolve) => setTimeout(resolve, 2500))
        ]);
      } catch (err) {
        console.warn('Firestore cloud order sync notice:', err);
      }
    }

    return {
      success: true,
      orderId,
      orderNumber,
      order: newOrder
    };
  }, [menuItems, orders, activeSlug, restaurant, soundEnabled]);

  // Reception laptop settles orders (single order or multiple orders for a table/guest)
  const settleOrders = async (orderIds, paymentMethod = 'UPI') => {
    if (!orderIds || (Array.isArray(orderIds) && orderIds.length === 0)) return;
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
    const timestamp = new Date().toISOString();
    const updatePayload = {
      isBilled: true,
      isPaid: true,
      paymentStatus: 'paid',
      status: 'paid',
      paidAt: timestamp,
      paymentMethod,
      updatedAt: timestamp
    };

    // Optimistically update local state immediately
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, ...updatePayload } : o));

    if (isFirebaseConfigured && db) {
      try {
        await ensureGuestAuth();
        for (const id of ids) {
          const orderRef = doc(db, 'restaurants', activeSlug, 'orders', id);
          updateDoc(orderRef, updatePayload).catch(err => {
            console.warn('Firestore settleOrder notice for', id, err);
          });
        }
      } catch (err) {
        console.warn('Firestore settleOrders error:', err);
      }
    }
  };

  // Reception laptop dispatches order to kitchen (KOT printed, not paid yet)
  const markOrderBilled = async (orderId) => {
    if (!orderId) return;
    const timestamp = new Date().toISOString();
    const updatePayload = {
      isBilled: true,
      status: 'in_kitchen',
      billedAt: timestamp,
      updatedAt: timestamp
    };

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatePayload } : o));

    if (isFirebaseConfigured && db) {
      try {
        await ensureGuestAuth();
        const orderRef = doc(db, 'restaurants', activeSlug, 'orders', orderId);
        updateDoc(orderRef, updatePayload).catch(err => {
          console.warn('Firestore markOrderBilled notice for', orderId, err);
        });
      } catch (err) {
        console.warn('Firestore markOrderBilled error:', err);
      }
    }
  };

  // Explicit status changer (syncs across Tables, Orders, and Dashboard)
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId) return;
    const timestamp = new Date().toISOString();
    let updatePayload = { updatedAt: timestamp };

    if (newStatus === 'paid') {
      updatePayload = {
        ...updatePayload,
        isBilled: true,
        isPaid: true,
        paymentStatus: 'paid',
        status: 'paid',
        paidAt: timestamp
      };
    } else if (newStatus === 'in_kitchen' || newStatus === 'billed') {
      updatePayload = {
        ...updatePayload,
        isBilled: true,
        isPaid: false,
        paymentStatus: 'unpaid',
        status: 'in_kitchen',
        billedAt: timestamp
      };
    } else if (newStatus === 'new' || newStatus === 'pending') {
      updatePayload = {
        ...updatePayload,
        isBilled: false,
        isPaid: false,
        paymentStatus: 'unpaid',
        status: 'new',
        billedAt: null,
        paidAt: null
      };
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatePayload } : o));

    if (isFirebaseConfigured && db) {
      try {
        await ensureGuestAuth();
        const orderRef = doc(db, 'restaurants', activeSlug, 'orders', orderId);
        updateDoc(orderRef, updatePayload).catch(err => {
          console.warn('Firestore updateOrderStatus notice for', orderId, err);
        });
      } catch (err) {
        console.warn('Firestore updateOrderStatus error:', err);
      }
    }
  };

  // Generate / Reprint Bill & Kitchen Order Ticket (KOT)
  // Supports single order ID OR array of order IDs for a guest / full table
  const generateBill = (orderOrOrderIds, customTaxConfig = null) => {
    if (!orderOrOrderIds) return null;
    const ids = Array.isArray(orderOrOrderIds) ? orderOrOrderIds : [orderOrOrderIds];
    const matchingOrders = orders.filter(o => ids.includes(o.id));
    if (matchingOrders.length === 0) return null;

    const billingConfig = customTaxConfig || restaurant.billing || {};
    const primaryOrder = matchingOrders[0];
    const billNumber = `BILL-${matchingOrders.map(o => o.orderNumber?.replace('ORD-', '')).join('-')}`;

    // Consolidate dishes across all rounds
    const aggregatedItems = [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let grandTotal = 0;

    matchingOrders.forEach(ord => {
      subtotal += (ord.subtotal || 0);
      totalDiscount += (ord.discount || 0);
      totalTax += (ord.taxDetails?.totalTax || 0);
      grandTotal += (ord.total || 0);

      ord.items?.forEach(it => {
        const existing = aggregatedItems.find(x => x.menuItemId === it.menuItemId && x.itemName === it.itemName);
        if (existing) {
          existing.quantity += it.quantity;
          existing.lineTotal += it.lineTotal;
        } else {
          aggregatedItems.push({ ...it });
        }
      });
    });

    const uniqueNames = [...new Set(matchingOrders.map(o => o.customerName).filter(Boolean))].join(' & ');
    const uniquePhones = [...new Set(matchingOrders.map(o => o.customerPhone).filter(Boolean))].join(', ');

    return {
      billNumber,
      orderNumber: matchingOrders.map(o => o.orderNumber).join(', '),
      orderIds: ids,
      restaurant: {
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        gstin: billingConfig.gstin || restaurant.billing?.gstin || '',
        upiId: billingConfig.upiId || 'naachicafe@okaxis',
        upiPayeeName: billingConfig.upiPayeeName || restaurant.name,
        logo: restaurant.logo,
        footerMessage: billingConfig.billFooterMessage || "Thank you! Please pay directly at the counter."
      },
      customer: {
        name: uniqueNames || primaryOrder.customerName,
        phone: uniquePhones || primaryOrder.customerPhone,
        table: primaryOrder.tableName
      },
      items: aggregatedItems,
      subtotal,
      discount: totalDiscount,
      taxDetails: primaryOrder.taxDetails ? {
        ...primaryOrder.taxDetails,
        totalTax
      } : { totalTax },
      serviceCharge: 0,
      total: grandTotal,
      estimatedWaitTime: Math.max(...matchingOrders.map(o => o.estimatedWaitTime || 10)),
      isBilled: matchingOrders.every(o => o.isBilled),
      billedAt: primaryOrder.billedAt,
      paymentMethod: primaryOrder.paymentMethod || 'cash',
      paymentStatus: primaryOrder.paymentStatus || 'unpaid',
      upiRef: primaryOrder.upiRef || '',
      date: primaryOrder.createdAt,
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

  // Clear all sample / active orders completely
  const clearAllOrders = () => {
    setOrders([]);
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('qr_orders_') || key.includes('session_orders') || key.includes('cart'))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
  };

  // Reset demo
  const resetDemoData = () => {
    setRestaurant(DEMO_RESTAURANT);
    setCategories(DEMO_CATEGORIES);
    setMenuItems(DEMO_MENU_ITEMS);
    setTables(DEMO_TABLES);
    setOrders([]);
    localStorage.removeItem(`qr_rest_${activeSlug}`);
    localStorage.removeItem(`qr_cats_${activeSlug}`);
    localStorage.removeItem(`qr_menu_${activeSlug}`);
    localStorage.removeItem(`qr_tables_${activeSlug}`);
    localStorage.removeItem(`qr_orders_${activeSlug}`);
    localStorage.removeItem('qr_restaurant_session_orders');
    localStorage.removeItem('qr_restaurant_cart');
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
      settleOrders,
      updateOrderStatus,
      generateBill,
      soundEnabled,
      setSoundEnabled,
      testNotificationSound,
      resetDemoData,
      clearAllOrders
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
