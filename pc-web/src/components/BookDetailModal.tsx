import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Star, ExternalLink } from 'lucide-react';
import type { Book } from '../types';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onShelfChange: (
    bookId: string,
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null,
    rating?: number,
    progress?: number
  ) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  onShelfChange,
}) => {
  if (!isOpen || !book) return null;

  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(book.userRating || 0);
  const [currentShelf, setCurrentShelf] = useState(book.userShelf || null);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  const [progressPages, setProgressPages] = useState(
    book.progressPages !== undefined ? String(book.progressPages) : '0'
  );

  const starLabels = [
    '',
    'did not like it',
    'it was ok',
    'liked it',
    'really liked it',
    'it was amazing',
  ];

  const handleRate = (r: number) => {
    setCurrentRating(r);
    onShelfChange(book.id, currentShelf, r, parseInt(progressPages, 10) || 0);
  };

  const handleShelf = (shelf: 'want-to-read' | 'currently-reading' | 'read' | null) => {
    setCurrentShelf(shelf);
    setShowShelfMenu(false);
    onShelfChange(book.id, shelf, currentRating, parseInt(progressPages, 10) || 0);
  };

  const handleSaveProgress = (e: FormEvent) => {
    e.preventDefault();
    const p = parseInt(progressPages, 10);
    if (!isNaN(p) && p >= 0 && p <= book.pages) {
      onShelfChange(book.id, currentShelf, currentRating, p);
    }
  };

  const getShelfLabel = () => {
    switch (currentShelf) {
      case 'want-to-read':
        return 'Want to Read ✓';
      case 'currently-reading':
        return 'Currently Reading 📖';
      case 'read':
        return 'Read ✓✓';
      default:
        return 'Want to Read';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF9F6] rounded-xl shadow-2xl border border-[#E0DDD5] overflow-hidden my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Cover & Shelf Actions */}
            <div className="md:col-span-4 flex flex-col items-center">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-44 h-64 object-cover rounded shadow-md border border-[#D5D2C9]"
              />

              {/* Shelf Button & Dropdown */}
              <div className="w-full mt-4 relative">
                <button
                  onClick={() => setShowShelfMenu(!showShelfMenu)}
                  className={`w-full py-2.5 px-4 rounded text-sm font-bold flex items-center justify-between transition-colors shadow-xs ${
                    currentShelf
                      ? 'bg-[#EAE5DB] text-[#382110] border border-[#D5D2C9]'
                      : 'bg-[#409D69] hover:bg-[#358257] text-white'
                  }`}
                >
                  <span>{getShelfLabel()}</span>
                  <span>▾</span>
                </button>

                {showShelfMenu && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D5D2C9] rounded shadow-lg py-1 z-20 text-xs">
                    <button
                      onClick={() => handleShelf('want-to-read')}
                      className="w-full px-4 py-2 text-left hover:bg-[#F4F1EA] text-gray-800"
                    >
                      Want to Read
                    </button>
                    <button
                      onClick={() => handleShelf('currently-reading')}
                      className="w-full px-4 py-2 text-left hover:bg-[#F4F1EA] text-gray-800"
                    >
                      Currently Reading
                    </button>
                    <button
                      onClick={() => handleShelf('read')}
                      className="w-full px-4 py-2 text-left hover:bg-[#F4F1EA] text-gray-800"
                    >
                      Read
                    </button>
                    {currentShelf && (
                      <button
                        onClick={() => handleShelf(null)}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 border-t border-gray-100"
                      >
                        Remove from shelf
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* User Rating Widget */}
              <div className="w-full mt-4 bg-white border border-[#E0DDD5] rounded-md p-3 text-center">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Rate this book
                </div>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className="focus:outline-none p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          (hoverRating || currentRating) >= star
                            ? 'text-[#ED9220] fill-[#ED9220]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-gray-500 h-4 mt-1">
                  {starLabels[hoverRating || currentRating] || 'Tap stars to rate'}
                </div>
              </div>

              {/* Reading Progress if Currently Reading */}
              {currentShelf === 'currently-reading' && (
                <form
                  onSubmit={handleSaveProgress}
                  className="w-full mt-3 bg-white border border-[#E0DDD5] rounded-md p-3 text-xs"
                >
                  <div className="font-semibold text-gray-700 mb-2">Reading Progress</div>
                  <div className="flex items-center gap-2">
                    <span>Page</span>
                    <input
                      type="number"
                      value={progressPages}
                      onChange={e => setProgressPages(e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span>of {book.pages}</span>
                    <button
                      type="submit"
                      className="ml-auto bg-[#37745B] hover:bg-[#2c5f49] text-white px-2.5 py-1 rounded font-semibold text-xs"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              {/* Retailer Links */}
              <div className="w-full mt-4 space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider">
                  Get a copy
                </div>
                <button className="w-full flex justify-between items-center bg-white border border-[#D5D2C9] py-1.5 px-3 rounded hover:bg-gray-50 text-gray-700">
                  <span>Amazon</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button className="w-full flex justify-between items-center bg-white border border-[#D5D2C9] py-1.5 px-3 rounded hover:bg-gray-50 text-gray-700">
                  <span>Kindle Store</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button className="w-full flex justify-between items-center bg-white border border-[#D5D2C9] py-1.5 px-3 rounded hover:bg-gray-50 text-gray-700">
                  <span>Barnes & Noble</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Right Column: Title, Metadata, Description */}
            <div className="md:col-span-8">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {book.title}
              </h1>
              <p className="font-serif text-sm text-gray-600 mt-1">
                by{' '}
                <a href="#author" className="text-[#00635D] font-medium hover:underline">
                  {book.author}
                </a>
              </p>

              {/* Rating Summary */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex items-center gap-1 text-[#ED9220]">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        book.rating >= s ? 'fill-[#ED9220]' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-sm text-gray-800">
                  {book.rating.toFixed(2)}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {book.ratingCount.toLocaleString()} ratings
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {book.reviewCount.toLocaleString()} reviews
                </span>
              </div>

              {/* Description */}
              <div className="mt-4 pt-4 border-t border-[#EAE7DF]">
                <h3 className="font-serif font-bold text-sm text-gray-900 mb-2">
                  Description
                </h3>
                <p className="font-serif text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              </div>

              {/* Genres */}
              <div className="mt-6">
                <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
                  Genres
                </h4>
                <div className="flex flex-wrap gap-2">
                  {book.genres.map(genre => (
                    <span
                      key={genre}
                      className="bg-[#F4F1EA] text-[#00635D] text-xs font-medium px-3 py-1 rounded-full border border-[#E0DDD5]"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specs */}
              <div className="mt-6 pt-4 border-t border-[#EAE7DF] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-gray-600">
                <div>
                  <span className="block text-gray-400 uppercase text-[10px] font-semibold">
                    Format
                  </span>
                  <span className="font-medium text-gray-800">{book.pages} pages, Hardcover</span>
                </div>
                <div>
                  <span className="block text-gray-400 uppercase text-[10px] font-semibold">
                    Published
                  </span>
                  <span className="font-medium text-gray-800">{book.publishedYear}</span>
                </div>
                <div>
                  <span className="block text-gray-400 uppercase text-[10px] font-semibold">
                    Language
                  </span>
                  <span className="font-medium text-gray-800">English</span>
                </div>
              </div>

              {/* Community Reviews preview */}
              <div className="mt-8 pt-4 border-t border-[#EAE7DF]">
                <h3 className="font-serif font-bold text-base text-gray-900 mb-3">
                  Community Reviews
                </h3>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        alt="Elena"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="font-bold text-xs text-gray-900">Elena Rostova</span>
                      <div className="flex text-[#ED9220] ml-2">
                        {'★★★★★'}
                      </div>
                    </div>
                    <p className="font-serif text-xs text-gray-700 leading-relaxed">
                      One of the most emotionally resonant books I have ever read. The character dynamics felt completely authentic and timeless.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
