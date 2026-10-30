import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Book, FeedActivity, UserProfile } from '../types';
import { Icon } from '../components/Icon';
import { StarRating } from '../components/StarRating';

interface ProfileScreenProps {
  user: UserProfile | null;
  books: Book[];
  feed?: FeedActivity[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectBook: (book: Book) => void;
  onUpdateGoal?: (newGoal: number) => void;
  onEditPost?: (activity: FeedActivity) => void;
  onDeletePost?: (postId: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  books,
  feed = [],
  onOpenAuth,
  onLogout,
  onSelectBook,
  onUpdateGoal,
  onEditPost,
  onDeletePost,
}) => {
  const [imageError, setImageError] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState(
    String(user?.readingChallengeGoal || 12)
  );

  useEffect(() => {
    setImageError(false);
  }, [user?.avatar]);

  useEffect(() => {
    if (user?.readingChallengeGoal) {
      setGoalInput(String(user.readingChallengeGoal));
    }
  }, [user?.readingChallengeGoal]);

  // Live shelf statistics calculated directly from user's current book shelves
  const liveBooksRead = books.filter(b => b.userShelf === 'read').length;
  const liveReading = books.filter(b => b.userShelf === 'currently-reading').length;
  const liveWantToRead = books.filter(b => b.userShelf === 'want-to-read').length;

  const challengeGoal =
    user?.readingChallengeGoal && user.readingChallengeGoal > 0
      ? user.readingChallengeGoal
      : 12;
  const challengeProgress = Math.max(
    user?.readingChallengeProgress || 0,
    liveBooksRead
  );
  const challengePercent = Math.min(
    100,
    Math.round((challengeProgress / challengeGoal) * 100)
  );

  // Dynamic live pace calculation
  const calculateLivePace = () => {
    if (challengeProgress >= challengeGoal) {
      return `🎉 Congratulations! You completed your 2026 goal of ${challengeGoal} books!`;
    }
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear =
      Math.floor(
        (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const expected = Math.round((dayOfYear / 365) * challengeGoal);
    const diff = challengeProgress - expected;
    if (diff > 0) {
      return `You are ${diff} ${diff === 1 ? 'book' : 'books'} ahead of schedule!`;
    } else if (diff < 0) {
      const behind = Math.abs(diff);
      return `You are ${behind} ${behind === 1 ? 'book' : 'books'} behind schedule. Keep reading!`;
    }
    return 'You are right on track with your reading schedule!';
  };

  const handleSaveGoal = () => {
    const parsed = parseInt(goalInput.trim(), 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 500) {
      Alert.alert(
        'Invalid Goal',
        'Please enter a realistic reading goal between 1 and 500 books.'
      );
      return;
    }
    if (onUpdateGoal) {
      onUpdateGoal(parsed);
    }
    setGoalModalVisible(false);
    Alert.alert(
      'Goal Updated!',
      `Your 2026 Reading Challenge goal is now set to ${parsed} books.`
    );
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <Icon name="profile" size={52} color="#BBBBBB" />
        <Text style={styles.guestTitle}>Sign in to Goodreads</Text>
        <Text style={styles.guestSubtitle}>
          Track your reading challenge, connect with friends, and customize your bookshelves.
        </Text>
        <TouchableOpacity style={styles.authBtn} onPress={onOpenAuth}>
          <Text style={styles.authBtnText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const readBooks = books.filter(b => b.userShelf === 'read');
  const userReviews = feed.filter(
    f => f.userId === user.id || (user.name && f.userName === user.name)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          {user.avatar && !imageError ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {user.name
                  .split(' ')
                  .map(p => p.charAt(0))
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'GR'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.isGoogleUser && (
            <View style={styles.googleBadge}>
              <Text style={styles.googleBadgeText}>G Signed in with Google</Text>
            </View>
          )}
        </View>
      </View>

      {/* Live Reading Challenge Card */}
      <View style={styles.challengeBox}>
        <View style={styles.challengeHeaderRow}>
          <Text style={styles.boxTitle}>2026 READING CHALLENGE</Text>
          <TouchableOpacity
            style={styles.editGoalBtn}
            onPress={() => setGoalModalVisible(true)}
          >
            <Text style={styles.editGoalBtnText}>✦ Edit Goal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.challengeStatsRow}>
          <Text style={styles.challengeBigCount}>
            {challengeProgress}{' '}
            <Text style={styles.challengeSubCount}>of {challengeGoal} books</Text>
          </Text>
          <Text style={styles.percentBadge}>{challengePercent}%</Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${challengePercent}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.paceSubtext}>{calculateLivePace()}</Text>
      </View>

      {/* Live Bookshelf Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{liveBooksRead}</Text>
          <Text style={styles.statLabel}>Read</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{liveReading}</Text>
          <Text style={styles.statLabel}>Reading</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{liveWantToRead}</Text>
          <Text style={styles.statLabel}>Want to Read</Text>
        </View>
      </View>

      {/* Recently Read Shelf Preview */}
      {readBooks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENTLY READ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {readBooks.map(b => (
              <TouchableOpacity
                key={b.id}
                style={styles.readBookItem}
                onPress={() => onSelectBook(b)}
              >
                <Image source={{ uri: b.coverUrl }} style={styles.readBookCover} />
                <Text style={styles.readBookTitle} numberOfLines={1}>
                  {b.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Dedicated Authored Reviews Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MY REVIEWS & ACTIVITY</Text>
        {userReviews.length > 0 ? (
          userReviews.map(r => (
            <View key={r.id} style={styles.userReviewCard}>
              <View style={styles.userReviewHeader}>
                <Image source={{ uri: r.book?.coverUrl }} style={styles.userReviewCover} />
                <View style={styles.userReviewMeta}>
                  <Text style={styles.userReviewBookTitle} numberOfLines={1}>
                    {r.book?.title}
                  </Text>
                  <Text style={styles.userReviewAuthor}>by {r.book?.author}</Text>
                  <StarRating rating={r.rating || 5} size={14} />
                  <Text style={styles.userReviewDate}>{r.timestamp}</Text>
                </View>
              </View>
              {Boolean(r.reviewText) && (
                <Text style={styles.userReviewBody}>"{r.reviewText}"</Text>
              )}

              <View style={styles.profileReviewActionsRow}>
                <TouchableOpacity
                  style={styles.profileEditBtn}
                  onPress={() => onEditPost && onEditPost(r)}
                  activeOpacity={0.8}
                >
                  <Icon name="edit" size={12} color="#00635D" />
                  <Text style={styles.profileEditBtnText}>Edit Review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileDeleteBtn}
                  onPress={() => onDeletePost && onDeletePost(r.id)}
                  activeOpacity={0.8}
                >
                  <Icon name="trash" size={12} color="#C0392B" />
                  <Text style={styles.profileDeleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))
        ) : (
          <View style={styles.noReviewsBox}>
            <Text style={styles.noReviewsTitle}>No reviews published yet</Text>
            <Text style={styles.noReviewsSubtitle}>
              Open any book in your feed or search to write and publish your thoughts!
            </Text>
          </View>
        )}
      </View>

      {/* Settings / Sign Out */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Reading Challenge Goal Modal */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set 2026 Reading Goal</Text>
            <Text style={styles.modalSubtitle}>
              How many books do you want to read this year?
            </Text>

            <TextInput
              style={styles.goalInput}
              keyboardType="number-pad"
              value={goalInput}
              onChangeText={setGoalInput}
              maxLength={3}
            />

            {/* Quick Preset Chips */}
            <View style={styles.presetsRow}>
              {[10, 20, 30, 50].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.presetChip,
                    goalInput === String(val) && styles.activePresetChip,
                  ]}
                  onPress={() => setGoalInput(String(val))}
                >
                  <Text
                    style={[
                      styles.presetText,
                      goalInput === String(val) && styles.activePresetText,
                    ]}
                  >
                    {val} books
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.cancelGoalBtn}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={styles.cancelGoalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveGoalBtn}
                onPress={handleSaveGoal}
              >
                <Text style={styles.saveGoalBtnText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  profileReviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EAE5DB',
  },
  profileEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  profileEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00635D',
  },
  profileDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  profileDeleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C0392B',
  },

  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  guestContainer: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  guestTitle: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: '#382110',
    marginTop: 12,
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  authBtn: {
    backgroundColor: '#00635D',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 20,
  },
  authBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00635D',
    overflow: 'hidden',
    backgroundColor: '#3B82F6',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#767676',
    marginTop: 2,
  },
  googleBadge: {
    backgroundColor: '#E8F0FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  googleBadgeText: {
    fontSize: 11,
    color: '#1A73E8',
    fontWeight: '600',
  },
  challengeBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    marginBottom: 16,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00635D',
    letterSpacing: 0.5,
  },
  editGoalBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  editGoalBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  challengeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  challengeBigCount: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: '#382110',
  },
  challengeSubCount: {
    fontSize: 13,
    color: '#767676',
    fontWeight: '400',
  },
  percentBadge: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EAE5DB',
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00635D',
    borderRadius: 4,
  },
  paceSubtext: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: '#382110',
  },
  statLabel: {
    fontSize: 11,
    color: '#767676',
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#767676',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  readBookItem: {
    marginRight: 12,
    width: 80,
  },
  readBookCover: {
    width: 80,
    height: 120,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  readBookTitle: {
    fontSize: 11,
    color: '#333',
    marginTop: 4,
    fontWeight: '500',
  },
  userReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    marginBottom: 10,
  },
  userReviewHeader: {
    flexDirection: 'row',
  },
  userReviewCover: {
    width: 44,
    height: 66,
    borderRadius: 4,
  },
  userReviewMeta: {
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
  },
  userReviewBookTitle: {
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '700',
    color: '#382110',
  },
  userReviewAuthor: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  userReviewDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 3,
  },
  userReviewBody: {
    fontFamily: 'serif',
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  noReviewsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    alignItems: 'center',
  },
  noReviewsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#382110',
    marginBottom: 4,
  },
  noReviewsSubtitle: {
    fontSize: 11,
    color: '#767676',
    textAlign: 'center',
  },
  actionSection: {
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#C0392B',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#E8E5DD',
  },
  modalTitle: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#382110',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 8,
    fontSize: 22,
    fontWeight: '700',
    color: '#00635D',
    textAlign: 'center',
    paddingVertical: 10,
    backgroundColor: '#FAF8F5',
    marginBottom: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: '#F4F1EA',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  activePresetChip: {
    backgroundColor: '#00635D',
    borderColor: '#00635D',
  },
  presetText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  activePresetText: {
    color: '#FFF',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelGoalBtn: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelGoalBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  saveGoalBtn: {
    flex: 1,
    backgroundColor: '#00635D',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveGoalBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
