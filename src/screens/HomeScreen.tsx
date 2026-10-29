import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Book, FeedActivity, UserProfile } from '../types';
import { BookCard } from '../components/BookCard';
import { StarRating } from '../components/StarRating';
import { Icon } from '../components/Icon';

interface HomeScreenProps {
  user: UserProfile | null;
  books: Book[];
  feed: FeedActivity[];
  onSelectBook: (book: Book) => void;
  onShelfChange: (bookId: string, shelf: 'want-to-read' | 'currently-reading' | 'read' | null) => void;
  onOpenAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  books,
  feed,
  onSelectBook,
  onShelfChange,
  onOpenAuth,
}) => {
  const currentlyReading = books.filter(b => b.userShelf === 'currently-reading');
  const trendingBooks = books.slice(0, 6);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Logged In User Profile Card matching Image 1 */}
      {user && (
        <View style={styles.userProfileCard}>
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
          <View style={styles.userProfileDetails}>
            <Text style={styles.userProfileName}>{user.name}</Text>
            <Text style={styles.userProfileEmail}>{user.email}</Text>
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

      {/* Reading Challenge Widget */}
      {user && (
        <View style={styles.challengeCard}>
          <View style={styles.challengeRow}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeYear}>2026 READING CHALLENGE</Text>
              <Text style={styles.challengeStats}>
                {user.readingChallengeProgress} of {user.readingChallengeGoal} books completed
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        (user.readingChallengeProgress / user.readingChallengeGoal) * 100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.challengeSubtext}>You are 2 books ahead of schedule!</Text>
            </View>
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeBadgeNumber}>
                {Math.round((user.readingChallengeProgress / user.readingChallengeGoal) * 100)}%
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
                  {item.userName}{' '}
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
  userAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00635D',
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
});

