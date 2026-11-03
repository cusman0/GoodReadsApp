import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { UserProfile, Review, Book } from '../types';
import { subscribeToOtherUserPublicReviews } from '../firebase';
import { StarRating } from './StarRating';
import { Icon } from './Icon';

interface ViewUserProfileModalProps {
  visible: boolean;
  targetUser: UserProfile | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSelectBook?: (book: Book) => void;
  onLikePost?: (postId: string, currentlyLiked: boolean) => void;
  onOpenComments?: (postId: string, bookTitle: string) => void;
}

export const ViewUserProfileModal: React.FC<ViewUserProfileModalProps> = ({
  visible,
  targetUser,
  currentUser,
  onClose,
  onSelectBook,
  onLikePost,
  onOpenComments,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [targetUser?.avatar]);

  useEffect(() => {
    if (!visible || !targetUser?.id) {
      setReviews([]);
      return;
    }
    setLoading(true);
    const unsub = subscribeToOtherUserPublicReviews(targetUser.id, userReviews => {
      setReviews(userReviews);
      setLoading(false);
    });

    return () => unsub();
  }, [visible, targetUser?.id]);

  if (!visible || !targetUser) return null;

  const isOwnProfile = currentUser && currentUser.id === targetUser.id;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>Reader Profile</Text>
              {isOwnProfile && <Text style={styles.youBadge}> (You)</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarWrapper}>
                {targetUser.avatar && !imageError ? (
                  <Image
                    source={{ uri: targetUser.avatar }}
                    style={styles.avatar}
                    onError={() => setImageError(true)}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitials}>
                      {targetUser.name
                        .split(' ')
                        .map(p => p.charAt(0))
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'GR'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.profileMeta}>
                <Text style={styles.userName}>{targetUser.name}</Text>
                <Text style={styles.userRole}>Community Reader</Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statPill}>
                    <Text style={styles.statNumber}>{targetUser.booksReadCount || 0}</Text>
                    <Text style={styles.statLabel}>Read</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statNumber}>{targetUser.currentlyReadingCount || 0}</Text>
                    <Text style={styles.statLabel}>Reading</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statNumber}>{targetUser.wantToReadCount || 0}</Text>
                    <Text style={styles.statLabel}>Want to Read</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Public Reviews Section */}
            <View style={styles.reviewsSection}>
              <View style={styles.reviewsSectionHeader}>
                <Text style={styles.sectionTitle}>PUBLIC REVIEWS</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              </View>

              {loading ? (
                <View style={styles.loaderBox}>
                  <ActivityIndicator size="small" color="#00635D" />
                  <Text style={styles.loaderText}>Loading reviews...</Text>
                </View>
              ) : reviews.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Icon name="books" size={28} color="#00635D" />
                  <Text style={styles.emptyTitle}>No public reviews yet</Text>
                  <Text style={styles.emptySubtitle}>
                    {targetUser.name} has not published any public reviews yet.
                  </Text>
                </View>
              ) : (
                reviews.map(r => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {r.bookCoverUrl ? (
                        <TouchableOpacity
                          onPress={() =>
                            onSelectBook &&
                            onSelectBook({
                              id: r.bookId,
                              title: r.bookTitle || 'Book',
                              author: r.bookAuthor || 'Unknown Author',
                              coverUrl: r.bookCoverUrl || '',
                              rating: r.rating || 5,
                              ratingCount: 1,
                              reviewCount: 1,
                              pages: 300,
                              publishedYear: 2024,
                              genres: ['Fiction'],
                              description: r.reviewText || '',
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: r.bookCoverUrl }} style={styles.bookCover} />
                        </TouchableOpacity>
                      ) : null}

                      <View style={styles.reviewMeta}>
                        <TouchableOpacity
                          onPress={() =>
                            onSelectBook &&
                            onSelectBook({
                              id: r.bookId,
                              title: r.bookTitle || 'Book',
                              author: r.bookAuthor || 'Unknown Author',
                              coverUrl: r.bookCoverUrl || '',
                              rating: r.rating || 5,
                              ratingCount: 1,
                              reviewCount: 1,
                              pages: 300,
                              publishedYear: 2024,
                              genres: ['Fiction'],
                              description: r.reviewText || '',
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={styles.bookTitle} numberOfLines={2}>
                            {r.bookTitle}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.bookAuthor}>by {r.bookAuthor}</Text>
                        <View style={styles.ratingRow}>
                          <StarRating rating={r.rating} size={13} />
                          <Text style={styles.reviewDate}>{r.date}</Text>
                        </View>
                      </View>
                    </View>

                    {r.reviewText ? (
                      <Text style={styles.reviewBody}>"{r.reviewText}"</Text>
                    ) : null}

                    {/* Social reactions */}
                    <View style={styles.reactionsRow}>
                      <TouchableOpacity
                        style={styles.reactionBtn}
                        onPress={() => onLikePost && onLikePost(r.id, r.isLiked || false)}
                        activeOpacity={0.7}
                      >
                        <Icon name="heart" size={13} color={r.isLiked ? '#C0392B' : '#767676'} />
                        <Text
                          style={[
                            styles.reactionBtnText,
                            r.isLiked && { color: '#C0392B', fontWeight: '700' },
                          ]}
                        >
                          {r.likesCount || r.likes || 0} {r.isLiked ? 'Liked' : 'Like'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reactionBtn}
                        onPress={() =>
                          onOpenComments && onOpenComments(r.id, r.bookTitle || 'Review')
                        }
                        activeOpacity={0.7}
                      >
                        <Icon name="comment" size={13} color="#767676" />
                        <Text style={styles.reactionBtnText}>
                          {r.commentsCount || 0} Comments
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(56,33,16,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F4F1EA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 450,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D6',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#382110',
  },
  youBadge: {
    fontSize: 14,
    color: '#00635D',
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#767676',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E0D6',
    marginBottom: 16,
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8E0D6',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00635D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  profileMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#382110',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#767676',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    backgroundColor: '#F8F6F2',
    borderWidth: 1,
    borderColor: '#E8E0D6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00635D',
  },
  statLabel: {
    fontSize: 9,
    color: '#767676',
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#382110',
  },
  countBadge: {
    backgroundColor: '#E8F3F1',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00635D',
  },
  loaderBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#767676',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E0D6',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#382110',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#767676',
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E0D6',
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bookCover: {
    width: 48,
    height: 72,
    borderRadius: 4,
    backgroundColor: '#E8E0D6',
    marginRight: 12,
  },
  reviewMeta: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#382110',
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#767676',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999999',
  },
  reviewBody: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 12,
    backgroundColor: '#FAF7F2',
    padding: 10,
    borderRadius: 6,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
    paddingTop: 8,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionBtnText: {
    fontSize: 12,
    color: '#767676',
  },
});

