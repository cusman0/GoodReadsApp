import { useState } from 'react';
import type { Book } from '../types';
import { Check } from 'lucide-react';

interface CurrentlyReadingWidgetProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onUpdateProgress: (bookId: string, progress: number) => void;
}

export const CurrentlyReadingWidget: React.FC<CurrentlyReadingWidgetProps> = ({
  books,
  onSelectBook,
  onUpdateProgress,
}) => {
  const currentBooks = books.filter(b => b.userShelf === 'currently-reading');
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [tempPage, setTempPage] = useState('');

  if (currentBooks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E0DDD5] p-4 mb-4">
        <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#382110] mb-2">
          CURRENTLY READING
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          What are you reading right now?
        </p>
        <button
          onClick={() => {
            const first = books[0];
            if (first) onSelectBook(first);
          }}
          className="text-xs font-semibold text-[#00635D] hover:underline"
        >
          Find a book to read →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#E0DDD5] p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#382110]">
          CURRENTLY READING
        </h3>
        <span className="text-[11px] text-gray-500">
          {currentBooks.length} {currentBooks.length === 1 ? 'book' : 'books'}
        </span>
      </div>

      <div className="space-y-4">
        {currentBooks.map(book => {
          const progressPercent = Math.min(
            100,
            Math.round(((book.progressPages || 0) / book.pages) * 100)
          );

          return (
            <div key={book.id} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
              <img
                src={book.coverUrl}
                alt={book.title}
                onClick={() => onSelectBook(book)}
                className="w-12 h-18 object-cover rounded-xs border border-gray-200 cursor-pointer shadow-xs shrink-0 hover:opacity-90 transition-opacity"
              />

              <div className="flex-1 min-w-0">
                <h4
                  onClick={() => onSelectBook(book)}
                  className="font-serif font-bold text-xs text-gray-900 truncate hover:text-[#00635D] cursor-pointer"
                >
                  {book.title}
                </h4>
                <p className="text-[11px] text-gray-600 truncate">by {book.author}</p>

                {/* Progress bar */}
                <div className="w-full bg-[#EBE8DF] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#409D69] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-1.5 text-[11px] text-gray-500">
                  <span>
                    page {book.progressPages || 0} of {book.pages}
                  </span>
                  <span className="font-semibold text-gray-700">{progressPercent}%</span>
                </div>

                {editingBookId === book.id ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-gray-600">Page:</span>
                    <input
                      type="number"
                      value={tempPage}
                      onChange={e => setTempPage(e.target.value)}
                      placeholder={String(book.progressPages || 0)}
                      className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-center"
                    />
                    <button
                      onClick={() => {
                        const p = parseInt(tempPage, 10);
                        if (!isNaN(p) && p >= 0 && p <= book.pages) {
                          onUpdateProgress(book.id, p);
                        }
                        setEditingBookId(null);
                        setTempPage('');
                      }}
                      className="p-1 bg-[#409D69] text-white rounded text-xs hover:bg-[#358257]"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingBookId(book.id);
                      setTempPage(String(book.progressPages || 0));
                    }}
                    className="mt-2 text-[11px] font-semibold text-[#00635D] hover:underline"
                  >
                    Update progress
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
