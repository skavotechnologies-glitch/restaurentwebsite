import React from 'react';

export default function VegNonVegIcon({ type = 'veg', size = 'md' }) {
  const isVeg = type === 'veg';
  const sizeClasses = {
    sm: 'w-3.5 h-3.5 p-0.5',
    md: 'w-4 h-4 p-0.5',
    lg: 'w-5 h-5 p-1'
  }[size] || 'w-4 h-4 p-0.5';

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size] || 'w-2 h-2';

  return (
    <div 
      className={`border inline-flex items-center justify-center rounded-sm flex-shrink-0 ${sizeClasses} ${
        isVeg ? 'border-emerald-600' : 'border-rose-700'
      }`}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <div 
        className={`rounded-full ${dotSize} ${
          isVeg ? 'bg-emerald-600' : 'bg-rose-700'
        }`} 
      />
    </div>
  );
}
