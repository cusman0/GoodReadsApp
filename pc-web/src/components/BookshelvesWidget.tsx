import type { Book } from '../types';

interface BookshelvesWidgetProps {
  books: Book[];
  selectedShelf: string | null;
  onSelectShelf: (shelf: string | null) => void;
}

export const BookshelvesWidget: React.FC<BookshelvesWidgetProps> = ({
  books,
  selectedShelf,
  onSelectShelf,
}) => {
  const readCount = books.filter(b => b.userShelf === 'read').length;
  const currentlyReadingCount = books.filter(b => b.userShelf === 'currently-reading').length;
  const wantToReadCount = books.filter(b => b.userShelf === 'want-to-read').length;
  const totalShelved = books.filter(b => b.userShelf).length;

  return (
    <div className="bg-white rounded-lg border border-[#E0DDD5] p-4 mb-4">
      <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#382110] mb-3">
        BOOKSHELVES
      </h3>

      <div className="space-y-1.5 text-xs">
        <button
          onClick={() => onSelectShelf(null)}
          className={`w-full flex justify-between items-center py-1 px-2 rounded-xs text-left transition-colors ${
            selectedShelf === null
              ? 'bg-[#F4F1EA] text-[#00635D] font-bold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>All Shelves</span>
          <span className="text-gray-500 font-normal">({totalShelved})</span>
        </button>

        <button
          onClick={() => onSelectShelf('read')}
          className={`w-full flex justify-between items-center py-1 px-2 rounded-xs text-left transition-colors ${
            selectedShelf === 'read'
              ? 'bg-[#F4F1EA] text-[#00635D] font-bold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>Read</span>
          <span className="text-gray-500 font-normal">({readCount})</span>
        </button>

        <button
          onClick={() => onSelectShelf('currently-reading')}
          className={`w-full flex justify-between items-center py-1 px-2 rounded-xs text-left transition-colors ${
            selectedShelf === 'currently-reading'
              ? 'bg-[#F4F1EA] text-[#00635D] font-bold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>Currently Reading</span>
          <span className="text-gray-500 font-normal">({currentlyReadingCount})</span>
        </button>

        <button
          onClick={() => onSelectShelf('want-to-read')}
          className={`w-full flex justify-between items-center py-1 px-2 rounded-xs text-left transition-colors ${
            selectedShelf === 'want-to-read'
              ? 'bg-[#F4F1EA] text-[#00635D] font-bold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>Want to Read</span>
          <span className="text-gray-500 font-normal">({wantToReadCount})</span>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <a href="#shelves" className="text-[11px] text-[#00635D] hover:underline font-semibold">
          Add shelf +
        </a>
      </div>
    </div>
  );
};
