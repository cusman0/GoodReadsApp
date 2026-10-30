import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Book, FeedActivity, UserProfile } from '../types';
import { BookCard } from '../components/BookCard';
import { StarRating } from '../components/StarRating';
import { Icon } from '../components/Icon';
import { getCommunityFeedSummary, AISummaryResult } from '../services/aiService';

interface HomeScreenProps {
  user: UserProfile | null;
  books: Book[];
  feed: FeedActivity[];
  onSelectBook: (book: Book) => void;
  onShelfChange: (bookId: string, shelf: 'want-to-read' | 'currently-reading' | 'read' | null) => void;
  onOpenAuth: () => void;
  onEditPost?: (activity: FeedActivity) => void;
  onDeletePost?: (postId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  books,
  feed,
  onSelectBook,
  onShelfChange,
  onOpenAuth,
  onEditPost,
  onDeletePost,
}) => {
  const currentlyReading = books.filter(b => b.userShelf === 'currently-reading');
  const trendingBooks = books.slice(0, 6);
  const myReviews = (feed || []).filter(
    item => user && (item.userId === user.id || (user.name && item.userName === user.name))
  );
  const [avatarError, setAvatarError] = useState(false);
  const [summary, setSummary] = useState<AISummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  useEffect(() => {
    let active = true;
    getCommunityFeedSummary(feed).then(res => {
      if (active) setSummary(res);
    });
    return () => {
      active = false;
    };
  }, [feed]);

  const handleRefreshSummary = async () => {
    setSummaryLoading(true);
    try {
      const freshSummary = await getCommunityFeedSummary(feed, true);
      setSummary(freshSummary);
    } catch (e) {
      console.warn('Failed to refresh AI summary:', e);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Live user bookshelf & reading challenge metrics
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

  const calculateLivePace = () => {
    if (challengeProgress >= challengeGoal) {
      return `🎉 Goal achieved! You read ${challengeProgress} of ${challengeGoal} books!`;
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
    return 'You are right on track with your reading goal!';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Logged In User Profile Card matching Image 1 */}
      {user && (
        <View style={styles.userProfileCard}>
          <View style={styles.userAvatarWrapper}>
            {user.avatar && !avatarError ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.userAvatar}
                onError={() => setAvatarError(true)}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.userAvatarCircle}>
                <Text style={styles.userAvatarInitials}>
                  {user.name
                    .split(' ')
                    .map(p => p.charAt(0))
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'MS'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userProfileDetails}>
            <Text style={styles.userProfileName}>{user.name}</Text>
            <Text style={styles.userProfileEmail}>{user.email}</Text>
            <View style={styles.userProfileStatsRow}>
              <Text style={styles.userProfileStatText}>
                <Text style={styles.userProfileStatBold}>{liveBooksRead}</Text> Read •{' '}
                <Text style={styles.userProfileStatBold}>{liveReading}</Text> Reading •{' '}
                <Text style={styles.userProfileStatBold}>{liveWantToRead}</Text> Want to Read
              </Text>
            </View>
            {user.isGoogleUser && (
              <View style={styles.googleBadgePill}>
                <Text style={styles.googleBadgePillText}>G Signed in with Google</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Welcome / Guest Callout */}
      {!user && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestTitle}>Welcome to Goodreads!</Text>
          <Text style={styles.guestSubtitle}>
            Track the books you want to read, find great recommendations, and join the world\'s largest reader community.
          </Text>
          <TouchableOpacity style={styles.guestSignInBtn} onPress={onOpenAuth}>
            <Text style={styles.guestSignInBtnText}>Sign In or Register</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Live Reading Challenge Widget */}
      {user && (
        <View style={styles.challengeCard}>
          <View style={styles.challengeRow}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeYear}>2026 READING CHALLENGE</Text>
              <Text style={styles.challengeStats}>
                {challengeProgress} of {challengeGoal} books completed
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${challengePercent}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.challengeSubtext}>{calculateLivePace()}</Text>
            </View>
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeBadgeNumber}>
                {challengePercent}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Currently Reading Section */}
      {currentlyReading.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CURRENTLY READING</Text>
          {currentlyReading.map(book => (
            <View key={book.id} style={styles.readingCard}>
              <TouchableOpacity onPress={() => onSelectBook(book)} activeOpacity={0.8}>
                <Image source={{ uri: book.coverUrl }} style={styles.readingCover} />
              </TouchableOpacity>
              <View style={styles.readingMeta}>
                <Text style={styles.readingTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.readingAuthor}>by {book.author}</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    Page {book.progressPages || 0} of {book.pages} (
                    {Math.round(((book.progressPages || 0) / book.pages) * 100)}%)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.updateStatusBtn}
                  onPress={() => onSelectBook(book)}
                >
                  <Text style={styles.updateStatusBtnText}>Update Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Trending Books Carousel */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TRENDING THIS WEEK</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={trendingBooks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              layout="compact"
              onPress={onSelectBook}
              onShelfChange={onShelfChange}
            />
          )}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* AI Community Summary Section */}
      <View style={styles.aiSummaryCard}>
        <View style={styles.aiSummaryHeaderRow}>
          <View style={styles.aiSummaryTitleGroup}>
            <View style={styles.aiSummaryBadge}>
              <Text style={styles.aiSummaryBadgeText}>✦ GEMINI AI</Text>
            </View>
            <Text style={styles.aiSummaryTitle}>Reader Consensus</Text>
          </View>
          <TouchableOpacity
            style={styles.aiRefreshBtn}
            onPress={handleRefreshSummary}
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <ActivityIndicator size="small" color="#00635D" />
            ) : (
              <Text style={styles.aiRefreshBtnText}>↻ Refresh</Text>
            )}
          </TouchableOpacity>
        </View>

        {summary && (
          <View style={styles.aiSummaryBody}>
            <Text style={styles.aiSummaryText}>"{summary.summaryText}"</Text>

            {/* Trending Topics Badges */}
            <View style={styles.aiTopicsRow}>
              {summary.topics.map((topic, idx) => (
                <View key={idx} style={styles.aiTopicBadge}>
                  <Text style={styles.aiTopicText}>#{topic}</Text>
                </View>
              ))}
            </View>

            {/* Sentiment & Status Row */}
            <View style={styles.aiFooterRow}>
              <View style={styles.aiSentimentBadge}>
                <Text style={styles.aiSentimentDot}>●</Text>
                <Text style={styles.aiSentimentText}>
                  {summary.mood === 'positive'
                    ? '94% Positive Sentiment'
                    : summary.mood === 'negative'
                    ? 'Critical / Mixed Feedback'
                    : 'Balanced Community View'}
                </Text>
              </View>
              <Text style={styles.aiUpdatedText}>
                {summary.cached ? 'Cached' : 'Live'} • {summary.lastUpdated}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* My Reviews & Recent Activity Section */}
      {user && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>MY REVIEWS & RECENT ACTIVITY</Text>
            {myReviews.length > 0 && (
              <View style={styles.myReviewsCountPill}>
                <Text style={styles.myReviewsCountText}>
                  {myReviews.length} {myReviews.length === 1 ? 'review' : 'reviews'}
                </Text>
              </View>
            )}
          </View>

          {myReviews.length > 0 ? (
            myReviews.map(item => (
              <View key={item.id} style={styles.myReviewCard}>
                <View style={styles.myReviewHeader}>
                  <TouchableOpacity
                    onPress={() => onSelectBook(item.book)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.book.coverUrl }}
                      style={styles.myReviewCover}
                    />
                  </TouchableOpacity>
                  <View style={styles.myReviewMeta}>
                    <TouchableOpacity
                      onPress={() => onSelectBook(item.book)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.myReviewTitle} numberOfLines={2}>
                        {item.book.title}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.myReviewAuthor}>by {item.book.author}</Text>
                    {item.rating && (
                      <View style={styles.myReviewRatingRow}>
                        <StarRating rating={item.rating} size={14} />
                      </View>
                    )}
                    <Text style={styles.myReviewDateText}>
                      Published {item.timestamp}
                    </Text>
                  </View>
                </View>

                {item.reviewText ? (
                  <View style={styles.myReviewBodyBox}>
                    <Text style={styles.myReviewBody}>"{item.reviewText}"</Text>
                  </View>
                ) : null}


                <View style={styles.myReviewActionsRow}>
                  <TouchableOpacity
                    style={styles.myReviewEditBtn}
                    onPress={() => onEditPost && onEditPost(item)}
                    activeOpacity={0.8}
                  >
                    <Icon name="edit" size={13} color="#00635D" />
                    <Text style={styles.myReviewEditBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.myReviewDeleteBtn}
                    onPress={() => onDeletePost && onDeletePost(item.id)}
                    activeOpacity={0.8}
                  >
                    <Icon name="trash" size={13} color="#C0392B" />
                    <Text style={styles.myReviewDeleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.myReviewFooter}>
                  <View style={styles.myReviewBadge}>
                    <Text style={styles.myReviewBadgeText}>✓ Your Verified Review</Text>
                  </View>
                  <View style={styles.myReviewStatsRow}>
                    <Icon name="heart" size={12} color="#C0392B" />
                    <Text style={styles.myReviewStatText}>{item.likes || 0} likes</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyMyReviewsBox}>
              <Icon name="books" size={24} color="#00635D" />
              <Text style={styles.emptyMyReviewsTitle}>No reviews published yet</Text>
              <Text style={styles.emptyMyReviewsSubtext}>
                Tap any book to rate, review, and share your thoughts with the community!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Updates Feed (Community / Friends) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>UPDATES FEED</Text>
        {feed.map(item => (
          <View key={item.id} style={styles.feedCard}>
            {/* Feed user info */}
            <View style={styles.feedUserRow}>
              <Image source={{ uri: item.userAvatar }} style={styles.feedUserAvatar} />
              <View style={styles.feedUserInfo}>
                <Text style={styles.feedUserName}>
                  {item.userName}
                  {user && (item.userId === user.id || item.userName === user.name) && (
                    <Text style={styles.feedYouBadge}> (You)</Text>
                  )}{' '}
                  <Text style={styles.feedActionText}>
                    {item.activityType === 'reviewed' && 'reviewed a book'}
                    {item.activityType === 'reading' && 'started reading'}
                    {item.activityType === 'finished' && 'finished reading'}
                  </Text>
                </Text>
                <Text style={styles.feedTime}>{item.timestamp}</Text>
              </View>
            </View>

            {/* Book snippet */}
            <TouchableOpacity
              style={styles.feedBookSnippet}
              onPress={() => onSelectBook(item.book)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.book.coverUrl }} style={styles.feedBookCover} />
              <View style={styles.feedBookMeta}>
                <Text style={styles.feedBookTitle}>{item.book.title}</Text>
                <Text style={styles.feedBookAuthor}>by {item.book.author}</Text>
                {item.rating && (
                  <View style={styles.feedRatingRow}>
                    <StarRating rating={item.rating} size={13} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Review text */}
            {item.reviewText && (
              <Text style={styles.feedReviewText}>{item.reviewText}</Text>
            )}


            {user && (item.userId === user.id || item.userName === user.name) && (
              <View style={styles.feedOwnerActionsRow}>
                <TouchableOpacity
                  style={styles.feedOwnerEditBtn}
                  onPress={() => onEditPost && onEditPost(item)}
                  activeOpacity={0.8}
                >
                  <Icon name="edit" size={12} color="#00635D" />
                  <Text style={styles.feedOwnerEditBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.feedOwnerDeleteBtn}
                  onPress={() => onDeletePost && onDeletePost(item.id)}
                  activeOpacity={0.8}
                >
                  <Icon name="trash" size={12} color="#C0392B" />
                  <Text style={styles.feedOwnerDeleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Social reactions */}
            <View style={styles.feedActionsRow}>
              <TouchableOpacity style={styles.feedActionBtn}>
                <View style={styles.feedActionBtnInner}>
                  <Icon name="heart" size={13} color="#C0392B" />
                  <Text style={styles.feedActionBtnText}>{item.likes} Likes</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedActionBtn}>
                <View style={styles.feedActionBtnInner}>
                  <Icon name="comment" size={13} color="#767676" />
                  <Text style={styles.feedActionBtnText}>{item.commentsCount} Comments</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  myReviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  myReviewEditBtn: {
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
  myReviewEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00635D',
  },
  myReviewDeleteBtn: {
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
  myReviewDeleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C0392B',
  },
  feedOwnerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE1',
    marginTop: 6,
  },
  feedOwnerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
  },
  feedOwnerEditBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00635D',
  },
  feedOwnerDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
  },
  feedOwnerDeleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C0392B',
  },

  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  guestBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E5DD',
  },
  guestTitle: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#382110',
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 6,
    lineHeight: 18,
  },
  guestSignInBtn: {
    backgroundColor: '#37745B',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  guestSignInBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E5DD',
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeYear: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00635D',
    letterSpacing: 0.5,
  },
  challengeStats: {
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '700',
    color: '#382110',
    marginTop: 4,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#EBE8DF',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#409D69',
    borderRadius: 4,
  },
  challengeSubtext: {
    fontSize: 11,
    color: '#767676',
    marginTop: 6,
  },
  challengeBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F4F1EA',
    borderWidth: 2,
    borderColor: '#409D69',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBadgeNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#382110',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#767676',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  readingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    marginBottom: 10,
  },
  readingCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
  },
  readingMeta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  readingTitle: {
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },
  readingAuthor: {
    fontSize: 12,
    color: '#666666',
  },
  progressRow: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#00635D',
    fontWeight: '600',
  },
  updateStatusBtn: {
    backgroundColor: '#EAE5DB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  updateStatusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#382110',
  },
  horizontalList: {
    paddingRight: 16,
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E5DD',
  },
  feedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  feedUserInfo: {
    marginLeft: 10,
    flex: 1,
  },
  feedUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },
  feedActionText: {
    fontWeight: '400',
    color: '#666666',
  },
  feedTime: {
    fontSize: 11,
    color: '#999999',
    marginTop: 1,
  },
  feedBookSnippet: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EAE5DB',
    marginBottom: 10,
  },
  feedBookCover: {
    width: 44,
    height: 65,
    borderRadius: 3,
  },
  feedBookMeta: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1,
  },
  feedBookTitle: {
    fontFamily: 'serif',
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },
  feedBookAuthor: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  feedRatingRow: {
    marginTop: 4,
  },
  feedReviewText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 19,
    marginBottom: 12,
  },
  feedActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
    paddingTop: 8,
    gap: 16,
  },
  feedActionBtn: {
    paddingVertical: 4,
  },
  feedActionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  userProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiSummaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiSummaryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiSummaryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  aiSummaryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  aiSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00635D',
    letterSpacing: 0.5,
  },
  aiRefreshBtn: {
    backgroundColor: '#F4F1EA',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiRefreshBtnText: {
    fontSize: 11,
    color: '#00635D',
    fontWeight: '700',
  },
  aiSummaryBody: {
    marginTop: 2,
  },
  aiSummaryText: {
    fontFamily: 'serif',
    fontSize: 13,
    color: '#382110',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  aiTopicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  aiTopicBadge: {
    backgroundColor: '#F4F1EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EAE5DB',
  },
  aiTopicText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  aiFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F1EA',
  },
  aiSentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  aiSentimentDot: {
    fontSize: 10,
    color: '#409D69',
  },
  aiSentimentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#409D69',
  },
  aiUpdatedText: {
    fontSize: 10,
    color: '#999',
  },
  userAvatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00635D',
    overflow: 'hidden',
    backgroundColor: '#3B82F6',
    marginRight: 16,
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  userAvatarCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  userProfileDetails: {
    flex: 1,
  },
  userProfileName: {
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '700',
    color: '#382110',
  },
  userProfileEmail: {
    fontSize: 13,
    color: '#767676',
    marginTop: 2,
  },
  userProfileStatsRow: {
    marginTop: 4,
  },
  userProfileStatText: {
    fontSize: 12,
    color: '#666666',
  },
  userProfileStatBold: {
    fontWeight: '700',
    color: '#00635D',
  },
  googleBadgePill: {
    backgroundColor: '#E8F0FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  googleBadgePillText: {
    fontSize: 11,
    color: '#1A73E8',
    fontWeight: '600',
  },
  feedActionBtnText: {
    fontSize: 12,
    color: '#767676',
    fontWeight: '500',
  },
  feedYouBadge: {
    color: '#00635D',
    fontWeight: '700',
    fontSize: 12,
  },
  myReviewsCountPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  myReviewsCountText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  myReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    borderLeftWidth: 4,
    borderLeftColor: '#00635D',
  },
  myReviewHeader: {
    flexDirection: 'row',
  },
  myReviewCover: {
    width: 54,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#DDD',
    marginRight: 12,
  },
  myReviewMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  myReviewTitle: {
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '700',
    color: '#382110',
    lineHeight: 20,
  },
  myReviewAuthor: {
    fontSize: 12,
    color: '#767676',
    marginTop: 2,
  },
  myReviewRatingRow: {
    marginTop: 4,
  },
  myReviewDateText: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
  },
  myReviewBodyBox: {
    marginTop: 10,
    backgroundColor: '#F9F8F5',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#D8D4C7',
  },
  myReviewBody: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  myReviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE1',
  },
  myReviewBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  myReviewBadgeText: {
    fontSize: 11,
    color: '#137333',
    fontWeight: '600',
  },
  myReviewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myReviewStatText: {
    fontSize: 12,
    color: '#767676',
    marginLeft: 4,
  },
  emptyMyReviewsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DD',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  emptyMyReviewsTitle: {
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '600',
    color: '#382110',
    marginTop: 8,
  },
  emptyMyReviewsSubtext: {
    fontSize: 12,
    color: '#767676',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
});

