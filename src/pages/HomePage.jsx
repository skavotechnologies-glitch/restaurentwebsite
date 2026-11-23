import React from 'react';
import { Link } from 'react-router-dom';
import { 
  QrCode, 
  UtensilsCrossed, 
  Smartphone, 
  ShieldCheck, 
  Receipt, 
  ArrowRight, 
  ChefHat, 
  CheckCircle2,
  Sparkles,
  Store
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

export default function HomePage() {
  const { restaurant, activeSlug, tables } = useRestaurant();

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-cream-200 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-700 text-gold-400 flex items-center justify-center font-bold shadow-sm">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-base text-charcoal-900 leading-tight block">
                {restaurant.name}
              </span>
              <span className="text-[10px] text-forest-700 font-semibold tracking-wider uppercase">
                Dine-In QR Ordering System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/login"
              className="px-3.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Staff / Admin Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center space-y-8 flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold border border-forest-200">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            <span>Multi-Restaurant Contactless Dining & Billing Platform</span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-5xl text-charcoal-900 max-w-2xl mx-auto leading-tight">
            Scan QR, Order Food & Bill Dine-In Guests Seamlessly
          </h1>

          <p className="text-sm sm:text-base text-charcoal-700/80 max-w-xl mx-auto leading-relaxed">
            A modern, responsive platform built for restaurants, cafes, juice bars, and diners. Customers scan table QR codes without app downloads, and staff manage orders on a live dashboard.
          </p>
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full text-left">
          {/* Customer Experience Card */}
          <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-soft hover:shadow-elevated transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-xl text-charcoal-900">
                Customer QR Experience
              </h2>
              <p className="text-xs text-charcoal-700/80 leading-relaxed">
                Experience what diners see after scanning a table QR code. Browse food, add to cart, and place orders with Indian mobile verification.
              </p>
            </div>

            <div className="pt-5 space-y-2">
              <Link
                to={`/r/${activeSlug}?table=T01`}
                className="w-full py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Launch Table 1 Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="flex gap-2">
                <Link
                  to={`/r/${activeSlug}?table=T02`}
                  className="flex-1 py-1.5 px-2 bg-cream-50 hover:bg-cream-100 text-charcoal-800 border border-cream-300 rounded-lg text-center text-[11px] font-semibold"
                >
                  Table 2
                </Link>
                <Link
                  to={`/r/${activeSlug}?table=T04`}
                  className="flex-1 py-1.5 px-2 bg-cream-50 hover:bg-cream-100 text-charcoal-800 border border-cream-300 rounded-lg text-center text-[11px] font-semibold"
                >
                  Table 4
                </Link>
                <Link
                  to={`/r/${activeSlug}`}
                  className="flex-1 py-1.5 px-2 bg-cream-50 hover:bg-cream-100 text-charcoal-800 border border-cream-300 rounded-lg text-center text-[11px] font-semibold"
                >
                  All Tables
                </Link>
              </div>
            </div>
          </div>

          {/* Admin / Reception Experience Card */}
          <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-soft hover:shadow-elevated transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-xl text-charcoal-900">
                Staff & Reception Portal
              </h2>
              <p className="text-xs text-charcoal-700/80 leading-relaxed">
                Live reception queue with audio alerts: orders arrive from tables, receptionist generates the bill, gives it to the kitchen, and customers pay directly at the counter.
              </p>
            </div>

            <div className="pt-5 space-y-2">
              <Link
                to="/admin/login"
                className="w-full py-2.5 px-4 bg-charcoal-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Open Staff Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-cream-200 text-left">
          <div className="p-3 bg-white/60 rounded-xl border border-cream-200">
            <span className="font-bold text-xs text-charcoal-900 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
              <span>Realtime Orders</span>
            </span>
            <span className="text-[11px] text-charcoal-700/70">Instant audio alerts & live tickets</span>
          </div>

          <div className="p-3 bg-white/60 rounded-xl border border-cream-200">
            <span className="font-bold text-xs text-charcoal-900 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
              <span>Multi-Tenant</span>
            </span>
            <span className="text-[11px] text-charcoal-700/70">Unique URL slugs per restaurant</span>
          </div>

          <div className="p-3 bg-white/60 rounded-xl border border-cream-200">
            <span className="font-bold text-xs text-charcoal-900 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
              <span>80mm Thermal Bills</span>
            </span>
            <span className="text-[11px] text-charcoal-700/70">Print receipts without header clutter</span>
          </div>

          <div className="p-3 bg-white/60 rounded-xl border border-cream-200">
            <span className="font-bold text-xs text-charcoal-900 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
              <span>Table QR Stands</span>
            </span>
            <span className="text-[11px] text-charcoal-700/70">Download SVG or print all stands</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-cream-200 py-4 px-4 text-center text-xs text-charcoal-700/60">
        <span>&copy; {new Date().getFullYear()} {restaurant.name} &bull; Powered by QR Dine-In Digital System</span>
      </footer>
    </div>
  );
}
