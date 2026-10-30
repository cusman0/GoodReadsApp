const fs = require('fs');

// --- 1. Update HomeScreen.tsx ---
let homeCode = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8').replace(/\r\n/g, '\n');

if (!homeCode.includes('onEditPost?:')) {
  homeCode = homeCode.replace(
    '  onOpenAuth: () => void;\n}',
    '  onOpenAuth: () => void;\n  onEditPost?: (activity: FeedActivity) => void;\n  onDeletePost?: (postId: string) => void;\n}'
  );

  homeCode = homeCode.replace(
    '  onOpenAuth,\n}) => {',
    '  onOpenAuth,\n  onEditPost,\n  onDeletePost,\n}) => {'
  );

  // In myReviews.map: add Edit / Delete action buttons
  const myReviewActions = `
                <View style={styles.myReviewActionsRow}>
                  <TouchableOpacity
                    style={styles.myReviewEditBtn}
                    onPress={() => onEditPost && onEditPost(item)}
                    activeOpacity={0.8}
                  >
                    <Icon name="edit" size={13} color="#00635D" />
                    <Text style={styles.myReviewEditBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.myReviewDeleteBtn}
                    onPress={() => onDeletePost && onDeletePost(item.id)}
                    activeOpacity={0.8}
                  >
                    <Icon name="trash" size={13} color="#C0392B" />
                    <Text style={styles.myReviewDeleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
`;

  homeCode = homeCode.replace(
    '                <View style={styles.myReviewFooter}>',
    myReviewActions + '\n                <View style={styles.myReviewFooter}>'
  );

  // In feed.map: add owner Edit / Delete action buttons
  const feedOwnerActions = `
            {user && (item.userId === user.id || item.userName === user.name) && (
              <View style={styles.feedOwnerActionsRow}>
                <TouchableOpacity
                  style={styles.feedOwnerEditBtn}
                  onPress={() => onEditPost && onEditPost(item)}
                  activeOpacity={0.8}
                >
                  <Icon name="edit" size={12} color="#00635D" />
                  <Text style={styles.feedOwnerEditBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.feedOwnerDeleteBtn}
                  onPress={() => onDeletePost && onDeletePost(item.id)}
                  activeOpacity={0.8}
                >
                  <Icon name="trash" size={12} color="#C0392B" />
                  <Text style={styles.feedOwnerDeleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
`;

  homeCode = homeCode.replace(
    '            {/* Social reactions */}',
    feedOwnerActions + '\n            {/* Social reactions */}'
  );

  // Add styles for the buttons
  const crudStyles = `
  myReviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  myReviewEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  myReviewEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00635D',
  },
  myReviewDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  myReviewDeleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C0392B',
  },
  feedOwnerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE1',
    marginTop: 6,
  },
  feedOwnerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
  },
  feedOwnerEditBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00635D',
  },
  feedOwnerDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
  },
  feedOwnerDeleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C0392B',
  },
`;

  homeCode = homeCode.replace(
    'const styles = StyleSheet.create({',
    'const styles = StyleSheet.create({' + crudStyles
  );

  fs.writeFileSync('src/screens/HomeScreen.tsx', homeCode.replace(/\n/g, '\r\n'), 'utf8');
  console.log('HomeScreen.tsx updated successfully');
}

// --- 2. Update ProfileScreen.tsx ---
let profileCode = fs.readFileSync('src/screens/ProfileScreen.tsx', 'utf8').replace(/\r\n/g, '\n');

if (!profileCode.includes('onEditPost?:')) {
  profileCode = profileCode.replace(
    '  onUpdateGoal?: (newGoal: number) => void;\n}',
    '  onUpdateGoal?: (newGoal: number) => void;\n  onEditPost?: (activity: FeedActivity) => void;\n  onDeletePost?: (postId: string) => void;\n}'
  );

  profileCode = profileCode.replace(
    '  onUpdateGoal,\n}) => {',
    '  onUpdateGoal,\n  onEditPost,\n  onDeletePost,\n}) => {'
  );

  const profileReviewActions = `
              <View style={styles.profileReviewActionsRow}>
                <TouchableOpacity
                  style={styles.profileEditBtn}
                  onPress={() => onEditPost && onEditPost(r)}
                  activeOpacity={0.8}
                >
                  <Icon name="edit" size={12} color="#00635D" />
                  <Text style={styles.profileEditBtnText}>Edit Review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileDeleteBtn}
                  onPress={() => onDeletePost && onDeletePost(r.id)}
                  activeOpacity={0.8}
                >
                  <Icon name="trash" size={12} color="#C0392B" />
                  <Text style={styles.profileDeleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
`;

  profileCode = profileCode.replace(
    '              {Boolean(r.reviewText) && (\n                <Text style={styles.userReviewBody}>"{r.reviewText}"</Text>\n              )}',
    '              {Boolean(r.reviewText) && (\n                <Text style={styles.userReviewBody}>"{r.reviewText}"</Text>\n              )}\n' + profileReviewActions
  );

  const profileCrudStyles = `
  profileReviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EAE5DB',
  },
  profileEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  profileEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00635D',
  },
  profileDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  profileDeleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C0392B',
  },
`;

  profileCode = profileCode.replace(
    'const styles = StyleSheet.create({',
    'const styles = StyleSheet.create({' + profileCrudStyles
  );

  fs.writeFileSync('src/screens/ProfileScreen.tsx', profileCode.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ProfileScreen.tsx updated successfully');
}

