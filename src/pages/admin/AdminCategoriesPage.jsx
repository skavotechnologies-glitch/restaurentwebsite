import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FolderTree, 
  Coffee, 
  GlassWater, 
  Utensils, 
  Flame, 
  IceCream, 
  X,
  Check
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

const AVAILABLE_ICONS = [
  { name: 'Coffee', icon: Coffee },
  { name: 'GlassWater', icon: GlassWater },
  { name: 'Utensils', icon: Utensils },
  { name: 'Flame', icon: Flame },
  { name: 'IceCream', icon: IceCream },
];

export default function AdminCategoriesPage() {
  const { categories, menuItems, addCategory, updateCategory, deleteCategory } = useRestaurant();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setIcon('Utensils');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon || 'Utensils');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, { name: name.trim(), icon });
    } else {
      await addCategory({ name: name.trim(), icon });
    }

    setModalOpen(false);
  };

  const handleDelete = async (cat) => {
    const itemsCount = menuItems.filter(m => m.categoryId === cat.id).length;
    if (itemsCount > 0) {
      alert(`Cannot delete category "${cat.name}" because it still contains ${itemsCount} menu items. Please reassign or delete the dishes first.`);
      return;
    }

    if (confirm(`Delete category "${cat.name}"?`)) {
      await deleteCategory(cat.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Category Management
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Organize menu navigation sections and food categories
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, idx) => {
          const itemsCount = menuItems.filter(m => m.categoryId === cat.id).length;

          return (
            <div 
              key={cat.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-charcoal-900">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-charcoal-700/60 font-medium">
                    {itemsCount} {itemsCount === 1 ? 'dish' : 'dishes'} listed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 text-slate-500 hover:text-forest-700 hover:bg-slate-100 rounded-lg transition"
                  title="Edit Category"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Starters or Biriyani"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Category Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map(item => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIcon(item.name)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition ${
                          icon === item.name
                            ? 'bg-forest-700 text-white border-forest-800 shadow'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-charcoal-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-800"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
