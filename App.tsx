/**
 * Goodreads Mobile App - React Native CLI
 */

import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Book, FeedActivity, UserProfile } from './src/types';
import { BOOKS_DATA, FEED_ACTIVITIES } from './src/data/mockData';
import { GoodreadsHeader } from './src/components/GoodreadsHeader';
import { AuthModal } from './src/components/AuthModal';
import { BookDetailModal } from './src/components/BookDetailModal';
import { Icon } from './src/components/Icon';
import { subscribeToAuthState, signOutUser } from './src/firebase';

import { HomeScreen } from './src/screens/HomeScreen';
import { MyBooksScreen } from './src/screens/MyBooksScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<Book[]>(BOOKS_DATA);
  const [feed] = useState<FeedActivity[]>(FEED_ACTIVITIES);
  const [activeTab, setActiveTab] = useState<
    'home' | 'mybooks' | 'discover' | 'profile'
  >('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Subscribe to Firebase Auth state for automatic session persistence
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(currentUser => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleShelfChange = (
    bookId: string,
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null,
    rating?: number,
    progress?: number
  ) => {
    setBooks(prev =>
      prev.map(b => {
        if (b.id === bookId) {
          return {
            ...b,
            userShelf: shelf,
            userRating: rating !== undefined ? rating : b.userRating,
            progressPages: progress !== undefined ? progress : b.progressPages,
          };
        }
        return b;
      })
    );

    // Also update selectedBook if open
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook(prev =>
        prev
          ? {
              ...prev,
              userShelf: shelf,
              userRating: rating !== undefined ? rating : prev.userRating,
              progressPages:
                progress !== undefined ? progress : prev.progressPages,
            }
          : null
      );
    }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    Alert.alert(
      'Welcome to Goodreads!',
      `Signed in successfully as ${newUser.name} (${newUser.email})`
    );
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setUser(null);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <SafeAreaView style={styles.safeArea}>
        {/* Main Goodreads Mobile Header */}
        <GoodreadsHeader
          user={user}
          onOpenAuth={() => setAuthModalVisible(true)}
          onOpenSearch={() => setActiveTab('discover')}
          onOpenProfile={() => setActiveTab('profile')}
        />

        {/* Screen Content */}
        <View style={styles.screenContainer}>
          {activeTab === 'home' && (
            <HomeScreen
              user={user}
              books={books}
              feed={feed}
              onSelectBook={setSelectedBook}
              onShelfChange={handleShelfChange}
              onOpenAuth={() => setAuthModalVisible(true)}
            />
          )}

          {activeTab === 'mybooks' && (
            <MyBooksScreen
              user={user}
              books={books}
              onSelectBook={setSelectedBook}
              onShelfChange={handleShelfChange}
              onOpenAuth={() => setAuthModalVisible(true)}
            />
          )}

          {activeTab === 'discover' && (
            <DiscoverScreen
              books={books}
              onSelectBook={setSelectedBook}
              onShelfChange={handleShelfChange}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              user={user}
              books={books}
              onOpenAuth={() => setAuthModalVisible(true)}
              onLogout={handleLogout}
              onSelectBook={setSelectedBook}
            />
          )}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('home')}
          >
            <Icon
              name="home"
              size={20}
              color={activeTab === 'home' ? '#00635D' : '#767676'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'home' && styles.activeTabLabel,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('mybooks')}
          >
            <Icon
              name="books"
              size={20}
              color={activeTab === 'mybooks' ? '#00635D' : '#767676'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'mybooks' && styles.activeTabLabel,
              ]}
            >
              My Books
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('discover')}
          >
            <Icon
              name="search"
              size={20}
              color={activeTab === 'discover' ? '#00635D' : '#767676'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'discover' && styles.activeTabLabel,
              ]}
            >
              Discover
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('profile')}
          >
            <Icon
              name="profile"
              size={20}
              color={activeTab === 'profile' ? '#00635D' : '#767676'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'profile' && styles.activeTabLabel,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Global Auth Modal (Sign In, Registration & Google Sign In) */}
        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Book Details Modal */}
        <BookDetailModal
          book={selectedBook}
          visible={Boolean(selectedBook)}
          onClose={() => setSelectedBook(null)}
          onUpdateShelf={handleShelfChange}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  screenContainer: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2DED5',
    alignItems: 'center',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: '#767676',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#00635D',
    fontWeight: '700',
  },
});

export default App;
