import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Search, X, Filter, Flame, AlertCircle, Receipt, ArrowRight, Clock } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import RestaurantHeader from '../../components/customer/RestaurantHeader';
import CategoryNav from '../../components/customer/CategoryNav';
import MenuItemCard from '../../components/customer/MenuItemCard';
import CartBar from '../../components/customer/CartBar';
import VegNonVegIcon from '../../components/common/VegNonVegIcon';

export default function CustomerMenuPage() {
  const { restaurantSlug = 'naachi-cafe' } = useParams();
  const [searchParams] = useSearchParams();
  const { restaurant, categories, menuItems, tables, orders } = useRestaurant();
  const { 
    cartItems, 
    totalItemCount, 
    subtotal, 
    addToCart, 
    updateQuantity, 
    updateItemInstructions,
    getItemQuantity,
    tableInfo,
    setTableInfo,
    sessionOrderIds 
  } = useCart();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'veg' | 'non-veg' | 'bestseller'

  // Detect and set table from URL query params (e.g. ?table=T04 or ?table=4)
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      const matchedTable = tables.find(t => 
        t.id.toLowerCase() === tableParam.toLowerCase() || 
        t.tableNumber === tableParam ||
        t.name.toLowerCase() === `table ${tableParam}`.toLowerCase()
      );

      if (matchedTable) {
        setTableInfo({
          id: matchedTable.id,
          name: matchedTable.name,
          tableNumber: matchedTable.tableNumber
        });
      } else {
        // Fallback for custom or direct table numbers
        setTableInfo({
          id: tableParam,
          name: `Table ${tableParam}`,
          tableNumber: tableParam
        });
      }
    }
  }, [searchParams, tables, setTableInfo]);

  // Compute category item counts
  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length };
    categories.forEach(cat => {
      counts[cat.id] = menuItems.filter(m => m.categoryId === cat.id).length;
    });
    return counts;
  }, [categories, menuItems]);

  // Filter menu items by category, search query, and dietary filter
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Hide sold out if restaurant setting demands it
      if (restaurant.hideSoldOut && !item.isAvailable) {
        return false;
      }

      // Category filter
      if (activeCategory !== 'all' && item.categoryId !== activeCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Dietary / Bestseller filter
      if (filterType === 'veg' && item.foodType !== 'veg') return false;
      if (filterType === 'non-veg' && item.foodType !== 'non-veg') return false;
      if (filterType === 'bestseller' && !item.isBestseller) return false;

      return true;
    });
  }, [menuItems, activeCategory, searchQuery, filterType, restaurant.hideSoldOut]);

  // Group items by category if 'all' is selected and no search query active
  const groupedSections = useMemo(() => {
    if (activeCategory !== 'all' || searchQuery.trim() || filterType !== 'all') {
      return null;
    }

    const groups = [];
    categories.forEach(cat => {
      const itemsInCat = filteredItems.filter(item => item.categoryId === cat.id);
      if (itemsInCat.length > 0) {
        groups.push({
          category: cat,
          items: itemsInCat
        });
      }
    });
    return groups;
  }, [categories, filteredItems, activeCategory, searchQuery, filterType]);

  const isOrderingDisabled = !restaurant.isOpen || restaurant.onlineOrderingEnabled === false;
  const currency = restaurant.billing?.currency || '₹';

  // Active table orders for this dining session
  const activeTableOrders = useMemo(() => {
    if (!tableInfo?.id && (!sessionOrderIds || sessionOrderIds.length === 0)) return [];
    return orders.filter(o => {
      if (sessionOrderIds?.includes(o.id) || sessionOrderIds?.includes(o.orderNumber)) return true;
      if (tableInfo?.id && (o.tableId === tableInfo.id || o.tableName?.toLowerCase() === tableInfo.name?.toLowerCase())) {
        if (o.createdAt) {
          const diffHours = (Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60);
          if (diffHours < 6) return true;
        }
      }
      return false;
    }).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [orders, tableInfo, sessionOrderIds]);

  const activeTableGrandTotal = useMemo(() => {
    return activeTableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [activeTableOrders]);

  return (
    <div className="min-h-screen bg-cream-100 pb-28 text-charcoal-900">
      {/* Restaurant Header */}
      <RestaurantHeader restaurant={restaurant} currentTable={tableInfo} />

      {/* Running Table Bill Banner if customer has active orders */}
      {activeTableOrders.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 -mt-2 mb-3">
          <Link
            to={`/order/${activeTableOrders[activeTableOrders.length - 1].id}`}
            className="w-full bg-forest-800 hover:bg-forest-900 text-white p-3 rounded-2xl shadow-elevated border border-forest-600 flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest-700 border border-forest-500 text-gold-400 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4 text-gold-400" />
              </div>
              <div className="text-left">
                <div className="text-[11px] text-forest-200 font-semibold uppercase tracking-wider">
                  {tableInfo?.name || 'Your Table'} &bull; {activeTableOrders.length} {activeTableOrders.length === 1 ? 'Order Placed' : 'Orders Placed'}
                </div>
                <div className="text-sm font-serif font-bold text-white flex items-center gap-1.5">
                  <span>Running Bill: {formatCurrency(activeTableGrandTotal, currency)}</span>
                  <span className="text-[10px] font-sans text-gold-400 bg-forest-700/80 px-2 py-0.5 rounded-full border border-forest-500">
                    Consolidated
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-gold-400 group-hover:translate-x-0.5 transition">
              <span>View Full Bill</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}

      {/* Sticky Category Navigation */}
      <CategoryNav 
        categories={categories}
        activeCategoryId={activeCategory}
        onSelectCategory={setActiveCategory}
        counts={categoryCounts}
      />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Search & Dietary Filters Bar */}
        <div className="bg-white rounded-2xl p-3 shadow-soft border border-cream-200 mb-6 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/60" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, snacks..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-700/60 hover:text-charcoal-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Dietary Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterType === 'all'
                  ? 'bg-charcoal-900 text-white'
                  : 'bg-cream-100 text-charcoal-700 hover:bg-cream-200'
              }`}
            >
              All Types
            </button>

            <button
              onClick={() => setFilterType('veg')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterType === 'veg'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <VegNonVegIcon type="veg" size="sm" />
              <span>Veg Only</span>
            </button>

            <button
              onClick={() => setFilterType('non-veg')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterType === 'non-veg'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <VegNonVegIcon type="non-veg" size="sm" />
              <span>Non-Veg</span>
            </button>

            <button
              onClick={() => setFilterType('bestseller')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterType === 'bestseller'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Bestsellers</span>
            </button>
          </div>
        </div>

        {/* Menu Listings */}
        {groupedSections ? (
          // Grouped by Category
          <div className="space-y-8">
            {groupedSections.map(({ category, items }) => (
              <section key={category.id} className="scroll-mt-16">
                <div className="flex items-baseline justify-between border-b border-cream-300 pb-2 mb-4">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal-900 flex items-center gap-2">
                    <span>{category.name}</span>
                    <span className="text-xs font-sans font-medium text-charcoal-700/60 bg-cream-200 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {items.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={getItemQuantity(item.id)}
                      onAdd={(it) => addToCart(it, 1)}
                      onUpdateQty={updateQuantity}
                      onUpdateInstructions={updateItemInstructions}
                      currency={restaurant.billing?.currency || '₹'}
                      isOrderingDisabled={isOrderingDisabled}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          // Flat list (Filtered by category or search)
          <div>
            <div className="text-sm font-semibold text-charcoal-700 mb-3 flex items-center justify-between">
              <span>Showing {filteredItems.length} items</span>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-forest-700 underline font-semibold"
                >
                  Clear search
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredItems.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={getItemQuantity(item.id)}
                  onAdd={(it) => addToCart(it, 1)}
                  onUpdateQty={updateQuantity}
                  onUpdateInstructions={updateItemInstructions}
                  currency={restaurant.billing?.currency || '₹'}
                  isOrderingDisabled={isOrderingDisabled}
                />
              ))}
            </div>
          </div>
        ) : (
          // No items found
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-cream-300">
            <div className="w-12 h-12 rounded-full bg-cream-200 text-charcoal-600 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-charcoal-900">No dishes found</h3>
            <p className="text-xs sm:text-sm text-charcoal-700/80 mt-1 max-w-sm mx-auto">
              We couldn't find any menu item matching your search or filters. Try clearing your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setActiveCategory('all');
              }}
              className="mt-4 px-4 py-2 bg-forest-700 text-white rounded-xl text-xs font-semibold hover:bg-forest-800 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      <CartBar 
        itemCount={totalItemCount}
        subtotal={subtotal}
        restaurantSlug={restaurantSlug}
        currency={restaurant.billing?.currency || '₹'}
      />
    </div>
  );
}
