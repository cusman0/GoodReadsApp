import { useState } from 'react';
import {
  BookOpen,
  Bookmark,
  Search,
  User,
} from 'lucide-react';
import type { Book, FeedActivity, UserProfile } from '../types';

interface MobileSimulatorProps {
  user: UserProfile | null;
  books: Book[];
  feed: FeedActivity[];
  onSelectBook: (book: Book) => void;
  onShelfChange?: (
    bookId: string,
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null,
    rating?: number,
    progress?: number
  ) => void;
  onOpenAuth: (tab: 'signin' | 'register') => void;
  onLogout: () => void;
}

export const MobileViewSimulator: React.FC<MobileSimulatorProps> = ({
  user,
  books,
  feed,
  onSelectBook,
  onOpenAuth,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'mybooks' | 'search' | 'profile'>('home');
  const [myBooksFilter, setMyBooksFilter] = useState<'all' | 'reading' | 'want' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentlyReading = books.filter(b => b.userShelf === 'currently-reading');

  const filteredMyBooks = books.filter(b => {
    if (myBooksFilter === 'all') return Boolean(b.userShelf);
    if (myBooksFilter === 'reading') return b.userShelf === 'currently-reading';
    if (myBooksFilter === 'want') return b.userShelf === 'want-to-read';
    if (myBooksFilter === 'read') return b.userShelf === 'read';
    return true;
  });

  const searchResults = books.filter(
    b =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex justify-center items-center py-6">
      {/* Mobile Device Frame */}
      <div className="w-[380px] h-[780px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-gray-800 relative flex flex-col overflow-hidden">
        {/* Phone Notch / Speaker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-36 bg-black rounded-b-xl z-50 flex items-center justify-center">
          <div className="w-12 h-1 bg-gray-800 rounded-full" />
        </div>

        {/* Inner Phone Screen */}
        <div className="flex-1 bg-[#F4F1EA] rounded-[38px] overflow-hidden flex flex-col relative">
          {/* iOS Status Bar */}
          <div className="h-9 px-6 flex justify-between items-center text-[11px] font-semibold text-gray-800 bg-[#F4F1EA] select-none pt-1">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <div className="w-5 h-2.5 border border-gray-800 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-gray-800 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Mobile Goodreads Header */}
          <header className="h-12 bg-[#F4F1EA] border-b border-[#E2DED5] px-4 flex items-center justify-between">
            <span className="font-serif text-2xl font-bold text-[#382110] tracking-tight">
              goodreads
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('search')}
                className="w-8 h-8 rounded-full bg-white border border-[#D5D2C9] flex items-center justify-center text-gray-700"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {user ? (
                <button
                  onClick={() => setActiveTab('profile')}
                  className="w-8 h-8 rounded-full overflow-hidden border border-[#00635D]"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="bg-[#37745B] text-white text-[11px] font-bold px-2.5 py-1 rounded"
                >
                  Sign In
                </button>
              )}
            </div>
          </header>

          {/* Scrollable Screen Content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs">
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-3">
                {/* 2026 Reading Challenge Mobile Card */}
                {user ? (
                  <div className="bg-white rounded-lg p-3 border border-[#E0DDD5] shadow-2xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-[#00635D] tracking-wider uppercase">
                        2026 Reading Challenge
                      </span>
                      <span className="text-[10px] font-bold text-[#409D69]">
                        {Math.round((user.readingChallengeProgress / user.readingChallengeGoal) * 100)}%
                      </span>
                    </div>
                    <div className="font-serif font-bold text-gray-900 text-xs">
                      {user.readingChallengeProgress} of {user.readingChallengeGoal} books completed
                    </div>
                    <div className="w-full bg-[#EBE8DF] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-[#409D69] h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (user.readingChallengeProgress / user.readingChallengeGoal) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-3 border border-[#E0DDD5] text-center">
                    <h4 className="font-serif font-bold text-sm text-[#382110]">
                      Meet your next favorite book.
                    </h4>
                    <p className="text-[11px] text-gray-600 mt-1">
                      Sign in or create an account with Google to track your reading.
                    </p>
                    <button
                      onClick={() => onOpenAuth('signin')}
                      className="mt-2.5 w-full bg-[#37745B] text-white font-bold py-1.5 rounded text-xs"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}

                {/* Currently Reading */}
                {currentlyReading.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Currently Reading
                    </div>
                    {currentlyReading.map(book => (
                      <div
                        key={book.id}
                        className="bg-white rounded-lg p-2.5 border border-[#E0DDD5] flex gap-2.5 items-center mb-2"
                      >
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          onClick={() => onSelectBook(book)}
                          className="w-10 h-15 object-cover rounded cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            onClick={() => onSelectBook(book)}
                            className="font-serif font-bold text-gray-900 truncate cursor-pointer"
                          >
                            {book.title}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            by {book.author}
                          </div>
                          <div className="text-[10px] text-[#00635D] font-semibold mt-1">
                            Page {book.progressPages || 0} of {book.pages}
                          </div>
                        </div>
                        <button
                          onClick={() => onSelectBook(book)}
                          className="text-[10px] bg-[#F4F1EA] border border-[#D5D2C9] font-semibold px-2 py-1 rounded"
                        >
                          Update
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trending Books Carousel */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Trending This Week
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                    {books.slice(0, 5).map(b => (
                      <div
                        key={b.id}
                        onClick={() => onSelectBook(b)}
                        className="w-22 shrink-0 cursor-pointer"
                      >
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="w-22 h-32 object-cover rounded border border-gray-200 shadow-2xs"
                        />
                        <div className="font-serif font-bold text-[11px] truncate mt-1 text-gray-900">
                          {b.title}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {b.author}
                        </div>
                        <div className="text-[10px] text-[#ED9220] font-semibold">
                          ★ {b.rating.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feed Activities */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Updates Feed
                  </div>
                  <div className="space-y-2.5">
                    {feed.map(item => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg p-3 border border-[#E0DDD5]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={item.userAvatar}
                            alt={item.userName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-gray-900">
                              {item.userName}
                            </span>{' '}
                            <span className="text-gray-500 text-[10px]">
                              {item.activityType === 'reviewed' ? 'reviewed' : 'is reading'}
                            </span>
                          </div>
                        </div>

                        <div
                          onClick={() => onSelectBook(item.book)}
                          className="flex gap-2 bg-[#FAF9F6] p-2 rounded border border-[#EAE7DF] cursor-pointer"
                        >
                          <img
                            src={item.book.coverUrl}
                            alt={item.book.title}
                            className="w-8 h-12 object-cover rounded"
                          />
                          <div className="overflow-hidden">
                            <div className="font-serif font-bold truncate">
                              {item.book.title}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              by {item.book.author}
                            </div>
                            <div className="text-[10px] text-[#ED9220]">
                              ★ {item.rating || item.book.rating.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {item.reviewText && (
                          <p className="text-[11px] font-serif text-gray-700 mt-2 line-clamp-2">
                            "{item.reviewText}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MY BOOKS TAB */}
            {activeTab === 'mybooks' && (
              <div className="space-y-3">
                <div className="flex gap-1 bg-[#EBE8DF] p-0.5 rounded-lg text-[11px]">
                  <button
                    onClick={() => setMyBooksFilter('all')}
                    className={`flex-1 py-1 rounded-md font-semibold transition-colors ${
                      myBooksFilter === 'all'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-600'
                    }`}
                  >
                    All ({books.filter(b => b.userShelf).length})
                  </button>
                  <button
                    onClick={() => setMyBooksFilter('reading')}
                    className={`flex-1 py-1 rounded-md font-semibold transition-colors ${
                      myBooksFilter === 'reading'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-600'
                    }`}
                  >
                    Reading
                  </button>
                  <button
                    onClick={() => setMyBooksFilter('want')}
                    className={`flex-1 py-1 rounded-md font-semibold transition-colors ${
                      myBooksFilter === 'want'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-600'
                    }`}
                  >
                    Want
                  </button>
                  <button
                    onClick={() => setMyBooksFilter('read')}
                    className={`flex-1 py-1 rounded-md font-semibold transition-colors ${
                      myBooksFilter === 'read'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-600'
                    }`}
                  >
                    Read
                  </button>
                </div>

                <div className="space-y-2">
                  {filteredMyBooks.length > 0 ? (
                    filteredMyBooks.map(book => (
                      <div
                        key={book.id}
                        className="bg-white rounded-lg p-2.5 border border-[#E0DDD5] flex gap-3 items-center"
                      >
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          onClick={() => onSelectBook(book)}
                          className="w-12 h-17 object-cover rounded cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            onClick={() => onSelectBook(book)}
                            className="font-serif font-bold text-gray-900 truncate cursor-pointer"
                          >
                            {book.title}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            by {book.author}
                          </div>
                          <div className="text-[10px] text-[#ED9220] font-semibold mt-1">
                            ★ {book.rating.toFixed(2)}
                          </div>
                          <span className="inline-block mt-1 text-[10px] bg-[#EAE5DB] text-[#382110] px-2 py-0.5 rounded font-medium">
                            {book.userShelf === 'want-to-read' && 'Want to Read ✓'}
                            {book.userShelf === 'currently-reading' && 'Reading 📖'}
                            {book.userShelf === 'read' && 'Read ✓✓'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No books found on this shelf.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEARCH / DISCOVER TAB */}
            {activeTab === 'search' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books, authors, genres..."
                  className="w-full bg-white border border-[#D5D2C9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00635D]"
                />

                <div className="space-y-2">
                  {searchResults.map(book => (
                    <div
                      key={book.id}
                      onClick={() => onSelectBook(book)}
                      className="bg-white rounded-lg p-2.5 border border-[#E0DDD5] flex gap-3 items-center cursor-pointer hover:bg-gray-50"
                    >
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-10 h-15 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-serif font-bold text-gray-900 truncate">
                          {book.title}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          by {book.author}
                        </div>
                        <div className="text-[10px] text-[#ED9220] font-semibold">
                          ★ {book.rating.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-3">
                {user ? (
                  <>
                    <div className="bg-white rounded-lg p-4 border border-[#E0DDD5] flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#00635D]"
                      />
                      <div className="min-w-0">
                        <div className="font-serif font-bold text-sm text-gray-900 truncate">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {user.email}
                        </div>
                        {user.isGoogleUser && (
                          <span className="inline-block bg-blue-50 text-blue-700 text-[9px] font-semibold px-2 py-0.5 rounded-full mt-1">
                            Google Connected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-[#E0DDD5]">
                        <div className="font-serif font-bold text-sm text-[#382110]">
                          {books.filter(b => b.userShelf === 'read').length}
                        </div>
                        <div className="text-[10px] text-gray-500">Read</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#E0DDD5]">
                        <div className="font-serif font-bold text-sm text-[#382110]">
                          {books.filter(b => b.userShelf === 'currently-reading').length}
                        </div>
                        <div className="text-[10px] text-gray-500">Reading</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#E0DDD5]">
                        <div className="font-serif font-bold text-sm text-[#382110]">
                          {books.filter(b => b.userShelf === 'want-to-read').length}
                        </div>
                        <div className="text-[10px] text-gray-500">Want</div>
                      </div>
                    </div>

                    <button
                      onClick={onLogout}
                      className="w-full bg-white border border-red-300 text-red-600 font-semibold py-2 rounded-lg text-xs"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="bg-white rounded-lg p-6 border border-[#E0DDD5] text-center">
                    <User className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <div className="font-serif font-bold text-sm text-gray-900">
                      Sign in to Goodreads
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 mb-3">
                      Access your reading challenge, bookshelves, and ratings.
                    </p>
                    <button
                      onClick={() => onOpenAuth('signin')}
                      className="w-full bg-[#37745B] text-white font-bold py-2 rounded text-xs"
                    >
                      Sign In with Google or Email
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Bottom Tab Bar */}
          <nav className="h-14 bg-white border-t border-[#E2DED5] flex items-center justify-around px-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-0.5 ${
                activeTab === 'home' ? 'text-[#00635D] font-bold' : 'text-gray-500'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-[9px]">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('mybooks')}
              className={`flex flex-col items-center gap-0.5 ${
                activeTab === 'mybooks' ? 'text-[#00635D] font-bold' : 'text-gray-500'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="text-[9px]">My Books</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex flex-col items-center gap-0.5 ${
                activeTab === 'search' ? 'text-[#00635D] font-bold' : 'text-gray-500'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="text-[9px]">Discover</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 ${
                activeTab === 'profile' ? 'text-[#00635D] font-bold' : 'text-gray-500'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[9px]">Profile</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
