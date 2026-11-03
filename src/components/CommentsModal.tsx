import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { Comment, UserProfile } from '../types';
import { subscribeToComments, addComment, deleteComment } from '../firebase';

interface CommentsModalProps {
  visible: boolean;
  postId: string;
  postTitle: string;
  postOwnerId?: string;
  onClose: () => void;
  user: UserProfile | null;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  postId,
  postTitle,
  postOwnerId,
  onClose,
  user,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!visible || !postId) {
      return;
    }
    setLoading(true);
    setComments([]);
    const unsub = subscribeToComments(postId, (incoming: Comment[]) => {
      setComments(incoming);
      setLoading(false);
    });
    unsubscribeRef.current = unsub;
    return () => {
      unsub();
      unsubscribeRef.current = null;
    };
  }, [visible, postId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await addComment(postId, text);
      setInputText('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (comment: Comment) => {
    Alert.alert('Delete Comment', 'Remove this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(postId, comment.id);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not delete comment.');
          }
        },
      },
    ]);
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isOwn = user && (item.userId === user.id || item.authorId === user.id);
    const canDelete = isOwn || (user && postOwnerId && user.id === postOwnerId);
    const authorDisplayName = item.authorName || 'Reader';
    return (
      <View style={styles.commentRow}>
        {item.authorPhotoUrl ? (
          <Image source={{ uri: item.authorPhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>
              {authorDisplayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.commentBubble}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{authorDisplayName}</Text>
            {canDelete && (
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
          <Text style={styles.commentTime}>{item.createdAt}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Comments</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {postTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Comment list */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00635D" />
              <Text style={styles.loadingText}>Loading comments…</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to comment on this review!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              renderItem={renderComment}
              contentContainerStyle={styles.commentList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input bar */}
          {user ? (
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment…"
                placeholderTextColor="#9A8F85"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!inputText.trim() || submitting) && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendBtnText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.signInBar}>
              <Text style={styles.signInText}>
                Sign in to join the conversation
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(56,33,16,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FDFAF6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: 300,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D5CEC6',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D6',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#382110',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#767676',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#767676',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#767676',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#382110',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#767676',
    textAlign: 'center',
  },
  commentList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    backgroundColor: '#00635D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#F0EBE3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#382110',
  },
  deleteBtn: {
    fontSize: 12,
    color: '#C0392B',
    fontWeight: '700',
  },
  commentText: {
    fontSize: 13,
    color: '#382110',
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    color: '#9A8F85',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D6',
    backgroundColor: '#FDFAF6',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0EBE3',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#382110',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#00635D',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  signInBar: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D6',
  },
  signInText: {
    fontSize: 13,
    color: '#767676',
    fontStyle: 'italic',
  },
});

