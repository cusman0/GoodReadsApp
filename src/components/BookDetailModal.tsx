import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Book, UserProfile, FeedActivity } from '../types';
import { createReviewPost } from '../firebase';
import { assistReviewWriting, getBookConsensusSummary } from '../services/aiService';
import { StarRating } from './StarRating';
import { Icon } from './Icon';

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
  user?: UserProfile | null;
  onOpenAuth?: () => void;
  onPostCreated?: (newActivity: FeedActivity) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  visible,
  onClose,
  onUpdateShelf,
  user,
  onOpenAuth,
  onPostCreated,
}) => {
  const [currentShelf, setCurrentShelf] = useState<
    'want-to-read' | 'currently-reading' | 'read' | null
  >(book?.userShelf || null);
  const [userRating, setUserRating] = useState(book?.userRating || 0);
  const [pagesRead, setPagesRead] = useState(
    book?.progressPages ? String(book.progressPages) : '0'
  );
  const [showShelfPicker, setShowShelfPicker] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [aiHelperLoading, setAiHelperLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showAIConsensus, setShowAIConsensus] = useState(false);
  const [bookConsensus, setBookConsensus] = useState<string | null>(null);
  const [bookConsensusLoading, setBookConsensusLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setCurrentShelf(book.userShelf || null);
      setUserRating(book.userRating || 0);
      setPagesRead(book.progressPages ? String(book.progressPages) : '0');
      setReviewText('');
      setAiSuggestion(null);
      setShowAIConsensus(false);
      setBookConsensus(null);
      setShowShelfPicker(false);
    }
  }, [book?.id]);

  const handleToggleConsensus = async () => {
    if (showAIConsensus) {
      setShowAIConsensus(false);
      return;
    }
    setShowAIConsensus(true);
    if (!bookConsensus && book) {
      setBookConsensusLoading(true);
      try {
        const text = await getBookConsensusSummary(book);
        setBookConsensus(text);
      } catch (err: any) {
        Alert.alert('Gemini AI Notice', err.message || 'Could not generate summary.');
        setBookConsensus(
          `Readers rate "${book.title}" ${book.rating}★ (${book.ratingCount.toLocaleString()} ratings). Genres: ${book.genres.join(', ')}.`
        );
      } finally {
        setBookConsensusLoading(false);
      }
    }
  };

  const handleAIWritingAssist = async (mode: 'improve' | 'shorten' | 'translate') => {
    if (!reviewText.trim()) {
      Alert.alert(
        'Draft Required',
        'Please write a few thoughts first, then tap an AI Helper button to polish it!'
      );
      return;
    }

    setAiHelperLoading(true);
    try {
      const suggestion = await assistReviewWriting(reviewText, mode);
      setAiSuggestion(suggestion);
    } catch (err: any) {
      Alert.alert('AI Helper Notice', err.message || 'Could not generate suggestion.');
    } finally {
      setAiHelperLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!book) return;
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to share your review with the community.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: onOpenAuth },
      ]);
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Empty Review', 'Please enter your thoughts before submitting your review.');
      return;
    }

    const postText = reviewText.trim();
    const finalRating = userRating || 5;

    // Build optimistic activity so UI updates immediately
    const newActivity: FeedActivity = {
      id: `post_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      activityType: 'reviewed',
      book: {
        ...book,
        userRating: finalRating,
      },
      rating: finalRating,
      reviewText: postText,
      timestamp: 'Just now',
      likes: 0,
      commentsCount: 0,
      isLiked: false,
    };

    if (onPostCreated) {
      onPostCreated(newActivity);
    }

    // Automatically update book shelf to 'read' with the user's rating
    onUpdateShelf(book.id, 'read', finalRating, book.pages);
    setCurrentShelf('read');
    setUserRating(finalRating);

    setSubmittingReview(true);
    try {
      await createReviewPost({
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCoverUrl: book.coverUrl,
        rating: finalRating,
        text: postText,
        activityType: 'reviewed',
      });

      setReviewText('');
      Alert.alert(
        'Review Published!',
        `Your review for "${book.title}" was successfully posted to the community feed.`
      );
    } catch (err: any) {
      console.warn('Review submit error:', err);
      Alert.alert('Submission Error', err.message || 'Could not post review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShelfSelect = (
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null
  ) => {
    if (!book) return;
    setCurrentShelf(shelf);
    setShowShelfPicker(false);
    onUpdateShelf(book.id, shelf, userRating, parseInt(pagesRead, 10) || 0);
  };

  const handleRating = (rating: number) => {
    if (!book) return;
    setUserRating(rating);
    onUpdateShelf(book.id, currentShelf, rating, parseInt(pagesRead, 10) || 0);
  };

  const handleSaveProgress = () => {
    if (!book) return;
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
        return 'Want to Read';
      case 'currently-reading':
        return 'Currently Reading';
      case 'read':
        return 'Read';
      default:
        return 'Want to Read';
    }
  };

  const getShelfIcon = () => {
    switch (currentShelf) {
      case 'want-to-read':
        return <Icon name="check" size={13} color={currentShelf ? '#382110' : '#fff'} />;
      case 'currently-reading':
        return <Icon name="book-open" size={13} color="#00635D" />;
      case 'read':
        return <Icon name="check-double" size={13} color={currentShelf ? '#382110' : '#fff'} />;
      default:
        return null;
    }
  };

  if (!visible || !book) {
    return null;
  }

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
              <Icon name="close" size={14} color="#666" />
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
                  <View style={styles.shelfBtnInner}>
                    {currentShelf && getShelfIcon()}
                    <Text
                      style={[
                        styles.shelfBtnText,
                        currentShelf && styles.shelvedBtnTextActive,
                      ]}
                    >
                      {getShelfLabel()} ▾
                    </Text>
                  </View>
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

            {/* Write a Community Review Card */}
            <View style={styles.reviewCard}>
              <Text style={styles.sectionHeader}>Write a Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="What did you think of this book? Share your thoughts..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
                value={reviewText}
                onChangeText={setReviewText}
              />

              {/* AI Writing Helper Toolbar */}
              <View style={styles.aiHelperToolbar}>
                <View style={styles.aiHelperLabelRow}>
                  <Text style={styles.aiHelperLabel}>✦ AI Writing Helper:</Text>
                  {aiHelperLoading && (
                    <ActivityIndicator size="small" color="#00635D" style={{ marginLeft: 6 }} />
                  )}
                </View>
                <View style={styles.aiHelperButtonsRow}>
                  <TouchableOpacity
                    style={styles.aiHelperChip}
                    onPress={() => handleAIWritingAssist('improve')}
                    disabled={aiHelperLoading}
                  >
                    <Text style={styles.aiHelperChipText}>✦ Improve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.aiHelperChip}
                    onPress={() => handleAIWritingAssist('shorten')}
                    disabled={aiHelperLoading}
                  >
                    <Text style={styles.aiHelperChipText}>✦ Shorten</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.aiHelperChip}
                    onPress={() => handleAIWritingAssist('translate')}
                    disabled={aiHelperLoading}
                  >
                    <Text style={styles.aiHelperChipText}>✦ Filipino</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* AI Suggestion Box (User review & confirmation) */}
              {aiSuggestion && (
                <View style={styles.aiSuggestionBox}>
                  <Text style={styles.aiSuggestionHeader}>✦ Gemini AI Suggestion:</Text>
                  <Text style={styles.aiSuggestionText}>"{aiSuggestion}"</Text>
                  <View style={styles.aiSuggestionActions}>
                    <TouchableOpacity
                      style={styles.applySuggestionBtn}
                      onPress={() => {
                        setReviewText(aiSuggestion);
                        setAiSuggestion(null);
                      }}
                    >
                      <Text style={styles.applySuggestionBtnText}>Use Suggestion</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.discardSuggestionBtn}
                      onPress={() => setAiSuggestion(null)}
                    >
                      <Text style={styles.discardSuggestionBtnText}>Keep Original</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.submitReviewBtn,
                  submittingReview && styles.btnDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>Post Review to Feed</Text>
                )}
              </TouchableOpacity>
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

            {/* AI Reader Consensus Toggle Button */}
            <TouchableOpacity
              style={styles.aiConsensusToggleBtn}
              onPress={handleToggleConsensus}
              activeOpacity={0.8}
            >
              <Text style={styles.aiConsensusToggleText}>
                ✦ {showAIConsensus ? 'Hide Reader Consensus' : 'Summarize Reader Reviews with Gemini AI'}
              </Text>
            </TouchableOpacity>

            {showAIConsensus && (
              <View style={styles.aiConsensusCard}>
                <View style={styles.aiConsensusBadge}>
                  <Text style={styles.aiConsensusBadgeText}>✦ GEMINI CONSENSUS</Text>
                </View>
                {bookConsensusLoading ? (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#00635D" />
                    <Text style={{ fontSize: 11, color: '#666', marginTop: 6, fontStyle: 'italic' }}>
                      Analyzing reader sentiment with Gemini AI...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.aiConsensusText}>
                    "{bookConsensus}"
                  </Text>
                )}
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
  shelfBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  aiHelperToolbar: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  aiHelperLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiHelperLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00635D',
  },
  aiHelperButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  aiHelperChip: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  aiHelperChipText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },
  aiSuggestionBox: {
    backgroundColor: '#F3FBF7',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  aiSuggestionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 4,
  },
  aiSuggestionText: {
    fontFamily: 'serif',
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  aiSuggestionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  applySuggestionBtn: {
    backgroundColor: '#00635D',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  applySuggestionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  discardSuggestionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  discardSuggestionBtnText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  aiConsensusToggleBtn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  aiConsensusToggleText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  aiConsensusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    marginBottom: 14,
  },
  aiConsensusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  aiConsensusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D32',
  },
  aiConsensusText: {
    fontFamily: 'serif',
    fontSize: 12,
    color: '#382110',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAE5DB',
  },
  reviewInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    color: '#333',
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: 6,
  },
  submitReviewBtn: {
    backgroundColor: '#37745B',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.6,
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

