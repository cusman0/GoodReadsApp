import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';

interface GoogleSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAccount: (account: { name: string; email: string; avatar: string }) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  visible,
  onClose,
  onSelectAccount,
}) => {
  const [loading, setLoading] = React.useState(false);

  const accounts = [
    {
      name: 'Ashley Valdez',
      email: 'ashleypatricia.valdez@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
    {
      name: 'Ashley Student',
      email: 'ashleypatricia.valdez@letran.edu.ph',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
  ];

  const handleChoose = (acc: typeof accounts[0]) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSelectAccount(acc);
      onClose();
    }, 700);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Google Header */}
          <View style={styles.header}>
            <View style={styles.googleLogoContainer}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.title}>Sign in with Google</Text>
            <Text style={styles.subtitle}>to continue to Goodreads</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4285F4" />
              <Text style={styles.loadingText}>Signing you in...</Text>
            </View>
          ) : (
            <View style={styles.accountsList}>
              <Text style={styles.sectionLabel}>Choose an account</Text>

              {accounts.map((acc, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.accountItem}
                  onPress={() => handleChoose(acc)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: acc.avatar }} style={styles.accountAvatar} />
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{acc.name}</Text>
                    <Text style={styles.accountEmail}>{acc.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.accountItem}
                onPress={() =>
                  handleChoose({
                    name: 'Goodreads Reader',
                    email: 'reader@goodreads.com',
                    avatar:
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
                  })
                }
              >
                <View style={styles.addAccountIcon}>
                  <Text style={styles.addAccountText}>+</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>Use another account</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              To continue, Google will share your name, email address, and profile
              picture with Goodreads.
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  googleG: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4285F4',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202124',
  },
  subtitle: {
    fontSize: 14,
    color: '#5F6368',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  accountsList: {
    marginVertical: 8,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 14,
  },
  addAccountIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  addAccountText: {
    fontSize: 20,
    color: '#5F6368',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
  },
  accountEmail: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5F6368',
  },
  footer: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 14,
  },
  footerNote: {
    fontSize: 11,
    color: '#70757A',
    lineHeight: 16,
    marginBottom: 12,
  },
  cancelButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
});

