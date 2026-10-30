/**
 * Goodreads Book Service
 * Fetches real books from the internet via Google Books API (with Open Library API fallback).
 * Works immediately without requiring a paid API key.
 */

import { Book } from '../types';

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_BASE = 'https://openlibrary.org';

// Default high-quality placeholder cover if an API book has no thumbnail
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80';

/**
 * Normalizes Google Books volume items into the application's Book model
 */
function normalizeGoogleBook(item: any): Book {
  const info = item.volumeInfo || {};
  const imageLinks = info.imageLinks || {};

  // Upgrade http:// image URLs to https:// and replace zoom for higher quality
  let coverUrl =
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail ||
    imageLinks.medium ||
    DEFAULT_COVER;
  if (coverUrl.startsWith('http://')) {
    coverUrl = coverUrl.replace('http://', 'https://');
  }

  // Parse published year
  let publishedYear = 2023;
  if (info.publishedDate) {
    const year = parseInt(info.publishedDate.substring(0, 4), 10);
    if (!isNaN(year)) publishedYear = year;
  }

  // Parse page count
  const pages = info.pageCount || (info.printedPageCount ? info.printedPageCount : 280);

  // Parse rating & counts
  const rating = info.averageRating ? Number(info.averageRating.toFixed(2)) : 4.2;
  const ratingCount = info.ratingsCount || Math.floor(Math.random() * 50000) + 1200;
  const reviewCount = Math.round(ratingCount * 0.12);

  // Parse clean description (strip HTML tags if any)
  const rawDescription = info.description || 'No summary available for this edition.';
  const description = rawDescription.replace(/<[^>]*>?/gm, '').trim();

  // Authors
  const author = Array.isArray(info.authors) && info.authors.length > 0
    ? info.authors.join(', ')
    : 'Unknown Author';

  // Genres / Categories
  const genres: string[] = Array.isArray(info.categories) && info.categories.length > 0
    ? info.categories.map((c: string) => c.split('/')[0].trim())
    : ['Fiction'];

  return {
    id: `gb_${item.id}`,
    title: info.title || 'Untitled Book',
    author,
    coverUrl,
    rating,
    ratingCount,
    reviewCount,
    pages,
    publishedYear,
    genres,
    description,
    userShelf: null,
    userRating: 0,
    progressPages: 0,
  };
}

/**
 * Normalizes Apify Goodreads Scraper items into the application's Book model
 */
function normalizeApifyBook(item: any): Book {
  const rawTitle = item.title || 'Untitled Book';
  const cleanTitle = rawTitle
    .replace(/by [^|]+ \| Goodreads.*/i, '')
    .replace(/Loading interface.*/gi, '')
    .trim();

  let coverUrl = item.image || item.coverUrl || DEFAULT_COVER;
  if (coverUrl.startsWith('http://')) {
    coverUrl = coverUrl.replace('http://', 'https://');
  }

  let year = 2023;
  if (item.publishedDate) {
    const match = String(item.publishedDate).match(/\b(19\d\d|20\d\d)\b/);
    if (match) year = parseInt(match[1], 10);
  } else if (item.firstPublishedDate) {
    const match = String(item.firstPublishedDate).match(/\b(19\d\d|20\d\d)\b/);
    if (match) year = parseInt(match[1], 10);
  }

  const genres: string[] =
    Array.isArray(item.shelves) && item.shelves.length > 0
      ? item.shelves
          .map((s: string) =>
            s
              .replace(/-/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())
              .trim()
          )
          .slice(0, 4)
      : ['Fiction'];

  return {
    id: `gr_${item.bookId || Math.random().toString(36).substring(7)}`,
    title: cleanTitle,
    author: item.authorName || 'Unknown Author',
    coverUrl,
    rating: typeof item.rating === 'number' ? Number(item.rating.toFixed(2)) : 4.25,
    ratingCount: item.numberOfRatings || 1200,
    reviewCount: item.numberOfReviews || Math.round((item.numberOfRatings || 1200) * 0.1),
    pages: item.numberOfPages || 320,
    publishedYear: year,
    genres,
    description: (item.description || '').replace(/<[^>]*>?/gm, '').trim(),
    userShelf: null,
    userRating: 0,
    progressPages: 0,
  };
}

/**
 * Searches the Apify Goodreads Scraper (`epctex/goodreads-scraper`)
 * Supports direct Apify API token or public dataset endpoints
 */
export async function searchApifyGoodreads(
  query: string,
  maxResults: number = 30,
  apifyToken?: string | null
): Promise<Book[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // 1. Direct Apify Actor API invocation if token is configured
  if (apifyToken) {
    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/epctex~goodreads-scraper/run-sync-get-dataset-items?token=${apifyToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            search: cleanQuery,
            maxItems: maxResults,
            includeReviews: false,
            proxy: { useApifyProxy: true },
          }),
        }
      );
      if (response.ok) {
        const items = await response.json();
        if (Array.isArray(items) && items.length > 0) {
          return items.map(normalizeApifyBook);
        }
      }
    } catch (e) {
      console.warn('Apify actor run notice:', e);
    }
  }

  // 2. Apify public sample dataset endpoint fallback
  try {
    const datasetRes = await fetch(
      'https://api.apify.com/v2/datasets/AVTdGvcS2iOjDgAaV/items?clean=true&format=json'
    );
    if (datasetRes.ok) {
      const items = await datasetRes.json();
      if (Array.isArray(items) && items.length > 0) {
        const qLower = cleanQuery.toLowerCase();
        const matches = items.filter(
          (it: any) =>
            (it.title && it.title.toLowerCase().includes(qLower)) ||
            (it.authorName && it.authorName.toLowerCase().includes(qLower)) ||
            (it.description && it.description.toLowerCase().includes(qLower))
        );
        if (matches.length > 0) {
          return matches.slice(0, maxResults).map(normalizeApifyBook);
        }
      }
    }
  } catch (e) {
    // Non-blocking
  }

  return [];
}

/**
 * Searches Open Library database
 */
export async function searchOpenLibraryBooks(
  query: string,
  maxResults: number = 30
): Promise<Book[]> {
  try {
    const olUrl = `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(
      query.trim()
    )}&limit=${maxResults}`;
    const olRes = await fetch(olUrl);
    if (olRes.ok) {
      const olData = await olRes.json();
      if (Array.isArray(olData.docs) && olData.docs.length > 0) {
        return olData.docs.map((doc: any, index: number) => {
          const coverId = doc.cover_i;
          const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : DEFAULT_COVER;

          return {
            id: `ol_${doc.key?.replace('/works/', '') || index}`,
            title: doc.title || 'Untitled Book',
            author: Array.isArray(doc.author_name)
              ? doc.author_name.join(', ')
              : 'Unknown Author',
            coverUrl,
            rating: doc.ratings_average
              ? Number(doc.ratings_average.toFixed(2))
              : 4.15,
            ratingCount: doc.ratings_count || 1500,
            reviewCount: Math.round((doc.ratings_count || 1500) * 0.1),
            pages: doc.number_of_pages_median || 320,
            publishedYear: doc.first_publish_year || 2022,
            genres: Array.isArray(doc.subject) ? doc.subject.slice(0, 3) : ['Fiction'],
            description: doc.first_sentence
              ? Array.isArray(doc.first_sentence)
                ? doc.first_sentence[0]
                : doc.first_sentence
              : `A notable work by ${
                  Array.isArray(doc.author_name) ? doc.author_name[0] : 'the author'
                }.`,
            userShelf: null,
            userRating: 0,
            progressPages: 0,
          };
        });
      }
    }
  } catch (olErr) {
    console.warn('Open Library API search notice:', olErr);
  }
  return [];
}

/**
 * Multi-Source Aggregator: Queries Google Books, Apify Goodreads, and Open Library simultaneously
 * Deduplicates results and returns a comprehensive library of matching books.
 */
export async function searchMultiSourceBooks(
  query: string,
  genre?: string | null,
  maxResults: number = 40,
  apifyToken?: string | null
): Promise<Book[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const [googleRes, apifyRes, olRes] = await Promise.allSettled([
    searchBooksFromInternet(cleanQuery, maxResults),
    searchApifyGoodreads(cleanQuery, Math.min(25, maxResults), apifyToken),
    searchOpenLibraryBooks(cleanQuery, Math.min(25, maxResults)),
  ]);

  const googleList = googleRes.status === 'fulfilled' ? googleRes.value : [];
  const apifyList = apifyRes.status === 'fulfilled' ? apifyRes.value : [];
  const olList = olRes.status === 'fulfilled' ? olRes.value : [];

  const seen = new Set<string>();
  const combined: Book[] = [];

  for (const book of [...googleList, ...apifyList, ...olList]) {
    const key = `${book.title.toLowerCase().trim()}_${book.author.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(book);
    }
  }

  if (genre && genre !== 'All Genres' && genre !== 'Trending') {
    const gLower = genre.toLowerCase();
    const filtered = combined.filter(
      b =>
        b.genres.some(
          g =>
            g.toLowerCase().includes(gLower) ||
            gLower.includes(g.toLowerCase())
        ) || (b.description && b.description.toLowerCase().includes(gLower))
    );
    return filtered.length > 0 ? filtered : combined;
  }

  return combined;
}

/**
 * Searches the internet for books using the Google Books API
 * Falls back to Open Library API if Google Books is unavailable
 */
export async function searchBooksFromInternet(
  query: string,
  maxResults: number = 40,
  apiKey?: string | null
): Promise<Book[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    let url = `${GOOGLE_BOOKS_BASE}?q=${encodeURIComponent(cleanQuery)}&maxResults=${maxResults}&printType=books`;
    if (apiKey) {
      url += `&key=${apiKey}`;
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map(normalizeGoogleBook);
      }
    }
  } catch (err) {
    console.warn('Google Books API search notice, trying Open Library:', err);
  }

  // Open Library API Fallback (Completely free, no API key needed)
  try {
    const olUrl = `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(cleanQuery)}&limit=${maxResults}`;
    const olRes = await fetch(olUrl);
    if (olRes.ok) {
      const olData = await olRes.json();
      if (Array.isArray(olData.docs) && olData.docs.length > 0) {
        return olData.docs.map((doc: any, index: number) => {
          const coverId = doc.cover_i;
          const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : DEFAULT_COVER;

          return {
            id: `ol_${doc.key?.replace('/works/', '') || index}`,
            title: doc.title || 'Untitled Book',
            author: Array.isArray(doc.author_name) ? doc.author_name.join(', ') : 'Unknown Author',
            coverUrl,
            rating: doc.ratings_average ? Number(doc.ratings_average.toFixed(2)) : 4.15,
            ratingCount: doc.ratings_count || 1500,
            reviewCount: Math.round((doc.ratings_count || 1500) * 0.1),
            pages: doc.number_of_pages_median || 320,
            publishedYear: doc.first_publish_year || 2022,
            genres: Array.isArray(doc.subject) ? doc.subject.slice(0, 3) : ['Fiction'],
            description: doc.first_sentence
              ? (Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence)
              : `A notable work by ${Array.isArray(doc.author_name) ? doc.author_name[0] : 'the author'}.`,
            userShelf: null,
            userRating: 0,
            progressPages: 0,
          };
        });
      }
    }
  } catch (olErr) {
    console.warn('Open Library API search notice:', olErr);
  }

  return [];
}

const GENRE_SEARCH_MAP: Record<string, string> = {
  'fiction': 'bestseller+fiction',
  'science fiction': 'science+fiction+bestseller',
  'fantasy': 'fantasy+fiction+bestseller',
  'mystery & thriller': 'mystery+thriller+bestseller',
  'romance': 'romance+novel+bestseller',
  'horror': 'horror+fiction+bestseller',
  'historical fiction': 'historical+fiction+bestseller',
  'non-fiction': 'nonfiction+bestseller',
  'biography & memoir': 'biography+memoir+bestseller',
  'self help & psychology': 'self-help+psychology+habits',
  'young adult': 'young+adult+fiction+bestseller',
  'graphic novels': 'graphic+novel+comics',
  'trending': 'new+york+times+bestseller',
};

/**
 * Fetches popular trending books from Google Books by subject / genre
 */
export async function fetchPopularBooksFromInternet(
  subject?: string | null,
  maxResults: number = 40,
  apiKey?: string | null
): Promise<Book[]> {
  try {
    const key = (subject || '').trim().toLowerCase();
    const queryParam = key && GENRE_SEARCH_MAP[key]
      ? GENRE_SEARCH_MAP[key]
      : key && key !== 'all genres' && key !== 'all'
      ? `subject:${encodeURIComponent(key.replace(/&/g, 'and'))}`
      : 'bestseller+fiction+goodreads';

    let url = `${GOOGLE_BOOKS_BASE}?q=${queryParam}&orderBy=relevance&maxResults=${maxResults}&printType=books`;
    if (apiKey) {
      url += `&key=${apiKey}`;
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map(normalizeGoogleBook);
      }
    }
  } catch (err) {
    console.warn('Could not fetch popular books from internet:', err);
  }
  return [];
}

