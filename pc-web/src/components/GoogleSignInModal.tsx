import { useState } from 'react';
import {
  signInWithGoogle,
} from '../firebase';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { name: string; email: string; avatar: string }) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('email');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    setLoading(false);
  };

  const handleCancel = () => {
    resetState();
    onClose();
  };

  const handleEmailNext = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Enter an email or phone number');
      return;
    }
    setErrorMessage(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep('password');
    }, 400);
  };

  const handlePasswordNext = () => {
    const trimmedEmail = email.trim().toLowerCase();
    const finalEmail = trimmedEmail.includes('@') ? trimmedEmail : `${trimmedEmail}@gmail.com`;

    const handle = finalEmail.split('@')[0];
    const derivedName = handle
      .split(/[._-]/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Google User';

    const account = {
      name: derivedName,
      email: finalEmail,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=4285F4&color=fff&size=128`,
    };

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSelectAccount(account);
      resetState();
      onClose();
    }, 500);
  };

  const handleDirectLivePopup = async () => {
    setLoading(true);
    try {
      const userProfile = await signInWithGoogle();
      onSelectAccount({
        name: userProfile.name,
        email: userProfile.email,
        avatar: userProfile.avatar,
      });
      resetState();
      onClose();
    } catch (err: any) {
      console.error('Firebase Google popup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-300 flex flex-col h-[600px] max-h-[95vh]">
        {/* Safari / Browser Top Header Bar */}
        <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between bg-white shrink-0">
          <button
            onClick={handleCancel}
            className="text-[#007AFF] text-base hover:opacity-75 transition-opacity font-normal cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-1.5 bg-[#F2F2F7] px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-900 border border-gray-200">
            <span className="text-[11px]">🔒</span>
            <span>accounts.google.com</span>
          </div>

          <div className="flex items-center gap-3 text-[#007AFF]">
            <span className="text-sm font-medium">aA</span>
            <button
              onClick={handleDirectLivePopup}
              title="Launch official popup"
              className="text-base font-semibold hover:opacity-75 cursor-pointer"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Real Google Blue Top Progress Bar */}
        {loading && <div className="h-0.5 bg-[#1A73E8] w-full animate-pulse" />}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pt-8 pb-4 flex flex-col justify-between">
          <div>
            {/* Official Google Wordmark Logo */}
            <div className="flex justify-center mb-4">
              <img
                src="/src/assets/google_wordmark.png"
                alt="Google"
                className="h-7 w-auto object-contain"
                onError={e => {
                  // Fallback colored text if asset path is relative
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {step === 'email' ? (
              <>
                <h2 className="text-2xl font-normal text-[#202124] text-center mb-2">
                  Sign in
                </h2>
                <p className="text-sm text-[#202124] text-center leading-relaxed px-2 mb-8">
                  with your Google Account. You’ll also sign in to Google services in
                  your apps & Safari.
                </p>

                {/* Input with Floating Label */}
                <div
                  className={`relative border rounded px-3 pt-2.5 pb-2 transition-all ${
                    errorMessage
                      ? 'border-[#D93025] ring-1 ring-[#D93025]'
                      : emailFocused || email
                      ? 'border-[#1A73E8] ring-1 ring-[#1A73E8]'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <label
                    className={`absolute -top-2.5 left-2 bg-white px-1 text-xs transition-colors ${
                      errorMessage
                        ? 'text-[#D93025]'
                        : emailFocused || email
                        ? 'text-[#1A73E8] font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    Email or phone
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoFocus
                    className="w-full text-base text-[#202124] focus:outline-hidden bg-transparent"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-[#D93025] mt-1.5 ml-1">
                    ⚠ {errorMessage}
                  </p>
                )}

                <div className="mt-2.5">
                  <a href="#forgot" className="text-sm font-semibold text-[#1A73E8] hover:underline">
                    Forgot email?
                  </a>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-normal text-[#202124] text-center mb-4">
                  Welcome
                </h2>

                {/* Account Chip */}
                <div
                  onClick={() => setStep('email')}
                  className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-1 w-fit mx-auto mb-6 cursor-pointer hover:bg-gray-50"
                >
                  <div className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-xs flex items-center justify-center font-bold">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-700 font-medium max-w-[200px] truncate">
                    {email}
                  </span>
                  <span className="text-xs text-gray-500">▾</span>
                </div>

                {/* Password Input */}
                <div
                  className={`relative border rounded px-3 pt-2.5 pb-2 transition-all ${
                    passwordFocused || password
                      ? 'border-[#1A73E8] ring-1 ring-[#1A73E8]'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <label
                    className={`absolute -top-2.5 left-2 bg-white px-1 text-xs transition-colors ${
                      passwordFocused || password
                        ? 'text-[#1A73E8] font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    Enter your password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    autoFocus
                    className="w-full text-base text-[#202124] focus:outline-hidden bg-transparent"
                  />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPass"
                    checked={showPassword}
                    onChange={e => setShowPassword(e.target.checked)}
                    className="rounded border-gray-300 text-[#1A73E8] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="showPass" className="text-xs text-gray-700 cursor-pointer">
                    Show password
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="pt-8 flex items-center justify-between">
            <a
              href="#create"
              className="text-sm font-semibold text-[#1A73E8] hover:underline"
            >
              {step === 'email' ? 'Create account' : 'Forgot password?'}
            </a>

            <button
              onClick={step === 'email' ? handleEmailNext : handlePasswordNext}
              disabled={loading}
              className="bg-[#1A73E8] hover:bg-[#1557b0] text-white text-sm font-medium px-6 py-2 rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Next'}
            </button>
          </div>
        </div>

        {/* Safari / Browser Bottom Bar */}
        <div className="h-11 border-t border-gray-200 bg-[#F9F9FB] px-6 flex items-center justify-between text-[#007AFF] text-lg select-none">
          <span>‹</span>
          <span className="text-gray-300">›</span>
          <span>⎙</span>
          <span>📖</span>
          <span>⧉</span>
        </div>
      </div>
    </div>
  );
};
