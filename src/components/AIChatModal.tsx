/**
 * Goodreads AI Reading Assistant & Feed Chatbot Modal
 * Conversational multi-turn interface grounded in feed reviews with citations [P1], [P2].
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { askFeedChatbot, ChatMessage } from '../services/aiService';

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
  posts: any[];
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  visible,
  onClose,
  posts,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your Goodreads AI Reading Assistant. Ask me anything about books, authors, recommendations, or reviews in your community feed!',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<any>(null);


  const handleCitationPress = (cite: string) => {
    const num = parseInt(cite.replace(/\D/g, ''), 10);
    const postIndex = isNaN(num) ? 0 : num - 1;
    const post = posts[postIndex];
    if (post) {
      const bookTitle = post.bookTitle || post.book?.title || 'Community Book';
      const author = post.bookAuthor || post.book?.author || 'Author';
      const reviewer = post.authorName || post.userName || 'Community Reader';
      const text = post.text || post.reviewText || 'Verified review from community feed.';
      const rating = post.rating || 5;
      Alert.alert(
        `Citation ${cite}: "${bookTitle}"`,
        `Author: ${author}\nReviewer: ${reviewer} (${rating}★)\n\n"${text}"`,
        [{ text: 'Close', style: 'cancel' }]
      );
    } else {
      Alert.alert('Citation Source', `Referencing community review ${cite} from your active updates feed.`);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Hello! I am your Goodreads AI Reading Assistant. Ask me anything about books, authors, recommendations, or reviews in your community feed!',
        timestamp: 'Just now',
      },
    ]);
  };

  const quickPrompts = [
    'What do readers love about Project Hail Mary?',
    'Summarize recent book reviews',
    'Which book has the best character arcs?',
  ];

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [visible, messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await askFeedChatbot(text, posts, messages);

      const replyWords = response.reply.split(' ');
      const msgId = String(Date.now() + 1);

      // Start word-by-word streaming animation
      let currentWordIndex = 1;
      const initialText = replyWords[0] || '';

      const streamingMsg: ChatMessage = {
        id: msgId,
        sender: 'ai',
        text: initialText,
        citations: response.citations,
        timestamp: 'Just now',
      };

      setMessages(prev => [...prev, streamingMsg]);
      setLoading(false);

      if (replyWords.length > 1) {
        const streamInterval = setInterval(() => {
          if (currentWordIndex >= replyWords.length) {
            clearInterval(streamInterval);
            return;
          }
          currentWordIndex++;
          const progressiveText = replyWords.slice(0, currentWordIndex).join(' ');
          setMessages(prev =>
            prev.map(m => (m.id === msgId ? { ...m, text: progressiveText } : m))
          );
        }, 22);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: 'Goodreads AI is temporarily experiencing high reader demand or network traffic. Please wait a moment and try asking again.',
        timestamp: 'Just now',
      };
      setMessages(prev => [...prev, errorMsg]);
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>✦ GEMINI</Text>
              </View>
              <Text style={styles.title}>Goodreads AI Assistant</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleClearChat} style={styles.clearChatBtn}>
                <Text style={styles.clearChatText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Prompts Bar */}
          <View style={styles.quickPromptsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickPrompts.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickPromptChip}
                  onPress={() => handleSend(prompt)}
                  disabled={loading}
                >
                  <Text style={styles.quickPromptText}>✦ {prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map(item => (
              <View
                key={item.id}
                style={[
                  styles.messageRow,
                  item.sender === 'user' ? styles.userRow : styles.aiRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    item.sender === 'user'
                      ? styles.userBubble
                      : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      item.sender === 'user'
                        ? styles.userText
                        : styles.aiText,
                    ]}
                  >
                    {item.text}
                  </Text>

                  {/* Citations Pill list */}
                  {item.citations && item.citations.length > 0 && (
                    <View style={styles.citationsRow}>
                      <Text style={styles.citationsLabel}>Sources:</Text>
                      {item.citations.map((cite, cIdx) => (
                        <TouchableOpacity
                          key={cIdx}
                          style={styles.citationBadge}
                          onPress={() => handleCitationPress(cite)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.citationBadgeText}>{cite} ↗</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}

            {loading && (
              <View style={[styles.messageRow, styles.aiRow]}>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#00635D" />
                    <Text style={styles.loadingText}>Reading community reviews...</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Box */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask about books, themes, or reviews..."
              placeholderTextColor="#888888"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || loading) && styles.sendBtnDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F9F7F4',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '82%',
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E5DD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DB',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    fontWeight: '700',
    color: '#382110',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearChatBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EAE5DB',
  },
  clearChatText: {
    fontSize: 11,
    color: '#767676',
    fontWeight: '600',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAE5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
  },
  quickPromptsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F4F1EA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DD',
  },
  quickPromptChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickPromptText: {
    fontSize: 11,
    color: '#00635D',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: 12,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#00635D',
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DD',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#333333',
  },
  citationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  citationsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#767676',
  },
  citationBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  citationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#EAE5DB',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5D2C9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00635D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
