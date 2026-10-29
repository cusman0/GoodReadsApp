import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Book } from '../types';
import { StarRating } from './StarRating';
import { Icon } from './Icon';

interface BookCardProps {
  book: Book;
  onPress: (book: Book) => void;
  onShelfChange?: (bookId: string, shelf: 'want-to-read' | 'currently-reading' | 'read' | null) => void;
  layout?: 'horizontal' | 'compact' | 'vertical';
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  onShelfChange,
  layout = 'horizontal',
}) => {
  const getShelfLabel = (shelf?: string | null) => {
    switch (shelf) {
      case 'want-to-read':
        return 'Want to Read';
      case 'currently-reading':
        return 'Reading...';
      case 'read':
        return 'Read';
      default:
        return 'Want to Read';
    }
  };

  const getShelfIcon = (shelf?: string | null) => {
    switch (shelf) {
      case 'want-to-read':
        return <Icon name="check" size={12} color="#409D69" />;
      case 'currently-reading':
        return <Icon name="book-open" size={12} color="#00635D" />;
      case 'read':
        return <Icon name="check-double" size={12} color="#409D69" />;
      default:
        return null;
    }
  };

  const isShelved = Boolean(book.userShelf);

  const cycleShelf = () => {
    if (!onShelfChange) return;
    if (!book.userShelf) {
      onShelfChange(book.id, 'want-to-read');
    } else if (book.userShelf === 'want-to-read') {
      onShelfChange(book.id, 'currently-reading');
    } else if (book.userShelf === 'currently-reading') {
      onShelfChange(book.id, 'read');
    } else {
      onShelfChange(book.id, null);
    }
  };

  if (layout === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => onPress(book)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: book.coverUrl }} style={styles.compactCover} />
        <Text style={styles.compactTitle} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={styles.compactAuthor} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.compactRatingRow}>
          <Icon name="star" size={11} color="#ED9220" />
          <Text style={styles.compactRatingText}>{book.rating.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onPress(book)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />

      <View style={styles.infoCol}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          by <Text style={styles.authorUnderline}>{book.author}</Text>
        </Text>

        <View style={styles.ratingsRow}>
          <StarRating rating={book.rating} size={13} />
          <Text style={styles.ratingNumber}>{book.rating.toFixed(2)}</Text>
          <Text style={styles.ratingCount}>
            ({(book.ratingCount / 1000).toFixed(0)}k)
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[
              styles.shelfButton,
              isShelved ? styles.shelvedButton : styles.wantToReadButton,
            ]}
            onPress={cycleShelf}
            activeOpacity={0.7}
          >
            <View style={styles.shelfButtonInner}>
              {isShelved && getShelfIcon(book.userShelf)}
              <Text
                style={[
                  styles.shelfButtonText,
                  isShelved && styles.shelvedButtonText,
                ]}
              >
                {getShelfLabel(book.userShelf)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  coverImage: {
    width: 74,
    height: 110,
    borderRadius: 4,
    backgroundColor: '#EEEEEE',
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  authorUnderline: {
    color: '#00635D',
  },
  ratingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingNumber: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  ratingCount: {
    marginLeft: 4,
    fontSize: 11,
    color: '#888888',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  shelfButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  shelfButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wantToReadButton: {
    backgroundColor: '#409D69',
  },
  shelvedButton: {
    backgroundColor: '#EBE8DF',
    borderWidth: 1,
    borderColor: '#D4CFBE',
  },
  shelfButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shelvedButtonText: {
    color: '#382110',
  },

  // Compact layout styles
  compactContainer: {
    width: 110,
    marginRight: 14,
  },
  compactCover: {
    width: 110,
    height: 160,
    borderRadius: 4,
    backgroundColor: '#EEEEEE',
  },
  compactTitle: {
    fontFamily: 'serif',
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
    marginTop: 6,
  },
  compactAuthor: {
    fontSize: 11,
    color: '#767676',
    marginTop: 2,
  },
  compactRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  starIcon: {
    fontSize: 11,
    color: '#ED9220',
  },
  compactRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 3,
  },
});

