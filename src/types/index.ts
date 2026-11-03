export interface Book {
  id: string;
  title: string;
  author: string;
  authors?: string[];
  authorImage?: string;
  coverUrl: string;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  pages: number;
  publishedYear: number;
  firstPublishYear?: number;
  genres: string[];
  subjects?: string[];
  description: string;
  workKey?: string;
  source?: string;
  userShelf?: 'want-to-read' | 'currently-reading' | 'read' | null;
  userRating?: number;
  progressPages?: number;
}

export interface Review {
  id: string;
  ownerId: string;
  bookId: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
  rating: number;
  reviewText: string;
  visibility: 'public' | 'private';
  createdAt: any;
  activityType?: 'reviewed' | 'reading' | 'finished' | 'rated';
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;

  // Compatibility fields
  userName?: string;
  userAvatar?: string;
  date?: string;
  content?: string;
  likes?: number;
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
  visibility: 'public' | 'private';
  timestamp: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  reviewId?: string;
  postId?: string;
  userId: string;
  authorId?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  text: string;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: 'like' | 'comment';
  postId: string;
  bookTitle: string;
  bookCoverUrl?: string;
  commentText?: string;
  read: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isGoogleUser?: boolean;
  booksReadCount?: number;
  wantToReadCount?: number;
  currentlyReadingCount?: number;
  readingChallengeGoal?: number;
  readingChallengeProgress?: number;
  createdAt?: any;
}
