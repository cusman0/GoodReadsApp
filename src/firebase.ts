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
  increment,
  arrayUnion,
  arrayRemove,
  addDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { UserProfile, Comment, AppNotification, Book, Review } from './types';

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
  // Prioritize photoURL from users/{uid} so updates show everywhere right away
  if (isGenuinePhoto(overridePhotoURL)) {
    avatar = overridePhotoURL!;
  } else if (isGenuinePhoto(rawFirestorePhoto)) {
    avatar = rawFirestorePhoto!;
  } else if (isGenuinePhoto(googlePhoto)) {
    avatar = googlePhoto!;
  } else if (isGenuinePhoto(rawFirebasePhoto)) {
    avatar = rawFirebasePhoto!;
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

        if (!firestoreData?.photoURL || firestoreData.photoURL.includes('ui-avatars.com')) {
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

/**
 * Toggle like on a post for the current user.
 * Uses arrayUnion/arrayRemove on likedBy field + increment on likeCount.
 * Automatically notifies the post author in real-time.
 */
export async function togglePostLike(
  postId: string,
  currentlyLiked: boolean
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to like a review.');
  }

  try {
    const reviewRef = doc(db, 'reviews', postId);
    const reviewSnap = await getDoc(reviewRef);
    if (reviewSnap.exists()) {
      const reviewData = reviewSnap.data();
      if (reviewData.visibility !== 'public' && reviewData.ownerId !== currentUser.uid) {
        throw new Error('Only public reviews can be liked.');
      }
      await toggleReviewLike(postId, currentlyLiked);
      if (!currentlyLiked && reviewData.ownerId && reviewData.ownerId !== currentUser.uid) {
        try {
          await addDoc(collection(db, 'notifications'), {
            recipientId: reviewData.ownerId,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'A Reader',
            senderAvatar: currentUser.photoURL || '',
            type: 'like',
            postId,
            bookTitle: reviewData.bookTitle || 'your review',
            bookCoverUrl: reviewData.bookCoverUrl || '',
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch (notifErr) {
          console.warn('Could not create like notification:', notifErr);
        }
      }
      return;
    }
  } catch (err: any) {
    if (err.message?.includes('public') || err.message?.includes('signed in')) {
      throw err;
    }
  }

  const postRef = doc(db, 'posts', postId);
  if (currentlyLiked) {
    await updateDoc(postRef, {
      likeCount: increment(-1),
      likedBy: arrayRemove(currentUser.uid),
    });
  } else {
    await updateDoc(postRef, {
      likeCount: increment(1),
      likedBy: arrayUnion(currentUser.uid),
    });

    // Send real-time notification to post author
    try {
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        if (postData.authorId && postData.authorId !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: postData.authorId,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'A Reader',
            senderAvatar: currentUser.photoURL || '',
            type: 'like',
            postId,
            bookTitle: postData.bookTitle || 'your review',
            bookCoverUrl: postData.bookCoverUrl || '',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (notifErr) {
      console.warn('Could not create like notification:', notifErr);
    }
  }
}

/**
 * Subscribe to real-time comments for a post (ordered by createdAt asc).
 */
export function subscribeToComments(
  postId: string,
  onUpdate: (comments: Comment[]) => void
): () => void {
  // Listen to reviews/{postId}/comments (FEATURE 2: newest first)
  const reviewCommentsRef = collection(db, 'reviews', postId, 'comments');
  const qReviews = query(reviewCommentsRef, orderBy('createdAt', 'desc'));

  let unsubPosts: (() => void) | null = null;
  const unsubReviews = onSnapshot(
    qReviews,
    async snap => {
      if (!snap.empty) {
        const comments: Comment[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          const profile = await getUserProfileDoc(data.userId);
          comments.push({
            id: d.id,
            postId,
            userId: data.userId,
            authorId: data.userId,
            authorName: profile.displayName || 'Reader',
            authorPhotoUrl: profile.photoURL || '',
            text: data.text,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Just now',
          });
        }
        onUpdate(comments);
      } else {
        // Fallback to legacy posts/{postId}/comments if reviews subcollection is empty
        if (!unsubPosts) {
          const postsCommentsRef = collection(db, 'posts', postId, 'comments');
          const qPosts = query(postsCommentsRef, orderBy('createdAt', 'desc'));
          unsubPosts = onSnapshot(
            qPosts,
            snapPosts => {
              const comments: Comment[] = snapPosts.docs.map(d => ({
                id: d.id,
                postId,
                userId: d.data().authorId || d.data().userId || '',
                authorId: d.data().authorId || d.data().userId || '',
                authorName: d.data().authorName || 'Reader',
                authorPhotoUrl: d.data().authorPhotoUrl || '',
                text: d.data().text,
                createdAt: d.data().createdAt?.toDate
                  ? d.data().createdAt.toDate().toLocaleString()
                  : 'Just now',
              }));
              onUpdate(comments);
            },
            () => onUpdate([])
          );
        } else {
          onUpdate([]);
        }
      }
    },
    err => {
      console.warn('subscribeToComments review subcollection notice:', err);
      const postsCommentsRef = collection(db, 'posts', postId, 'comments');
      unsubPosts = onSnapshot(
        postsCommentsRef,
        snapPosts => {
          const comments: Comment[] = snapPosts.docs.map(d => ({
            id: d.id,
            postId,
            userId: d.data().authorId || d.data().userId || '',
            authorId: d.data().authorId || d.data().userId || '',
            authorName: d.data().authorName || 'Reader',
            authorPhotoUrl: d.data().authorPhotoUrl || '',
            text: d.data().text,
            createdAt: d.data().createdAt?.toDate
              ? d.data().createdAt.toDate().toLocaleString()
              : 'Just now',
          }));
          onUpdate(comments);
        },
        () => onUpdate([])
      );
    }
  );

  return () => {
    unsubReviews();
    if (unsubPosts) unsubPosts();
  };
}

/**
 * Add a comment to a post and trigger real-time notification to author.
 */
export async function addComment(postId: string, text: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to comment.');
  }
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Comment cannot be empty.');
  }
  if (trimmed.length > 500) {
    throw new Error('Comment cannot exceed 500 characters.');
  }

  // Check if target is a review in reviews/{postId}
  try {
    const reviewRef = doc(db, 'reviews', postId);
    const reviewSnap = await getDoc(reviewRef);
    if (reviewSnap.exists()) {
      const reviewData = reviewSnap.data();
      if (reviewData.visibility !== 'public' && reviewData.ownerId !== currentUser.uid) {
        throw new Error('Comments are only allowed on public reviews.');
      }
      await addDoc(collection(db, 'reviews', postId, 'comments'), {
        userId: currentUser.uid,
        text: trimmed,
        createdAt: serverTimestamp(),
      });

      // Send real-time notification to review owner
      if (reviewData.ownerId && reviewData.ownerId !== currentUser.uid) {
        try {
          await addDoc(collection(db, 'notifications'), {
            recipientId: reviewData.ownerId,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'A Reader',
            senderAvatar: currentUser.photoURL || '',
            type: 'comment',
            postId,
            bookTitle: reviewData.bookTitle || 'your review',
            bookCoverUrl: reviewData.bookCoverUrl || '',
            commentText: trimmed,
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch (notifErr) {
          console.warn('Could not create comment notification:', notifErr);
        }
      }
      return;
    }
  } catch (err: any) {
    if (err.message?.includes('public reviews') || err.message?.includes('signed in')) {
      throw err;
    }
  }

  const commentsRef = collection(db, 'posts', postId, 'comments');
  await addDoc(commentsRef, {
    authorId: currentUser.uid,
    authorName: currentUser.displayName || 'Reader',
    authorPhotoUrl: currentUser.photoURL || '',
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });

  // Send real-time notification to post author
  try {
    const postSnap = await getDoc(doc(db, 'posts', postId));
    if (postSnap.exists()) {
      const postData = postSnap.data();
      if (postData.authorId && postData.authorId !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: postData.authorId,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Reader',
          senderAvatar: currentUser.photoURL || '',
          type: 'comment',
          postId,
          bookTitle: postData.bookTitle || 'your review',
          bookCoverUrl: postData.bookCoverUrl || '',
          commentText: text.trim(),
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (notifErr) {
    console.warn('Could not create comment notification:', notifErr);
  }
}

/**
 * Delete own comment from a post (decrements commentsCount on parent).
 */
export async function deleteComment(
  postId: string,
  commentId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to delete a comment.');
  }
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(-1) });
}

/**
 * Real-time subscription to notifications for a specific user
 */
export function subscribeToNotifications(
  userId: string,
  onUpdate: (notifications: AppNotification[]) => void
): () => void {
  const notifRef = collection(db, 'notifications');
  const q = query(
    notifRef,
    where('recipientId', '==', userId)
  );

  return onSnapshot(
    q,
    snapshot => {
      const items: AppNotification[] = snapshot.docs.map(d => {
        const data = d.data();
        let formattedDate = 'Just now';
        if (data.createdAt?.toDate) {
          const dt = data.createdAt.toDate();
          const diffMs = Date.now() - dt.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          if (diffMins < 1) formattedDate = 'Just now';
          else if (diffMins < 60) formattedDate = `${diffMins}m ago`;
          else {
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) formattedDate = `${diffHours}h ago`;
            else formattedDate = dt.toLocaleDateString();
          }
        }
        return {
          id: d.id,
          recipientId: data.recipientId,
          senderId: data.senderId,
          senderName: data.senderName || 'A Reader',
          senderAvatar: data.senderAvatar || '',
          type: data.type || 'like',
          postId: data.postId,
          bookTitle: data.bookTitle || '',
          bookCoverUrl: data.bookCoverUrl || '',
          commentText: data.commentText || '',
          read: Boolean(data.read),
          createdAt: formattedDate,
        };
      });
      items.sort((a, b) => b.id.localeCompare(a.id));
      onUpdate(items);
    },
    err => {
      console.warn('subscribeToNotifications notice:', err);
    }
  );
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

/**
 * Mark all unread notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) return;
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const updates = snap.docs.map(d => updateDoc(d.ref, { read: true }));
  await Promise.all(updates);
}

/**
 * Save a book into Cloud Firestore's live books collection
 */
export async function saveBookToCatalog(book: Book): Promise<void> {
  try {
    const bookRef = doc(db, 'books', book.id);
    await setDoc(bookRef, book, { merge: true });
  } catch (err) {
    console.warn('saveBookToCatalog notice:', err);
  }
}

/**
 * Real-time subscription to the live community books catalog in Firestore
 */
export function subscribeToBooks(onBooksUpdate: (books: Book[]) => void): () => void {
  const booksColRef = collection(db, 'books');
  return onSnapshot(
    booksColRef,
    snapshot => {
      if (!snapshot.empty) {
        const books = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Book));
        onBooksUpdate(books);
      }
    },
    err => {
      console.warn('subscribeToBooks notice:', err);
    }
  );
}

/**
 * Persist user bookshelf status (want-to-read / reading / read / rating / pages) to Firestore
 */
export async function saveUserShelvedBook(userId: string, book: Book): Promise<void> {
  try {
    const shelfDocRef = doc(db, 'users', userId, 'shelvedBooks', book.id);
    await setDoc(shelfDocRef, book, { merge: true });
  } catch (err) {
    console.warn('saveUserShelvedBook notice:', err);
  }
}

/**
 * Remove a book from user's bookshelf in Firestore
 */
export async function removeUserShelvedBook(userId: string, bookId: string): Promise<void> {
  try {
    const shelfDocRef = doc(db, 'users', userId, 'shelvedBooks', bookId);
    await deleteDoc(shelfDocRef);
  } catch (err) {
    console.warn('removeUserShelvedBook notice:', err);
  }
}

/**
 * Real-time subscription to a user's shelved books in Firestore
 */
export function subscribeToUserShelvedBooks(
  userId: string,
  onUpdate: (shelvedBooks: Book[]) => void
): () => void {
  const colRef = collection(db, 'users', userId, 'shelvedBooks');
  return onSnapshot(
    colRef,
    snapshot => {
      const books = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Book));
      onUpdate(books);
    },
    err => {
      console.warn('subscribeToUserShelvedBooks notice:', err);
    }
  );
}

// ============================================================================
// FEATURE 1 & 2: REVIEWS (PUBLIC / PRIVATE), LIKES & COMMENTS
// ============================================================================

const userDocsCache = new Map<string, { displayName: string; photoURL: string }>();

/**
 * Reads user's display name and picture from users/{uid} so updates show everywhere right away.
 */
export async function getUserProfileDoc(
  uid: string
): Promise<{ displayName: string; photoURL: string }> {
  if (userDocsCache.has(uid)) return userDocsCache.get(uid)!;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const info = {
        displayName: data.displayName || 'Reader',
        photoURL: data.photoURL || '',
      };
      userDocsCache.set(uid, info);
      return info;
    }
  } catch (e) {
    // ignore
  }
  return { displayName: 'Reader', photoURL: '' };
}

/**
 * Subscribes to real-time updates of users/{uid} for immediate display name/photo updates
 */
export function subscribeToUserProfileDoc(
  uid: string,
  onUpdate: (user: { displayName: string; photoURL: string }) => void
): () => void {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(userDocRef, snap => {
    if (snap.exists()) {
      const data = snap.data();
      const info = {
        displayName: data.displayName || 'Reader',
        photoURL: data.photoURL || '',
      };
      userDocsCache.set(uid, info);
      onUpdate(info);
    }
  });
}

/**
 * FEATURE 1: Creates a review with visibility ('public' | 'private'). Default is 'private'.
 * FEATURE 4: Saves basic book info to books/{bookId} if it does not exist yet.
 */
export async function createReview(params: {
  book: Book;
  rating: number;
  reviewText: string;
  visibility?: 'public' | 'private';
  activityType?: 'reviewed' | 'reading' | 'finished' | 'rated';
}): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to submit a review.');

  const reviewsCol = collection(db, 'reviews');
  const newDocRef = doc(reviewsCol);

  const visibility = params.visibility || 'private'; // Default is Only me (private)

  const reviewPayload = {
    ownerId: currentUser.uid,
    bookId: params.book.id,
    bookTitle: params.book.title,
    bookAuthor: params.book.author,
    bookCoverUrl: params.book.coverUrl,
    rating: params.rating,
    reviewText: params.reviewText.trim(),
    visibility,
    activityType: params.activityType || 'reviewed',
    createdAt: serverTimestamp(),
  };

  await setDoc(newDocRef, reviewPayload);

  // FEATURE 4: Save book's basic info to books/{bookId} only when reviewed, if not exists yet
  try {
    const bookDocRef = doc(db, 'books', params.book.id);
    const bookSnap = await getDoc(bookDocRef);
    if (!bookSnap.exists()) {
      await setDoc(bookDocRef, {
        title: params.book.title,
        authors: params.book.authors || [params.book.author],
        coverUrl: params.book.coverUrl,
        source: params.book.source || 'openlibrary',
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Save book doc notice:', err);
  }

  return newDocRef.id;
}

/**
 * FEATURE 1: Updates owner's review text, rating, or visibility
 */
export async function updateReview(
  reviewId: string,
  params: {
    reviewText?: string;
    rating?: number;
    visibility?: 'public' | 'private';
  }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to edit your review.');

  const payload: any = { updatedAt: serverTimestamp() };
  if (params.reviewText !== undefined) {
    payload.reviewText = params.reviewText.trim();
    payload.text = params.reviewText.trim();
  }
  if (params.rating !== undefined) payload.rating = params.rating;
  if (params.visibility !== undefined) payload.visibility = params.visibility;

  // 1. Try updating reviews/{reviewId}
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const snap = await getDoc(reviewRef);
    if (snap.exists()) {
      await updateDoc(reviewRef, payload);
      return;
    }
  } catch (e) {
    console.warn('updateReview check reviews notice:', e);
  }

  // 2. Try updating posts/{reviewId} (for legacy reviews)
  try {
    const postRef = doc(db, 'posts', reviewId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      await updateDoc(postRef, payload);
      return;
    }
  } catch (e) {
    console.warn('updateReview check posts notice:', e);
  }

  // 3. Fallback direct update to reviews
  const reviewRef = doc(db, 'reviews', reviewId);
  await updateDoc(reviewRef, payload);
}

/**
 * Deletes owner's review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to delete your review.');

  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const snap = await getDoc(reviewRef);
    if (snap.exists()) {
      await deleteDoc(reviewRef);
      return;
    }
  } catch (e) {}

  try {
    const postRef = doc(db, 'posts', reviewId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      await deleteDoc(postRef);
      return;
    }
  } catch (e) {}

  await deleteDoc(doc(db, 'reviews', reviewId));
}

/**
 * FEATURE 1: Main feed query for public reviews only (ordered by createdAt descending)
 * Index: reviews -> visibility (ASC) + createdAt (DESC)
 */
export function subscribeToPublicReviews(
  onUpdate: (reviews: Review[]) => void
): () => void {
  const reviewsCol = collection(db, 'reviews');
  const q = query(
    reviewsCol,
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    snapshot => {
      const items: Review[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: data.ownerId,
          bookId: data.bookId,
          bookTitle: data.bookTitle,
          bookAuthor: data.bookAuthor,
          bookCoverUrl: data.bookCoverUrl,
          rating: data.rating,
          reviewText: data.reviewText,
          visibility: data.visibility || 'public',
          activityType: data.activityType || 'reviewed',
          createdAt: data.createdAt,
        };
      });
      onUpdate(items);
    },
    err => {
      console.warn('subscribeToPublicReviews notice:', err);
      // Fallback without orderBy if index is building
      const fallbackQuery = query(reviewsCol, where('visibility', '==', 'public'));
      return onSnapshot(fallbackQuery, snap => {
        const items: Review[] = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as Review));
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        onUpdate(items);
      });
    }
  );
}

/**
 * FEATURE 1: User's profile query for all owner reviews (public & private)
 * Index: reviews -> ownerId (ASC) + createdAt (DESC)
 */
export function subscribeToUserReviews(
  ownerId: string,
  onUpdate: (reviews: Review[]) => void
): () => void {
  const reviewsCol = collection(db, 'reviews');
  const q = query(
    reviewsCol,
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    snapshot => {
      const items: Review[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as Review));
      onUpdate(items);
    },
    err => {
      console.warn('subscribeToUserReviews notice:', err);
      const fallbackQuery = query(reviewsCol, where('ownerId', '==', ownerId));
      return onSnapshot(fallbackQuery, snap => {
        const items: Review[] = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as Review));
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        onUpdate(items);
      });
    }
  );
}

/**
 * FEATURE 1: Book reviews query for public reviews of a single book
 * Index: reviews -> bookId (ASC) + visibility (ASC) + createdAt (DESC)
 */
export function subscribeToBookReviews(
  bookId: string,
  onUpdate: (reviews: Review[]) => void
): () => void {
  const reviewsCol = collection(db, 'reviews');
  const q = query(
    reviewsCol,
    where('bookId', '==', bookId),
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    snapshot => {
      const items: Review[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as Review));
      onUpdate(items);
    },
    err => {
      console.warn('subscribeToBookReviews notice:', err);
      const fallbackQuery = query(
        reviewsCol,
        where('bookId', '==', bookId),
        where('visibility', '==', 'public')
      );
      return onSnapshot(fallbackQuery, snap => {
        const items: Review[] = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as Review));
        onUpdate(items);
      });
    }
  );
}

/**
 * FEATURE 2: Like a public review. Document ID is user's uid (one like per user).
 * Tapping again removes the like.
 */
export async function toggleReviewLike(
  reviewId: string,
  currentlyLiked: boolean
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to like a review.');

  const likeDocRef = doc(db, 'reviews', reviewId, 'likes', currentUser.uid);
  if (currentlyLiked) {
    await deleteDoc(likeDocRef);
  } else {
    await setDoc(likeDocRef, { createdAt: serverTimestamp() });
  }
}

/**
 * FEATURE 2: Real-time listener for likes on a review
 */
export function subscribeToReviewLikes(
  reviewId: string,
  onUpdate: (likedUids: string[]) => void
): () => void {
  const colRef = collection(db, 'reviews', reviewId, 'likes');
  return onSnapshot(
    colRef,
    snap => {
      const uids = snap.docs.map(d => d.id);
      onUpdate(uids);
    },
    err => console.warn('subscribeToReviewLikes notice:', err)
  );
}

/**
 * FEATURE 2: Adds a comment to reviews/{reviewId}/comments
 * Max 500 characters, required. Does NOT store name/photo (read from users/{uid}).
 */
export async function addReviewComment(
  reviewId: string,
  text: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to comment.');

  const trimmed = text.trim();
  if (!trimmed) throw new Error('Comment text cannot be empty.');
  if (trimmed.length > 500) throw new Error('Comment text cannot exceed 500 characters.');

  const commentsCol = collection(db, 'reviews', reviewId, 'comments');
  await addDoc(commentsCol, {
    userId: currentUser.uid,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}

/**
 * FEATURE 2: Delete own comment, or review owner can delete any comment on their review
 */
export async function deleteReviewComment(
  reviewId: string,
  commentId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to delete a comment.');
  await deleteDoc(doc(db, 'reviews', reviewId, 'comments', commentId));
}

/**
 * FEATURE 2: Real-time listener for comments on a review (newest first)
 */
export function subscribeToReviewComments(
  reviewId: string,
  onUpdate: (comments: Comment[]) => void
): () => void {
  const commentsCol = collection(db, 'reviews', reviewId, 'comments');
  const q = query(commentsCol, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    async snapshot => {
      const comments: Comment[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        let formattedDate = 'Just now';
        if (data.createdAt?.toDate) {
          formattedDate = data.createdAt.toDate().toLocaleString();
        }

        // Dynamically resolve author profile from users/{uid}
        const profile = await getUserProfileDoc(data.userId);

        comments.push({
          id: d.id,
          reviewId,
          userId: data.userId,
          text: data.text,
          createdAt: formattedDate,
          authorName: profile.displayName,
          authorPhotoUrl: profile.photoURL,
        });
      }
      onUpdate(comments);
    },
    err => {
      console.warn('subscribeToReviewComments notice:', err);
      // Fallback query if index is building
      return onSnapshot(commentsCol, async snap => {
        const comments: Comment[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          const profile = await getUserProfileDoc(data.userId);
          comments.push({
            id: d.id,
            reviewId,
            userId: data.userId,
            text: data.text,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Just now',
            authorName: profile.displayName,
            authorPhotoUrl: profile.photoURL,
          });
        }
        onUpdate(comments);
      });
    }
  );
}

// ============================================================================
// FEATURE 3: EDIT PROFILE (SPARK PLAN: BASE64 IN FIRESTORE users/{uid})
// ============================================================================

/**
 * Updates user display name (3-30 chars) in Firebase Auth and display name + base64 photoURL in Firestore users/{uid}.
 * Does NOT call updateProfile with photoURL because Auth cannot store long data URLs.
 */
export async function updateUserProfile(params: {
  displayName: string;
  photoURL?: string;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to edit your profile.');

  const trimmedName = params.displayName.trim();
  if (trimmedName.length < 3 || trimmedName.length > 30) {
    throw new Error('Display name must be between 3 and 30 characters.');
  }

  // 1. Update Firebase Auth ONLY for displayName (Auth cannot hold long base64 data URLs)
  await updateProfile(currentUser, {
    displayName: trimmedName,
  });

  // 2. Update Firestore users/{uid} (stores base64 data URL up to 150,000 characters)
  const userDocRef = doc(db, 'users', currentUser.uid);
  const firestorePayload: any = {
    displayName: trimmedName,
    updatedAt: serverTimestamp(),
  };
  if (params.photoURL !== undefined) {
    firestorePayload.photoURL = params.photoURL;
  }
  await setDoc(userDocRef, firestorePayload, { merge: true });

  // 3. Update in-memory cache so reviews, comments, and headers update immediately
  userDocsCache.set(currentUser.uid, {
    displayName: trimmedName,
    photoURL: params.photoURL || '',
  });
}

// ============================================================================
// COMMUNITY USERS SEARCH & PUBLIC PROFILES
// ============================================================================

/**
 * Searches community users in Firestore users collection by displayName or email
 */
export async function searchCommunityUsers(searchTerm: string = ''): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const term = searchTerm.trim().toLowerCase();

    const users: UserProfile[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.disabled) return;
      const name = data.displayName || data.name || 'Reader';
      const email = data.email || '';
      if (!term || name.toLowerCase().includes(term) || email.toLowerCase().includes(term)) {
        users.push({
          id: d.id,
          name,
          email,
          avatar:
            data.photoURL ||
            data.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00635D&color=fff`,
          booksReadCount: data.booksReadCount || 0,
          wantToReadCount: data.wantToReadCount || 0,
          currentlyReadingCount: data.currentlyReadingCount || 0,
          readingChallengeGoal: data.readingChallengeGoal || 12,
          readingChallengeProgress: data.readingChallengeProgress || data.booksReadCount || 0,
        });
      }
    });

    users.sort((a, b) => (b.booksReadCount || 0) - (a.booksReadCount || 0));
    return users;
  } catch (err) {
    console.warn('searchCommunityUsers error:', err);
    return [];
  }
}

/**
 * Subscribes to public reviews of another community user
 */
export function subscribeToOtherUserPublicReviews(
  targetUserId: string,
  onUpdate: (reviews: Review[]) => void
): () => void {
  const reviewsCol = collection(db, 'reviews');
  const q = query(
    reviewsCol,
    where('ownerId', '==', targetUserId),
    where('visibility', '==', 'public')
  );

  return onSnapshot(
    q,
    async snapshot => {
      const profile = await getUserProfileDoc(targetUserId);
      const currentUid = auth.currentUser?.uid;
      const items: Review[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        let likesCount = 0;
        let isLiked = false;
        let commentsCount = 0;
        try {
          const likesSnap = await getDocs(collection(db, 'reviews', d.id, 'likes'));
          likesCount = likesSnap.size;
          if (currentUid) isLiked = likesSnap.docs.some(ld => ld.id === currentUid);
        } catch (e) {}
        try {
          const commentsSnap = await getDocs(collection(db, 'reviews', d.id, 'comments'));
          commentsCount = commentsSnap.size;
        } catch (e) {}

        items.push({
          id: d.id,
          ownerId: data.ownerId,
          bookId: data.bookId,
          bookTitle: data.bookTitle,
          bookAuthor: data.bookAuthor,
          bookCoverUrl: data.bookCoverUrl,
          rating: data.rating,
          reviewText: data.reviewText,
          visibility: 'public',
          activityType: data.activityType || 'reviewed',
          createdAt: data.createdAt,
          userName: profile.displayName || 'Reader',
          userAvatar:
            profile.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || 'Reader')}&background=00635D&color=fff`,
          likesCount,
          commentsCount,
          likes: likesCount,
          isLiked,
          date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Recently',
        });
      }

      // If no reviews in reviews collection, check posts collection for backward compatibility
      if (items.length === 0) {
        try {
          const postsCol = collection(db, 'posts');
          const postsSnap = await getDocs(query(postsCol, where('authorId', '==', targetUserId)));
          postsSnap.forEach(pd => {
            const pdata = pd.data();
            items.push({
              id: pd.id,
              ownerId: targetUserId,
              bookId: pdata.bookId,
              bookTitle: pdata.bookTitle,
              bookAuthor: pdata.bookAuthor,
              bookCoverUrl: pdata.bookCoverUrl,
              rating: pdata.rating || 5,
              reviewText: pdata.text || '',
              visibility: 'public',
              activityType: pdata.activityType || 'reviewed',
              createdAt: pdata.createdAt,
              userName: profile.displayName || pdata.authorName || 'Reader',
              userAvatar: profile.photoURL || pdata.authorPhotoUrl || '',
              likesCount: pdata.likeCount || 0,
              commentsCount: pdata.commentsCount || 0,
              likes: pdata.likeCount || 0,
              isLiked: Array.isArray(pdata.likedBy) && currentUid ? pdata.likedBy.includes(currentUid) : false,
              date: pdata.createdAt?.toDate ? pdata.createdAt.toDate().toLocaleDateString() : 'Recently',
            });
          });
        } catch (e) {
          // ignore
        }
      }

      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      onUpdate(items);
    },
    err => {
      console.warn('subscribeToOtherUserPublicReviews notice:', err);
      onUpdate([]);
    }
  );
}
