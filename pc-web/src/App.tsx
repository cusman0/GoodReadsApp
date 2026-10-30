import { useState, useEffect } from 'react';
import type {
  Book,
  FeedActivity,
  UserProfile,
} from './types';
import {
  BOOKS_DATA,
  FEED_ACTIVITIES,
} from './data/mockData';

import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { BookDetailModal } from './components/BookDetailModal';
import { CurrentlyReadingWidget } from './components/CurrentlyReadingWidget';
import { ReadingChallengeWidget } from './components/ReadingChallengeWidget';
import { BookshelvesWidget } from './components/BookshelvesWidget';
import { FeedItem } from './components/FeedItem';
import { NewsSidebar } from './components/NewsSidebar';
import { MobileViewSimulator } from './components/MobileViewSimulator';
import { AdminPortal } from './components/AdminPortal';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import {
  subscribeToAuthState,
  signOutUser,
  signInWithGoogle,
} from './firebase';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<Book[]>(BOOKS_DATA);
  const [feed] = useState<FeedActivity[]>(FEED_ACTIVITIES);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'admin'>('desktop');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'signin' | 'register'>('signin');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Session persistence via Firebase Auth listener (prompt_requirements.md Section 3.1)
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(currentUser => {
      if (currentUser) {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleShelfChange = (
    bookId: string,
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null,
    rating?: number,
    progress?: number
  ) => {
    setBooks(prev =>
      prev.map(b => {
        if (b.id === bookId) {
          return {
            ...b,
            userShelf: shelf,
            userRating: rating !== undefined ? rating : b.userRating,
            progressPages: progress !== undefined ? progress : b.progressPages,
          };
        }
        return b;
      })
    );

    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook(prev =>
        prev
          ? {
              ...prev,
              userShelf: shelf,
              userRating: rating !== undefined ? rating : prev.userRating,
              progressPages:
                progress !== undefined ? progress : prev.progressPages,
            }
          : null
      );
    }

    const shelfName = shelf
      ? shelf === 'want-to-read'
        ? 'Want to Read'
        : shelf === 'currently-reading'
        ? 'Currently Reading'
        : 'Read'
      : 'Removed from shelves';
    showToast(`Book updated: ${shelfName}`);
  };

  const handleUpdateProgress = (bookId: string, progress: number) => {
    setBooks(prev =>
      prev.map(b => (b.id === bookId ? { ...b, progressPages: progress } : b))
    );
    showToast(`Progress updated: page ${progress}`);
  };

  const handleOpenAuth = (tab: 'signin' | 'register') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    showToast(`Welcome back, ${newUser.name}!`);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setUser(null);
    showToast('You have signed out.');
  };

  /**
   * Direct Google Sign-In with Firebase from Hero Banner
   */
  const handleDirectGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      const userProfile = await signInWithGoogle();
      setUser(userProfile);
      showToast(`Welcome to Goodreads, ${userProfile.name}!`);
    } catch (err: any) {
      console.error('Direct Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      handleOpenAuth('signin');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Filter feed or books based on selected shelf if any
  const displayedBooks = selectedShelf
    ? books.filter(b => b.userShelf === selectedShelf)
    : books;

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col font-sans text-gray-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#382110] text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs border border-[#52331b] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#409D69]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Goodreads Navbar */}
      <Navbar
        user={user}
        books={books}
        onSelectBook={setSelectedBook}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Admin Portal Mode (Checklist Items 15-18) */}
      {viewMode === 'admin' ? (
        <AdminPortal onBackToApp={() => setViewMode('desktop')} />
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {viewMode === 'mobile' ? (
          /* Mobile Simulator Mode */
          <MobileViewSimulator
            user={user}
            books={books}
            feed={feed}
            onSelectBook={setSelectedBook}
            onShelfChange={handleShelfChange}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
          />
        ) : (
          /* PC Desktop 3-Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar (Col 3) */}
            <aside className="lg:col-span-3 space-y-4">
              <CurrentlyReadingWidget
                books={books}
                onSelectBook={setSelectedBook}
                onUpdateProgress={handleUpdateProgress}
              />

              <ReadingChallengeWidget
                user={user}
                onOpenAuth={() => handleOpenAuth('signin')}
              />

              <BookshelvesWidget
                books={books}
                selectedShelf={selectedShelf}
                onSelectShelf={setSelectedShelf}
              />
            </aside>

            {/* Center Main Feed (Col 6) */}
            <section className="lg:col-span-6 space-y-6">
              {/* Hero Banner: Logged-in vs Guest */}
              {!user ? (
                <div className="bg-white rounded-lg border border-[#E0DDD5] p-6 shadow-xs">
                  <h2 className="font-serif text-2xl font-bold text-[#382110] leading-tight">
                    Meet your next favorite book.
                  </h2>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Goodreads is the world’s largest site for readers and book recommendations.
                    Keep track of books you want to read, rate books you’ve read, and see what
                    your friends are reading!
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleOpenAuth('signin')}
                      className="bg-[#37745B] hover:bg-[#2c5f49] text-white text-xs font-bold py-2 px-4 rounded shadow-xs transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleOpenAuth('register')}
                      className="bg-white border border-[#D5D2C9] hover:bg-gray-50 text-gray-700 text-xs font-bold py-2 px-4 rounded transition-colors cursor-pointer"
                    >
                      Create Account
                    </button>
                    <button
                      onClick={handleDirectGoogleSignIn}
                      disabled={isGoogleSigningIn}
                      className="flex items-center gap-2 bg-white border border-[#D5D2C9] hover:bg-gray-50 text-gray-700 text-xs font-medium py-2 px-3 rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isGoogleSigningIn ? (
                        <div className="w-4 h-4 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      <span>
                        {isGoogleSigningIn ? 'Connecting...' : 'Continue with Google'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-[#E0DDD5] p-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-gray-900">
                      What will you read next, {user.name.split(' ')[0]}?
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on your reading challenge and shelf favorites.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedShelf(null)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#00635D] hover:underline cursor-pointer"
                  >
                    <span>Browse Recommendations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Shelf Filter Indicator */}
              {selectedShelf && (
                <div className="flex items-center justify-between bg-[#EBE8DF] px-4 py-2 rounded-lg border border-[#D5D2C9]">
                  <span className="text-xs font-semibold text-[#382110]">
                    Showing books on shelf:{' '}
                    <span className="capitalize text-[#00635D]">
                      {selectedShelf.replace('-', ' ')}
                    </span>{' '}
                    ({displayedBooks.length})
                  </span>
                  <button
                    onClick={() => setSelectedShelf(null)}
                    className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Feed Activities */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-gray-600">
                    UPDATES FEED
                  </h3>
                  <span className="text-xs text-gray-400">All Updates ▾</span>
                </div>

                {feed.map(activity => (
                  <FeedItem
                    key={activity.id}
                    activity={activity}
                    onSelectBook={setSelectedBook}
                    onShelfChange={handleShelfChange}
                  />
                ))}
              </div>

              {/* Recommendations Carousel on PC */}
              <div className="bg-white rounded-lg border border-[#E0DDD5] p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif font-bold text-sm text-[#382110]">
                    READERS ALSO ENJOYED
                  </h3>
                  <a href="#more" className="text-xs text-[#00635D] font-semibold hover:underline">
                    See more →
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {books.slice(3, 7).map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBook(b)}
                      className="cursor-pointer group flex flex-col items-center text-center"
                    >
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="w-24 h-36 object-cover rounded shadow-xs border border-gray-200 group-hover:opacity-90 transition-opacity"
                      />
                      <div className="font-serif font-bold text-xs text-gray-900 group-hover:text-[#00635D] line-clamp-1 mt-2">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-gray-500 line-clamp-1">
                        {b.author}
                      </div>
                      <div className="text-[10px] text-[#ED9220] font-semibold mt-0.5">
                        ★ {b.rating.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Right Sidebar (Col 3) */}
            <aside className="lg:col-span-3">
              <NewsSidebar />
            </aside>
          </div>
        )}
      </main>
      )}

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
        onShelfChange={handleShelfChange}
      />

      {/* Auth Modal (Sign In / Register / Google Sign In) */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authInitialTab}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
