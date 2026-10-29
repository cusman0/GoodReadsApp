import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
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

export const firebaseConfig = {
  apiKey: "AIzaSyDDcjNMSsDRsa2xrhePfC_xAk-Pcf-9PG8",
  authDomain: "good-readsapp-final.firebaseapp.com",
  projectId: "good-readsapp-final",
  storageBucket: "good-readsapp-final.firebasestorage.app",
  messagingSenderId: "383505732079",
  appId: "1:383505732079:web:68d76764708ee0983f261a",
  measurementId: "G-6Q1V1S0YSF",
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Register a new user in Firebase Authentication and Cloud Firestore
 * in adherence with prompt_requirements.md Section 1 Data Model.
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

  // Register user document in Cloud Firestore (users/{uid})
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      photoURL: avatar,
      createdAt: serverTimestamp(),
      disabled: false,
    });
  } catch (e) {
    console.warn('Firestore user registration warning:', e);
  }

  return {
    id: user.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    avatar,
    isGoogleUser: false,
    booksReadCount: 0,
    wantToReadCount: 0,
    currentlyReadingCount: 0,
    readingChallengeGoal: 20,
    readingChallengeProgress: 0,
  };
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
  const user = credential.user;

  let firestoreData: any = null;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      firestoreData = userSnap.data();
      if (firestoreData?.disabled === true) {
        await signOut(auth);
        throw new Error('Your account has been disabled by an administrator.');
      }
    }
  } catch (e: any) {
    if (e.message?.includes('disabled by an administrator')) {
      throw e;
    }
    console.warn('Firestore sign in check notice:', e);
  }

  return {
    id: user.uid,
    name: user.displayName || firestoreData?.displayName || email.split('@')[0],
    email: user.email || email,
    avatar:
      user.photoURL ||
      firestoreData?.photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.displayName || 'Reader'
      )}&background=00635D&color=fff&size=160`,
    isGoogleUser: false,
    booksReadCount: firestoreData?.booksReadCount ?? 0,
    wantToReadCount: firestoreData?.wantToReadCount ?? 0,
    currentlyReadingCount: firestoreData?.currentlyReadingCount ?? 0,
    readingChallengeGoal: firestoreData?.readingChallengeGoal ?? 20,
    readingChallengeProgress: firestoreData?.readingChallengeProgress ?? 0,
  };
}

/**
 * Authenticate or Register Google User with Firebase Authentication & Cloud Firestore
 */
export async function authenticateGoogleUser(acc: {
  name: string;
  email: string;
  avatar: string;
  password?: string;
}): Promise<UserProfile> {
  const cleanEmail = acc.email.trim().toLowerCase();
  const authPassword =
    acc.password && acc.password.length >= 6
      ? acc.password
      : `GAuth@${cleanEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}!2026`;

  let firebaseUser: FirebaseUser | null = null;

  // Attempt Firebase Auth sign-in or account creation
  try {
    const signCred = await signInWithEmailAndPassword(auth, cleanEmail, authPassword);
    firebaseUser = signCred.user;
  } catch (signErr: any) {
    if (
      signErr.code === 'auth/user-not-found' ||
      signErr.code === 'auth/invalid-credential'
    ) {
      try {
        const createCred = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          authPassword
        );
        firebaseUser = createCred.user;
        await updateProfile(firebaseUser, {
          displayName: acc.name,
          photoURL: acc.avatar,
        });
      } catch (createErr: any) {
        console.warn('Google user Firebase Auth creation notice:', createErr);
      }
    } else {
      console.warn('Google user Firebase Auth sign in notice:', signErr);
    }
  }

  const uid =
    firebaseUser?.uid ||
    `usr_google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Sync with Cloud Firestore users collection
  let firestoreData: any = null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      firestoreData = userSnap.data();
      if (firestoreData?.disabled === true) {
        await signOut(auth);
        throw new Error('Your account has been disabled by an administrator.');
      }
    } else {
      firestoreData = {
        displayName: acc.name,
        email: cleanEmail,
        photoURL: acc.avatar,
        createdAt: serverTimestamp(),
        disabled: false,
      };
      await setDoc(userDocRef, firestoreData);
    }
  } catch (e: any) {
    if (e.message?.includes('disabled by an administrator')) {
      throw e;
    }
    console.warn('Firestore sync notice:', e);
  }

  return {
    id: uid,
    name: acc.name,
    email: cleanEmail,
    avatar: acc.avatar,
    isGoogleUser: true,
    booksReadCount: firestoreData?.booksReadCount ?? 0,
    wantToReadCount: firestoreData?.wantToReadCount ?? 0,
    currentlyReadingCount: firestoreData?.currentlyReadingCount ?? 0,
    readingChallengeGoal: firestoreData?.readingChallengeGoal ?? 20,
    readingChallengeProgress: firestoreData?.readingChallengeProgress ?? 0,
  };
}

/**
 * Backward compatibility alias
 */
export const syncGoogleUserWithFirestore = authenticateGoogleUser;

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
      const userSnap = await getDoc(userDocRef);
      const firestoreData = userSnap.exists() ? userSnap.data() : null;

      if (firestoreData?.disabled === true) {
        await signOut(auth);
        onUserChanged(null);
        return;
      }

      onUserChanged({
        id: firebaseUser.uid,
        name:
          firebaseUser.displayName ||
          firestoreData?.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Goodreads Reader',
        email: firebaseUser.email || '',
        avatar:
          firebaseUser.photoURL ||
          firestoreData?.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            firebaseUser.displayName || 'Reader'
          )}&background=00635D&color=fff&size=160`,
        isGoogleUser: Boolean(
          firebaseUser.providerData?.some(p => p.providerId === 'google.com')
        ),
        booksReadCount: firestoreData?.booksReadCount ?? 0,
        wantToReadCount: firestoreData?.wantToReadCount ?? 0,
        currentlyReadingCount: firestoreData?.currentlyReadingCount ?? 0,
        readingChallengeGoal: firestoreData?.readingChallengeGoal ?? 20,
        readingChallengeProgress: firestoreData?.readingChallengeProgress ?? 0,
      });
    } catch (e) {
      console.warn('subscribeToAuthState notice:', e);
      onUserChanged({
        id: firebaseUser.uid,
        name:
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Goodreads Reader',
        email: firebaseUser.email || '',
        avatar:
          firebaseUser.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            firebaseUser.displayName || 'Reader'
          )}&background=00635D&color=fff&size=160`,
        isGoogleUser: false,
        booksReadCount: 0,
        wantToReadCount: 0,
        currentlyReadingCount: 0,
        readingChallengeGoal: 20,
        readingChallengeProgress: 0,
      });
    }
  });
}
