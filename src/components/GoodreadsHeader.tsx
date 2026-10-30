import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { UserProfile } from '../types';
import { Icon } from './Icon';

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenAIChat?: () => void;
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'MS';
}

export const GoodreadsHeader: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenSearch,
  onOpenProfile,
  onOpenAIChat,
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user?.avatar]);
  return (
    <View style={styles.header}>
      <View style={styles.leftRow}>
        <Text style={styles.logoText}>goodreads</Text>
      </View>

      <View style={styles.rightRow}>
        {/* Dedicated Goodreads AI Assistant Button */}
        <TouchableOpacity
          style={styles.aiHeaderBtn}
          onPress={onOpenAIChat}
          activeOpacity={0.8}
          accessibilityLabel="Ask Goodreads AI"
        >
          <Text style={styles.aiHeaderSparkle}>✦</Text>
          <Text style={styles.aiHeaderBtnText}>Ask AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenSearch}
          accessibilityLabel="Search books"
        >
          <Icon name="search" size={16} color="#555" />
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onOpenProfile}
            accessibilityLabel="Open profile"
          >
            {user.avatar && !imageError ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.headerAvatar}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {getInitials(user.name, user.email)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={onOpenAuth}
            activeOpacity={0.8}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: '#F4F1EA',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DED5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    color: '#382110',
    letterSpacing: -0.5,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  aiHeaderSparkle: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '800',
  },
  aiHeaderBtnText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#00635D',
    overflow: 'hidden',
    backgroundColor: '#3B82F6',
  },
  headerAvatar: {
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
    fontWeight: '700',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#37745B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
