import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../types';
import {
  signInWithGoogle,
  signInWithGoogleIdToken,
  registerWithEmail,
  signInWithEmail,
  GOOGLE_WEB_CLIENT_ID,
} from '../firebase';

declare global {
  interface Window {
    google?: any;
  }
}

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gisRendered, setGisRendered] = useState(false);

  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  // Sync tab with initialTab when opened
  useEffect(() => {
    setTab(initialTab);
    setError(null);
  }, [initialTab, isOpen]);

  // Initialize official Google Identity Services (GIS) button using real Client ID
  useEffect(() => {
    if (!isOpen) return;

    const initGIS = () => {
      if (window.google?.accounts?.id && googleButtonContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_WEB_CLIENT_ID,
            callback: async (response: { credential: string }) => {
              setIsGoogleLoading(true);
              setError(null);
              try {
                const userProfile = await signInWithGoogleIdToken(response.credential);
                onLoginSuccess(userProfile);
                onClose();
              } catch (err: any) {
                console.error('Google Credential Sign-In Error:', err);
                setError(err.message || 'Google Authentication failed.');
              } finally {
                setIsGoogleLoading(false);
              }
            },
          });

          // Render official Google button into the container
          googleButtonContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'outline',
            text: tab === 'signin' ? 'continue_with' : 'signup_with',
            size: 'large',
            logo_alignment: 'left',
            width: googleButtonContainerRef.current.offsetWidth || 340,
          });
          setGisRendered(true);
        } catch (e) {
          console.warn('GIS init error:', e);
          setGisRendered(false);
        }
      }
    };

    const timer = setTimeout(initGIS, 150);
    return () => clearTimeout(timer);
  }, [isOpen, tab, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
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

    setIsSubmitting(true);
    try {
      let profile: UserProfile;
      if (tab === 'register') {
        profile = await registerWithEmail(name, email, password);
      } else {
        profile = await signInWithEmail(email, password);
      }
      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Firebase Email Auth Error:', err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'Incorrect email or password. Please verify your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please create an account.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'The email address is invalid.';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Real Google Authentication via Firebase Auth Popup
   */
  const handleGooglePopupAuth = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const userProfile = await signInWithGoogle();
      onLoginSuccess(userProfile);
      onClose();
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err);
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          `Domain '${window.location.hostname}' is not authorized. Go to Firebase Console > Authentication > Settings > Authorized domains and add '${window.location.hostname}'.`
        );
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          'Google Sign-In is disabled in your Firebase project. Go to Firebase Console > Authentication > Sign-in method and enable Google.'
        );
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        setError(
          'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.'
        );
        return;
      }
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#FAF9F6] rounded-xl shadow-2xl border border-[#E0DDD5] overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
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
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
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
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Official Google Identity Services container */}
          <div className={`justify-center mb-4 ${gisRendered ? 'flex' : 'hidden'}`}>
            <div
              ref={googleButtonContainerRef}
              className="w-full min-h-[44px] flex justify-center"
            />
          </div>

          {/* Standard Firebase Google Authentication Button (shown if GIS is not rendered) */}
          {!gisRendered && (
            <button
              type="button"
              disabled={isGoogleLoading || isSubmitting}
              onClick={handleGooglePopupAuth}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#D5D2C9] hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-md shadow-xs transition-colors mb-4 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
              ) : (
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
              )}
              <span className="font-semibold text-sm">
                {isGoogleLoading
                  ? 'Authenticating with Google...'
                  : tab === 'signin'
                  ? 'Sign in with Google'
                  : 'Sign up with Google'}
              </span>
            </button>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-[#D5D2C9] w-full" />
            <span className="bg-[#FAF9F6] px-3 text-xs text-gray-500 uppercase tracking-wider">
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
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
                  <a
                    href="#forgot"
                    className="text-xs text-[#00635D] hover:underline"
                  >
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
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                  className="rounded border-[#D5D2C9] text-[#00635D] focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-gray-600 cursor-pointer"
                >
                  Keep me signed in on this device
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full bg-[#37745B] hover:bg-[#2c5f49] text-white font-semibold py-2.5 rounded-md shadow-xs transition-colors text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : tab === 'signin' ? (
                'Sign In'
              ) : (
                'Create Goodreads Account'
              )}
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
  );
};
