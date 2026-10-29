import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Book, UserProfile } from '../types';
import { BookCard } from '../components/BookCard';
import { Icon } from '../components/Icon';

interface MyBooksScreenProps {
  user: UserProfile | null;
  books: Book[];
  onSelectBook: (book: Book) => void;
  onShelfChange: (bookId: string, shelf: 'want-to-read' | 'currently-reading' | 'read' | null) => void;
  onOpenAuth: () => void;
}

export const MyBooksScreen: React.FC<MyBooksScreenProps> = ({
  user,
  books,
  onSelectBook,
  onShelfChange,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'currently-reading' | 'want-to-read' | 'read'>('all');

  const filteredBooks = books.filter(b => {
    if (activeTab === 'all') return Boolean(b.userShelf);
    return b.userShelf === activeTab;
  });

  const allCount = books.filter(b => Boolean(b.userShelf)).length;
  const readingCount = books.filter(b => b.userShelf === 'currently-reading').length;
  const wantCount = books.filter(b => b.userShelf === 'want-to-read').length;
  const readCount = books.filter(b => b.userShelf === 'read').length;

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="books" size={52} color="#BBBBBB" />
        <Text style={styles.emptyTitle}>Sign in to view your Bookshelves</Text>
        <Text style={styles.emptySubtitle}>
          Keep track of what you want to read, organize your books into shelves, and see your reading stats.
        </Text>
        <TouchableOpacity style={styles.emptyAuthBtn} onPress={onOpenAuth}>
          <Text style={styles.emptyAuthBtnText}>Sign In with Google or Email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Shelves Selector Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsContainer}
      >
        <TouchableOpacity
          style={[styles.shelfTab, activeTab === 'all' && styles.activeShelfTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.shelfTabText, activeTab === 'all' && styles.activeShelfTabText]}>
            All ({allCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shelfTab, activeTab === 'currently-reading' && styles.activeShelfTab]}
          onPress={() => setActiveTab('currently-reading')}
        >
          <Text
            style={[
              styles.shelfTabText,
              activeTab === 'currently-reading' && styles.activeShelfTabText,
            ]}
          >
            Reading ({readingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shelfTab, activeTab === 'want-to-read' && styles.activeShelfTab]}
          onPress={() => setActiveTab('want-to-read')}
        >
          <Text
            style={[
              styles.shelfTabText,
              activeTab === 'want-to-read' && styles.activeShelfTabText,
            ]}
          >
            Want to Read ({wantCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shelfTab, activeTab === 'read' && styles.activeShelfTab]}
          onPress={() => setActiveTab('read')}
        >
          <Text style={[styles.shelfTabText, activeTab === 'read' && styles.activeShelfTabText]}>
            Read ({readCount})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Book List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredBooks.length === 0 ? (
          <View style={styles.noBooksBox}>
            <Text style={styles.noBooksText}>No books on this shelf yet.</Text>
            <Text style={styles.noBooksSubtext}>
              Explore trending books or search to add to your shelf!
            </Text>
          </View>
        ) : (
          filteredBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onPress={onSelectBook}
              onShelfChange={onShelfChange}
            />
          ))
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
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DED5',
    maxHeight: 48,
  },
  tabsScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  shelfTab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeShelfTab: {
    borderBottomColor: '#00635D',
  },
  shelfTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#767676',
  },
  activeShelfTabText: {
    color: '#00635D',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  noBooksBox: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    marginTop: 20,
  },
  noBooksText: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
    color: '#382110',
  },
  noBooksSubtext: {
    fontSize: 13,
    color: '#767676',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: '#382110',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  emptyAuthBtn: {
    backgroundColor: '#37745B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 20,
  },
  emptyAuthBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

