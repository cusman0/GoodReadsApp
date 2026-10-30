import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { FeedActivity } from '../types';
import { StarRating } from './StarRating';
import { Icon } from './Icon';
import { assistReviewWriting } from '../services/aiService';

interface EditReviewModalProps {
  visible: boolean;
  activity: FeedActivity | null;
  onClose: () => void;
  onSave: (postId: string, updatedText: string, updatedRating?: number) => Promise<void>;
}

export const EditReviewModal: React.FC<EditReviewModalProps> = ({
  visible,
  activity,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (activity) {
      setText(activity.reviewText || '');
      setRating(activity.rating || 5);
    }
  }, [activity?.id]);

  if (!activity) return null;

  const handleAIHelper = async (mode: 'improve' | 'shorten' | 'translate') => {
    if (!text.trim()) {
      Alert.alert('Empty Review', 'Please write some review text first to use AI assistance.');
      return;
    }
    setAiLoading(true);
    try {
      const suggestion = await assistReviewWriting(text, mode);
      setText(suggestion);
    } catch (err: any) {
      Alert.alert('AI Helper Notice', err.message || 'Could not polish review.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Review Required', 'Please enter your review text before saving.');
      return;
    }
    setSaving(true);
    try {
      await onSave(activity.id, text.trim(), rating);
      onClose();
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Could not update review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit Your Review</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.content}>
            {/* Book Info */}
            <View style={styles.bookSnippet}>
              {activity.book?.coverUrl ? (
                <Image source={{ uri: activity.book.coverUrl }} style={styles.cover} />
              ) : null}
              <View style={styles.bookMeta}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {activity.book?.title || 'Book Review'}
                </Text>
                <Text style={styles.bookAuthor}>
                  by {activity.book?.author || 'Author'}
                </Text>
              </View>
            </View>

            {/* Rating Selector */}
            <View style={styles.ratingSection}>
              <Text style={styles.label}>Your Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starTouch}
                  >
                    <Icon
                      name="star"
                      size={28}
                      color={star <= rating ? '#ED9220' : '#D5D2C9'}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.ratingNumberText}>{rating} of 5 stars</Text>
              </View>
            </View>

            {/* AI Writing Helper Bar */}
            <View style={styles.aiHelperBar}>
              <View style={styles.aiHelperBadge}>
                <Text style={styles.aiHelperBadgeText}>✦ AI HELPER</Text>
              </View>
              <TouchableOpacity
                style={styles.aiChip}
                onPress={() => handleAIHelper('improve')}
                disabled={aiLoading}
              >
                <Text style={styles.aiChipText}>✦ Polish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.aiChip}
                onPress={() => handleAIHelper('shorten')}
                disabled={aiLoading}
              >
                <Text style={styles.aiChipText}>✦ Shorten</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.aiChip}
                onPress={() => handleAIHelper('translate')}
                disabled={aiLoading}
              >
                <Text style={styles.aiChipText}>✦ Filipino</Text>
              </TouchableOpacity>
              {aiLoading && <ActivityIndicator size="small" color="#00635D" style={{ marginLeft: 6 }} />}
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={6}
              value={text}
              onChangeText={setText}
              placeholder="What did you think of this book? Share your thoughts..."
              placeholderTextColor="#888"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7DE',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#382110',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '700',
  },
  body: {
    maxHeight: 460,
  },
  content: {
    padding: 16,
  },
  bookSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8F6F0',
    padding: 10,
    borderRadius: 8,
  },
  cover: {
    width: 44,
    height: 64,
    borderRadius: 4,
    marginRight: 12,
  },
  bookMeta: {
    flex: 1,
  },
  bookTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 15,
    fontWeight: '700',
    color: '#382110',
  },
  bookAuthor: {
    fontSize: 12,
    color: '#767676',
    marginTop: 2,
  },
  ratingSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#767676',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starTouch: {
    padding: 2,
  },
  ratingNumberText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  aiHelperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  aiHelperBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  aiHelperBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  aiChip: {
    backgroundColor: '#F0EFEA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD9CF',
  },
  aiChipText: {
    fontSize: 11,
    color: '#00635D',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAF8',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EBE7DE',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#00635D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

