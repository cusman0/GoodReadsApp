/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock Firebase for Jest Node environment
jest.mock('../src/firebase', () => ({
  db: {},
  auth: {},
  firebaseConfig: {},
  subscribeToAuthState: jest.fn(() => () => {}),
  signOutUser: jest.fn(() => Promise.resolve()),
  registerWithFirebase: jest.fn(),
  signInWithFirebase: jest.fn(),
  signInWithGoogle: jest.fn(),
  authenticateGoogleUser: jest.fn(),
  syncGoogleUserWithFirestore: jest.fn(),
  isNativeGoogleSigninAvailable: jest.fn(() => false),
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
