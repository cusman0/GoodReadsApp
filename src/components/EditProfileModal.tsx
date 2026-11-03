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
import { updateUserProfile } from '../firebase';
import { resizeImageTo256Jpeg } from '../utils/imageUtils';

declare const document: any;

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
  const [saving, setSaving] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setDisplayName(user.name || '');
      setPhotoUri(user.avatar || '');
      setCustomUrlInput('');
      setShowUrlInput(false);
    }
  }, [visible, user]);

  if (!visible || !user) return null;

  // Determine if changes were made
  const hasNameChanged = displayName.trim() !== (user.name || '').trim();
  const hasPhotoChanged = photoUri !== (user.avatar || '');
  const isNameValid = displayName.trim().length >= 3 && displayName.trim().length <= 30;
  const isSaveDisabled = (!hasNameChanged && !hasPhotoChanged) || !isNameValid || saving;

  const handleApplyPreview = (uri: string) => {
    const cleanUri = uri.trim();
    if (!cleanUri) return;

    // Check JPG / PNG format
    const lower = cleanUri.toLowerCase();
    const isPng = lower.includes('.png') || lower.includes('image/png');
    const isJpg = lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('image/jpeg');

    if (!isPng && !isJpg && !cleanUri.startsWith('http')) {
      Alert.alert('Invalid Format', 'Only JPG and PNG image formats are allowed.');
      return;
    }

    setPhotoUri(cleanUri);
    setShowUrlInput(false);
  };

  const handlePickDeviceImage = () => {
    // If in Web browser environment: use file input dialog
    if (typeof document !== 'undefined') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg';
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return;

          if (
            !file.type.includes('jpeg') &&
            !file.type.includes('png') &&
            !file.type.includes('jpg')
          ) {
            Alert.alert('Invalid Format', 'Only JPG and PNG image formats are allowed.');
            return;
          }

          if (file.size > 5 * 1024 * 1024) {
            Alert.alert('File Too Large', 'Display picture must be under 5 MB.');
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              handleApplyPreview(reader.result as string);
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      } catch (e) {
        // Fallback to text input
      }
    }
    // Fallback on mobile/native: show input box to paste image URL or file path
    setShowUrlInput(true);
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

      // 1. If photo changed, resize to 256x256, compress to JPEG (~0.8), under 100 KB
      if (hasPhotoChanged) {
        if (photoUri && photoUri.trim()) {
          finalPhotoURL = await resizeImageTo256Jpeg(photoUri);
        } else {
          // Reset to default / empty
          finalPhotoURL = '';
        }
      }

      // 2. Update Firebase Auth (ONLY for displayName) & Firestore users/{uid} (with photoURL base64 data URL)
      await updateUserProfile({
        displayName: trimmed,
        photoURL: finalPhotoURL,
      });

      // 3. Notify parent app state immediately
      onProfileUpdated({
        name: trimmed,
        avatar: finalPhotoURL || DEFAULT_AVATAR,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Save Failed',
        err.message || 'Could not update your profile. Please try again.'
      );
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
              <Text style={styles.compressedHint}>Resized to 256x256 JPEG (&lt;100 KB)</Text>

              {/* Photo Action Buttons */}
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={handlePickDeviceImage}
                  activeOpacity={0.8}
                >
                  <Icon name="edit" size={13} color="#00635D" />
                  <Text style={styles.changePhotoBtnText}>Upload from Device</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryPhotoBtn}
                  onPress={() => setShowUrlInput(!showUrlInput)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryPhotoBtnText}>
                    {showUrlInput ? 'Hide URL' : 'Image URL'}
                  </Text>
                </TouchableOpacity>

                {photoUri ? (
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotoUri('')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removePhotoBtnText}>Reset</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* URL or Device Image Input Box */}
              {showUrlInput && (
                <View style={styles.urlInputBox}>
                  <Text style={styles.urlInputLabel}>Paste image URL / path:</Text>
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
                    onPress={() => handleApplyPreview(customUrlInput)}
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
                <Text
                  style={[
                    styles.charCount,
                    (displayName.trim().length < 3 || displayName.trim().length > 30) &&
                      styles.charCountWarn,
                  ]}
                >
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
    paddingBottom: 36,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCirclePreview: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#00635D',
    overflow: 'hidden',
    backgroundColor: '#E8E0D6',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarHint: {
    fontSize: 12,
    color: '#767676',
    marginBottom: 2,
  },
  compressedHint: {
    fontSize: 11,
    color: '#00635D',
    fontWeight: '600',
    marginBottom: 12,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F3F1',
    borderWidth: 1,
    borderColor: '#B2D8D5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00635D',
  },
  secondaryPhotoBtn: {
    backgroundColor: '#F3EFEA',
    borderWidth: 1,
    borderColor: '#D5CEC6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  secondaryPhotoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#382110',
  },
  removePhotoBtn: {
    backgroundColor: '#FBF0EF',
    borderWidth: 1,
    borderColor: '#E8C5C2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removePhotoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C0392B',
  },
  urlInputBox: {
    width: '100%',
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0D6',
    borderRadius: 10,
    padding: 12,
  },
  urlInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#382110',
    marginBottom: 6,
  },
  urlInput: {
    backgroundColor: '#F8F6F2',
    borderWidth: 1,
    borderColor: '#E8E0D6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#382110',
    marginBottom: 8,
  },
  applyUrlBtn: {
    backgroundColor: '#00635D',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
  },
  applyUrlBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#382110',
  },
  charCount: {
    fontSize: 12,
    color: '#767676',
  },
  charCountWarn: {
    color: '#C0392B',
    fontWeight: '700',
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5CEC6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#382110',
  },
  inputHelper: {
    fontSize: 11,
    color: '#767676',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#EAE6DF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#382110',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#00635D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#A0BDBB',
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
