import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { Book, UserProfile } from '../types';
import { searchCommunityUsers } from '../firebase';
import { Icon } from '../components/Icon';
import {
  DISCOVER_CATEGORIES,
  searchOpenLibraryBooks,
  fetchBooksByCategory,
  fetchWorkDetails,
  DEFAULT_COVER,
} from '../services/bookService';

interface DiscoverScreenProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onSelectUser?: (user: UserProfile) => void;
  onShelfChange: (
    bookId: string,
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null,
    rating?: number,
    progress?: number
  ) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2-column grid

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  books,
  onSelectBook,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(DISCOVER_CATEGORIES[0]); // Default: Fantasy

  const [bookList, setBookList] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<any>(null);

  // Community Readers search state
  const [activeMode, setActiveMode] = useState<'books' | 'readers'>('books');
  const [readerQuery, setReaderQuery] = useState('');
  const [readersList, setReadersList] = useState<UserProfile[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);

  const loadReaders = useCallback(async (q: string) => {
    setReadersLoading(true);
    try {
      const results = await searchCommunityUsers(q);
      setReadersList(results);
    } catch (e) {
      console.warn('loadReaders error:', e);
    } finally {
      setReadersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMode === 'readers') {
      const timer = setTimeout(() => {
        loadReaders(readerQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeMode, readerQuery, loadReaders]);

  // Synchronize book items with any user bookshelf / rating updates from App state
  const syncWithUserShelves = useCallback(
    (items: Book[]): Book[] => {
      return items.map(item => {
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
    },
    [books]
  );

  // Fetch initial books for category or query
  const loadBooks = useCallback(
    async (searchQuery: string, category: string, isInitial: boolean = true) => {
      const isSearch = searchQuery.trim().length > 0;
      if (isInitial) {
        setLoading(true);
        setErrorMessage(null);
      } else {
        setLoadingMore(true);
      }

      try {
        if (isSearch) {
          const targetPage = isInitial ? 1 : page + 1;
          const { books: newBooks, total } = await searchOpenLibraryBooks(
            searchQuery,
            targetPage
          );

          if (isInitial) {
            setBookList(newBooks);
            setPage(1);
          } else {
            setBookList(prev => {
              const ids = new Set(prev.map(b => b.id));
              const filtered = newBooks.filter(b => !ids.has(b.id));
              return [...prev, ...filtered];
            });
            setPage(targetPage);
          }
          setTotalCount(total);
        } else {
          const targetOffset = isInitial ? 0 : offset + 20;
          const { books: newBooks, total } = await fetchBooksByCategory(
            category,
            targetOffset,
            20
          );

          if (isInitial) {
            setBookList(newBooks);
            setOffset(0);
          } else {
            setBookList(prev => {
              const ids = new Set(prev.map(b => b.id));
              const filtered = newBooks.filter(b => !ids.has(b.id));
              return [...prev, ...filtered];
            });
            setOffset(targetOffset);
          }
          setTotalCount(total);
        }
      } catch (err: any) {
        console.warn('Discover load notice:', err);
        setErrorMessage('Unable to load books from Open Library. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, offset]
  );

  // Debounced search (500 ms) or category switch
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (trimmed) {
      debounceTimerRef.current = setTimeout(() => {
        loadBooks(trimmed, selectedCategory, true);
      }, 500);
    } else {
      // Default view: category browsing
      loadBooks('', selectedCategory, true);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedCategory]);

  const handleClearSearch = () => {
    setQuery('');
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || bookList.length >= totalCount) return;
    loadBooks(query, selectedCategory, false);
  };

  const handleBookPress = async (book: Book) => {
    // If book has workKey and default description, fetch full work description from Open Library
    if (book.workKey && (!book.description || book.description.startsWith('A celebrated') || book.description.startsWith('Explore this title'))) {
      const details = await fetchWorkDetails(book.workKey);
      const detailedBook: Book = {
        ...book,
        description: details.description || book.description,
        subjects: details.subjects.length > 0 ? details.subjects : book.subjects,
        genres: details.subjects.length > 0 ? details.subjects : book.genres,
      };
      onSelectBook(detailedBook);
    } else {
      onSelectBook(book);
    }
  };

  const displayBooks = syncWithUserShelves(bookList);

  const renderBookCard = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleBookPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.coverWrapper}>
        <Image
          source={{ uri: item.coverUrl || DEFAULT_COVER }}
          style={styles.cover}
          resizeMode="cover"
        />
        {item.userShelf && (
          <View style={styles.shelfIndicatorPill}>
            <Text style={styles.shelfIndicatorText}>
              {item.userShelf === 'currently-reading'
                ? 'Reading'
                : item.userShelf === 'read'
                ? 'Read'
                : 'Want to Read'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {item.author}
        </Text>
        {Boolean(item.firstPublishYear) && (
          <Text style={styles.year}>{item.firstPublishYear}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonCover} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonAuthor} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Segmented Mode Selector (Books vs Readers) */}
      <View style={styles.modeToggleRow}>
        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'books' && styles.modeTabActive]}
          onPress={() => setActiveMode('books')}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, activeMode === 'books' && styles.modeTabTextActive]}>
            📚 Books
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'readers' && styles.modeTabActive]}
          onPress={() => setActiveMode('readers')}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, activeMode === 'readers' && styles.modeTabTextActive]}>
            👥 Readers
          </Text>
        </TouchableOpacity>
      </View>

      {activeMode === 'readers' ? (
        <View style={styles.readersContainer}>
          {/* Reader Search Input */}
          <View style={styles.searchHeader}>
            <View style={styles.searchInputRow}>
              <Icon name="search" size={16} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="Search readers by name or email..."
                placeholderTextColor="#888888"
                value={readerQuery}
                onChangeText={setReaderQuery}
                returnKeyType="search"
              />
              {readersLoading && (
                <ActivityIndicator size="small" color="#00635D" style={{ marginRight: 6 }} />
              )}
              {readerQuery.length > 0 && !readersLoading && (
                <TouchableOpacity onPress={() => setReaderQuery('')} style={styles.clearBtn}>
                  <Icon name="close" size={14} color="#888" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Reader Results List */}
          {readersLoading ? (
            <View style={styles.readersLoaderBox}>
              <ActivityIndicator size="large" color="#00635D" />
              <Text style={styles.readersLoaderText}>Searching community readers...</Text>
            </View>
          ) : readersList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="profile" size={32} color="#00635D" />
              </View>
              <Text style={styles.emptyTitle}>No readers found</Text>
              <Text style={styles.emptySubtitle}>
                {readerQuery
                  ? `No readers match "${readerQuery}". Try another name.`
                  : 'No community members registered yet.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={readersList}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.readersListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.readerCard}
                  onPress={() => onSelectUser && onSelectUser(item)}
                  activeOpacity={0.8}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.readerAvatar} />
                  ) : (
                    <View style={styles.readerAvatarFallback}>
                      <Text style={styles.readerAvatarFallbackText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.readerMeta}>
                    <Text style={styles.readerName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.readerStatsRow}>
                      <Text style={styles.readerStatText}>
                        📚 {item.booksReadCount || 0} books read
                      </Text>
                    </View>
                  </View>
                  <View style={styles.viewProfileBtn}>
                    <Text style={styles.viewProfileBtnText}>View Profile</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <>
          {/* Search Bar (500 ms debounce) */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputRow}>
          <Icon name="search" size={16} color="#888" />
          <TextInput
            style={styles.input}
            placeholder="Search Open Library by title or author..."
            placeholderTextColor="#888888"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {loading && (
            <ActivityIndicator size="small" color="#00635D" style={{ marginRight: 6 }} />
          )}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
              <Icon name="close" size={14} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips (Shown when not searching) */}
      {!query && (
        <View style={styles.chipsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={DISCOVER_CATEGORIES}
            keyExtractor={item => item}
            contentContainerStyle={styles.chipsList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Main Content: Loading Skeleton, Error, Empty, or Book Grid */}
      {loading ? (
        renderSkeleton()
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadBooks(query, selectedCategory, true)}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : displayBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="books" size={32} color="#00635D" />
          </View>
          <Text style={styles.emptyTitle}>No books found</Text>
          <Text style={styles.emptySubtitle}>
            {query
              ? `No Open Library results for "${query}". Try another search term.`
              : 'No books available in this category right now.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayBooks}
          keyExtractor={item => item.id}
          renderItem={renderBookCard}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#00635D" />
                <Text style={styles.footerText}>Loading more books...</Text>
              </View>
            ) : undefined
          }
        />
      )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E8E0D6',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#767676',
  },
  modeTabTextActive: {
    color: '#00635D',
    fontWeight: '700',
  },
  readersContainer: {
    flex: 1,
  },
  readersLoaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readersLoaderText: {
    marginTop: 10,
    fontSize: 13,
    color: '#767676',
  },
  readersListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  readerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E0D6',
  },
  readerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E0D6',
    marginRight: 12,
  },
  readerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00635D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  readerAvatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  readerMeta: {
    flex: 1,
  },
  readerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#382110',
    marginBottom: 2,
  },
  readerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readerStatText: {
    fontSize: 12,
    color: '#767676',
  },
  viewProfileBtn: {
    backgroundColor: '#E8F3F1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#B2D8D5',
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00635D',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DED5',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0ECE1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#382110',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  chipsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DED5',
    paddingVertical: 10,
  },
  chipsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F0ECE1',
  },
  chipActive: {
    backgroundColor: '#00635D',
  },
  chipText: {
    fontSize: 13,
    color: '#382110',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gridContent: {
    padding: 16,
    paddingBottom: 32,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2DED5',
  },
  coverWrapper: {
    width: '100%',
    height: 190,
    backgroundColor: '#E8E2D5',
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  shelfIndicatorPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 99, 93, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  shelfIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  meta: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#382110',
    lineHeight: 17,
  },
  author: {
    fontSize: 11,
    color: '#767676',
  },
  year: {
    fontSize: 10,
    color: '#9E9488',
    marginTop: 2,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2DED5',
  },
  skeletonCover: {
    width: '100%',
    height: 170,
    backgroundColor: '#E8E2D5',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTitle: {
    width: '80%',
    height: 12,
    backgroundColor: '#E8E2D5',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonAuthor: {
    width: '50%',
    height: 10,
    backgroundColor: '#E8E2D5',
    borderRadius: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#C0392B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#00635D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#382110',
    fontFamily: 'serif',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#767676',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#767676',
  },
});
