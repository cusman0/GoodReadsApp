import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Book } from '../types';
import { BookCard } from '../components/BookCard';
import { Icon } from '../components/Icon';
import {
  DISCOVER_GENRES,
  TRENDING_BOOKS,
  RECOMMENDED_BOOKS,
  GENRE_CURATED_BOOKS,
} from '../data/discoverData';
import {
  fetchPopularBooksFromInternet,
  searchMultiSourceBooks,
} from '../services/bookService';

interface DiscoverScreenProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onShelfChange: (
    bookId: string,
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null,
    rating?: number,
    progress?: number
  ) => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  books,
  onSelectBook,
  onShelfChange,
}) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');
  // Distinct states for search vs. per-genre browsing to prevent cross-contamination
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [genreLiveBooks, setGenreLiveBooks] = useState<Record<string, Book[]>>({});
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<any>(null);

  // Synchronizes book items with any user bookshelf / rating updates from App state
  const syncWithUserShelves = (bookList: Book[]): Book[] => {
    return bookList.map(item => {
      const local = books.find(
        b => b.id === item.id || b.title.toLowerCase() === item.title.toLowerCase()
      );
      return local
        ? {
            ...item,
            userShelf: local.userShelf,
            userRating: local.userRating,
            progressPages: local.progressPages,
          }
        : item;
    });
  };

  const recommendedList = syncWithUserShelves(RECOMMENDED_BOOKS);
  const trendingList = syncWithUserShelves(TRENDING_BOOKS);

  // Unified Search & Per-Genre Loader
  useEffect(() => {
    let active = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();

    // 1. Browsing Mode: query is empty, fetch books specific to selectedGenre
    if (!trimmed) {
      setSearchResults([]);

      // If we don't have cached online results for this specific genre yet, fetch them
      if (!genreLiveBooks[selectedGenre]) {
        setLoading(true);
        const genreToFetch =
          selectedGenre === 'All Genres' || selectedGenre === 'Trending'
            ? null
            : selectedGenre;

        fetchPopularBooksFromInternet(genreToFetch, 40)
          .then(results => {
            if (active && results.length > 0) {
              setGenreLiveBooks(prev => ({
                ...prev,
                [selectedGenre]: results,
              }));
            }
          })
          .catch(err => {
            console.warn('Popular books fetch notice:', err);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      }

      return () => {
        active = false;
      };
    }

    // 2. Search Mode: 350ms debounce across Google Books, Goodreads Scraper & Open Library
    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchMultiSourceBooks(trimmed, selectedGenre, 50);
        if (active) {
          if (results.length > 0) {
            setSearchResults(results);
          } else {
            // Curated fallback matching the search query
            const allCurated = [
              ...RECOMMENDED_BOOKS,
              ...TRENDING_BOOKS,
              ...Object.values(GENRE_CURATED_BOOKS).flat(),
              ...books,
            ];
            const localMatch = allCurated.filter(
              b =>
                b.title.toLowerCase().includes(trimmed.toLowerCase()) ||
                b.author.toLowerCase().includes(trimmed.toLowerCase())
            );
            setSearchResults(localMatch);
          }
        }
      } catch (err) {
        console.warn('Multi-source book search notice:', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedGenre]);

  // Clears search input and purges search results so they never leak into genres
  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
  };

  // Compute catalog books strictly based on current mode
  const getCatalogBooks = (): Book[] => {
    // A. Active Search Mode: Show results matching the search term
    if (query.trim()) {
      if (selectedGenre && selectedGenre !== 'All Genres') {
        const gLower = selectedGenre.toLowerCase();
        const filtered = searchResults.filter(
          b =>
            (Array.isArray(b.genres) &&
              b.genres.some(
                g =>
                  g.toLowerCase().includes(gLower) ||
                  gLower.includes(g.toLowerCase())
              )) ||
            (b.description && b.description.toLowerCase().includes(gLower))
        );
        return filtered.length > 0 ? filtered : searchResults;
      }
      return searchResults;
    }

    // B. Browsing Mode: Specific Selected Genre
    if (selectedGenre && selectedGenre !== 'All Genres') {
      if (selectedGenre === 'Trending') {
        const live = genreLiveBooks['Trending'] || [];
        const liveFiltered = live.filter(
          gb =>
            !TRENDING_BOOKS.some(
              t => t.id === gb.id || t.title.toLowerCase() === gb.title.toLowerCase()
            )
        );
        return [...TRENDING_BOOKS, ...liveFiltered];
      }

      // Unique curated collection for this specific genre
      const curated = GENRE_CURATED_BOOKS[selectedGenre] || [];
      const live = genreLiveBooks[selectedGenre] || [];
      const liveFiltered = live.filter(
        gb =>
          !curated.some(
            c => c.id === gb.id || c.title.toLowerCase() === gb.title.toLowerCase()
          )
      );
      return [...curated, ...liveFiltered];
    }

    // C. Browsing Mode: All Genres (Default)
    const liveAll = genreLiveBooks['All Genres'] || [];
    const combined = [
      ...liveAll,
      ...TRENDING_BOOKS.filter(
        t =>
          !liveAll.some(
            gb => gb.id === t.id || gb.title.toLowerCase() === t.title.toLowerCase()
          )
      ),
      ...RECOMMENDED_BOOKS.filter(
        r =>
          !liveAll.some(
            gb => gb.id === r.id || gb.title.toLowerCase() === r.title.toLowerCase()
          )
      ),
    ];
    return combined.length > 0 ? combined : books;
  };

  const displayBooks = syncWithUserShelves(getCatalogBooks());

  return (
    <View style={styles.container}>
      {/* Search Bar with Live Loading Spinner */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputRow}>
          <Icon name="search" size={16} color="#888" />
          <TextInput
            style={styles.input}
            placeholder="Search Google Books, Goodreads, Open Library..."
            placeholderTextColor="#888888"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {loading && (
            <ActivityIndicator size="small" color="#00635D" style={{ marginRight: 6 }} />
          )}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Icon name="close" size={14} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Genre Tags / Filter Bar */}
        <View style={styles.genreSection}>
          <Text style={styles.sectionTitle}>EXPLORE BY GENRE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genresRow}
          >
            {DISCOVER_GENRES.map((genre, idx) => {
              const isActive = selectedGenre === genre;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.genreChip, isActive && styles.activeGenreChip]}
                  onPress={() => setSelectedGenre(genre)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genreChipText,
                      isActive && styles.activeGenreChipText,
                    ]}
                  >
                    {genre === 'Trending' ? '🔥 Trending' : genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 1. RECOMMENDED FOR YOU (Shown only in general browsing mode) */}
        {!query && selectedGenre === 'All Genres' && (
          <View style={styles.carouselSection}>
            <View style={styles.carouselHeaderRow}>
              <View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>✦ CURATED PICKS</Text>
                </View>
                <Text style={styles.carouselSectionTitle}>Recommended For You</Text>
              </View>
              <Text style={styles.carouselSubtitle}>Top rated by readers</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselList}
            >
              {recommendedList.map(book => (
                <BookCard
                  key={`rec_${book.id}`}
                  book={book}
                  layout="compact"
                  onPress={onSelectBook}
                  onShelfChange={onShelfChange}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* 2. TRENDING THIS WEEK (Shown in browsing mode) */}
        {!query && (selectedGenre === 'All Genres' || selectedGenre === 'Trending') && (
          <View style={styles.carouselSection}>
            <View style={styles.carouselHeaderRow}>
              <View>
                <View style={[styles.badgePill, { backgroundColor: '#FBE9E7' }]}>
                  <Text style={[styles.badgePillText, { color: '#D84315' }]}>🔥 POPULAR NOW</Text>
                </View>
                <Text style={styles.carouselSectionTitle}>Trending Bestsellers</Text>
              </View>
              <Text style={styles.carouselSubtitle}>Viral on BookTok & Goodreads</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselList}
            >
              {trendingList.map(book => (
                <BookCard
                  key={`trend_${book.id}`}
                  book={book}
                  layout="compact"
                  onPress={onSelectBook}
                  onShelfChange={onShelfChange}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Choice Awards Banner (Shown in general browsing mode) */}
        {!query && selectedGenre === 'All Genres' && (
          <View style={styles.awardsBanner}>
            <View style={styles.awardsBadge}>
              <Text style={styles.awardsYear}>2026</Text>
            </View>
            <View style={styles.awardsInfo}>
              <Text style={styles.awardsTitle}>Goodreads Choice Awards</Text>
              <Text style={styles.awardsSubtitle}>
                The best books of the year, nominated and voted by the world's largest reader community.
              </Text>
            </View>
          </View>
        )}

        {/* Results Header */}
        <View style={styles.resultsHeaderRow}>
          <View style={styles.resultsCountBadge}>
            <Text style={styles.resultsCount}>
              {loading
                ? 'Searching Google Books & Goodreads...'
                : query.trim()
                ? selectedGenre !== 'All Genres'
                  ? `${displayBooks.length} ${
                      displayBooks.length === 1 ? 'result' : 'results'
                    } for "${query}" in ${selectedGenre}`
                  : `${displayBooks.length} ${
                      displayBooks.length === 1 ? 'result' : 'results'
                    } for "${query}" across All Sources`
                : `${displayBooks.length} ${
                    displayBooks.length === 1 ? 'book' : 'books'
                  } in ${selectedGenre}`}
            </Text>
          </View>
          {(selectedGenre !== 'All Genres' || query.length > 0) && (
            <TouchableOpacity
              onPress={() => {
                setSelectedGenre('All Genres');
                handleClear();
              }}
            >
              <Text style={styles.resetFilter}>Reset to All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main Books Catalog */}
        {displayBooks.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onPress={onSelectBook}
            onShelfChange={onShelfChange}
          />
        ))}

        {displayBooks.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="search" size={32} color="#AAA" />
            <Text style={styles.emptyTitle}>No matching books found</Text>
            <Text style={styles.emptySubtitle}>
              {query.trim() && selectedGenre !== 'All Genres'
                ? `No books found for "${query}" in ${selectedGenre}. Try viewing all genres or clearing your search.`
                : 'Try searching with another book title, author, or keyword.'}
            </Text>
            {query.trim() && selectedGenre !== 'All Genres' && (
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={() => setSelectedGenre('All Genres')}
              >
                <Text style={styles.emptyResetBtnText}>Show all results in All Genres</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DED5',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#D8D5CD',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
  },
  clearBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  genreSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#767676',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  genresRow: {
    gap: 8,
  },
  genreChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  activeGenreChip: {
    backgroundColor: '#00635D',
    borderColor: '#00635D',
  },
  genreChipText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  activeGenreChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  carouselSection: {
    marginBottom: 20,
  },
  carouselHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  badgePill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  carouselSectionTitle: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#382110',
  },
  carouselSubtitle: {
    fontSize: 11,
    color: '#767676',
    marginBottom: 2,
  },
  carouselList: {
    paddingVertical: 4,
  },
  awardsBanner: {
    backgroundColor: '#382110',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  awardsBadge: {
    backgroundColor: '#ED9220',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 14,
  },
  awardsYear: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  awardsInfo: {
    flex: 1,
  },
  awardsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  awardsSubtitle: {
    color: '#D8D0C5',
    fontSize: 12,
    lineHeight: 16,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCountBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  resultsCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.4,
  },
  resetFilter: {
    fontSize: 12,
    color: '#00635D',
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#382110',
    marginTop: 10,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 14,
    backgroundColor: '#00635D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
