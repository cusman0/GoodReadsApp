import { useState } from 'react';
import { X } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const accounts = [
    {
      name: 'Ashley Valdez',
      email: 'ashleypatricia.valdez@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
    {
      name: 'Ashley Valdez (Letran)',
      email: 'ashleypatricia.valdez@letran.edu.ph',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
  ];

  const handleSelect = (account: typeof accounts[0]) => {
    setSelectedEmail(account.email);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSelectAccount(account);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Google Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            <div>
              <h3 className="font-medium text-gray-900 text-base leading-tight">
                Sign in with Google
              </h3>
              <p className="text-xs text-gray-500">to continue to Goodreads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Selection */}
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Choose an account
          </p>

          <div className="space-y-2">
            {accounts.map(acc => (
              <button
                key={acc.email}
                disabled={loading}
                onClick={() => handleSelect(acc)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900 group-hover:text-blue-600">
                      {acc.name}
                    </div>
                    <div className="text-xs text-gray-500">{acc.email}</div>
                  </div>
                </div>
                {selectedEmail === acc.email && loading ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 font-medium">
                    Select
                  </span>
                )}
              </button>
            ))}

            <button
              disabled={loading}
              onClick={() =>
                handleSelect({
                  name: 'Goodreads Reader',
                  email: 'reader@goodreads.com',
                  avatar:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
                })
              }
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold">
                +
              </div>
              <div className="text-sm font-medium text-gray-700">
                Use another account
              </div>
            </button>
          </div>

          <p className="text-[11px] text-gray-500 mt-6 leading-relaxed">
            To continue, Google will share your name, email address, language preference,
            and profile picture with Goodreads. Review Goodreads’s{' '}
            <a href="#privacy" className="text-blue-600 underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="#terms" className="text-blue-600 underline">
              Terms of Service
            </a>
            .
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
          <span>English (United States)</span>
          <div className="flex gap-4">
            <a href="#help" className="hover:underline">
              Help
            </a>
            <a href="#privacy" className="hover:underline">
              Privacy
            </a>
            <a href="#terms" className="hover:underline">
              Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
