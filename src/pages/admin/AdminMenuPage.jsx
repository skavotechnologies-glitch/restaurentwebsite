import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Flame, 
  X, 
  Clock,
  UtensilsCrossed
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/formatters';
import VegNonVegIcon from '../../components/common/VegNonVegIcon';

const PRESET_IMAGES = [
  { label: 'Filter Coffee', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Masala Chai', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fresh Juice', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Samosa / Snacks', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
  { label: 'Chicken Biriyani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Veg Biriyani', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dessert / Sweets', url: 'https://images.unsplash.com/photo-1605197584547-c93de1a02937?auto=format&fit=crop&w=600&q=80' },
];

export default function AdminMenuPage() {
  const { restaurant, menuItems, categories, addMenuItem, updateMenuItem, deleteMenuItem } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State with prepTime (waiting time in minutes)
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    prepTime: '10', // Waiting time in minutes
    foodType: 'veg',
    description: '',
    image: '',
    isBestseller: false,
    isAvailable: true
  });

  const currency = restaurant.billing?.currency || '₹';

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      price: '',
      prepTime: '10',
      foodType: 'veg',
      description: '',
      image: PRESET_IMAGES[0].url,
      isBestseller: false,
      isAvailable: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      price: item.price.toString(),
      prepTime: (item.prepTime || 10).toString(),
      foodType: item.foodType,
      description: item.description || '',
      image: item.image || '',
      isBestseller: Boolean(item.isBestseller),
      isAvailable: item.isAvailable !== false
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      alert('Please fill in item name, valid price, and category.');
      return;
    }

    if (editingItem) {
      await updateMenuItem(editingItem.id, {
        ...formData,
        price: Number(formData.price),
        prepTime: Number(formData.prepTime) || 10
      });
    } else {
      await addMenuItem({
        ...formData,
        price: Number(formData.price),
        prepTime: Number(formData.prepTime) || 10
      });
    }

    setModalOpen(false);
  };

  const handleDelete = async (item) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      await deleteMenuItem(item.id);
    }
  };

  const handleToggleAvailability = async (item) => {
    await updateMenuItem(item.id, { isAvailable: !item.isAvailable });
  };

  const handleToggleBestseller = async (item) => {
    await updateMenuItem(item.id, { isBestseller: !item.isBestseller });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Menu & Waiting Times
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Set food prices, availability, and individual waiting times shown to customers
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Food Item</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-forest-700 text-white'
                : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
            }`}
          >
            All Categories ({menuItems.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-forest-700 text-white'
                  : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or beverage..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-charcoal-700/70 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Dish</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Customer Waiting Time</th>
                <th className="py-3 px-4 text-center">Bestseller</th>
                <th className="py-3 px-4 text-center">Availability</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const category = categories.find(c => c.id === item.categoryId);
                const isAvailable = item.isAvailable !== false;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          <img 
                            src={item.image || PRESET_IMAGES[0].url} 
                            alt={item.name}
                            className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-sm text-charcoal-900">
                            <VegNonVegIcon type={item.foodType} size="sm" />
                            <span>{item.name}</span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-charcoal-700/70 line-clamp-1 max-w-xs mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-charcoal-700">
                      {category ? category.name : '—'}
                    </td>

                    <td className="py-3 px-4 font-bold font-serif text-sm text-forest-800">
                      {formatCurrency(item.price, currency)}
                    </td>

                    {/* Waiting Time Display */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{item.prepTime || 10} Mins</span>
                      </span>
                    </td>

                    {/* Bestseller toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleBestseller(item)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition ${
                          item.isBestseller
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle bestseller"
                      >
                        <Flame className={`w-3 h-3 ${item.isBestseller ? 'fill-amber-500 text-amber-500' : ''}`} />
                        <span>{item.isBestseller ? 'Yes' : 'No'}</span>
                      </button>
                    </td>

                    {/* Availability toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition border ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                        }`}
                      >
                        {isAvailable ? 'Available' : 'Sold Out'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-forest-700 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Item"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-elevated overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">
                {editingItem ? 'Edit Dish & Waiting Time' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Food Item Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Masala Dosa, Filter Coffee"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    Price ({currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="40"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-bold"
                  />
                </div>

                {/* Waiting time input */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Wait (Mins) <span className="text-rose-500">*</span></span>
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 text-xs bg-amber-50/60 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Dietary Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-charcoal-800">
                    <input 
                      type="radio"
                      name="foodType"
                      checked={formData.foodType === 'veg'}
                      onChange={() => setFormData({ ...formData, foodType: 'veg' })}
                    />
                    <VegNonVegIcon type="veg" size="sm" />
                    <span>Vegetarian</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-charcoal-800">
                    <input 
                      type="radio"
                      name="foodType"
                      checked={formData.foodType === 'non-veg'}
                      onChange={() => setFormData({ ...formData, foodType: 'non-veg' })}
                    />
                    <VegNonVegIcon type="non-veg" size="sm" />
                    <span>Non-Vegetarian</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Description
                </label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Food Photo URL
                </label>
                <input 
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.url })}
                      className={`text-[10px] px-2 py-1 rounded-md border font-medium ${
                        formData.image === preset.url
                          ? 'bg-forest-100 text-forest-900 border-forest-400 font-bold'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-6 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-charcoal-800">
                  <input 
                    type="checkbox"
                    checked={formData.isBestseller}
                    onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                  />
                  <span>Mark Bestseller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-charcoal-800">
                  <input 
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  />
                  <span>Available / In Stock</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-charcoal-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-800"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
