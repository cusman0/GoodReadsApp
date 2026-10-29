import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { UserProfile } from './types';

export const firebaseConfig = {
  apiKey: "AIzaSyDDcjNMSsDRsa2xrhePfC_xAk-Pcf-9PG8",
  authDomain: "good-readsapp-final.firebaseapp.com",
  projectId: "good-readsapp-final",
  storageBucket: "good-readsapp-final.firebasestorage.app",
  messagingSenderId: "383505732079",
  appId: "1:383505732079:web:68d76764708ee0983f261a",
  measurementId: "G-6Q1V1S0YSF",
};

export const GOOGLE_WEB_CLIENT_ID =
  "383505732079-pd5h25jo1pbjrmd2b3e9t4jfup9hrfg6.apps.googleusercontent.com";

// Initialize native Google Sign-In with official Web Client ID
try {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    offlineAccess: false,
  });
} catch (e) {
  console.warn('GoogleSignin configure notice:', e);
}

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

function formatDisplayNameFromEmail(email?: string | null): string {
  if (!email) return 'Goodreads Reader';
  const handle = email.split('@')[0];
  const parts = handle
    .replace(/[0-9]+/g, ' ')
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  return parts.length > 0 ? parts.join(' ') : 'Goodreads Reader';
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
    formatDisplayNameFromEmail(firebaseUser.email);

  const avatar =
    firebaseUser.photoURL ||
    firestoreData?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      derivedName
    )}&background=3B82F6&color=fff&size=160&bold=true`;

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
 */
async function syncUserWithFirestore(firebaseUser: FirebaseUser): Promise<any> {
  let firestoreData: any = null;
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      firestoreData = userDocSnap.data();
      if (firestoreData?.disabled === true) {
        await signOut(auth);
        throw new Error('Your account has been disabled by an administrator.');
      }
    } else {
      const name =
        firebaseUser.displayName ||
        formatDisplayNameFromEmail(firebaseUser.email);

      const photoURL =
        firebaseUser.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name
        )}&background=3B82F6&color=fff&size=160&bold=true`;

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
 * Register a new user in Firebase Authentication and Cloud Firestore
 */
export async function registerWithFirebase(
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
    console.warn('Update profile warning:', e);
  }

  const firestoreData = await syncUserWithFirestore(user);
  return mapFirebaseUserToProfile(user, firestoreData);
}

/**
 * Sign in an existing user with Firebase Authentication and verify Firestore status.
 */
export async function signInWithFirebase(
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
 * Legitimate Google Sign-In authentication function for mobile devices:
 * 1. Checks Google Play Services on device
 * 2. Launches authentic Google Play Services account picker / bottom sheet
 * 3. Retrieves real ID token from Google
 * 4. Signs into Firebase Auth via GoogleAuthProvider.credential(idToken)
 * 5. Syncs legitimate user data to Cloud Firestore users/{uid}
 * 6. Returns genuine UserProfile
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  // Check if device supports Google Play Services
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Launch official Google Sign-In prompt
  const signInResult = await GoogleSignin.signIn();

  // If the user cancelled or dismissed the Google account prompt
  if (signInResult.type === 'cancelled') {
    const cancelErr: any = new Error('Sign in action cancelled');
    cancelErr.code = 'SIGN_IN_CANCELLED';
    throw cancelErr;
  }

  // Retrieve idToken from result
  const idToken =
    signInResult.data?.idToken ??
    (signInResult as any).idToken;

  if (!idToken) {
    throw new Error('Google Sign-In failed: No ID token returned from Google.');
  }

  // Authenticate with Firebase using official Google credential
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  const firestoreData = await syncUserWithFirestore(userCredential.user);
  return mapFirebaseUserToProfile(userCredential.user, firestoreData);
}

export const authenticateGoogleUser = signInWithGoogle;
export const syncGoogleUserWithFirestore = signInWithGoogle;

/**
 * Signs out the current Firebase user and Google Sign-In session.
 */
export async function signOutUser(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch (e) {
    // Non-blocking if user was not signed in via Google
  }
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
      const userSnap = await getDoc(userDocRef);
      const firestoreData = userSnap.exists() ? userSnap.data() : null;

      if (firestoreData?.disabled === true) {
        await signOut(auth);
        onUserChanged(null);
        return;
      }

      onUserChanged(mapFirebaseUserToProfile(firebaseUser, firestoreData));
    } catch (e) {
      console.warn('subscribeToAuthState notice:', e);
      onUserChanged(mapFirebaseUserToProfile(firebaseUser));
    }
  });
}
