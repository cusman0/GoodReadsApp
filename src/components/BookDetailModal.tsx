import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Book } from '../types';
import { StarRating } from './StarRating';

interface BookDetailModalProps {
  book: Book | null;
  visible: boolean;
  onClose: () => void;
  onUpdateShelf: (
    bookId: string,
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null,
    rating?: number,
    progress?: number
  ) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  visible,
  onClose,
  onUpdateShelf,
}) => {
  if (!book) return null;

  const [currentShelf, setCurrentShelf] = useState(book.userShelf || null);
  const [userRating, setUserRating] = useState(book.userRating || 0);
  const [pagesRead, setPagesRead] = useState(
    book.progressPages ? String(book.progressPages) : '0'
  );
  const [showShelfPicker, setShowShelfPicker] = useState(false);

  const handleShelfSelect = (
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null
  ) => {
    setCurrentShelf(shelf);
    setShowShelfPicker(false);
    onUpdateShelf(book.id, shelf, userRating, parseInt(pagesRead, 10) || 0);
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    onUpdateShelf(book.id, currentShelf, rating, parseInt(pagesRead, 10) || 0);
  };

  const handleSaveProgress = () => {
    const pages = parseInt(pagesRead, 10);
    if (isNaN(pages) || pages < 0 || pages > book.pages) {
      Alert.alert(
        'Invalid Page',
        `Please enter a page number between 0 and ${book.pages}`
      );
      return;
    }
    onUpdateShelf(book.id, currentShelf, userRating, pages);
    Alert.alert('Reading Progress Updated', `You are on page ${pages} of ${book.pages}!`);
  };

  const getShelfLabel = () => {
    switch (currentShelf) {
      case 'want-to-read':
        return 'Want to Read ✓';
      case 'currently-reading':
        return 'Currently Reading 📖';
      case 'read':
        return 'Read ✓✓';
      default:
        return 'Want to Read';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.dragHandle} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            {/* Top Book Header */}
            <View style={styles.topInfo}>
              <Image source={{ uri: book.coverUrl }} style={styles.cover} />
              <View style={styles.mainMeta}>
                <Text style={styles.title}>{book.title}</Text>
                <Text style={styles.author}>by {book.author}</Text>

                <View style={styles.ratingBox}>
                  <StarRating rating={book.rating} size={15} />
                  <Text style={styles.ratingVal}>{book.rating.toFixed(2)}</Text>
                </View>

                <Text style={styles.countText}>
                  {book.ratingCount.toLocaleString()} ratings •{' '}
                  {book.reviewCount.toLocaleString()} reviews
                </Text>

                {/* Shelf Button */}
                <TouchableOpacity
                  style={[
                    styles.shelfBtn,
                    currentShelf ? styles.shelvedBtnActive : styles.wantToReadBtn,
                  ]}
                  onPress={() => setShowShelfPicker(!showShelfPicker)}
                >
                  <Text
                    style={[
                      styles.shelfBtnText,
                      currentShelf && styles.shelvedBtnTextActive,
                    ]}
                  >
                    {getShelfLabel()} ▾
                  </Text>
                </TouchableOpacity>

                {/* Dropdown Options */}
                {showShelfPicker && (
                  <View style={styles.shelfDropdown}>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => handleShelfSelect('want-to-read')}
                    >
                      <Text style={styles.dropdownOptionText}>Want to Read</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => handleShelfSelect('currently-reading')}
                    >
                      <Text style={styles.dropdownOptionText}>
                        Currently Reading
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => handleShelfSelect('read')}
                    >
                      <Text style={styles.dropdownOptionText}>Read</Text>
                    </TouchableOpacity>
                    {currentShelf && (
                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => handleShelfSelect(null)}
                      >
                        <Text style={[styles.dropdownOptionText, { color: '#C0392B' }]}>
                          Remove from shelf
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* User Rating Box */}
            <View style={styles.rateThisBookCard}>
              <Text style={styles.sectionHeader}>My Rating</Text>
              <View style={styles.userRateRow}>
                <StarRating
                  rating={userRating}
                  size={24}
                  interactive
                  onRate={handleRating}
                />
                <Text style={styles.userRatingStatus}>
                  {userRating === 0
                    ? 'Rate this book'
                    : `${userRating} of 5 stars`}
                </Text>
              </View>
            </View>

            {/* Currently Reading Page Tracker */}
            {currentShelf === 'currently-reading' && (
              <View style={styles.progressCard}>
                <Text style={styles.sectionHeader}>Reading Progress</Text>
                <View style={styles.progressInputRow}>
                  <Text style={styles.progressLabel}>I am on page</Text>
                  <TextInput
                    style={styles.progressInput}
                    value={pagesRead}
                    onChangeText={setPagesRead}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.progressTotal}>of {book.pages}</Text>
                  <TouchableOpacity
                    style={styles.updateProgressBtn}
                    onPress={handleSaveProgress}
                  >
                    <Text style={styles.updateProgressBtnText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionHeader}>About this book</Text>
              <Text style={styles.descriptionText}>{book.description}</Text>
            </View>

            {/* Genres */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionHeader}>Genres</Text>
              <View style={styles.genresRow}>
                {book.genres.map((g, idx) => (
                  <View key={idx} style={styles.genreBadge}>
                    <Text style={styles.genreBadgeText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Book Specs */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionHeader}>Book Details</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Pages</Text>
                  <Text style={styles.specValue}>{book.pages} pages</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Published</Text>
                  <Text style={styles.specValue}>{book.publishedYear}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F9F7F4',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  headerBar: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAE5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  topInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  cover: {
    width: 105,
    height: 155,
    borderRadius: 6,
    backgroundColor: '#DDD',
  },
  mainMeta: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    lineHeight: 22,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingVal: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  countText: {
    fontSize: 11,
    color: '#888',
    marginTop: 3,
  },
  shelfBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  wantToReadBtn: {
    backgroundColor: '#409D69',
  },
  shelvedBtnActive: {
    backgroundColor: '#EAE5DB',
    borderWidth: 1,
    borderColor: '#D4CFBE',
  },
  shelfBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  shelvedBtnTextActive: {
    color: '#382110',
  },
  shelfDropdown: {
    position: 'absolute',
    top: 140,
    left: 0,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4CFBE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 999,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  rateThisBookCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAE5DB',
  },
  sectionHeader: {
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '700',
    color: '#382110',
    marginBottom: 8,
  },
  userRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRatingStatus: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAE5DB',
  },
  progressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    color: '#444',
  },
  progressInput: {
    backgroundColor: '#F9F7F4',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    marginHorizontal: 8,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
  },
  progressTotal: {
    fontSize: 13,
    color: '#666',
  },
  updateProgressBtn: {
    backgroundColor: '#37745B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  updateProgressBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAE5DB',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#444',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreBadge: {
    backgroundColor: '#F4F1EA',
    borderWidth: 1,
    borderColor: '#E0DDD5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  genreBadgeText: {
    fontSize: 12,
    color: '#00635D',
    fontWeight: '600',
  },
  specsGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  specItem: {
    flex: 1,
  },
  specLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
});

