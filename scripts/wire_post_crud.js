const fs = require('fs');

// 1. Update App.tsx
let appCode = fs.readFileSync('App.tsx', 'utf8').replace(/\r\n/g, '\n');

if (!appCode.includes('EditReviewModal')) {
  appCode = appCode.replace(
    "import { BookDetailModal } from './src/components/BookDetailModal';",
    "import { BookDetailModal } from './src/components/BookDetailModal';\nimport { EditReviewModal } from './src/components/EditReviewModal';"
  );
  appCode = appCode.replace(
    "  updateUserReadingProgress,\n} from './src/firebase';",
    "  updateUserReadingProgress,\n  updateReviewPost,\n  deleteReviewPost,\n} from './src/firebase';"
  );
  appCode = appCode.replace(
    "  const [aiChatVisible, setAiChatVisible] = useState(false);",
    "  const [aiChatVisible, setAiChatVisible] = useState(false);\n  const [editingPost, setEditingPost] = useState<FeedActivity | null>(null);"
  );

  const crudHandlers = `
  const handleEditPost = (activity: FeedActivity) => {
    setEditingPost(activity);
  };

  const handleSaveEdit = async (
    postId: string,
    updatedText: string,
    updatedRating?: number
  ) => {
    await updateReviewPost(postId, updatedText, updatedRating);
    setFeed(prev =>
      prev.map(f =>
        f.id === postId
          ? {
              ...f,
              reviewText: updatedText,
              rating: updatedRating !== undefined ? updatedRating : f.rating,
            }
          : f
      )
    );
    Alert.alert('Success', 'Your review has been updated!');
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to permanently delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReviewPost(postId);
              setFeed(prev => prev.filter(f => f.id !== postId));
              Alert.alert('Deleted', 'Your review has been removed.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete review.');
            }
          },
        },
      ]
    );
  };
`;
  appCode = appCode.replace(
    "  const handleLoginSuccess = (newUser: UserProfile) => {",
    crudHandlers + "\n  const handleLoginSuccess = (newUser: UserProfile) => {"
  );

  appCode = appCode.replace(
    "              onOpenAuth={() => setAuthModalVisible(true)}\n            />\n          )}",
    "              onOpenAuth={() => setAuthModalVisible(true)}\n              onEditPost={handleEditPost}\n              onDeletePost={handleDeletePost}\n            />\n          )}"
  );

  appCode = appCode.replace(
    "              onUpdateGoal={handleUpdateGoal}\n            />\n          )}",
    "              onUpdateGoal={handleUpdateGoal}\n              onEditPost={handleEditPost}\n              onDeletePost={handleDeletePost}\n            />\n          )}"
  );

  appCode = appCode.replace(
    "        {/* Book Details Modal */}",
    `        {/* Edit Review Modal (Checklist Item 5 & 6) */}
        <EditReviewModal
          visible={Boolean(editingPost)}
          activity={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSaveEdit}
        />

        {/* Book Details Modal */}`
  );

  fs.writeFileSync('App.tsx', appCode.replace(/\n/g, '\r\n'), 'utf8');
  console.log('App.tsx updated successfully');
}

