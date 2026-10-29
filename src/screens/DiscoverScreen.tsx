import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Book } from '../types';
import { GENRES } from '../data/mockData';
import { BookCard } from '../components/BookCard';

interface DiscoverScreenProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onShelfChange: (bookId: string, shelf: 'want-to-read' | 'currently-reading' | 'read' | null) => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  books,
  onSelectBook,
  onShelfChange,
}) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const filteredBooks = books.filter(b => {
    const matchesQuery =
      query.trim() === '' ||
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.author.toLowerCase().includes(query.toLowerCase());

    const matchesGenre =
      !selectedGenre ||
      b.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase());

    return matchesQuery && matchesGenre;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Search books, authors, genres..."
            placeholderTextColor="#888888"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Genre Tags */}
        <View style={styles.genreSection}>
          <Text style={styles.sectionTitle}>BROWSE BY GENRE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genresRow}
          >
            <TouchableOpacity
              style={[
                styles.genreChip,
                selectedGenre === null && styles.activeGenreChip,
              ]}
              onPress={() => setSelectedGenre(null)}
            >
              <Text
                style={[
                  styles.genreChipText,
                  selectedGenre === null && styles.activeGenreChipText,
                ]}
              >
                All Genres
              </Text>
            </TouchableOpacity>

            {GENRES.map((genre, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.genreChip,
                  selectedGenre === genre && styles.activeGenreChip,
                ]}
                onPress={() =>
                  setSelectedGenre(selectedGenre === genre ? null : genre)
                }
              >
                <Text
                  style={[
                    styles.genreChipText,
                    selectedGenre === genre && styles.activeGenreChipText,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Choice Awards Banner */}
        {!query && !selectedGenre && (
          <View style={styles.awardsBanner}>
            <View style={styles.awardsBadge}>
              <Text style={styles.awardsYear}>2026</Text>
            </View>
            <View style={styles.awardsInfo}>
              <Text style={styles.awardsTitle}>Goodreads Choice Awards</Text>
              <Text style={styles.awardsSubtitle}>
                The best books of the year, chosen by readers like you.
              </Text>
            </View>
          </View>
        )}

        {/* Results List */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCount}>
            {filteredBooks.length}{' '}
            {filteredBooks.length === 1 ? 'book found' : 'books found'}
          </Text>
          {selectedGenre && (
            <TouchableOpacity onPress={() => setSelectedGenre(null)}>
              <Text style={styles.resetFilter}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredBooks.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onPress={onSelectBook}
            onShelfChange={onShelfChange}
          />
        ))}
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
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  activeGenreChipText: {
    color: '#FFFFFF',
  },
  awardsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#382110',
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
  },
  awardsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ED9220',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  awardsYear: {
    fontSize: 13,
    fontWeight: '800',
    color: '#382110',
  },
  awardsInfo: {
    flex: 1,
  },
  awardsTitle: {
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  awardsSubtitle: {
    fontSize: 11,
    color: '#E0DDD5',
    marginTop: 2,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#767676',
  },
  resetFilter: {
    fontSize: 12,
    color: '#00635D',
    fontWeight: '600',
  },
});

