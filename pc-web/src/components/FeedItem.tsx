import { useState } from 'react';
import type { FormEvent } from 'react';
import { Heart, MessageSquare, Share2, Star } from 'lucide-react';
import type { FeedActivity, Book } from '../types';

interface FeedItemProps {
  activity: FeedActivity;
  onSelectBook: (book: Book) => void;
  onShelfChange: (bookId: string, shelf: 'want-to-read' | 'currently-reading' | 'read' | null) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  activity,
  onSelectBook,
  onShelfChange,
}) => {
  const [likes, setLikes] = useState(activity.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      setLikes(likes + 1);
      setIsLiked(true);
    }
  };

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([...comments, commentText.trim()]);
    setCommentText('');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              rating >= star
                ? 'text-[#ED9220] fill-[#ED9220]'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <article className="bg-white rounded-lg border border-[#E0DDD5] p-5 shadow-xs transition-shadow hover:shadow-sm">
      {/* User Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={activity.userAvatar}
            alt={activity.userName}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <div className="text-xs text-gray-800">
              <span className="font-bold text-gray-900 hover:text-[#00635D] cursor-pointer">
                {activity.userName}
              </span>{' '}
              {activity.activityType === 'reviewed' && 'reviewed'}
              {activity.activityType === 'reading' && 'started reading'}
              {activity.activityType === 'finished' && 'finished reading'}
            </div>
            <div className="text-[11px] text-gray-500">{activity.timestamp}</div>
          </div>
        </div>
      </div>

      {/* Book Snippet */}
      <div className="flex gap-4 bg-[#FAF9F6] border border-[#EAE7DF] rounded-md p-3 mb-4">
        <img
          src={activity.book.coverUrl}
          alt={activity.book.title}
          onClick={() => onSelectBook(activity.book)}
          className="w-16 h-24 object-cover rounded-xs border border-gray-200 cursor-pointer shadow-xs shrink-0 hover:opacity-90"
        />

        <div className="flex-1 min-w-0">
          <h4
            onClick={() => onSelectBook(activity.book)}
            className="font-serif font-bold text-sm text-gray-900 hover:text-[#00635D] cursor-pointer leading-snug"
          >
            {activity.book.title}
          </h4>
          <p className="text-xs text-gray-600 mt-0.5">
            by <span className="text-[#00635D] hover:underline cursor-pointer">{activity.book.author}</span>
          </p>

          <div className="flex items-center gap-2 mt-2">
            {activity.rating && renderStars(activity.rating)}
            <span className="text-xs font-semibold text-gray-700">
              {activity.rating ? `${activity.rating}.0` : activity.book.rating.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              {(activity.book.ratingCount / 1000).toFixed(0)}k ratings
            </span>
          </div>

          <div className="mt-2.5">
            <button
              onClick={() =>
                onShelfChange(
                  activity.book.id,
                  activity.book.userShelf === 'want-to-read' ? null : 'want-to-read'
                )
              }
              className={`text-xs font-bold px-3 py-1 rounded transition-colors ${
                activity.book.userShelf === 'want-to-read'
                  ? 'bg-[#EAE5DB] text-[#382110] border border-[#D5D2C9]'
                  : 'bg-[#409D69] hover:bg-[#358257] text-white shadow-xs'
              }`}
            >
              {activity.book.userShelf === 'want-to-read' ? 'Want to Read ✓' : 'Want to Read'}
            </button>
          </div>
        </div>
      </div>

      {/* Review Content */}
      {activity.reviewText && (
        <div className="text-xs text-gray-700 leading-relaxed font-serif mb-4 pl-1">
          {activity.reviewText}
        </div>
      )}

      {/* Interaction Buttons */}
      <div className="flex items-center gap-6 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors ${
            isLiked ? 'text-red-500 font-semibold' : 'hover:text-gray-800'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
          <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
        </button>

        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="flex items-center gap-1.5 hover:text-gray-800 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{activity.commentsCount + comments.length} comments</span>
        </button>

        <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Comment section */}
      {showCommentBox && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="space-y-2 mb-3">
            {comments.map((c, i) => (
              <div key={i} className="bg-[#FAF9F6] p-2.5 rounded text-xs text-gray-700">
                <span className="font-bold text-gray-900">You: </span>
                {c}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 text-xs px-3 py-1.5 bg-white border border-[#D5D2C9] rounded-md focus:outline-none focus:border-[#00635D]"
            />
            <button
              type="submit"
              className="bg-[#37745B] hover:bg-[#2c5f49] text-white text-xs font-semibold px-3 py-1.5 rounded-md"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
};
