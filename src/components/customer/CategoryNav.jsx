import React from 'react';
import { Coffee, GlassWater, Utensils, Flame, IceCream, Sparkles } from 'lucide-react';

const ICON_MAP = {
  Coffee: Coffee,
  GlassWater: GlassWater,
  Utensils: Utensils,
  Flame: Flame,
  IceCream: IceCream,
};

export default function CategoryNav({ categories, activeCategoryId, onSelectCategory, counts = {} }) {
  return (
    <nav className="sticky top-0 z-30 bg-cream-100/95 backdrop-blur-md border-b border-cream-300 shadow-sm py-2 px-3">
      <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeCategoryId === 'all'
              ? 'bg-forest-700 text-white shadow-sm'
              : 'bg-white text-charcoal-700 hover:bg-cream-200 border border-cream-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>All Items</span>
          {counts['all'] !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeCategoryId === 'all' ? 'bg-forest-600 text-white' : 'bg-cream-200 text-charcoal-600'
            }`}>
              {counts['all']}
            </span>
          )}
        </button>

        {categories.map((cat) => {
          const IconComp = ICON_MAP[cat.icon] || Utensils;
          const isActive = activeCategoryId === cat.id;
          const count = counts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-white text-charcoal-700 hover:bg-cream-200 border border-cream-300'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-forest-600 text-white' : 'bg-cream-200 text-charcoal-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
