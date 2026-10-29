/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock Google Sign-In native module
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ data: { idToken: 'test-token' } })),
    signOut: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Firebase for Jest Node environment
jest.mock('../src/firebase', () => ({
  db: {},
  auth: {},
  firebaseConfig: {},
  GOOGLE_WEB_CLIENT_ID: '383505732079-pd5h25jo1pbjrmd2b3e9t4jfup9hrfg6.apps.googleusercontent.com',
  subscribeToAuthState: jest.fn(() => () => {}),
  signOutUser: jest.fn(() => Promise.resolve()),
  registerWithFirebase: jest.fn(),
  signInWithFirebase: jest.fn(),
  signInWithGoogle: jest.fn(),
  authenticateGoogleUser: jest.fn(),
  syncGoogleUserWithFirestore: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
