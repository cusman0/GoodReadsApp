import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface GoogleAccount {
  name: string;
  email: string;
  avatar: string;
  password?: string;
}

interface GoogleSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAccount: (account: GoogleAccount) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  visible,
  onClose,
  onSelectAccount,
}) => {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setStep('email');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    setLoading(false);
  };

  const handleCancel = () => {
    resetState();
    onClose();
  };

  const handleEmailNext = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Enter an email or phone number');
      return;
    }
    setErrorMessage(null);
    setLoading(true);

    // Simulate authentic Google security check and transition to password
    setTimeout(() => {
      setLoading(false);
      setStep('password');
    }, 450);
  };

  const handlePasswordNext = () => {
    const trimmedEmail = email.trim().toLowerCase();
    const finalEmail = trimmedEmail.includes('@') ? trimmedEmail : `${trimmedEmail}@gmail.com`;

    // Derive realistic user name from the Google account handle
    const handle = finalEmail.split('@')[0];
    const derivedName = handle
      .split(/[._-]/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Google User';

    const account: GoogleAccount = {
      name: derivedName,
      email: finalEmail,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=4285F4&color=fff&size=128`,
      password: password,
    };

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSelectAccount(account);
      resetState();
      onClose();
    }, 600);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Browser Top Navigation Bar matching accounts.google.com */}
        <View style={styles.browserHeader}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.urlContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.urlText}>accounts.google.com</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Text style={styles.readerViewIcon}>aA</Text>
            <TouchableOpacity onPress={resetState} style={styles.reloadBtn}>
              <Text style={styles.reloadIcon}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real Google Blue Top Progress Bar */}
        {loading && <View style={styles.loadingBar} />}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Center Content Box */}
            <View style={styles.contentCard}>
              {/* Official Google Wordmark Logo */}
              <View style={styles.logoRow}>
                <Image
                  source={require('../assets/google_wordmark.png')}
                  style={styles.googleWordmark}
                  resizeMode="contain"
                />
              </View>

              {step === 'email' ? (
                /* Step 1: Email or Phone */
                <>
                  <Text style={styles.title}>Sign in</Text>
                  <Text style={styles.subtitle}>
                    with your Google Account. You’ll also sign in to Google services
                    in your apps & Safari.
                  </Text>

                  {/* Input Field with Authentic Floating Label */}
                  <View
                    style={[
                      styles.inputBox,
                      (emailFocused || email.length > 0) && styles.inputBoxActive,
                      Boolean(errorMessage) && styles.inputBoxError,
                    ]}
                  >
                    <View style={styles.floatingLabelContainer}>
                      <Text
                        style={[
                          styles.floatingLabel,
                          (emailFocused || email.length > 0) && styles.floatingLabelActive,
                          Boolean(errorMessage) && styles.floatingLabelError,
                        ]}
                      >
                        Email or phone
                      </Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={t => {
                        setEmail(t);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                  </View>

                  {errorMessage ? (
                    <Text style={styles.errorText}>⚠ {errorMessage}</Text>
                  ) : null}

                  <TouchableOpacity style={styles.forgotEmailBtn}>
                    <Text style={styles.blueLink}>Forgot email?</Text>
                  </TouchableOpacity>

                  {/* Bottom Actions Row */}
                  <View style={styles.bottomActionsRow}>
                    <TouchableOpacity>
                      <Text style={styles.blueLink}>Create account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handleEmailNext}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.nextButtonText}>Next</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                /* Step 2: Password */
                <>
                  <Text style={styles.title}>Welcome</Text>

                  {/* Selected Account Chip with Avatar and Email */}
                  <TouchableOpacity
                    style={styles.accountChip}
                    onPress={() => setStep('email')}
                  >
                    <View style={styles.chipAvatar}>
                      <Text style={styles.chipAvatarText}>
                        {email.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.chipEmail} numberOfLines={1}>
                      {email}
                    </Text>
                    <Text style={styles.chipChevron}>▾</Text>
                  </TouchableOpacity>

                  {/* Password Input Field with Floating Label */}
                  <View
                    style={[
                      styles.inputBox,
                      (passwordFocused || password.length > 0) && styles.inputBoxActive,
                    ]}
                  >
                    <View style={styles.floatingLabelContainer}>
                      <Text
                        style={[
                          styles.floatingLabel,
                          (passwordFocused || password.length > 0) &&
                            styles.floatingLabelActive,
                        ]}
                      >
                        Enter your password
                      </Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoFocus
                    />
                  </View>

                  {/* Show Password Toggle Checkbox */}
                  <TouchableOpacity
                    style={styles.showPasswordRow}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        showPassword && styles.checkboxChecked,
                      ]}
                    >
                      {showPassword && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.showPasswordLabel}>Show password</Text>
                  </TouchableOpacity>

                  {/* Bottom Actions Row */}
                  <View style={styles.bottomActionsRow}>
                    <TouchableOpacity>
                      <Text style={styles.blueLink}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handlePasswordNext}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.nextButtonText}>Next</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Safari / Browser Bottom Bar */}
        <View style={styles.browserBottomBar}>
          <Text style={styles.navIcon}>‹</Text>
          <Text style={[styles.navIcon, styles.navIconDisabled]}>›</Text>
          <Text style={styles.navIcon}>⎙</Text>
          <Text style={styles.navIcon}>📖</Text>
          <Text style={styles.navIcon}>⧉</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  browserHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '400',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  urlText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  readerViewIcon: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  reloadBtn: {
    padding: 2,
  },
  reloadIcon: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingBar: {
    height: 3,
    backgroundColor: '#1A73E8',
    width: '100%',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 20,
    alignItems: 'center',
  },
  contentCard: {
    width: '100%',
    maxWidth: 420,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  googleWordmark: {
    width: 90,
    height: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    color: '#202124',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#202124',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 24,
    maxWidth: '90%',
  },
  chipAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chipEmail: {
    fontSize: 13,
    color: '#3C4043',
    fontWeight: '500',
    maxWidth: 220,
  },
  chipChevron: {
    fontSize: 12,
    color: '#5F6368',
    marginLeft: 6,
  },
  inputBox: {
    height: 54,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 4,
    paddingHorizontal: 14,
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  inputBoxActive: {
    borderColor: '#1A73E8',
    borderWidth: 2,
  },
  inputBoxError: {
    borderColor: '#D93025',
    borderWidth: 2,
  },
  floatingLabelContainer: {
    position: 'absolute',
    top: -10,
    left: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  floatingLabel: {
    fontSize: 12,
    color: '#5F6368',
  },
  floatingLabelActive: {
    color: '#1A73E8',
    fontWeight: '500',
  },
  floatingLabelError: {
    color: '#D93025',
  },
  textInput: {
    fontSize: 16,
    color: '#202124',
    paddingVertical: 0,
  },
  errorText: {
    color: '#D93025',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotEmailBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  blueLink: {
    color: '#1A73E8',
    fontSize: 14,
    fontWeight: '600',
  },
  showPasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginLeft: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#5F6368',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 12,
  },
  showPasswordLabel: {
    fontSize: 14,
    color: '#202124',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 48,
    width: '100%',
  },
  nextButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 24,
    minWidth: 84,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  browserBottomBar: {
    height: 48,
    borderTopWidth: 0.5,
    borderTopColor: '#D1D1D6',
    backgroundColor: '#F9F9FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  navIcon: {
    fontSize: 20,
    color: '#007AFF',
  },
  navIconDisabled: {
    color: '#C7C7CC',
  },
});
