import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function CartBar({ itemCount, subtotal, restaurantSlug, currency = '₹' }) {
  if (itemCount <= 0) return null;

  return (
    <aside aria-label="Order Cart" className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black/20 via-black/5 to-transparent pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <Link
          to={`/r/${restaurantSlug}/cart`}
          className="w-full flex items-center justify-between bg-forest-700 hover:bg-forest-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-elevated border border-forest-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {/* Left badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center text-gold-400 font-bold border border-forest-500 shadow-inner">
              <ShoppingBag className="w-5 h-5 text-gold-400" />
            </div>
            <div className="text-left">
              <div className="text-xs text-forest-100 font-medium tracking-wide uppercase">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'} added
              </div>
              <div className="text-lg font-bold font-serif text-white">
                {formatCurrency(subtotal, currency)}
              </div>
            </div>
          </div>

          {/* Right action */}
          <div className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-charcoal-900 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </Link>
      </div>
    </aside>
  );
}
