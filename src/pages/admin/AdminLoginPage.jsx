import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  UtensilsCrossed, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, resetPassword, authError, setAuthError } = useAuth();
  const { restaurant } = useRestaurant();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/admin/dashboard');
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@naachicafe.com');
    setPassword('admin123');
    setAuthError(null);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      alert(err.message || 'Could not send reset link.');
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-center items-center px-4 py-12 text-charcoal-900">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-forest-700 text-white flex items-center justify-center mx-auto shadow-elevated border-2 border-gold-400">
            <UtensilsCrossed className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-charcoal-900">
            Staff & Admin Portal
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-700/80">
            {restaurant.name} &bull; Reception & Kitchen Management
          </p>
        </div>

        {/* Demo Fast Fill Banner */}
        <div className="bg-gold-50 border border-gold-400/50 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-600 flex-shrink-0" />
            <div className="text-xs text-charcoal-800">
              <span className="font-bold">Instant Demo Login:</span>
              <div className="text-[11px] text-charcoal-700 font-mono">admin@naachicafe.com / admin123</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg shadow transition whitespace-nowrap"
          >
            Auto-fill
          </button>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-cream-200 shadow-elevated">
          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{authError}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/50" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@naachicafe.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-charcoal-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="text-[11px] text-forest-700 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/50" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-700/50 hover:text-charcoal-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm active:scale-98 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-cream-200 text-center">
            <p className="text-[11px] text-charcoal-700/60">
              Restricted to authorized restaurant personnel &bull; Multi-tenant tenant-isolated security
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-elevated">
            <h3 className="font-serif font-bold text-lg text-charcoal-900">
              Reset Staff Password
            </h3>
            {resetSent ? (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  Password reset link has been dispatched to your email address.
                </p>
                <button
                  onClick={() => {
                    setResetSent(false);
                    setResetModalOpen(false);
                  }}
                  className="w-full py-2 bg-forest-700 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-charcoal-700/80">
                  Enter your registered staff email and we will send password reset instructions.
                </p>
                <input 
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@naachicafe.com"
                  className="w-full px-3 py-2 text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-charcoal-700 hover:bg-cream-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-forest-700 text-white text-xs font-semibold rounded-xl hover:bg-forest-800"
                  >
                    Send Reset Email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
