import React, { useState } from 'react';
import { Plus, Minus, Flame, MessageSquare, Check } from 'lucide-react';
import VegNonVegIcon from '../common/VegNonVegIcon';
import { formatCurrency } from '../../utils/formatters';

export default function MenuItemCard({ 
  item, 
  quantity = 0, 
  onAdd, 
  onUpdateQty, 
  onUpdateInstructions,
  currency = '₹',
  isOrderingDisabled = false
}) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsText, setInstructionsText] = useState(item.specialInstructions || '');
  const isAvailable = item.isAvailable !== false;

  const handleSaveInstructions = () => {
    if (onUpdateInstructions) {
      onUpdateInstructions(item.id, instructionsText);
    }
    setShowInstructions(false);
  };

  return (
    <div className={`bg-white rounded-2xl p-3 sm:p-4 border transition-all duration-200 flex flex-col justify-between shadow-soft hover:shadow-elevated ${
      !isAvailable ? 'opacity-65 border-gray-200' : 'border-cream-300/80 hover:border-forest-100'
    }`}>
      <div className="flex gap-3 sm:gap-4 items-start">
        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <VegNonVegIcon type={item.foodType} size="sm" />
            
            {item.isBestseller && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                Bestseller
              </span>
            )}
          </div>

          <h3 className="font-serif font-bold text-base sm:text-lg text-charcoal-900 leading-snug">
            {item.name}
          </h3>

          <p className="font-sans font-bold text-sm sm:text-base text-forest-700 mt-1">
            {formatCurrency(item.price, currency)}
          </p>

          {item.description && (
            <p className="text-xs text-charcoal-700/80 mt-1.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* If already in cart, show small button for notes */}
          {quantity > 0 && (
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="mt-2 text-[11px] text-forest-600 hover:text-forest-800 font-semibold flex items-center gap-1 py-0.5"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{item.specialInstructions ? `Note: "${item.specialInstructions}"` : '+ Add cooking note'}</span>
            </button>
          )}
        </div>

        {/* Image & Action Column */}
        <div className="relative flex flex-col items-center flex-shrink-0 w-28 sm:w-32">
          <div className="w-28 h-24 sm:w-32 sm:h-28 rounded-xl overflow-hidden bg-cream-200 shadow-sm relative">
            <img 
              src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"} 
              alt={item.name}
              className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
                !isAvailable ? 'grayscale' : ''
              }`}
              loading="lazy"
            />
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-1">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider bg-rose-600/90 px-2 py-0.5 rounded">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Add / Quantity Stepper Button */}
          <div className="-mt-3.5 z-10 w-24">
            {!isAvailable || isOrderingDisabled ? (
              <button 
                disabled 
                className="w-full py-1.5 px-3 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg border border-gray-300 cursor-not-allowed text-center uppercase"
              >
                Sold Out
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={() => onAdd(item)}
                className="w-full py-1.5 px-3 bg-white hover:bg-cream-50 text-forest-700 text-xs font-bold rounded-lg border border-forest-600 shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-1 uppercase tracking-wide active:scale-95"
              >
                <span>Add</span>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="w-full flex items-center justify-between bg-forest-700 text-white rounded-lg shadow-md px-1.5 py-1 text-xs font-bold border border-forest-800">
                <button
                  onClick={() => onUpdateQty(item.id, quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-forest-600 rounded transition active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="font-sans px-1 text-sm">{quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.id, quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-forest-600 rounded transition active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Special instructions drawer */}
      {showInstructions && quantity > 0 && (
        <div className="mt-3 pt-2.5 border-t border-cream-200">
          <label className="text-[11px] font-semibold text-charcoal-700 block mb-1">
            Special cooking instructions for {item.name}:
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              placeholder="e.g. Less spicy, without sugar, extra crispy"
              maxLength={80}
              className="flex-1 text-xs px-2.5 py-1.5 border border-cream-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600 bg-cream-50"
            />
            <button
              onClick={handleSaveInstructions}
              className="px-2.5 py-1.5 bg-forest-700 text-white text-xs font-semibold rounded-lg hover:bg-forest-800 flex items-center gap-1 flex-shrink-0"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
