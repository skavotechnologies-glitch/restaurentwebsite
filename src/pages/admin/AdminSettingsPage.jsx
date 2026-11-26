import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Percent, 
  Receipt, 
  Volume2, 
  VolumeX, 
  BellRing, 
  Check, 
  Save, 
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export default function AdminSettingsPage() {
  const { 
    restaurant, 
    updateRestaurantSettings, 
    soundEnabled, 
    setSoundEnabled, 
    testNotificationSound,
    activeSlug 
  } = useRestaurant();

  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    tagline: restaurant.tagline || '',
    description: restaurant.description || '',
    logo: restaurant.logo || '',
    coverImage: restaurant.coverImage || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    whatsapp: restaurant.whatsapp || '',
    openingHours: restaurant.openingHours || '',
    isOpen: restaurant.isOpen !== false,
    onlineOrderingEnabled: restaurant.onlineOrderingEnabled !== false,
    estimatedPrepTime: restaurant.estimatedPrepTime || '15-20 mins',
    allowCustomerInstructions: restaurant.allowCustomerInstructions !== false,
    hideSoldOut: Boolean(restaurant.hideSoldOut),
    
    // Billing & Taxes
    currency: restaurant.billing?.currency || '₹',
    gstEnabled: restaurant.billing?.gstEnabled !== false,
    cGstRate: restaurant.billing?.cGstRate !== undefined ? restaurant.billing.cGstRate.toString() : '2.5',
    sGstRate: restaurant.billing?.sGstRate !== undefined ? restaurant.billing.sGstRate.toString() : '2.5',
    serviceChargeRate: restaurant.billing?.serviceChargeRate !== undefined ? restaurant.billing.serviceChargeRate.toString() : '0',
    discountRate: restaurant.billing?.discountRate !== undefined ? restaurant.billing.discountRate.toString() : '0',
    gstin: restaurant.billing?.gstin || '',
    upiId: restaurant.billing?.upiId || 'palanikathirvel05@okaxis',
    upiPayeeName: restaurant.billing?.upiPayeeName || restaurant.name || 'Naachi Café',
    autoPrintCashOrders: restaurant.billing?.autoPrintCashOrders !== false,
    billFooterMessage: restaurant.billing?.billFooterMessage || 'Thank you for dining with us! Please visit again.'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updated = {
      name: formData.name.trim(),
      tagline: formData.tagline.trim(),
      description: formData.description.trim(),
      logo: formData.logo.trim(),
      coverImage: formData.coverImage.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      whatsapp: formData.whatsapp.trim(),
      openingHours: formData.openingHours.trim(),
      isOpen: formData.isOpen,
      onlineOrderingEnabled: formData.onlineOrderingEnabled,
      estimatedPrepTime: formData.estimatedPrepTime.trim(),
      allowCustomerInstructions: formData.allowCustomerInstructions,
      hideSoldOut: formData.hideSoldOut,
      billing: {
        currency: formData.currency,
        currencyCode: 'INR',
        gstEnabled: formData.gstEnabled,
        cGstRate: Number(formData.cGstRate),
        sGstRate: Number(formData.sGstRate),
        serviceChargeRate: Number(formData.serviceChargeRate),
        discountRate: Number(formData.discountRate),
        gstin: formData.gstin.trim(),
        upiId: formData.upiId.trim(),
        upiPayeeName: formData.upiPayeeName.trim(),
        autoPrintCashOrders: formData.autoPrintCashOrders,
        billFooterMessage: formData.billFooterMessage.trim()
      }
    };

    await updateRestaurantSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Restaurant & Platform Settings
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Manage your restaurant profile, GST and tax rates, online ordering toggle, and receipt branding
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl animate-bounce shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Restaurant Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-charcoal-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-forest-700" />
            <span>Restaurant Profile</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Restaurant Name <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Tagline / Slogan
              </label>
              <input 
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Authentic Sips & South-Indian Delights"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">
              About / Description
            </label>
            <textarea 
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Logo Image URL
              </label>
              <input 
                type="url"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Cover Photo Image URL
              </label>
              <input 
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-charcoal-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest-700" />
            <span>Contact & Location</span>
          </h2>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">
              Physical Address
            </label>
            <input 
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Phone Number
              </label>
              <input 
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                WhatsApp Number
              </label>
              <input 
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Opening Hours
              </label>
              <input 
                type="text"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                placeholder="7:00 AM - 10:30 PM"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>
        </div>

        {/* Ordering & Operations Toggles */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-charcoal-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-forest-700" />
            <span>Operations & Dine-In Ordering</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-charcoal-900 block">Restaurant Status</span>
                <span className="text-[11px] text-charcoal-700/60">Toggle restaurant Open / Closed</span>
              </div>
              <input 
                type="checkbox"
                checked={formData.isOpen}
                onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                className="w-5 h-5 rounded text-forest-700 focus:ring-forest-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-charcoal-900 block">Online QR Ordering</span>
                <span className="text-[11px] text-charcoal-700/60">Accept orders from table QR codes</span>
              </div>
              <input 
                type="checkbox"
                checked={formData.onlineOrderingEnabled}
                onChange={(e) => setFormData({ ...formData, onlineOrderingEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-forest-700 focus:ring-forest-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-charcoal-900 block">Customer Instructions</span>
                <span className="text-[11px] text-charcoal-700/60">Allow special cooking notes</span>
              </div>
              <input 
                type="checkbox"
                checked={formData.allowCustomerInstructions}
                onChange={(e) => setFormData({ ...formData, allowCustomerInstructions: e.target.checked })}
                className="w-5 h-5 rounded text-forest-700 focus:ring-forest-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-charcoal-900 block">Hide Sold-Out Dishes</span>
                <span className="text-[11px] text-charcoal-700/60">Hide unavailable items from customer menu</span>
              </div>
              <input 
                type="checkbox"
                checked={formData.hideSoldOut}
                onChange={(e) => setFormData({ ...formData, hideSoldOut: e.target.checked })}
                className="w-5 h-5 rounded text-forest-700 focus:ring-forest-600"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">
              Estimated Preparation Time (displayed to customer)
            </label>
            <input 
              type="text"
              value={formData.estimatedPrepTime}
              onChange={(e) => setFormData({ ...formData, estimatedPrepTime: e.target.value })}
              placeholder="e.g. 15-20 mins"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 max-w-sm"
            />
          </div>
        </div>

        {/* Billing & Tax Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-charcoal-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Percent className="w-4 h-4 text-forest-700" />
            <span>Billing, Taxes & Invoice Configuration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer col-span-full">
              <div>
                <span className="text-xs font-bold text-charcoal-900 block">Enable GST / VAT Tax</span>
                <span className="text-[11px] text-charcoal-700/60">Apply taxes to customer bills</span>
              </div>
              <input 
                type="checkbox"
                checked={formData.gstEnabled}
                onChange={(e) => setFormData({ ...formData, gstEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-forest-700 focus:ring-forest-600"
              />
            </label>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                CGST Rate (%)
              </label>
              <input 
                type="number"
                step="0.1"
                min="0"
                max="100"
                disabled={!formData.gstEnabled}
                value={formData.cGstRate}
                onChange={(e) => setFormData({ ...formData, cGstRate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-bold disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                SGST Rate (%)
              </label>
              <input 
                type="number"
                step="0.1"
                min="0"
                max="100"
                disabled={!formData.gstEnabled}
                value={formData.sGstRate}
                onChange={(e) => setFormData({ ...formData, sGstRate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-bold disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Service Charge (%) (Optional)
              </label>
              <input 
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={formData.serviceChargeRate}
                onChange={(e) => setFormData({ ...formData, serviceChargeRate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                GSTIN / Tax ID Number
              </label>
              <input 
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="29AAAAA0000A1Z5"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Restaurant UPI ID / VPA (For Dynamic Payment QR)
              </label>
              <input 
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="e.g. palanikathirvel05@okaxis or 9876543210@paytm"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                UPI Payee Display Name
              </label>
              <input 
                type="text"
                value={formData.upiPayeeName}
                onChange={(e) => setFormData({ ...formData, upiPayeeName: e.target.value })}
                placeholder="e.g. Naachi Café"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
              />
            </div>

            <div className="col-span-full p-3.5 bg-forest-50/70 border border-forest-200 rounded-xl flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-forest-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-forest-900 block">
                    Auto-Print Cash on Delivery Bills to Billing Printer
                  </span>
                  <span className="text-[11px] text-charcoal-600 block">
                    Automatically trigger the thermal billing printer for KOT &amp; bill as soon as a customer orders with Cash on Delivery / Pay at Counter.
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox"
                  checked={formData.autoPrintCashOrders}
                  onChange={(e) => setFormData({ ...formData, autoPrintCashOrders: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-700"></div>
              </label>
            </div>

            <div className="col-span-full">
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Printed Receipt Footer Message
              </label>
              <input 
                type="text"
                value={formData.billFooterMessage}
                onChange={(e) => setFormData({ ...formData, billFooterMessage: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>
        </div>

        {/* Notification Sound Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-charcoal-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-forest-700" />
            <span>Order Arrival Audio Chimes</span>
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-charcoal-900 block">
                Play Audio Notification Chime on New Order
              </span>
              <p className="text-[11px] text-charcoal-700/60 mt-0.5">
                Rings a double bell chime when a customer submits a new order ticket
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={testNotificationSound}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-charcoal-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-300"
              >
                <BellRing className="w-3.5 h-3.5 text-forest-700" />
                <span>Test Chime</span>
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  soundEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border-slate-300'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-elevated transition active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
