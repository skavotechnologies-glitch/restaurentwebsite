import React from 'react';
import { MapPin, Clock, Phone, MessageSquare, UtensilsCrossed, AlertCircle } from 'lucide-react';

export default function RestaurantHeader({ restaurant, currentTable }) {
  const isOpen = restaurant.isOpen !== false;

  return (
    <header className="relative bg-white border-b border-cream-200">
      {/* Cover Image */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-forest-900">
        <img 
          src={restaurant.coverImage || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"} 
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Table Banner if table is detected from QR */}
        {currentTable && (
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
            <div className="bg-forest-700/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-forest-500/50">
              <UtensilsCrossed className="w-3.5 h-3.5 text-gold-400" />
              <span>Ordering for <strong className="text-gold-400 font-bold">{currentTable.name || `Table ${currentTable.tableNumber || currentTable.id}`}</strong></span>
            </div>
            
            <div className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-md ${
              isOpen ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
            }`}>
              {isOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>
        )}
      </div>

      {/* Restaurant Info Card */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 sm:-mt-16 pb-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Logo */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-white shadow-elevated bg-white flex-shrink-0">
            <img 
              src={restaurant.logo || "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&q=80"} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Titles & Meta */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
                {restaurant.name}
              </h1>
              {!currentTable && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
              )}
            </div>
            
            {restaurant.tagline && (
              <p className="text-sm font-medium text-forest-700 mt-0.5">
                {restaurant.tagline}
              </p>
            )}

            {restaurant.description && (
              <p className="text-xs sm:text-sm text-charcoal-700/80 mt-1 line-clamp-2 max-w-2xl">
                {restaurant.description}
              </p>
            )}
          </div>
        </div>

        {/* Info Badges (Address, Hours, Phone) */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 pt-3 border-t border-cream-200 text-xs text-charcoal-700">
          <div className="flex items-center gap-1.5 text-charcoal-700">
            <MapPin className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
            <span className="truncate max-w-xs">{restaurant.address}</span>
          </div>

          <div className="flex items-center gap-1.5 text-charcoal-700">
            <Clock className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
            <span>{restaurant.openingHours}</span>
          </div>

          {restaurant.phone && (
            <a 
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-1.5 text-forest-700 font-semibold hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{restaurant.phone}</span>
            </a>
          )}
        </div>

        {/* Warning if restaurant is closed or online ordering paused */}
        {(!isOpen || restaurant.onlineOrderingEnabled === false) && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-2 text-xs text-amber-900 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Restaurant is currently not accepting new orders. You can browse the menu.</span>
          </div>
        )}
      </div>
    </header>
  );
}
