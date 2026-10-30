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
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
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

// AI Gateway & Environment Configuration
const AI_PROXY_URL: string | null = import.meta.env.VITE_AI_PROXY_URL || null;
const AI_DEV_API_KEY: string | null =
  import.meta.env.VITE_AI_DEV_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || null;
const AI_MODEL: string | null = import.meta.env.VITE_AI_MODEL || null;

const proxyUrl = AI_PROXY_URL || null;
const devApiKey = AI_DEV_API_KEY || null;

export const AI = {
  proxyUrl,
  model: AI_MODEL || "gemini-3.8-flash",
  devApiKey: import.meta.env.DEV ? devApiKey : null, // ← dev key is erased in release builds
  mode: proxyUrl ? "proxy" : import.meta.env.DEV && devApiKey ? "direct" : "unconfigured",
};

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

function isGenuinePhoto(url?: string | null): boolean {
  return Boolean(
    url &&
    url.trim().length > 0 &&
    !url.includes('ui-avatars.com')
  );
}

/**
 * Maps a Firebase user and optional Firestore data to the app's UserProfile
 */
export function mapFirebaseUserToProfile(
  firebaseUser: FirebaseUser,
  firestoreData?: any,
  overridePhotoURL?: string | null
): UserProfile {
  const derivedName =
    firebaseUser.displayName ||
    firestoreData?.displayName ||
    deriveNameFromEmail(firebaseUser.email);

  const googleProvider = firebaseUser.providerData?.find(
    p => (p.providerId === 'google.com' || p.providerId === 'google') && isGenuinePhoto(p.photoURL)
  );
  const googlePhoto = googleProvider?.photoURL;

  const anyProviderPhoto = firebaseUser.providerData?.find(
    p => isGenuinePhoto(p.photoURL)
  )?.photoURL;

  const rawFirebasePhoto = firebaseUser.photoURL;
  const rawFirestorePhoto = firestoreData?.photoURL;

  let avatar = '';
  if (isGenuinePhoto(overridePhotoURL)) {
    avatar = overridePhotoURL!;
  } else if (isGenuinePhoto(googlePhoto)) {
    avatar = googlePhoto!;
  } else if (isGenuinePhoto(rawFirebasePhoto)) {
    avatar = rawFirebasePhoto!;
  } else if (isGenuinePhoto(rawFirestorePhoto)) {
    avatar = rawFirestorePhoto!;
  } else if (isGenuinePhoto(anyProviderPhoto)) {
    avatar = anyProviderPhoto!;
  } else {
    avatar =
      overridePhotoURL ||
      rawFirebasePhoto ||
      rawFirestorePhoto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        derivedName
      )}&background=00635D&color=fff&size=160`;
  }

  const isGoogle = Boolean(
    firebaseUser.providerData?.some(
      p => p.providerId === 'google.com' || p.providerId === 'google'
    )
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
    readingChallengeGoal: firestoreData?.readingChallengeGoal ?? 0,
    readingChallengeProgress: firestoreData?.readingChallengeProgress ?? 0,
  };
}

/**
 * Synchronizes user data with Firestore `users/{uid}` collection
 * in compliance with prompt_requirements.md.
 */
async function syncUserWithFirestore(
  firebaseUser: FirebaseUser,
  preferredPhotoURL?: string | null
): Promise<any> {
  let firestoreData: any = null;
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    const name =
      firebaseUser.displayName || deriveNameFromEmail(firebaseUser.email);

    const googleProviderPhoto = firebaseUser.providerData?.find(
      p => (p.providerId === 'google.com' || p.providerId === 'google') && isGenuinePhoto(p.photoURL)
    )?.photoURL;

    const realPhoto =
      (isGenuinePhoto(preferredPhotoURL) ? preferredPhotoURL : null) ||
      (isGenuinePhoto(googleProviderPhoto) ? googleProviderPhoto : null) ||
      (isGenuinePhoto(firebaseUser.photoURL) ? firebaseUser.photoURL : null);

    if (userDocSnap.exists()) {
      firestoreData = userDocSnap.data();
      // Disabled Account Handling (prompt_requirements.md Section 3.1)
      if (firestoreData?.disabled === true) {
        await signOut(auth);
        throw new Error('This account has been disabled by an administrator.');
      }

      if (
        realPhoto &&
        (!firestoreData?.photoURL ||
          firestoreData.photoURL.includes('ui-avatars.com') ||
          firestoreData.photoURL !== realPhoto)
      ) {
        try {
          await setDoc(userDocRef, { photoURL: realPhoto }, { merge: true });
          firestoreData.photoURL = realPhoto;
        } catch (updateErr) {
          console.warn('Could not update photo in Firestore:', updateErr);
        }
      }
    } else {
      // First-time registration in Firestore
      const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=00635D&color=fff&size=160`;

      // On first sign-in: create users/{uid} with required initial state (do not overwrite on later logins)
      firestoreData = {
        displayName: name,
        email: firebaseUser.email || '',
        photoURL: realPhoto || fallbackPhoto,
        createdAt: serverTimestamp(),
        disabled: false,
        readingChallengeGoal: 0,
        readingChallengeProgress: 0,
        booksReadCount: 0,
        wantToReadCount: 0,
        currentlyReadingCount: 0,
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

      const realPhoto =
        firebaseUser.providerData?.find(
          p => isGenuinePhoto(p.photoURL)
        )?.photoURL ||
        (isGenuinePhoto(firebaseUser.photoURL) ? firebaseUser.photoURL : null);

      if (realPhoto) {
        if (!firebaseUser.photoURL || firebaseUser.photoURL.includes('ui-avatars.com')) {
          try {
            await updateProfile(firebaseUser, { photoURL: realPhoto });
          } catch (e) {
            // ignore
          }
        }
        if (
          !firestoreData?.photoURL ||
          firestoreData.photoURL.includes('ui-avatars.com') ||
          firestoreData.photoURL !== realPhoto
        ) {
          try {
            await setDoc(userDocRef, { photoURL: realPhoto }, { merge: true });
            if (firestoreData) firestoreData.photoURL = realPhoto;
          } catch (e) {
            // ignore
          }
        }
      }

      onUserChanged(mapFirebaseUserToProfile(firebaseUser, firestoreData, realPhoto));
    } catch (err) {
      console.warn('Error reading user doc on auth change:', err);
      onUserChanged(mapFirebaseUserToProfile(firebaseUser));
    }
  });
}

export interface CreatePostParams {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string;
  rating: number;
  text: string;
  activityType?: 'reviewed' | 'reading' | 'finished' | 'rated';
  imageUrl?: string;
}

export async function createReviewPost(params: CreatePostParams): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to submit a review.');
  }

  const userDocRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists() && userSnap.data()?.disabled === true) {
    throw new Error('Your account has been disabled. You cannot post reviews.');
  }

  const postsColRef = collection(db, 'posts');
  const newPostDoc = doc(postsColRef);

  const authorName =
    currentUser.displayName ||
    userSnap.data()?.displayName ||
    deriveNameFromEmail(currentUser.email);

  const authorPhotoUrl =
    currentUser.photoURL ||
    userSnap.data()?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      authorName
    )}&background=00635D&color=fff&size=160`;

  const postData = {
    authorId: currentUser.uid,
    authorName,
    authorPhotoUrl,
    bookId: params.bookId,
    bookTitle: params.bookTitle,
    bookAuthor: params.bookAuthor,
    bookCoverUrl: params.bookCoverUrl,
    rating: params.rating || 5,
    text: params.text.trim(),
    activityType: params.activityType || 'reviewed',
    createdAt: serverTimestamp(),
    imageUrl: params.imageUrl || params.bookCoverUrl || '',
    likeCount: 0,
    commentsCount: 0,
  };

  await setDoc(newPostDoc, postData);

  try {
    const currentRead = userSnap.data()?.booksReadCount ?? 0;
    const currentProgress = userSnap.data()?.readingChallengeProgress ?? 0;
    await setDoc(
      userDocRef,
      {
        booksReadCount: currentRead + 1,
        readingChallengeProgress: currentProgress + 1,
      },
      { merge: true }
    );
  } catch (statErr) {
    console.warn('Could not increment booksReadCount:', statErr);
  }

  return newPostDoc.id;
}

export function subscribeToCommunityPosts(
  onPostsUpdate: (posts: any[]) => void
): () => void {
  const postsColRef = collection(db, 'posts');
  const q = query(postsColRef, orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    snapshot => {
      const posts = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      onPostsUpdate(posts);
    },
    err => {
      console.warn('subscribeToCommunityPosts snapshot notice:', err);
    }
  );
}

/**
 * One-click helper to populate Cloud Firestore with initial sample data
 */
export async function seedFirestoreDatabase(): Promise<{ success: boolean; count: number }> {
  const postsData = [
    {
      id: 'post_tomorrow_zevin',
      authorId: 'usr_elena',
      authorName: 'Elena Rostova',
      authorPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      bookId: 'b1',
      bookTitle: 'Tomorrow, and Tomorrow, and Tomorrow',
      bookAuthor: 'Gabrielle Zevin',
      bookCoverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      rating: 5,
      text: 'One of the most emotionally resonant books I have ever read. The character dynamics between Sam and Sadie felt completely authentic and timeless. A masterclass in modern fiction.',
      activityType: 'reviewed',
      createdAt: serverTimestamp(),
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      likeCount: 24,
      commentsCount: 5,
    },
    {
      id: 'post_project_hail_mary',
      authorId: 'usr_marcus',
      authorName: 'Marcus Chen',
      authorPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      bookId: 'b4',
      bookTitle: 'Project Hail Mary',
      bookAuthor: 'Andy Weir',
      bookCoverUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80',
      rating: 5,
      text: 'Rocky is already one of my favorite sci-fi characters of all time! Amaze! Amaze! Amaze! If you loved The Martian, this exceeds expectations.',
      activityType: 'reviewed',
      createdAt: serverTimestamp(),
      imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80',
      likeCount: 42,
      commentsCount: 9,
    },
    {
      id: 'post_yellowface_kuang',
      authorId: 'usr_sarah',
      authorName: 'Sarah Jenkins',
      authorPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      bookId: 'b3',
      bookTitle: 'Yellowface',
      bookAuthor: 'R.F. Kuang',
      bookCoverUrl: 'https://images.unsplash.com/photo-1512820790802-3726a03be73d?auto=format&fit=crop&w=600&q=80',
      rating: 4,
      text: 'Sharp, satirical, and impossible to put down. A biting critique of the modern publishing industry and cultural appropriation.',
      activityType: 'reviewed',
      createdAt: serverTimestamp(),
      imageUrl: 'https://images.unsplash.com/photo-1512820790802-3726a03be73d?auto=format&fit=crop&w=600&q=80',
      likeCount: 19,
      commentsCount: 3,
    },
  ];

  await setDoc(doc(db, 'users', 'usr_demo_reader'), {
    displayName: 'Marcus Sterling',
    email: 'marcus.sterling@example.com',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    createdAt: serverTimestamp(),
    disabled: false,
    readingChallengeGoal: 20,
    readingChallengeProgress: 12,
    booksReadCount: 12,
    wantToReadCount: 8,
    currentlyReadingCount: 2,
  });

  await setDoc(doc(db, 'admins', 'usr_demo_admin'), {
    email: 'admin@goodreads.com',
    role: 'admin',
    createdAt: serverTimestamp(),
  });

  for (const post of postsData) {
    const { id, ...data } = post;
    await setDoc(doc(db, 'posts', id), data);
  }

  await setDoc(doc(db, 'summaries', 'latest'), {
    text: 'Readers are actively reviewing top fiction and sci-fi titles. The community highlights captivating character dynamics, creative world-building, and gripping plot twists across trending books.',
    postCount: postsData.length,
    lastPostAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'insights', 'latest'), {
    topics: [
      'Contemporary Fiction',
      'Science Fiction',
      'Character Development',
      'Satire & Publishing',
      'Plot Pacing',
    ],
    mood: 'positive',
    updatedAt: serverTimestamp(),
  });

  return { success: true, count: postsData.length };
}
