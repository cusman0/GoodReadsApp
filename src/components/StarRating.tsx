import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showText?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 14,
  interactive = false,
  onRate,
  showText = false,
}) => {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFull = rating >= i;
    const isHalf = !isFull && rating >= i - 0.5;

    const starElement = (
      <Text
        key={i}
        style={[
          styles.star,
          {
            fontSize: size,
            color: isFull || isHalf ? '#ED9220' : '#CCCCCC',
          },
        ]}
      >
        ★
      </Text>
    );

    if (interactive && onRate) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => onRate(i)}
          activeOpacity={0.7}
          style={styles.touchableStar}
        >
          {starElement}
        </TouchableOpacity>
      );
    } else {
      stars.push(starElement);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>{stars}</View>
      {showText && <Text style={styles.ratingText}>{rating.toFixed(2)}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchableStar: {
    paddingHorizontal: 2,
  },
  star: {
    lineHeight: 16,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
  },
});

