export interface Book {
  id: string;
  title: string;
  author: string;
  authorImage?: string;
  coverUrl: string;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  pages: number;
  publishedYear: number;
  genres: string[];
  description: string;
  userShelf?: 'want-to-read' | 'currently-reading' | 'read' | null;
  userRating?: number;
  progressPages?: number;
}

export interface Review {
  id: string;
  bookId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  content: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface FeedActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  activityType: 'rated' | 'reading' | 'finished' | 'reviewed';
  book: Book;
  rating?: number;
  reviewText?: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isGoogleUser?: boolean;
  booksReadCount: number;
  wantToReadCount: number;
  currentlyReadingCount: number;
  readingChallengeGoal: number;
  readingChallengeProgress: number;
}

