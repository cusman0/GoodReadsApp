import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { UserProfile } from './types';

// Real Firebase configuration loaded from environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDDcjNMSsDRsa2xrhePfC_xAk-Pcf-9PG8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "good-readsapp-final.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "good-readsapp-final",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "good-readsapp-final.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "383505732079",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:383505732079:web:68d76764708ee0983f261a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6Q1V1S0YSF",
};

// Real Google OAuth Web Client ID
export const GOOGLE_WEB_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ||
  "383505732079-pd5h25jo1pbjrmd2b3e9t4jfup9hrfg6.apps.googleusercontent.com";

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
googleProvider.addScope('profile');
googleProvider.addScope('email');

/**
 * Derives a clean display name from an email address if no display name is set.
 */
function deriveNameFromEmail(email?: string | null): string {
  if (!email) return 'Reader';
  const handle = email.split('@')[0];
  return (
    handle
      .split(/[._-]/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Reader'
  );
}

/**
 * Maps a Firebase user and optional Firestore data to the app's UserProfile
 */
export function mapFirebaseUserToProfile(
  firebaseUser: FirebaseUser,
  firestoreData?: any
): UserProfile {
  const derivedName =
    firebaseUser.displayName ||
    firestoreData?.displayName ||
    deriveNameFromEmail(firebaseUser.email);

  const avatar =
    firebaseUser.photoURL ||
    firestoreData?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      derivedName
    )}&background=00635D&color=fff&size=160`;

  const isGoogle = Boolean(
    firebaseUser.providerData?.some(p => p.providerId === 'google.com')
  );

  return {
    id: firebaseUser.uid,
    name: derivedName,
    email: firebaseUser.email || '',
    avatar,
    isGoogleUser: isGoogle,
    booksReadCount: firestoreData?.booksReadCount ?? 0,
    wantToReadCount: firestoreData?.wantToReadCount ?? 0,
    currentlyReadingCount: firestoreData?.currentlyReadingCount ?? 0,
    readingChallengeGoal: firestoreData?.readingChallengeGoal ?? 20,
    readingChallengeProgress: firestoreData?.readingChallengeProgress ?? 0,
  };
}

/**
 * Synchronizes user data with Firestore `users/{uid}` collection
 * in compliance with prompt_requirements.md.
 */
async function syncUserWithFirestore(firebaseUser: FirebaseUser): Promise<any> {
  let firestoreData: any = null;
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      firestoreData = userDocSnap.data();
      // Disabled Account Handling (prompt_requirements.md Section 3.1)
      if (firestoreData?.disabled === true) {
        await signOut(auth);
        throw new Error('This account has been disabled by an administrator.');
      }
    } else {
      // First-time registration in Firestore
      const name =
        firebaseUser.displayName || deriveNameFromEmail(firebaseUser.email);
      const photoURL =
        firebaseUser.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name
        )}&background=00635D&color=fff&size=160`;

      firestoreData = {
        displayName: name,
        email: firebaseUser.email || '',
        photoURL,
        createdAt: serverTimestamp(),
        disabled: false,
      };
      await setDoc(userDocRef, firestoreData);
    }
  } catch (firestoreError: any) {
    if (firestoreError?.message?.includes('disabled by an administrator')) {
      throw firestoreError;
    }
    console.warn('Firestore user sync notice:', firestoreError);
  }
  return firestoreData;
}

/**
 * Register a new user with Email and Password in Firebase Auth and Firestore.
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );
  const user = credential.user;

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name.trim()
  )}&background=00635D&color=fff&size=160`;

  try {
    await updateProfile(user, {
      displayName: name.trim(),
      photoURL: avatar,
    });
  } catch (e) {
    console.warn('Update profile notice:', e);
  }

  const firestoreData = await syncUserWithFirestore(user);
  return mapFirebaseUserToProfile(user, firestoreData);
}

/**
 * Sign in existing user with Email and Password in Firebase Auth.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );
  const firestoreData = await syncUserWithFirestore(credential.user);
  return mapFirebaseUserToProfile(credential.user, firestoreData);
}

/**
 * Sign in with Google using Google Identity Services (GIS) ID Token credential
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<UserProfile> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const firestoreData = await syncUserWithFirestore(result.user);
  return mapFirebaseUserToProfile(result.user, firestoreData);
}

/**
 * Sign in using Google Authentication popup via Firebase Auth.
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const firestoreData = await syncUserWithFirestore(result.user);
  return mapFirebaseUserToProfile(result.user, firestoreData);
}

/**
 * Signs out the current Firebase user.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase Auth state changes for session persistence.
 */
export function subscribeToAuthState(
  onUserChanged: (profile: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      onUserChanged(null);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const firestoreData = userDocSnap.exists() ? userDocSnap.data() : null;

      if (firestoreData?.disabled === true) {
        await signOut(auth);
        onUserChanged(null);
        return;
      }

      onUserChanged(mapFirebaseUserToProfile(firebaseUser, firestoreData));
    } catch (err) {
      console.warn('Error reading user doc on auth change:', err);
      onUserChanged(mapFirebaseUserToProfile(firebaseUser));
    }
  });
}
