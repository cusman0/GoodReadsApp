import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AppNotification, UserProfile } from '../types';
import { Icon } from '../components/Icon';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  user: UserProfile | null;
  onOpenAuth: () => void;
  onNotificationPress: (notification: AppNotification) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  user,
  onOpenAuth,
  onNotificationPress,
  onMarkAllAsRead,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconCircle}>
          <Icon name="bell" size={32} color="#00635D" />
        </View>
        <Text style={styles.guestTitle}>Notifications</Text>
        <Text style={styles.guestSubtitle}>
          Sign in to receive real-time alerts whenever fellow readers like or comment on your book reviews and reading activities.
        </Text>
        <TouchableOpacity style={styles.signInBtn} onPress={onOpenAuth} activeOpacity={0.8}>
          <Text style={styles.signInBtnText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: AppNotification }) => {
    const isLike = item.type === 'like';

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => onNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Sender Avatar */}
        <View style={styles.avatarContainer}>
          {item.senderAvatar ? (
            <Image source={{ uri: item.senderAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {item.senderName ? item.senderName.charAt(0).toUpperCase() : 'R'}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.typeBadge,
              isLike ? styles.typeBadgeLike : styles.typeBadgeComment,
            ]}
          >
            <Icon
              name={isLike ? 'heart' : 'comment'}
              size={10}
              color={isLike ? '#C0392B' : '#00635D'}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentCol}>
          <Text style={styles.notifText}>
            <Text style={styles.senderName}>{item.senderName} </Text>
            {isLike ? 'liked your review of ' : 'commented on your review of '}
            <Text style={styles.bookTitle}>"{item.bookTitle}"</Text>
          </Text>

          {Boolean(item.commentText) && (
            <View style={styles.commentPreviewBox}>
              <Text style={styles.commentPreviewText} numberOfLines={2}>
                "{item.commentText}"
              </Text>
            </View>
          )}

          <Text style={styles.timestampText}>{item.createdAt}</Text>
        </View>

        {/* Book cover thumbnail & unread dot */}
        <View style={styles.rightCol}>
          {Boolean(item.bookCoverUrl) && (
            <Image source={{ uri: item.bookCoverUrl }} style={styles.bookThumb} />
          )}
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={onMarkAllAsRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markReadBtnText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List / Empty State */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="bell" size={32} color="#8D8070" />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            When someone likes or comments on your reviews, your live notifications will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DED5',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#382110',
    fontFamily: 'serif',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#767676',
    marginTop: 2,
  },
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F3F1',
    borderRadius: 14,
  },
  markReadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00635D',
  },
  listContent: {
    paddingVertical: 8,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  notifCardUnread: {
    backgroundColor: '#F7FBF9',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    backgroundColor: '#00635D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DED5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeLike: {
    backgroundColor: '#FDEDEC',
    borderColor: '#F5B7B1',
  },
  typeBadgeComment: {
    backgroundColor: '#E8F3F1',
    borderColor: '#A2D9D2',
  },
  contentCol: {
    flex: 1,
    marginRight: 10,
  },
  notifText: {
    fontSize: 13,
    color: '#382110',
    lineHeight: 18,
  },
  senderName: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bookTitle: {
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#00635D',
  },
  commentPreviewBox: {
    marginTop: 6,
    backgroundColor: '#F4F1EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#00635D',
  },
  commentPreviewText: {
    fontSize: 12,
    color: '#555555',
    fontStyle: 'italic',
  },
  timestampText: {
    fontSize: 11,
    color: '#8D8070',
    marginTop: 6,
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookThumb: {
    width: 32,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#E2DED5',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00635D',
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#382110',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#767676',
    textAlign: 'center',
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F4F1EA',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2F0ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#382110',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#767676',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  signInBtn: {
    backgroundColor: '#00635D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
