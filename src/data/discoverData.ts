import { Book } from '../types';

export const DISCOVER_GENRES = [
  'All Genres',
  'Trending',
  'Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery & Thriller',
  'Romance',
  'Horror',
  'Historical Fiction',
  'Non-Fiction',
  'Biography & Memoir',
  'Self Help & Psychology',
  'Young Adult',
  'Graphic Novels',
];

export const TRENDING_BOOKS: Book[] = [];

export const RECOMMENDED_BOOKS: Book[] = [];

export const GENRE_CURATED_BOOKS: Record<string, Book[]> = {};
