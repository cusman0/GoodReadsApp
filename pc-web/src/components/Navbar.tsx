import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  LogOut,
  BookOpen,
  Bookmark,
  Smartphone,
  Monitor,
} from 'lucide-react';
import type { Book, UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  books: Book[];
  onSelectBook: (book: Book) => void;
  onOpenAuth: (tab: 'signin' | 'register') => void;
  onLogout: () => void;
  viewMode: 'desktop' | 'mobile';
  onToggleViewMode: (mode: 'desktop' | 'mobile') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  books,
  onSelectBook,
  onOpenAuth,
  onLogout,
  viewMode,
  onToggleViewMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close search and user menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = books
    .filter(
      b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  return (
    <header className="sticky top-0 z-30 bg-[#F4F1EA] border-b border-[#E2DED5] shadow-xs">
      {/* Top Banner for Switching PC / Mobile mode */}
      <div className="bg-[#382110] text-[#E0DDD5] text-xs py-1.5 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-medium">Goodreads Multiplatform:</span>
          <span className="text-gray-400">Mobile & PC Web Architecture</span>
        </div>
        <div className="flex items-center bg-[#29170a] rounded-full p-0.5 border border-[#4d321d]">
          <button
            onClick={() => onToggleViewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium transition-colors ${
              viewMode === 'desktop'
                ? 'bg-[#409D69] text-white shadow-xs'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop PC View</span>
          </button>
          <button
            onClick={() => onToggleViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium transition-colors ${
              viewMode === 'mobile'
                ? 'bg-[#409D69] text-white shadow-xs'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Simulator</span>
          </button>
        </div>
      </div>

      {/* Main Goodreads Navbar */}
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="font-serif text-3xl font-bold text-[#382110] hover:text-[#00635D] transition-colors tracking-tight"
          >
            goodreads
          </a>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#382110]">
            <a href="#home" className="hover:text-[#00635D] transition-colors">
              Home
            </a>
            <a
              href="#mybooks"
              className="hover:text-[#00635D] transition-colors flex items-center gap-1"
            >
              My Books
              {user && (
                <span className="bg-[#409D69] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {books.filter(b => b.userShelf).length}
                </span>
              )}
            </a>

            {/* Browse Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrowseMenu(!showBrowseMenu)}
                className="hover:text-[#00635D] transition-colors flex items-center gap-0.5"
              >
                Browse <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showBrowseMenu && (
                <div
                  onMouseLeave={() => setShowBrowseMenu(false)}
                  className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#D5D2C9] rounded-md shadow-lg py-2 z-50 text-xs"
                >
                  <a href="#genres" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    Recommendations
                  </a>
                  <a href="#choice" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    Choice Awards
                  </a>
                  <a href="#genres" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    Genres
                  </a>
                  <a href="#giveaways" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    Giveaways
                  </a>
                  <a href="#new" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    New Releases
                  </a>
                </div>
              )}
            </div>

            {/* Community Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCommunityMenu(!showCommunityMenu)}
                className="hover:text-[#00635D] transition-colors flex items-center gap-0.5"
              >
                Community <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showCommunityMenu && (
                <div
                  onMouseLeave={() => setShowCommunityMenu(false)}
                  className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#D5D2C9] rounded-md shadow-lg py-2 z-50 text-xs"
                >
                  <a href="#groups" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    Groups
                  </a>
                  <a href="#discussions" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    Discussions
                  </a>
                  <a href="#quotes" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    Quotes
                  </a>
                  <a href="#ask" className="block px-4 py-1.5 hover:bg-[#F4F1EA] text-gray-700">
                    Ask the Author
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Center: Search with Live Autocomplete */}
        <div ref={searchContainerRef} className="flex-1 max-w-md relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search books, genres, authors, ISBN"
              className="w-full bg-white border border-[#D5D2C9] rounded-md py-1.5 pl-3 pr-8 text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#00635D] focus:ring-1 focus:ring-[#00635D]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D5D2C9] rounded-md shadow-xl py-2 z-50">
              <div className="px-3 py-1 text-[11px] font-semibold uppercase text-gray-500 tracking-wider">
                Matching Books
              </div>
              {searchResults.length > 0 ? (
                searchResults.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onSelectBook(b);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[#F4F1EA] text-left transition-colors"
                  >
                    <img
                      src={b.coverUrl}
                      alt={b.title}
                      className="w-8 h-12 object-cover rounded-xs border border-gray-200 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="font-serif font-bold text-xs text-gray-900 truncate">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-gray-600 truncate">by {b.author}</div>
                      <div className="text-[10px] text-[#ED9220] font-semibold">
                        ★ {b.rating.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-xs text-gray-500 text-center">
                  No books found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions / Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                title="Notifications"
                className="p-1.5 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                title="Discussions"
                className="p-1.5 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Profile Dropdown */}
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 focus:outline-none"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-[#00635D]"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#D5D2C9] rounded-md shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="font-semibold text-xs text-gray-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                      {user.isGoogleUser && (
                        <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1">
                          Google Account
                        </span>
                      )}
                    </div>

                    <a
                      href="#mybooks"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-[#F4F1EA]"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-gray-500" /> My Books
                    </a>
                    <a
                      href="#challenge"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-[#F4F1EA]"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-gray-500" /> 2026 Reading Challenge
                    </a>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('signin')}
                className="text-xs font-semibold text-[#382110] hover:text-[#00635D] px-2 py-1 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="bg-[#37745B] hover:bg-[#2c5f49] text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs"
              >
                Join
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
