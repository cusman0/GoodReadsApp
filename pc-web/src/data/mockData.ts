import type { Book, FeedActivity, UserProfile } from '../types';

export const INITIAL_USER: UserProfile | null = null;

export const BOOKS_DATA: Book[] = [];

export const FEED_ACTIVITIES: FeedActivity[] = [];

export const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery & Thriller',
  'Romance',
  'Historical Fiction',
  'Young Adult',
  'Memoir',
  'Biography',
  'Psychology',
  'Self Help',
];

export const NEWS_ITEMS = [
  {
    id: 'news-1',
    title: 'The 28 Most Anticipated Books of Spring 2026',
    date: 'March 24, 2026',
    image: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=300&q=80',
    comments: 64,
  },
  {
    id: 'news-2',
    title: 'Gabrielle Zevin on the Secret Lives of Video Game Creators',
    date: 'March 21, 2026',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80',
    comments: 42,
  },
  {
    id: 'news-3',
    title: 'Readers\' Favorite Sci-Fi Novels of the Decade',
    date: 'March 18, 2026',
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=300&q=80',
    comments: 109,
  },
];
