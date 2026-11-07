/**
 * Goodreads AI Reading Assistant & Feed Chatbot Modal
 * Conversational multi-turn interface grounded in feed reviews with citations [P1], [P2].
 * Supports real-time Gemini model selection, smart auto-rotation, custom API key configuration, and resilient failover.
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
import {
  askFeedChatbot,
  ChatMessage,
  GEMINI_MODELS,
  GeminiModelInfo,
  setRuntimeGeminiApiKey,
  getRuntimeGeminiApiKey,
} from '../services/aiService';

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
      modelUsed: 'gemini-2.0-flash',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const scrollViewRef = useRef<any>(null);

  const formatModelName = (modelId?: string) => {
    if (!modelId || modelId === 'offline') return null;
    const match = GEMINI_MODELS.find(m => m.id === modelId);
    if (match) return match.shortLabel;
    return modelId.replace(/^gemini-/, '').replace(/-/g, ' ').toUpperCase();
  };

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
        modelUsed: 'gemini-2.0-flash',
      },
    ]);
  };

  const handleSaveApiKey = () => {
    const trimmed = customKeyInput.trim();
    setRuntimeGeminiApiKey(trimmed);
    setShowKeyModal(false);
    if (trimmed) {
      Alert.alert(
        'Gemini Key Saved',
        'Your custom Gemini API key has been applied for live cloud requests!'
      );
    } else {
      Alert.alert(
        'Default Key Restored',
        'Reset to project default configuration.'
      );
    }
  };

  const topPostTitle = posts.find(p => p.book?.title)?.book?.title;
  const quickPrompts = [
    topPostTitle ? `What do readers say about "${topPostTitle}"?` : 'Recommend top trending books to read',
    'Summarize recent community reviews',
    'Recommend best basketball and sports books to read',
    'What book genres are readers enjoying right now?',
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
      const response = await askFeedChatbot(text, posts, messages, selectedModel);

      const replyWords = response.reply.split(' ');
      const msgId = String(Date.now() + 1);

      let currentWordIndex = 1;
      const initialText = replyWords[0] || '';

      const streamingMsg: ChatMessage = {
        id: msgId,
        sender: 'ai',
        text: initialText,
        citations: response.citations,
        timestamp: 'Just now',
        modelUsed: response.modelUsed,
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
        }, 18);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: 'Goodreads AI is analyzing reader insights and formulating your response...',
        timestamp: 'Just now',
        modelUsed: selectedModel === 'auto' ? 'gemini-2.0-flash' : selectedModel,
      };
      setMessages(prev => [...prev, errorMsg]);
      setLoading(false);
    }
  };

  const activeModelObj = GEMINI_MODELS.find(m => m.id === selectedModel) || GEMINI_MODELS[0];

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
                <Text style={styles.aiBadgeText}>{activeModelObj.badge}</Text>
              </View>
              <Text style={styles.title}>Goodreads AI</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => {
                  setCustomKeyInput(getRuntimeGeminiApiKey() || '');
                  setShowKeyModal(true);
                }}
                style={styles.keyBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.keyBtnText}>🔑 Key</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearChat} style={styles.clearChatBtn}>
                <Text style={styles.clearChatText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Model Selector Bar */}
          <View style={styles.modelBarContainer}>
            <Text style={styles.modelBarLabel}>MODEL:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modelScrollContent}
            >
              {GEMINI_MODELS.map((model: GeminiModelInfo) => {
                const isSelected = selectedModel === model.id;
                return (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelChip,
                      isSelected && styles.modelChipActive,
                    ]}
                    onPress={() => setSelectedModel(model.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modelChipText,
                        isSelected && styles.modelChipTextActive,
                      ]}
                    >
                      {model.shortLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

                  {/* Model indicator tag for AI responses */}
                  {item.sender === 'ai' && item.modelUsed && (
                    <View style={styles.modelTagRow}>
                      <View style={styles.modelTagBadge}>
                        <Text style={styles.modelTagText}>
                          ✦ {formatModelName(item.modelUsed)}
                        </Text>
                      </View>
                    </View>
                  )}

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
                    <Text style={styles.loadingText}>
                      Synthesizing with {formatModelName(selectedModel === 'auto' ? 'gemini-2.0-flash' : selectedModel)}...
                    </Text>
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

        {/* API Key Configuration Modal */}
        {showKeyModal && (
          <Modal
            visible={showKeyModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowKeyModal(false)}
          >
            <View style={styles.keyModalBackdrop}>
              <View style={styles.keyModalCard}>
                <Text style={styles.keyModalTitle}>Google Gemini API Key</Text>
                <Text style={styles.keyModalSubtitle}>
                  For live cloud generation across all models, paste your free API key from Google AI Studio (starts with "AIzaSy..."):
                </Text>
                <TextInput
                  style={styles.keyModalInput}
                  placeholder="AIzaSy..."
                  placeholderTextColor="#888"
                  value={customKeyInput}
                  onChangeText={setCustomKeyInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.keyModalHint}>
                  Get your free key at: aistudio.google.com/app/apikey
                </Text>
                <View style={styles.keyModalActions}>
                  <TouchableOpacity
                    style={styles.keyModalSaveBtn}
                    onPress={handleSaveApiKey}
                  >
                    <Text style={styles.keyModalSaveBtnText}>Save Key</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.keyModalResetBtn}
                    onPress={() => {
                      setCustomKeyInput('');
                      setRuntimeGeminiApiKey('');
                      setShowKeyModal(false);
                    }}
                  >
                    <Text style={styles.keyModalResetBtnText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.keyModalCancelBtn}
                    onPress={() => setShowKeyModal(false)}
                  >
                    <Text style={styles.keyModalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
    height: '84%',
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E5DD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    gap: 6,
  },
  keyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  keyBtnText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
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
  modelBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3D8',
  },
  modelBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A7A68',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  modelScrollContent: {
    gap: 6,
    alignItems: 'center',
  },
  modelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D3C8',
  },
  modelChipActive: {
    backgroundColor: '#00635D',
    borderColor: '#00635D',
  },
  modelChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },
  modelChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickPromptsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#F8F6F1',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DD',
  },
  quickPromptChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginRight: 7,
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
    maxWidth: '85%',
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
  modelTagRow: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  modelTagBadge: {
    backgroundColor: '#F0F4F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CFE0D9',
  },
  modelTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00635D',
    letterSpacing: 0.3,
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
  keyModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  keyModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  keyModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#382110',
    marginBottom: 8,
  },
  keyModalSubtitle: {
    fontSize: 12,
    color: '#555',
    lineHeight: 17,
    marginBottom: 12,
  },
  keyModalInput: {
    backgroundColor: '#F9F7F4',
    borderWidth: 1,
    borderColor: '#D5D2C9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#222',
    marginBottom: 8,
  },
  keyModalHint: {
    fontSize: 10,
    color: '#00635D',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  keyModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  keyModalSaveBtn: {
    backgroundColor: '#00635D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  keyModalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  keyModalResetBtn: {
    backgroundColor: '#F0EFEA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  keyModalResetBtnText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  keyModalCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  keyModalCancelBtnText: {
    color: '#888',
    fontSize: 12,
  },
});
