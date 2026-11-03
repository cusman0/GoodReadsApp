/**
 * Goodreads Book Service - Open Library API
 * Consolidated API service for searching and browsing books via Open Library.
 * Fully free, no API key required.
 */

import { Book } from '../types';

export const OPEN_LIBRARY_BASE = 'https://openlibrary.org';
export const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80';

// In-memory caches to prevent redundant network fetches
const searchCache = new Map<string, { books: Book[]; total: number }>();
const categoryCache = new Map<string, { books: Book[]; total: number }>();
const workDetailsCache = new Map<string, { description: string; subjects: string[] }>();

export const DISCOVER_CATEGORIES = [
  'Fantasy',
  'Romance',
  'Mystery',
  'Science Fiction',
  'Horror',
  'Self Help',
  'History',
  'Biography',
  'Young Adult',
];

/**
 * Maps category display name to Open Library subject slug
 */
export function getSubjectSlug(category: string): string {
  const map: Record<string, string> = {
    'Fantasy': 'fantasy',
    'Romance': 'romance',
    'Mystery': 'mystery',
    'Science Fiction': 'science_fiction',
    'Horror': 'horror',
    'Self Help': 'self-help',
    'History': 'history',
    'Biography': 'biography',
    'Young Adult': 'young_adult',
  };
  return map[category] || category.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Searches Open Library database by query string with pagination (20 items per page)
 * Endpoint: https://openlibrary.org/search.json?q={query}&limit=20&page={page}
 */
export async function searchOpenLibraryBooks(
  query: string,
  page: number = 1
): Promise<{ books: Book[]; total: number }> {
  const clean = query.trim();
  if (!clean) return { books: [], total: 0 };

  const cacheKey = `${clean.toLowerCase()}_p${page}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  const url = `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(clean)}&limit=20&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open Library search failed with status ${response.status}`);
  }

  const data = await response.json();
  const rawDocs: any[] = Array.isArray(data.docs) ? data.docs : [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  const books: Book[] = [];
  for (const doc of rawDocs) {
    const title = (doc.title || '').trim();
    if (!title) continue; // Skip results with no title

    const workKey = doc.key || '';
    const bookId = workKey.replace('/works/', '') || `ol_${doc.cover_i || Math.random().toString(36).substring(7)}`;

    const titleLower = title.toLowerCase();
    if (seenIds.has(bookId) || seenTitles.has(titleLower)) continue; // Skip duplicates
    seenIds.add(bookId);
    seenTitles.add(titleLower);

    const authors = Array.isArray(doc.author_name) && doc.author_name.length > 0
      ? doc.author_name
      : ['Unknown Author'];

    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : DEFAULT_COVER;

    const firstPublishYear = doc.first_publish_year || 2022;
    const subjects = Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : ['General'];

    books.push({
      id: bookId,
      title,
      author: authors.join(', '),
      authors,
      coverUrl,
      rating: doc.ratings_average ? Number(doc.ratings_average.toFixed(2)) : 4.2,
      ratingCount: doc.ratings_count || 1200,
      reviewCount: Math.round((doc.ratings_count || 1200) * 0.1),
      pages: doc.number_of_pages_median || 320,
      publishedYear: firstPublishYear,
      firstPublishYear,
      genres: subjects,
      subjects,
      description: doc.first_sentence
        ? Array.isArray(doc.first_sentence)
          ? doc.first_sentence[0]
          : doc.first_sentence
        : 'Explore this title by ' + authors[0] + ' on Goodreads.',
      workKey,
      source: 'openlibrary',
      userShelf: null,
      userRating: 0,
      progressPages: 0,
    });
  }

  const result = { books, total: data.numFound || books.length };
  searchCache.set(cacheKey, result);
  return result;
}

/**
 * Fetches books from Open Library by category/subject with offset pagination
 * Endpoint: https://openlibrary.org/subjects/{subject}.json?limit=20&offset={offset}
 */
export async function fetchBooksByCategory(
  category: string,
  offset: number = 0,
  limit: number = 20
): Promise<{ books: Book[]; total: number }> {
  const slug = getSubjectSlug(category);
  const cacheKey = `${slug}_off${offset}_lim${limit}`;

  if (categoryCache.has(cacheKey)) {
    return categoryCache.get(cacheKey)!;
  }

  const url = `${OPEN_LIBRARY_BASE}/subjects/${slug}.json?limit=${limit}&offset=${offset}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open Library category fetch failed with status ${response.status}`);
  }

  const data = await response.json();
  const rawWorks: any[] = Array.isArray(data.works) ? data.works : [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  const books: Book[] = [];
  for (const work of rawWorks) {
    const title = (work.title || '').trim();
    if (!title) continue; // Skip results with no title

    const workKey = work.key || '';
    const bookId = workKey.replace('/works/', '') || `ol_${work.cover_id || Math.random().toString(36).substring(7)}`;

    const titleLower = title.toLowerCase();
    if (seenIds.has(bookId) || seenTitles.has(titleLower)) continue; // Remove duplicates
    seenIds.add(bookId);
    seenTitles.add(titleLower);

    const authors = Array.isArray(work.authors) && work.authors.length > 0
      ? work.authors.map((a: any) => a.name || 'Unknown Author')
      : ['Unknown Author'];

    const coverUrl = work.cover_id
      ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
      : DEFAULT_COVER;

    const firstPublishYear = work.first_publish_year || 2022;
    const subjects = Array.isArray(work.subject) ? work.subject.slice(0, 5) : [category];

    books.push({
      id: bookId,
      title,
      author: authors.join(', '),
      authors,
      coverUrl,
      rating: 4.25,
      ratingCount: 2400,
      reviewCount: 320,
      pages: 350,
      publishedYear: firstPublishYear,
      firstPublishYear,
      genres: subjects,
      subjects,
      description: `A celebrated ${category} work by ${authors[0]}.`,
      workKey,
      source: 'openlibrary',
      userShelf: null,
      userRating: 0,
      progressPages: 0,
    });
  }

  const result = { books, total: data.work_count || books.length };
  categoryCache.set(cacheKey, result);
  return result;
}

/**
 * Fetches detailed information for a work from Open Library
 * Endpoint: https://openlibrary.org{work_key}.json
 */
export async function fetchWorkDetails(
  workKey: string
): Promise<{ description: string; subjects: string[] }> {
  if (!workKey) return { description: '', subjects: [] };

  const normalizedKey = workKey.startsWith('/works/') ? workKey : `/works/${workKey}`;
  if (workDetailsCache.has(normalizedKey)) {
    return workDetailsCache.get(normalizedKey)!;
  }

  try {
    const url = `${OPEN_LIBRARY_BASE}${normalizedKey}.json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      let description = '';
      if (typeof data.description === 'string') {
        description = data.description;
      } else if (data.description && typeof data.description.value === 'string') {
        description = data.description.value;
      }

      // Strip any HTML or markdown syntax markers if present
      description = description.replace(/<[^>]*>?/gm, '').replace(/\[\d+\]/g, '').trim();

      const subjects = Array.isArray(data.subjects) ? data.subjects.slice(0, 8) : [];
      const result = { description, subjects };
      workDetailsCache.set(normalizedKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Open Library work details notice:', err);
  }

  return { description: '', subjects: [] };
}

/**
 * Compatibility wrapper for initial bestselling/popular books on startup
 */
export async function fetchPopularBooksFromInternet(
  category?: string | null,
  limit: number = 20
): Promise<Book[]> {
  try {
    const target = category || 'Fantasy';
    const { books } = await fetchBooksByCategory(target, 0, limit);
    return books;
  } catch (err) {
    console.warn('fetchPopularBooksFromInternet notice:', err);
    return [];
  }
}
