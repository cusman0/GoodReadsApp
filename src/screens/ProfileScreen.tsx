import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Book, UserProfile } from '../types';
import { Icon } from '../components/Icon';

interface ProfileScreenProps {
  user: UserProfile | null;
  books: Book[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectBook: (book: Book) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  books,
  onOpenAuth,
  onLogout,
  onSelectBook,
}) => {
  const readBooks = books.filter(b => b.userShelf === 'read');

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <Icon name="profile" size={52} color="#BBBBBB" />
        <Text style={styles.guestTitle}>Sign in to Goodreads</Text>
        <Text style={styles.guestSubtitle}>
          Create an account or sign in to track your reading challenge, connect with friends, and customize your bookshelves.
        </Text>
        <TouchableOpacity style={styles.authBtn} onPress={onOpenAuth}>
          <Text style={styles.authBtnText}>Sign In / Register with Google</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
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

      {/* Reading Challenge Card */}
      <View style={styles.challengeBox}>
        <Text style={styles.boxTitle}>2026 READING CHALLENGE</Text>
        <View style={styles.challengeStatsRow}>
          <Text style={styles.challengeBigCount}>
            {user.readingChallengeProgress}{' '}
            <Text style={styles.challengeSubCount}>of {user.readingChallengeGoal} books</Text>
          </Text>
          <Text style={styles.percentBadge}>
            {Math.round((user.readingChallengeProgress / user.readingChallengeGoal) * 100)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  100,
                  (user.readingChallengeProgress / user.readingChallengeGoal) * 100
                )}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Bookshelf Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {books.filter(b => b.userShelf === 'read').length}
          </Text>
          <Text style={styles.statLabel}>Read</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {books.filter(b => b.userShelf === 'currently-reading').length}
          </Text>
          <Text style={styles.statLabel}>Reading</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {books.filter(b => b.userShelf === 'want-to-read').length}
          </Text>
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

      {/* Settings / Sign Out */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  guestContainer: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  guestIcon: {
    fontSize: 50,
    marginBottom: 14,
  },
  guestTitle: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: '#382110',
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  authBtn: {
    backgroundColor: '#37745B',
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
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00635D',
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
  boxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00635D',
    letterSpacing: 0.5,
  },
  challengeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
  },
  challengeBigCount: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: '#382110',
  },
  challengeSubCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  percentBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#409D69',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EBE8DF',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#409D69',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DD',
  },
  statNumber: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: '#382110',
  },
  statLabel: {
    fontSize: 11,
    color: '#767676',
    marginTop: 2,
    fontWeight: '600',
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
    width: 80,
    marginRight: 12,
  },
  readBookCover: {
    width: 80,
    height: 120,
    borderRadius: 4,
  },
  readBookTitle: {
    fontSize: 11,
    color: '#333',
    marginTop: 4,
  },
  actionSection: {
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#E74C3C',
    fontWeight: '700',
    fontSize: 14,
  },
});

