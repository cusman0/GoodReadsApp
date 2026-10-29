import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { UserProfile } from '../types';
import { Icon } from './Icon';

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
}

export const GoodreadsHeader: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenSearch,
  onOpenProfile,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftRow}>
        <Text style={styles.logoText}>goodreads</Text>
      </View>

      <View style={styles.rightRow}>
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
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
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
  iconText: {
    fontSize: 14,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#00635D',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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

