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
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc,
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

// AI Gateway & Environment Configuration
declare const __DEV__: boolean;
declare const process: any;

const AI_PROXY_URL: string | null =
  (typeof process !== 'undefined' && process?.env?.AI_PROXY_URL) || null;
const AI_DEV_API_KEY: string | null =
  (typeof process !== 'undefined' &&
    (process?.env?.AI_DEV_API_KEY || process?.env?.GEMINI_API_KEY)) ||
  null;
const AI_MODEL: string | null =
  (typeof process !== 'undefined' && process?.env?.AI_MODEL) || "gemini-1.5-flash";

const proxyUrl = AI_PROXY_URL || null;
const devApiKey = AI_DEV_API_KEY || null;

export const AI = {
  proxyUrl,
  model: AI_MODEL,
  devApiKey: (typeof __DEV__ !== 'undefined' && __DEV__) ? devApiKey : null, // ← dev key is erased in release builds
  mode: proxyUrl ? "proxy" : (typeof __DEV__ !== 'undefined' && __DEV__) && devApiKey ? "direct" : "unconfigured",
};

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
 * Checks if a URL represents an authentic uploaded or OAuth profile photo
 */
export function isGenuinePhoto(url?: string | null): boolean {
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
    formatDisplayNameFromEmail(firebaseUser.email);

  // Extract authentic Google photo from providerData if present
  const googleProvider = firebaseUser.providerData?.find(
    p => (p.providerId === 'google.com' || p.providerId === 'google') && isGenuinePhoto(p.photoURL)
  );
  const googlePhoto = googleProvider?.photoURL;

  // Check any provider with a real photo
  const anyProviderPhoto = firebaseUser.providerData?.find(
    p => isGenuinePhoto(p.photoURL)
  )?.photoURL;

  const rawFirebasePhoto = firebaseUser.photoURL;
  const rawFirestorePhoto = firestoreData?.photoURL;

  // Determine the best avatar: prioritize genuine Google or provider photos over generated placeholders
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
      )}&background=3B82F6&color=fff&size=160&bold=true`;
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
      firebaseUser.displayName ||
      formatDisplayNameFromEmail(firebaseUser.email);

    const googleProviderPhoto = firebaseUser.providerData?.find(
      p => (p.providerId === 'google.com' || p.providerId === 'google') && isGenuinePhoto(p.photoURL)
    )?.photoURL;

    const realPhoto =
      (isGenuinePhoto(preferredPhotoURL) ? preferredPhotoURL : null) ||
      (isGenuinePhoto(googleProviderPhoto) ? googleProviderPhoto : null) ||
      (isGenuinePhoto(firebaseUser.photoURL) ? firebaseUser.photoURL : null);

    if (userDocSnap.exists()) {
      firestoreData = userDocSnap.data();
      if (firestoreData?.disabled === true) {
        await signOut(auth);
        throw new Error('Your account has been disabled by an administrator.');
      }

      // If we have an authentic profile photo and Firestore has none or a placeholder, persist it
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
          console.warn('Could not update photoURL in Firestore:', updateErr);
        }
      }
    } else {
      const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=3B82F6&color=fff&size=160&bold=true`;

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
 * 3. Retrieves real ID token and direct profile photo from Google
 * 4. Signs into Firebase Auth via GoogleAuthProvider.credential(idToken)
 * 5. Updates Firebase Auth profile with authentic Google photo
 * 6. Syncs legitimate user data and photo to Cloud Firestore users/{uid}
 * 7. Returns genuine UserProfile with active photo
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

  // Retrieve idToken and direct Google photo from result
  let idToken: string | null = null;
  let googlePhoto: string | null = null;

  if (signInResult.type === 'success') {
    idToken = signInResult.data.idToken;
    googlePhoto = signInResult.data.user.photo;
  } else {
    // Fallback for different library response shapes
    idToken = (signInResult as any).data?.idToken ?? (signInResult as any).idToken;
    googlePhoto =
      (signInResult as any).data?.user?.photo ??
      (signInResult as any).user?.photo ??
      null;
  }

  if (!googlePhoto) {
    try {
      const currentUser = GoogleSignin.getCurrentUser();
      if (currentUser?.user.photo) {
        googlePhoto = currentUser.user.photo;
      }
    } catch (e) {
      // non-blocking
    }
  }

  if (!idToken) {
    throw new Error('Google Sign-In failed: No ID token returned from Google.');
  }

  // Authenticate with Firebase using official Google credential
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);

  const finalPhoto =
    (isGenuinePhoto(googlePhoto) ? googlePhoto : null) ||
    (isGenuinePhoto(userCredential.user.photoURL) ? userCredential.user.photoURL : null) ||
    userCredential.user.providerData?.find(p => isGenuinePhoto(p.photoURL))?.photoURL ||
    null;

  if (
    finalPhoto &&
    (!userCredential.user.photoURL ||
      userCredential.user.photoURL.includes('ui-avatars.com'))
  ) {
    try {
      await updateProfile(userCredential.user, { photoURL: finalPhoto });
    } catch (e) {
      console.warn('Update profile photo warning:', e);
    }
  }

  const firestoreData = await syncUserWithFirestore(userCredential.user, finalPhoto);
  return mapFirebaseUserToProfile(userCredential.user, firestoreData, finalPhoto);
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
      let firestoreData = userSnap.exists() ? userSnap.data() : null;

      if (firestoreData?.disabled === true) {
        await signOut(auth);
        onUserChanged(null);
        return;
      }

      // Check if user has an authentic Google or provider photo
      let realPhoto =
        firebaseUser.providerData?.find(
          p => isGenuinePhoto(p.photoURL)
        )?.photoURL ||
        (isGenuinePhoto(firebaseUser.photoURL) ? firebaseUser.photoURL : null);

      if (!realPhoto) {
        try {
          const currentGoogleUser = GoogleSignin.getCurrentUser();
          if (
            currentGoogleUser?.user.photo &&
            isGenuinePhoto(currentGoogleUser.user.photo)
          ) {
            realPhoto = currentGoogleUser.user.photo;
          }
        } catch (e) {
          // ignore
        }
      }

      if (realPhoto) {
        if (
          !firebaseUser.photoURL ||
          firebaseUser.photoURL.includes('ui-avatars.com')
        ) {
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

      onUserChanged(
        mapFirebaseUserToProfile(firebaseUser, firestoreData, realPhoto)
      );
    } catch (e) {
      console.warn('subscribeToAuthState notice:', e);
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

/**
 * When a user submits a review, creates posts/{postId} with the fields in the data model,
 * using serverTimestamp() for createdAt and the logged-in user's uid as authorId.
 */
export async function createReviewPost(params: CreatePostParams): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to submit a review.');
  }

  // Gatekeeping: verify user is not disabled
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
    formatDisplayNameFromEmail(currentUser.email);

  const authorPhotoUrl =
    currentUser.photoURL ||
    userSnap.data()?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      authorName
    )}&background=3B82F6&color=fff&size=160&bold=true`;

  const postData = {
    authorId: currentUser.uid, // logged-in user's uid as authorId
    authorName,
    authorPhotoUrl,
    bookId: params.bookId,
    bookTitle: params.bookTitle,
    bookAuthor: params.bookAuthor,
    bookCoverUrl: params.bookCoverUrl,
    rating: params.rating || 5,
    text: params.text.trim(),
    activityType: params.activityType || 'reviewed',
    createdAt: serverTimestamp(), // serverTimestamp() for createdAt
    imageUrl: params.imageUrl || params.bookCoverUrl || '',
    likeCount: 0,
    commentsCount: 0,
  };

  await setDoc(newPostDoc, postData);

  // Update author's booksReadCount in users/{uid}
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

/**
 * Updates the user's reading challenge target goal in Firestore
 */
export async function updateUserReadingGoal(
  userId: string,
  newGoal: number
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { readingChallengeGoal: newGoal }, { merge: true });
  } catch (e) {
    console.warn('Could not update reading challenge goal:', e);
  }
}

/**
 * Updates user reading challenge progress and bookshelf counts in Firestore
 */
export async function updateUserReadingProgress(
  userId: string,
  progress: number,
  counts?: { read?: number; reading?: number; wantToRead?: number }
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const updatePayload: any = {
      readingChallengeProgress: progress,
    };
    if (counts?.read !== undefined) updatePayload.booksReadCount = counts.read;
    if (counts?.reading !== undefined) updatePayload.currentlyReadingCount = counts.reading;
    if (counts?.wantToRead !== undefined) updatePayload.wantToReadCount = counts.wantToRead;

    await setDoc(userDocRef, updatePayload, { merge: true });
  } catch (e) {
    console.warn('Could not update reading stats:', e);
  }
}

/**
 * Real-time subscription to the community posts collection (ordered by createdAt desc)
 */
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
 * Edits author's own review post text and rating in Cloud Firestore
 */
export async function updateReviewPost(
  postId: string,
  updatedText: string,
  updatedRating?: number
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to edit your review.');
  }

  const postDocRef = doc(db, 'posts', postId);
  const payload: any = {
    text: updatedText.trim(),
    updatedAt: serverTimestamp(),
  };
  if (updatedRating !== undefined) {
    payload.rating = updatedRating;
  }

  await updateDoc(postDocRef, payload);
}

/**
 * Deletes author's own review post from Cloud Firestore
 */
export async function deleteReviewPost(postId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to delete your review.');
  }

  const postDocRef = doc(db, 'posts', postId);
  await deleteDoc(postDocRef);
}

