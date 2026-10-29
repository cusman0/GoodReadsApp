import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'signin' | 'register';
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'signin',
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: tab === 'register' ? name.trim() : email.split('@')[0],
      email: email.trim().toLowerCase(),
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      isGoogleUser: false,
      booksReadCount: 0,
      wantToReadCount: 0,
      currentlyReadingCount: 0,
      readingChallengeGoal: 20,
      readingChallengeProgress: 0,
    };

    onLoginSuccess(newUser);
    onClose();
  };

  const handleGoogleSuccess = (acc: { name: string; email: string; avatar: string }) => {
    const googleUser: UserProfile = {
      id: `usr_google_${Date.now()}`,
      name: acc.name,
      email: acc.email,
      avatar: acc.avatar,
      isGoogleUser: true,
      booksReadCount: 14,
      wantToReadCount: 48,
      currentlyReadingCount: 2,
      readingChallengeGoal: 30,
      readingChallengeProgress: 14,
    };

    onLoginSuccess(googleUser);
    setShowGoogleModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
        <div className="relative w-full max-w-md bg-[#FAF9F6] rounded-xl shadow-2xl border border-[#E0DDD5] overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="pt-8 pb-4 px-8 text-center">
            <h2 className="font-serif text-3xl font-bold text-[#382110] tracking-tight">
              goodreads
            </h2>
            <p className="font-serif italic text-sm text-[#767676] mt-1">
              Meet your next favorite book.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b border-[#E0DDD5] px-8 bg-[#F4F1EA]">
            <button
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === 'signin'
                  ? 'border-[#00635D] text-[#382110]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === 'register'
                  ? 'border-[#00635D] text-[#382110]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Content */}
          <div className="p-8 pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In Button - Primary Social */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#D5D2C9] hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-md shadow-xs transition-colors mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{tab === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
            </button>

            {/* Secondary Social Login Row */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={() =>
                  handleGoogleSuccess({
                    name: 'Ashley Valdez',
                    email: 'ashley.valdez@amazon.com',
                    avatar:
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
                  })
                }
                className="flex items-center justify-center gap-2 bg-white border border-[#D5D2C9] hover:bg-gray-50 text-gray-700 text-xs font-medium py-2 px-3 rounded-md transition-colors"
              >
                <span>🛒 Amazon</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleGoogleSuccess({
                    name: 'Ashley Valdez',
                    email: 'ashley.valdez@icloud.com',
                    avatar:
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
                  })
                }
                className="flex items-center justify-center gap-2 bg-white border border-[#D5D2C9] hover:bg-gray-50 text-gray-700 text-xs font-medium py-2 px-3 rounded-md transition-colors"
              >
                <span> Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-[#D5D2C9] w-full" />
              <span className="bg-[#FAF9F6] px-3 text-xs text-gray-500 uppercase tracking-wider">
                or with email
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-[#382110] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] rounded-md focus:outline-none focus:border-[#00635D] text-gray-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#382110] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] rounded-md focus:outline-none focus:border-[#00635D] text-gray-800"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-[#382110]">
                    Password
                  </label>
                  {tab === 'signin' && (
                    <a href="#forgot" className="text-xs text-[#00635D] hover:underline">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] rounded-md focus:outline-none focus:border-[#00635D] text-gray-800 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {tab === 'signin' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-[#D5D2C9] text-[#00635D] focus:ring-0"
                  />
                  <label htmlFor="remember" className="text-xs text-gray-600">
                    Keep me signed in on this device
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#37745B] hover:bg-[#2c5f49] text-white font-semibold py-2.5 rounded-md shadow-xs transition-colors text-sm"
              >
                {tab === 'signin' ? 'Sign In' : 'Create Goodreads Account'}
              </button>
            </form>

            <p className="text-[11px] text-gray-500 text-center mt-5 leading-normal">
              By continuing, you agree to the Goodreads{' '}
              <a href="#terms" className="text-[#00635D] hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-[#00635D] hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <GoogleSignInModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleGoogleSuccess}
      />
    </>
  );
};
