import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { UserProfile } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';
import { Icon } from './Icon';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleEmailAuth = () => {
    if (tab === 'register' && !name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name to register.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        'Short Password',
        'Password must be at least 6 characters long.'
      );
      return;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: tab === 'register' ? name.trim() : email.split('@')[0],
      email: email.trim().toLowerCase(),
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      isGoogleUser: false,
      booksReadCount: 0,
      wantToReadCount: 0,
      currentlyReadingCount: 0,
      readingChallengeGoal: 20,
      readingChallengeProgress: 0,
    };

    onLoginSuccess(newUser);
    onClose();
  };

  const handleGoogleAccountSelected = (acc: {
    name: string;
    email: string;
    avatar: string;
  }) => {
    const googleUser: UserProfile = {
      id: `usr_google_${Date.now()}`,
      name: acc.name,
      email: acc.email,
      avatar: acc.avatar,
      isGoogleUser: true,
      booksReadCount: 14,
      wantToReadCount: 48,
      currentlyReadingCount: 2,
      readingChallengeGoal: 30,
      readingChallengeProgress: 14,
    };

    onLoginSuccess(googleUser);
    onClose();
  };

  return (
    <>
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
          <View style={styles.modalSheet}>
            {/* Header bar */}
            <View style={styles.sheetHandleRow}>
              <View style={styles.sheetHandle} />
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Goodreads Brand */}
              <View style={styles.brandContainer}>
                <Text style={styles.brandTitle}>goodreads</Text>
                <Text style={styles.brandSubtitle}>
                  Meet your next favorite book.
                </Text>
              </View>

              {/* Tabs */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tab, tab === 'signin' && styles.activeTab]}
                  onPress={() => setTab('signin')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tab === 'signin' && styles.activeTabText,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, tab === 'register' && styles.activeTab]}
                  onPress={() => setTab('register')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tab === 'register' && styles.activeTabText,
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form fields */}
              <View style={styles.formContainer}>
                {tab === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your name"
                      placeholderTextColor="#999999"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#999999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    {tab === 'signin' && (
                      <TouchableOpacity>
                        <Text style={styles.forgotLink}>Forgot password?</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="At least 6 characters"
                      placeholderTextColor="#999999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <Text style={styles.eyeText}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEmailAuth}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>
                    {tab === 'signin' ? 'Sign In' : 'Create Goodreads Account'}
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => setShowGoogleModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>
                    {tab === 'signin'
                      ? 'Continue with Google'
                      : 'Sign up with Google'}
                  </Text>
                </TouchableOpacity>

                {/* Amazon & Apple buttons */}
                <View style={styles.secondarySocialRow}>
                  <TouchableOpacity
                    style={styles.secondarySocialBtn}
                    onPress={() =>
                      handleGoogleAccountSelected({
                        name: 'Ashley Valdez',
                        email: 'ashley.valdez@amazon.com',
                        avatar:
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
                      })
                    }
                  >
                    <Text style={styles.secondarySocialText}>🛒 Amazon</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondarySocialBtn}
                    onPress={() =>
                      handleGoogleAccountSelected({
                        name: 'Ashley Valdez',
                        email: 'ashley.valdez@icloud.com',
                        avatar:
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
                      })
                    }
                  >
                    <Text style={styles.secondarySocialText}> Apple</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.termsNotice}>
                  By continuing, you agree to Goodreads{' '}
                  <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>.
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Google Sign In Interactive Chooser */}
      <GoogleSignInModal
        visible={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleGoogleAccountSelected}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F9F7F4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1CCC0',
  },
  closeBtn: {
    position: 'absolute',
    right: 18,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAE5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontFamily: 'serif',
    fontSize: 32,
    fontWeight: '700',
    color: '#382110',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 14,
    color: '#767676',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAE5DB',
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#767676',
  },
  activeTabText: {
    color: '#382110',
    fontWeight: '700',
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    marginBottom: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#382110',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    color: '#00635D',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 6,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333333',
  },
  eyeBtn: {
    paddingHorizontal: 12,
  },
  eyeText: {
    fontSize: 12,
    color: '#00635D',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#37745B',
    paddingVertical: 13,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8D5CD',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#8A857B',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  googleIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C4043',
  },
  secondarySocialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondarySocialBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CD',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondarySocialText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
  },
  termsNotice: {
    fontSize: 11,
    color: '#767676',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  linkText: {
    color: '#00635D',
    textDecorationLine: 'underline',
  },
});

