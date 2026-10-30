const fs = require('fs');

// 1. Update aiService.ts candidate models
let aiCode = fs.readFileSync('src/services/aiService.ts', 'utf8').replace(/\r\n/g, '\n');

aiCode = aiCode.replace(
  `const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.8-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

// In-memory cache for the validated working model (default to gemini-3.8-flash for instant response)
let activeModel: string | null = 'gemini-3.8-flash';`,
  `const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

// In-memory cache for the validated working model
let activeModel: string | null = 'gemini-1.5-flash';`
);

fs.writeFileSync('src/services/aiService.ts', aiCode.replace(/\n/g, '\r\n'), 'utf8');
console.log('aiService.ts updated successfully');

// 2. Update AIChatModal.tsx
let modalCode = fs.readFileSync('src/components/AIChatModal.tsx', 'utf8').replace(/\r\n/g, '\n');

if (!modalCode.includes('handleCitationPress')) {
  modalCode = modalCode.replace(
    '  ActivityIndicator,\n} from \'react-native\';',
    '  ActivityIndicator,\n  Alert,\n} from \'react-native\';'
  );

  const citationHandler = `
  const handleCitationPress = (cite: string) => {
    const num = parseInt(cite.replace(/\\D/g, ''), 10);
    const postIndex = isNaN(num) ? 0 : num - 1;
    const post = posts[postIndex];
    if (post) {
      const bookTitle = post.bookTitle || post.book?.title || 'Community Book';
      const author = post.bookAuthor || post.book?.author || 'Author';
      const reviewer = post.authorName || post.userName || 'Community Reader';
      const text = post.text || post.reviewText || 'Verified review from community feed.';
      const rating = post.rating || 5;
      Alert.alert(
        \`Citation \${cite}: "\${bookTitle}"\`,
        \`Author: \${author}\\nReviewer: \${reviewer} (\${rating}★)\\n\\n"\${text}"\`,
        [{ text: 'Close', style: 'cancel' }]
      );
    } else {
      Alert.alert('Citation Source', \`Referencing community review \${cite} from your active updates feed.\`);
    }
  };
`;

  modalCode = modalCode.replace(
    '  const handleClearChat = () => {',
    citationHandler + '\n  const handleClearChat = () => {'
  );

  // Replace citation view with TouchableOpacity
  modalCode = modalCode.replace(
    `                      {item.citations.map((cite, cIdx) => (
                        <View key={cIdx} style={styles.citationBadge}>
                          <Text style={styles.citationBadgeText}>{cite}</Text>
                        </View>
                      ))}`,
    `                      {item.citations.map((cite, cIdx) => (
                        <TouchableOpacity
                          key={cIdx}
                          style={styles.citationBadge}
                          onPress={() => handleCitationPress(cite)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.citationBadgeText}>{cite} ↗</Text>
                        </TouchableOpacity>
                      ))}`
  );

  // Friendly error message matching Item 13
  modalCode = modalCode.replace(
    "text: 'I could not process that request right now. Please try again.',",
    "text: 'Goodreads AI is temporarily experiencing high reader demand or network traffic. Please wait a moment and try asking again.',"
  );

  fs.writeFileSync('src/components/AIChatModal.tsx', modalCode.replace(/\n/g, '\r\n'), 'utf8');
  console.log('AIChatModal.tsx updated successfully');
}

