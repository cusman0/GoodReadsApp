/**
 * Icon component - renders clean, styled icons to replace emoji characters.
 * Uses Unicode symbols + styling for a realistic, polished look.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IconProps {
  name:
    | 'home'
    | 'books'
    | 'search'
    | 'profile'
    | 'star'
    | 'star-half'
    | 'star-empty'
    | 'heart'
    | 'comment'
    | 'close'
    | 'check'
    | 'check-double'
    | 'book-open'
    | 'arrow-right'
    | 'amazon'
    | 'apple'
    | 'bell';
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, color }) => {
  switch (name) {
    case 'home':
      return <HomeIcon size={size} color={color ?? '#555'} />;
    case 'books':
      return <BooksIcon size={size} color={color ?? '#555'} />;
    case 'search':
      return <SearchIcon size={size} color={color ?? '#555'} />;
    case 'profile':
      return <ProfileIcon size={size} color={color ?? '#555'} />;
    case 'star':
      return <StarIcon size={size} color={color ?? '#ED9220'} filled />;
    case 'star-half':
      return <StarIcon size={size} color={color ?? '#ED9220'} half />;
    case 'star-empty':
      return <StarIcon size={size} color={color ?? '#CCCCCC'} />;
    case 'heart':
      return <HeartIcon size={size} color={color ?? '#C0392B'} />;
    case 'comment':
      return <CommentIcon size={size} color={color ?? '#555'} />;
    case 'close':
      return <CloseIcon size={size} color={color ?? '#555'} />;
    case 'check':
      return <CheckIcon size={size} color={color ?? '#409D69'} />;
    case 'check-double':
      return <CheckDoubleIcon size={size} color={color ?? '#409D69'} />;
    case 'book-open':
      return <BookOpenIcon size={size} color={color ?? '#00635D'} />;
    case 'arrow-right':
      return <ArrowRightIcon size={size} color={color ?? '#555'} />;
    case 'amazon':
      return <AmazonIcon size={size} />;
    case 'apple':
      return <AppleIcon size={size} />;
    case 'bell':
      return <BellIcon size={size} color={color ?? '#555'} />;
    default:
      return null;
  }
};

/* ─── Individual icon implementations ──────────────────────────────────────── */

const HomeIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Roof */}
    <View
      style={{
        width: size * 0.78,
        height: size * 0.42,
        borderLeftWidth: size * 0.39,
        borderRightWidth: size * 0.39,
        borderBottomWidth: size * 0.42,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
        position: 'absolute',
        top: 0,
      }}
    />
    {/* Body */}
    <View
      style={{
        width: size * 0.56,
        height: size * 0.46,
        backgroundColor: color,
        position: 'absolute',
        bottom: 0,
        borderRadius: 1,
      }}
    />
    {/* Door */}
    <View
      style={{
        width: size * 0.22,
        height: size * 0.28,
        backgroundColor: 'white',
        position: 'absolute',
        bottom: 0,
        borderRadius: 1,
        opacity: 0.8,
      }}
    />
  </View>
);

const BooksIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 }}>
    {[0.18, 0.24, 0.18].map((w, i) => (
      <View
        key={i}
        style={{
          width: size * w,
          height: size * 0.75,
          backgroundColor: i === 1 ? color : color + 'AA',
          borderRadius: 2,
          borderWidth: 0.5,
          borderColor: color + '55',
        }}
      />
    ))}
  </View>
);

const SearchIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Circle */}
    <View
      style={{
        width: size * 0.62,
        height: size * 0.62,
        borderRadius: size * 0.31,
        borderWidth: size * 0.1,
        borderColor: color,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
    {/* Handle */}
    <View
      style={{
        width: size * 0.12,
        height: size * 0.36,
        backgroundColor: color,
        borderRadius: size * 0.06,
        position: 'absolute',
        bottom: 0,
        right: size * 0.04,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

const ProfileIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
    {/* Head */}
    <View
      style={{
        width: size * 0.44,
        height: size * 0.44,
        borderRadius: size * 0.22,
        backgroundColor: color,
        position: 'absolute',
        top: size * 0.02,
      }}
    />
    {/* Shoulders */}
    <View
      style={{
        width: size * 0.78,
        height: size * 0.38,
        borderRadius: size * 0.2,
        backgroundColor: color,
        position: 'absolute',
        bottom: 0,
        opacity: 0.85,
      }}
    />
  </View>
);

const StarIcon = ({
  size,
  color,
  filled,
  half,
}: {
  size: number;
  color: string;
  filled?: boolean;
  half?: boolean;
}) => (
  <Text
    style={{
      fontSize: size,
      color: filled || half ? color : '#CCCCCC',
      lineHeight: size * 1.1,
    }}
  >
    {half ? '⯨' : '★'}
  </Text>
);

const HeartIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ flexDirection: 'row', position: 'absolute', top: size * 0.05 }}>
      <View
        style={{
          width: size * 0.45,
          height: size * 0.45,
          borderRadius: size * 0.225,
          backgroundColor: color,
          marginRight: -size * 0.08,
        }}
      />
      <View
        style={{
          width: size * 0.45,
          height: size * 0.45,
          borderRadius: size * 0.225,
          backgroundColor: color,
          marginLeft: -size * 0.08,
        }}
      />
    </View>
    {/* Bottom triangle */}
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.42,
        borderRightWidth: size * 0.42,
        borderTopWidth: size * 0.5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
        position: 'absolute',
        bottom: size * 0.0,
      }}
    />
  </View>
);

const CommentIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size * 0.88,
        height: size * 0.68,
        backgroundColor: color,
        borderRadius: size * 0.14,
        position: 'absolute',
        top: 0,
      }}
    />
    {/* Tail */}
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.14,
        borderRightWidth: size * 0.02,
        borderTopWidth: size * 0.22,
        borderLeftColor: color,
        borderRightColor: 'transparent',
        borderTopColor: 'transparent',
        position: 'absolute',
        bottom: size * 0.04,
        left: size * 0.14,
      }}
    />
  </View>
);

const CloseIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size * 0.8,
        height: size * 0.12,
        backgroundColor: color,
        borderRadius: size * 0.06,
        position: 'absolute',
        transform: [{ rotate: '45deg' }],
      }}
    />
    <View
      style={{
        width: size * 0.8,
        height: size * 0.12,
        backgroundColor: color,
        borderRadius: size * 0.06,
        position: 'absolute',
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

const CheckIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>✓</Text>
);

const CheckDoubleIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size * 0.75, color, lineHeight: size, letterSpacing: -2 }}>✓✓</Text>
);

const BookOpenIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Left page */}
    <View
      style={{
        width: size * 0.42,
        height: size * 0.7,
        backgroundColor: color + 'AA',
        borderRadius: 2,
        position: 'absolute',
        left: 0,
        borderWidth: 0.5,
        borderColor: color,
      }}
    />
    {/* Right page */}
    <View
      style={{
        width: size * 0.42,
        height: size * 0.7,
        backgroundColor: color + 'CC',
        borderRadius: 2,
        position: 'absolute',
        right: 0,
        borderWidth: 0.5,
        borderColor: color,
      }}
    />
    {/* Spine */}
    <View
      style={{
        width: size * 0.08,
        height: size * 0.76,
        backgroundColor: color,
        position: 'absolute',
      }}
    />
  </View>
);

const ArrowRightIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size * 0.8, color, lineHeight: size }}>›</Text>
);

const AmazonIcon = ({ size }: { size: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.12,
      backgroundColor: '#FF9900',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ fontSize: size * 0.55, color: '#fff', fontWeight: '900', lineHeight: size * 0.7 }}>
      a
    </Text>
  </View>
);

const AppleIcon = ({ size }: { size: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.12,
      backgroundColor: '#1C1C1E',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ fontSize: size * 0.65, color: '#fff', lineHeight: size * 0.75 }}>
    </Text>
  </View>
);

const BellIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>🔔</Text>
);

const styles = StyleSheet.create({});

