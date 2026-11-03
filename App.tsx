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

import { Book, FeedActivity, UserProfile, AppNotification } from './src/types';
import { BOOKS_DATA, FEED_ACTIVITIES } from './src/data/mockData';
import { GoodreadsHeader } from './src/components/GoodreadsHeader';
import { AIChatModal } from './src/components/AIChatModal';
import { AuthModal } from './src/components/AuthModal';
import { BookDetailModal } from './src/components/BookDetailModal';
import { EditReviewModal } from './src/components/EditReviewModal';
import { CommentsModal } from './src/components/CommentsModal';
import { Icon } from './src/components/Icon';
import {
  subscribeToAuthState,
  signOutUser,
  subscribeToCommunityPosts,
  updateUserReadingGoal,
  updateUserReadingProgress,
  updateReviewPost,
  deleteReviewPost,
  togglePostLike,
  auth,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToBooks,
  subscribeToUserShelvedBooks,
  saveUserShelvedBook,
  removeUserShelvedBook,
  saveBookToCatalog,
} from './src/firebase';

import { fetchPopularBooksFromInternet } from './src/services/bookService';
import { HomeScreen } from './src/screens/HomeScreen';
import { MyBooksScreen } from './src/screens/MyBooksScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<Book[]>(BOOKS_DATA);
  const [feed, setFeed] = useState<FeedActivity[]>(FEED_ACTIVITIES);
  const [activeTab, setActiveTab] = useState<
    'home' | 'mybooks' | 'discover' | 'notifications' | 'profile'
  >('home');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [aiChatVisible, setAiChatVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedActivity | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentPostTitle, setCommentPostTitle] = useState<string>('');

  // Subscribe to Firebase Auth state and real-time community posts
  useEffect(() => {
    let unsubscribeFeed: (() => void) | null = null;

    const startFeedSubscription = () => {
      if (unsubscribeFeed) {
        unsubscribeFeed();
        unsubscribeFeed = null;
      }
      try {
        unsubscribeFeed = subscribeToCommunityPosts((posts: any[]) => {
          const liveActivities: FeedActivity[] = (posts || []).map((p: any) => ({
            id: p.id,
            userId: p.authorId,
            userName: p.authorName,
            userAvatar: p.authorPhotoUrl,
            activityType: p.activityType || 'reviewed',
            book: {
              id: p.bookId,
              title: p.bookTitle,
              author: p.bookAuthor,
              coverUrl: p.bookCoverUrl,
              rating: p.rating || 5,
              ratingCount: 1,
              reviewCount: 1,
              pages: 320,
              publishedYear: 2024,
              genres: ['Fiction'],
              description: p.text,
            },
            rating: p.rating,
            reviewText: p.text,
            timestamp: p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'Just now',
            likes: p.likeCount || 0,
            commentsCount: p.commentsCount || 0,
            isLiked: Array.isArray(p.likedBy) && auth.currentUser
              ? p.likedBy.includes(auth.currentUser.uid)
              : false,
          }));
          setFeed(liveActivities);
        });
      } catch (err) {
        console.warn('Could not setup feed subscription:', err);
      }
    };

    const unsubscribeAuth = subscribeToAuthState((currentUser: any) => {
      setUser(currentUser);
      // Re-subscribe when auth state resolves to ensure authenticated Firestore read permission
      startFeedSubscription();
    });

    startFeedSubscription();

    return () => {
      unsubscribeAuth();
      if (unsubscribeFeed) {
        unsubscribeFeed();
      }
    };
  }, []);


  // Subscribe to live community books in Firestore and fetch live popular books
  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeToBooks(catalogBooks => {
      if (catalogBooks && catalogBooks.length > 0) {
        setBooks(prev => {
          const map = new Map<string, Book>();
          prev.forEach(b => map.set(b.id, b));
          catalogBooks.forEach(cb => {
            const existing = map.get(cb.id);
            map.set(
              cb.id,
              existing
                ? {
                    ...cb,
                    userShelf: existing.userShelf,
                    userRating: existing.userRating,
                    progressPages: existing.progressPages,
                  }
                : cb
            );
          });
          return Array.from(map.values());
        });
      }
    });

    // Populate catalog live from Google Books & Open Library if empty
    fetchPopularBooksFromInternet(null, 30)
      .then(liveBooks => {
        if (isMounted && liveBooks && liveBooks.length > 0) {
          setBooks(prev => {
            const map = new Map<string, Book>();
            prev.forEach(b => map.set(b.id, b));
            liveBooks.forEach(lb => {
              if (!map.has(lb.id)) {
                map.set(lb.id, lb);
                saveBookToCatalog(lb);
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(err => console.warn('Initial live books load notice:', err));

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Subscribe to logged-in user's live bookshelf and notifications in Firestore
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubShelves = subscribeToUserShelvedBooks(user.id, shelvedBooks => {
      if (shelvedBooks && shelvedBooks.length > 0) {
        setBooks(prev => {
          const shelfMap = new Map<string, Book>(shelvedBooks.map(sb => [sb.id, sb]));
          return prev.map(b => {
            const shelved = shelfMap.get(b.id);
            return shelved
              ? {
                  ...b,
                  userShelf: shelved.userShelf,
                  userRating: shelved.userRating,
                  progressPages: shelved.progressPages,
                }
              : b;
          });
        });
      }
    });

    const unsubNotifs = subscribeToNotifications(user.id, items => {
      setNotifications(items);
    });

    return () => {
      unsubShelves();
      unsubNotifs();
    };
  }, [user?.id]);

  const handlePostCreated = (newActivity: FeedActivity) => {
    setFeed(prev => [newActivity, ...prev.filter(f => f.id !== newActivity.id)]);
  };

  const handleShelfChange = (
    bookId: string,
    shelf: 'want-to-read' | 'currently-reading' | 'read' | null,
    rating?: number,
    progress?: number
  ) => {
    let updatedBook: Book | null = null;
    let nextBooks: Book[] = [];

    setBooks(prev => {
      const exists = prev.some(b => b.id === bookId);
      if (!exists && selectedBook && selectedBook.id === bookId) {
        updatedBook = {
          ...selectedBook,
          userShelf: shelf,
          userRating: rating !== undefined ? rating : selectedBook.userRating,
          progressPages: progress !== undefined ? progress : selectedBook.progressPages,
        };
        nextBooks = [...prev, updatedBook];
      } else {
        nextBooks = prev.map(b => {
          if (b.id === bookId) {
            updatedBook = {
              ...b,
              userShelf: shelf,
              userRating: rating !== undefined ? rating : b.userRating,
              progressPages: progress !== undefined ? progress : b.progressPages,
            };
            return updatedBook;
          }
          return b;
        });
      }

      // Persist to Cloud Firestore in real-time
      if (user && updatedBook) {
        saveBookToCatalog(updatedBook);
        if (shelf) {
          saveUserShelvedBook(user.id, updatedBook);
        } else {
          removeUserShelvedBook(user.id, bookId);
        }

        const readCount = nextBooks.filter(b => b.userShelf === 'read').length;
        const readingCount = nextBooks.filter(b => b.userShelf === 'currently-reading').length;
        const wantCount = nextBooks.filter(b => b.userShelf === 'want-to-read').length;

        setUser(currentUser =>
          currentUser
            ? {
                ...currentUser,
                booksReadCount: readCount,
                currentlyReadingCount: readingCount,
                wantToReadCount: wantCount,
                readingChallengeProgress: readCount,
              }
            : null
        );

        updateUserReadingProgress(user.id, readCount, {
          read: readCount,
          reading: readingCount,
          wantToRead: wantCount,
        });
      }

      return nextBooks;
    });

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

  const handleUpdateGoal = async (newGoal: number) => {
    if (user) {
      setUser(prev => (prev ? { ...prev, readingChallengeGoal: newGoal } : null));
      await updateUserReadingGoal(user.id, newGoal);
    }
  };


  const handleEditPost = (activity: FeedActivity) => {
    setEditingPost(activity);
  };

  const handleSaveEdit = async (
    postId: string,
    updatedText: string,
    updatedRating?: number
  ) => {
    await updateReviewPost(postId, updatedText, updatedRating);
    setFeed(prev =>
      prev.map(f =>
        f.id === postId
          ? {
              ...f,
              reviewText: updatedText,
              rating: updatedRating !== undefined ? updatedRating : f.rating,
            }
          : f
      )
    );
    Alert.alert('Success', 'Your review has been updated!');
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to permanently delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReviewPost(postId);
              setFeed(prev => prev.filter(f => f.id !== postId));
              Alert.alert('Deleted', 'Your review has been removed.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete review.');
            }
          },
        },
      ]
    );
  };

  const handleLikePost = async (postId: string, currentlyLiked: boolean) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    // Optimistic update
    setFeed(prev =>
      prev.map(f =>
        f.id === postId
          ? { ...f, likes: currentlyLiked ? f.likes - 1 : f.likes + 1, isLiked: !currentlyLiked }
          : f
      )
    );
    try {
      await togglePostLike(postId, currentlyLiked);
    } catch (err: any) {
      // Revert on error
      setFeed(prev =>
        prev.map(f =>
          f.id === postId
            ? { ...f, likes: currentlyLiked ? f.likes + 1 : f.likes - 1, isLiked: currentlyLiked }
            : f
        )
      );
      Alert.alert('Error', err.message || 'Could not update like.');
    }
  };

  const handleOpenComments = (postId: string, bookTitle: string) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    setCommentPostId(postId);
    setCommentPostTitle(bookTitle);
  };


  const handleNotificationPress = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.postId) {
      setCommentPostId(notif.postId);
      setCommentPostTitle(notif.bookTitle || 'Review');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (user) {
      await markAllNotificationsAsRead(user.id);
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
      <StatusBar barStyle="dark-content" {...({ backgroundColor: '#F4F1EA' } as any)} />
      <SafeAreaView style={styles.safeArea}>
        {/* Main Goodreads Mobile Header */}
        <GoodreadsHeader
          user={user}
          onOpenAuth={() => setAuthModalVisible(true)}
          onOpenSearch={() => setActiveTab('discover')}
          onOpenProfile={() => setActiveTab('profile')}
          onOpenAIChat={() => setAiChatVisible(true)}
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
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onLikePost={handleLikePost}
              onOpenComments={handleOpenComments}
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

          {activeTab === 'notifications' && (
            <NotificationsScreen
              notifications={notifications}
              user={user}
              onOpenAuth={() => setAuthModalVisible(true)}
              onNotificationPress={handleNotificationPress}
              onMarkAllAsRead={handleMarkAllNotificationsRead}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              user={user}
              books={books}
              feed={feed}
              onOpenAuth={() => setAuthModalVisible(true)}
              onLogout={handleLogout}
              onSelectBook={setSelectedBook}
              onUpdateGoal={handleUpdateGoal}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onLikePost={handleLikePost}
              onOpenComments={handleOpenComments}
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
            onPress={() => setActiveTab('notifications')}
          >
            <View style={styles.iconWithBadge}>
              <Icon
                name="bell"
                size={20}
                color={activeTab === 'notifications' ? '#00635D' : '#767676'}
              />
              {notifications.filter(n => !n.read).length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {notifications.filter(n => !n.read).length > 9
                      ? '9+'
                      : notifications.filter(n => !n.read).length}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'notifications' && styles.activeTabLabel,
              ]}
            >
              Inbox
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

        {/* Goodreads AI Reading Assistant Chatbot Modal */}
        <AIChatModal
          visible={aiChatVisible}
          onClose={() => setAiChatVisible(false)}
          posts={feed}
        />

        {/* Edit Review Modal (Checklist Item 5 & 6) */}
        <EditReviewModal
          visible={Boolean(editingPost)}
          activity={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSaveEdit}
        />

        {/* Comments Modal */}
        <CommentsModal
          visible={Boolean(commentPostId)}
          postId={commentPostId || ''}
          postTitle={commentPostTitle}
          onClose={() => { setCommentPostId(null); setCommentPostTitle(''); }}
          user={user}
        />

        {/* Book Details Modal */}
        <BookDetailModal
          book={selectedBook}
          visible={Boolean(selectedBook)}
          onClose={() => setSelectedBook(null)}
          onUpdateShelf={handleShelfChange}
          user={user}
          onOpenAuth={() => setAuthModalVisible(true)}
          onPostCreated={handlePostCreated}
          feed={feed}
          onLikePost={handleLikePost}
          onOpenComments={handleOpenComments}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
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
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#C0392B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default App;
