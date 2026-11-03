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
import { UserProfile } from '../types';
import { Icon } from './Icon';
import { uploadUserAvatar, updateUserProfile } from '../firebase';

interface EditProfileModalProps {
  visible: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onProfileUpdated: (updatedUser: Partial<UserProfile>) => void;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [photoUri, setPhotoUri] = useState(user?.avatar || '');
  const [imageBlobData, setImageBlobData] = useState<{ blob: Blob | Uint8Array; mimeType: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setDisplayName(user.name || '');
      setPhotoUri(user.avatar || '');
      setImageBlobData(null);
      setCustomUrlInput('');
      setShowUrlInput(false);
    }
  }, [visible, user]);

  if (!visible || !user) return null;

  // Determine if changes were made
  const hasNameChanged = displayName.trim() !== (user.name || '').trim();
  const hasPhotoChanged = photoUri !== (user.avatar || '');
  const isSaveDisabled = (!hasNameChanged && !hasPhotoChanged) || displayName.trim().length < 3 || displayName.trim().length > 30 || saving;

  const handleApplyPresetOrUrl = async (uri: string, mime: string = 'image/jpeg') => {
    try {
      // Validate image format (JPG or PNG only)
      const cleanUri = uri.trim();
      const isPng = cleanUri.toLowerCase().includes('.png') || mime === 'image/png';
      const isJpg = cleanUri.toLowerCase().includes('.jpg') || cleanUri.toLowerCase().includes('.jpeg') || mime === 'image/jpeg';

      if (!isPng && !isJpg && !cleanUri.startsWith('http')) {
        Alert.alert('Invalid Format', 'Only JPG and PNG image formats are allowed.');
        return;
      }

      setPhotoUri(cleanUri);
      setShowUrlInput(false);

      // Convert to blob if possible for Storage upload
      try {
        const response = await fetch(cleanUri);
        const blob = await response.blob();
        if (blob.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Display picture must be under 5 MB.');
          setPhotoUri(user.avatar || '');
          return;
        }
        setImageBlobData({ blob, mimeType: isPng ? 'image/png' : 'image/jpeg' });
      } catch (blobErr) {
        // Fallback for web/remote URL
        setImageBlobData(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load image.');
    }
  };

  const handleSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Display name cannot be empty.');
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 30) {
      Alert.alert('Invalid Name', 'Display name must be between 3 and 30 characters.');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoURL = user.avatar;

      // 1. If photo changed and we have a blob, upload to Firebase Storage at avatars/{uid}
      if (hasPhotoChanged) {
        if (imageBlobData) {
          finalPhotoURL = await uploadUserAvatar(imageBlobData.blob, imageBlobData.mimeType);
        } else if (photoUri) {
          // Direct URL update or fallback
          finalPhotoURL = photoUri;
        }
      }

      // 2. Update Firebase Auth and Firestore users/{uid}
      await updateUserProfile({
        displayName: trimmed,
        photoURL: finalPhotoURL,
      });

      // 3. Notify parent app state
      onProfileUpdated({
        name: trimmed,
        avatar: finalPhotoURL,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update your profile. Please try again.');
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
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Display Picture Preview (Cropped to Circle) */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCirclePreview}>
                <Image
                  source={{ uri: photoUri || DEFAULT_AVATAR }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.avatarHint}>Cropped to a circle (JPG or PNG, max 5 MB)</Text>

              {/* Photo Action Buttons */}
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={() => setShowUrlInput(!showUrlInput)}
                  activeOpacity={0.8}
                >
                  <Icon name="edit" size={13} color="#00635D" />
                  <Text style={styles.changePhotoBtnText}>
                    {showUrlInput ? 'Hide Input' : 'Change Picture'}
                  </Text>
                </TouchableOpacity>

                {photoUri ? (
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotoUri('')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removePhotoBtnText}>Reset to Default</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* URL or Device Image Input Box */}
              {showUrlInput && (
                <View style={styles.urlInputBox}>
                  <Text style={styles.urlInputLabel}>Paste image URL / Device path:</Text>
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://example.com/avatar.jpg"
                    placeholderTextColor="#999"
                    value={customUrlInput}
                    onChangeText={setCustomUrlInput}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.applyUrlBtn, !customUrlInput.trim() && styles.btnDisabled]}
                    disabled={!customUrlInput.trim()}
                    onPress={() => handleApplyPresetOrUrl(customUrlInput)}
                  >
                    <Text style={styles.applyUrlBtnText}>Apply Preview</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Display Name Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Display Name</Text>
                <Text style={[styles.charCount, (displayName.trim().length < 3 || displayName.trim().length > 30) && styles.charCountWarn]}>
                  {displayName.trim().length}/30
                </Text>
              </View>
              <TextInput
                style={styles.nameInput}
                placeholder="Your reader name"
                placeholderTextColor="#999"
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={30}
              />
              <Text style={styles.inputHelper}>
                3 to 30 characters. This name is shown publicly on your reviews and comments.
              </Text>
            </View>

            {/* Save & Cancel Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, isSaveDisabled && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaveDisabled}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(56,33,16,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FDFAF6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#382110',
    fontFamily: 'serif',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#767676',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarCirclePreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#00635D',
    borderWidth: 3,
    borderColor: '#00635D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 96,
    height: 96,
  },
  avatarHint: {
    fontSize: 11,
    color: '#8D8070',
    marginTop: 8,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E8F3F1',
    borderRadius: 20,
  },
  changePhotoBtnText: {
    fontSize: 13,
    color: '#00635D',
    fontWeight: '700',
  },
  removePhotoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0ECE1',
  },
  removePhotoBtnText: {
    fontSize: 12,
    color: '#767676',
    fontWeight: '600',
  },
  urlInputBox: {
    width: '100%',
    marginTop: 14,
    backgroundColor: '#F4F1EA',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  urlInputLabel: {
    fontSize: 12,
    color: '#382110',
    fontWeight: '600',
  },
  urlInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#382110',
    borderWidth: 1,
    borderColor: '#E2DED5',
  },
  applyUrlBtn: {
    backgroundColor: '#00635D',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  applyUrlBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#382110',
  },
  charCount: {
    fontSize: 12,
    color: '#767676',
    fontWeight: '600',
  },
  charCountWarn: {
    color: '#C0392B',
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#382110',
    borderWidth: 1,
    borderColor: '#E2DED5',
  },
  inputHelper: {
    fontSize: 11,
    color: '#8D8070',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5CEC6',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#767676',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#00635D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
