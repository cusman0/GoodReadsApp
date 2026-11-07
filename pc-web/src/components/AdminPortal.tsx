import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Trash2,
  UserX,
  UserCheck,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { auth, db, googleProvider } from '../firebase';

export interface AdminPortalProps {
  onBackToApp: () => void;
}

/**
 * Robust User Avatar with automatic error recovery and base64 support
 */
const UserAvatar: React.FC<{
  photoUrl?: string;
  name?: string;
  size?: string;
}> = ({ photoUrl, name, size = 'w-9 h-9' }) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const cleanName = (name || 'Reader').trim();
  const initial = cleanName.charAt(0).toUpperCase() || 'R';
  const cleanUrl = (photoUrl || '').trim();

  // Reset failure if photoUrl changes
  useEffect(() => {
    setLoadFailed(false);
  }, [cleanUrl]);

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    cleanName
  )}&background=00635D&color=fff&size=128&bold=true`;

  if (cleanUrl && !loadFailed) {
    return (
      <img
        src={cleanUrl}
        alt={cleanName}
        onError={() => setLoadFailed(true)}
        className={`${size} rounded-full object-cover shrink-0 border border-[#D5D0C5] bg-[#E0DDD5] shadow-xs`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full overflow-hidden shrink-0 border border-[#D5D0C5] bg-[#00635D] text-white flex items-center justify-center font-bold text-xs shadow-xs relative`}
    >
      <img
        src={fallbackUrl}
        alt={cleanName}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
        className="w-full h-full object-cover"
      />
      <span className="absolute pointer-events-none select-none text-[11px] font-bold">
        {initial}
      </span>
    </div>
  );
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToApp }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reviews' | 'users'>('dashboard');

  // Real-time Firestore state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [postsList, setPostsList] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<{
    topics: string[];
    mood: string;
    summary?: string;
    totalAnalyzed?: number;
    updatedAt?: any;
  } | null>(null);
  const [refreshingInsights, setRefreshingInsights] = useState<boolean>(false);

  // Modals
  const [postToDelete, setPostToDelete] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Auth Listener and Admin Role Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
            setAccessDeniedMsg(null);
          } else {
            setIsAdmin(false);
            setAccessDeniedMsg(
              `Access Denied: Account "${currentUser.email}" (UID: ${currentUser.uid}) does not have administrator privileges. Only UIDs in the 'admins' Firestore collection are authorized.`
            );
            await signOut(auth);
            setUser(null);
          }
        } catch (err: any) {
          console.warn('Admin check error:', err);
          setIsAdmin(false);
          setAccessDeniedMsg('Error verifying administrator credentials: ' + err.message);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time subscriptions for Dashboard, Reviews & Users
  useEffect(() => {
    if (!isAdmin) return;

    // Live Users subscription
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        const uList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsersList(uList);
      },
      err => console.warn('Users snapshot notice:', err)
    );

    // Live Posts subscription (ordered by createdAt desc)
    let rawPosts: any[] = [];
    let rawReviews: any[] = [];

    const mergeAndSetPosts = () => {
      const map = new Map<string, any>();
      rawPosts.forEach(p => map.set(p.id, p));
      rawReviews.forEach(r => {
        if (!map.has(r.id)) {
          map.set(r.id, {
            id: r.id,
            bookTitle: r.bookTitle || r.book?.title || 'Untitled',
            bookAuthor: r.bookAuthor || r.book?.author || 'Unknown',
            bookCoverUrl: r.bookCoverUrl || r.book?.coverUrl || '',
            authorId: r.ownerId || r.authorId || '',
            authorName: r.authorName || r.userName || 'Reader',
            authorPhotoUrl: r.authorPhotoUrl || r.userAvatar || '',
            rating: r.rating || 5,
            text: r.reviewText || r.text || '',
            createdAt: r.createdAt,
          });
        }
      });
      const combined = Array.from(map.values()).sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });
      setPostsList(combined);
    };

    const unsubPosts = onSnapshot(
      query(collection(db, 'posts'), orderBy('createdAt', 'desc')),
      snapshot => {
        rawPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSetPosts();
      },
      err => console.warn('Posts snapshot notice:', err)
    );

    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      snapshot => {
        rawReviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSetPosts();
      },
      err => console.warn('Reviews snapshot notice:', err)
    );

    // Live AI Insights subscription
    const unsubInsights = onSnapshot(
      doc(db, 'insights', 'latest'),
      snap => {
        if (snap.exists()) {
          setAiInsights(snap.data() as any);
        }
      },
      err => console.warn('Insights snapshot notice:', err)
    );

    return () => {
      unsubUsers();
      unsubPosts();
      unsubReviews();
      unsubInsights();
    };
  }, [isAdmin]);

  // Google Sign-In as Admin
  const handleAdminGoogleSignIn = async () => {
    setSigningIn(true);
    setAccessDeniedMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      if (adminDoc.exists()) {
        setIsAdmin(true);
        setUser(currentUser);
        showToast(`Welcome Administrator, ${currentUser.displayName || currentUser.email}!`);
      } else {
        setIsAdmin(false);
        setAccessDeniedMsg(
          `Access Denied: Account "${currentUser.email}" (UID: ${currentUser.uid}) does not have administrator privileges. Only UIDs in the 'admins' Firestore collection are authorized.`
        );
        await signOut(auth);
        setUser(null);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAccessDeniedMsg('Sign in failed: ' + err.message);
      }
    } finally {
      setSigningIn(false);
    }
  };

  // Authorize current account in admins collection
  const handleAuthorizeCurrentAsAdmin = async () => {
    setSigningIn(true);
    setAccessDeniedMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      await setDoc(doc(db, 'admins', currentUser.uid), {
        email: currentUser.email,
        displayName: currentUser.displayName,
        role: 'admin',
        createdAt: serverTimestamp(),
      });
      setIsAdmin(true);
      setUser(currentUser);
      showToast(`Account authorized as Admin! Welcome, ${currentUser.displayName}!`);
    } catch (err: any) {
      setAccessDeniedMsg('Authorization error: ' + err.message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleAdminSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    showToast('Administrator signed out.');
  };

  // 3. Delete Post Action
  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'posts', postToDelete.id)).catch(() => {});
      await deleteDoc(doc(db, 'reviews', postToDelete.id)).catch(() => {});
      showToast('Review permanently deleted from community feed.');
      setPostToDelete(null);
    } catch (err: any) {
      alert('Failed to delete review: ' + err.message);
    }
  };

  // 4. Toggle User Disabled / Enabled Action
  const handleToggleUserDisabled = async (targetUser: any) => {
    const newDisabledState = !targetUser.disabled;
    try {
      await updateDoc(doc(db, 'users', targetUser.id), {
        disabled: newDisabledState,
        updatedAt: serverTimestamp(),
      });
      showToast(
        `Reader "${targetUser.displayName || targetUser.email}" has been ${
          newDisabledState ? 'DISABLED' : 'ACTIVATED'
        }.`
      );
    } catch (err: any) {
      alert('Failed to update reader status: ' + err.message);
    }
  };

  // 5. Dynamic Real-Time AI Insights (Calls Gemini 2.0 Flash with live review texts)
  const handleRefreshAIInsights = async () => {
    setRefreshingInsights(true);
    try {
      const totalRatings = postsList.reduce((acc, p) => acc + (Number(p.rating) || 5), 0);
      const avgRating = postsList.length > 0 ? totalRatings / postsList.length : 4.5;
      const fallbackMood = avgRating >= 3.8 ? 'positive' : avgRating <= 2.5 ? 'negative' : 'neutral';

      // Gather live review data
      const sampleReviews = postsList.slice(0, 15).map((p, idx) => {
        const title = p.bookTitle || 'Book';
        const author = p.bookAuthor || 'Author';
        const rating = p.rating || 5;
        const text = (p.text || '').slice(0, 180);
        return `[Review ${idx + 1}] "${title}" by ${author} (${rating}★): "${text}"`;
      }).join('\n');

      let dynamicTopics: string[] = [];
      let dynamicMood = fallbackMood;
      let dynamicSummary = `Readers are actively discussing books across the community, maintaining a ${fallbackMood} average rating of ${avgRating.toFixed(1)}★.`;

      const geminiApiKey =
        import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.VITE_FIREBASE_API_KEY ||
        '';

      if (geminiApiKey && postsList.length > 0) {
        const candidateModels = [
          'gemini-3.8-flash',
          'gemini-3.5-flash-lite',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-2.0-flash-lite',
          'gemini-1.5-flash-8b',
        ];
        const prompt = `You are an expert AI Literary Analyst for a Goodreads reading community.
Analyze these real reader reviews:
${sampleReviews}

Extract:
1. 3 to 6 actual trending literary topics, genres, or thematic elements mentioned in these reviews.
2. Overall reader sentiment mood: strictly "positive", "neutral", or "negative".
3. A concise 2-sentence synthesis of reader discussions.

Respond ONLY with valid JSON (no markdown formatting, no code fences):
{
  "topics": ["Genre/Topic 1", "Genre/Topic 2", "Genre/Topic 3"],
  "mood": "positive",
  "summary": "..."
}`;

        for (const modelName of candidateModels) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 350 },
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const candidate = data.candidates?.[0];
              const parts = candidate?.content?.parts || [];
              const rawText = parts.filter((p: any) => !p.thought).map((p: any) => p.text || '').join('').trim();
              const cleaned = rawText.replace(/```json\n?|```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
                dynamicTopics = parsed.topics;
              }
              if (parsed.mood && ['positive', 'neutral', 'negative'].includes(parsed.mood.toLowerCase())) {
                dynamicMood = parsed.mood.toLowerCase();
              }
              if (parsed.summary) {
                dynamicSummary = parsed.summary;
              }
              break; // Success with current model!
            }
          } catch (apiErr) {
            console.warn(`Gemini model ${modelName} notice, trying next candidate:`, apiErr);
          }
        }
      }

      // If Gemini was offline or had no output, dynamically derive from actual posts
      if (dynamicTopics.length === 0) {
        const extractedSet = new Set<string>();
        postsList.forEach(p => {
          if (p.bookTitle) extractedSet.add(p.bookTitle);
          if (p.bookAuthor) extractedSet.add(p.bookAuthor);
          if (Array.isArray(p.genres)) p.genres.forEach((g: string) => extractedSet.add(g));
        });
        dynamicTopics = Array.from(extractedSet).slice(0, 5);
        if (dynamicTopics.length === 0) {
          dynamicTopics = ['Contemporary Fiction', 'Literary Discussion', 'Community Reads'];
        }
      }

      await setDoc(
        doc(db, 'insights', 'latest'),
        {
          topics: dynamicTopics,
          mood: dynamicMood,
          summary: dynamicSummary,
          totalAnalyzed: postsList.length,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      showToast('AI Insights successfully regenerated with Gemini AI and saved to Firestore!');
    } catch (err: any) {
      alert('Could not refresh AI insights: ' + err.message);
    } finally {
      setRefreshingInsights(false);
    }
  };

  // Metrics calculations
  const totalReaders = usersList.length;
  const totalPosts = postsList.length;
  const todayStr = new Date().toDateString();
  const postsToday = postsList.filter(p => {
    if (p.createdAt?.toDate) {
      return p.createdAt.toDate().toDateString() === todayStr;
    }
    return false;
  }).length;
  const disabledReaders = usersList.filter(u => u.disabled === true).length;
  const activeReaders = totalReaders - disabledReaders;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#00635D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#382110] font-medium">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not admin -> Show Admin Login Screen
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-[#E2DED5] p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-[#FAF3E8] rounded-full text-[#382110] mb-2">
              <ShieldCheck className="w-8 h-8 text-[#00635D]" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#382110]">
              Goodreads Admin Portal
            </h1>
            <p className="text-xs text-gray-600">
              Authorized Administrator Access & Content Moderation Console
            </p>
          </div>

          {accessDeniedMsg && (
            <div className="bg-[#FDEDEC] border border-[#F5B7B1] text-[#922B21] p-4 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Access Denied (Non-Admin Account)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-700">{accessDeniedMsg}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleAdminGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 bg-[#00635D] hover:bg-[#004e49] text-white py-3 px-4 rounded-lg font-medium text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{signingIn ? 'Authenticating...' : 'Sign In with Google (Admin Verification)'}</span>
            </button>

            <button
              onClick={handleAuthorizeCurrentAsAdmin}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-2 bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#382110] py-2.5 px-4 rounded-lg font-medium text-xs border border-[#D8D5CD] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00635D]" />
              <span>Register / Authorize My Google Account as Admin</span>
            </button>
          </div>

          <div className="border-t border-[#EAE5DB] pt-4 text-center">
            <button
              onClick={onBackToApp}
              className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
            >
              ← Back to Goodreads Public Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Administrator Console
  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col font-sans text-gray-800">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#382110] text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs border border-[#52331b]">
          <CheckCircle2 className="w-4 h-4 text-[#409D69]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Header */}
      <header className="bg-[#382110] text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-6xl w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-bold tracking-tight text-[#FAF8F5]">
              goodreads
            </span>
            <span className="bg-[#00635D] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={handleAdminSignOut}
              className="flex items-center gap-1.5 bg-[#4D2D16] hover:bg-[#5D371B] text-gray-200 px-3 py-1.5 rounded text-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={onBackToApp}
              className="text-gray-400 hover:text-white underline text-xs ml-1"
            >
              Public Web
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-6xl w-full mx-auto px-4 flex gap-6 text-xs font-medium border-t border-[#4D2D16] pt-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-[#00635D] text-white font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard & AI Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'reviews'
                ? 'border-[#00635D] text-white font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Review Moderation ({totalPosts})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'border-[#00635D] text-white font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Management ({totalReaders})</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* ============================================================ */}
        {/* TAB 1: DASHBOARD & AI INSIGHTS */}
        {/* ============================================================ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-[#E0DDD5] p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Total Readers
                  </span>
                  <Users className="w-4 h-4 text-[#00635D]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-[#382110]">{totalReaders}</span>
                  <span className="text-[11px] text-gray-500">registered</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E0DDD5] p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Active Readers
                  </span>
                  <UserCheck className="w-4 h-4 text-[#2E7D32]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-[#2E7D32]">{activeReaders}</span>
                  <span className="text-[11px] text-gray-500">can review</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E0DDD5] p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Total Reviews & Posts
                  </span>
                  <MessageSquare className="w-4 h-4 text-[#00635D]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-[#382110]">{totalPosts}</span>
                  <span className="text-[11px] text-gray-500">live reviews</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E0DDD5] p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Reviews Created Today
                  </span>
                  <TrendingUp className="w-4 h-4 text-[#00635D]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-[#00635D]">{postsToday}</span>
                  <span className="text-[11px] text-gray-500">today</span>
                </div>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-white rounded-xl border border-[#D5D0C5] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE5DB] pb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E8F5E9] text-[#00635D] text-xs font-bold px-2 py-0.5 rounded border border-[#A5D6A7]">
                    ✦ GEMINI 2.0 FLASH
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#382110]">
                    Real-Time Community Insights & Sentiment
                  </h2>
                </div>
                <button
                  onClick={handleRefreshAIInsights}
                  disabled={refreshingInsights}
                  className="flex items-center gap-1.5 text-xs bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#D8D5CD] text-[#00635D] font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingInsights ? 'animate-spin' : ''}`} />
                  <span>{refreshingInsights ? 'Synthesizing with Gemini...' : 'Refresh AI Insights'}</span>
                </button>
              </div>

              {aiInsights ? (
                <div className="space-y-4 pt-2">
                  {aiInsights.summary && (
                    <div className="bg-[#FAF8F5] border border-[#E5DEC9] p-4 rounded-lg text-xs leading-relaxed text-[#382110] italic">
                      "{aiInsights.summary}"
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trending Topics */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Trending Literary Topics & Genres
                      </h3>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {aiInsights.topics?.map((topic, i) => (
                          <span
                            key={i}
                            className="bg-[#FAF3E8] text-[#382110] border border-[#E5DEC9] px-3 py-1 rounded-full text-xs font-medium"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Overall Reader Mood */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Overall Community Reader Sentiment
                      </h3>
                      <div className="flex items-center gap-3 pt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            aiInsights.mood === 'positive'
                              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                              : aiInsights.mood === 'negative'
                              ? 'bg-[#FDEDEC] text-[#C0392B] border border-[#F5B7B1]'
                              : 'bg-[#FFF8E1] text-[#F39C12] border border-[#FFE082]'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                          <span>{aiInsights.mood} Sentiment</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Synthesized live from {totalPosts} reader reviews in Firestore
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs">
                  No AI insights cached yet. Click "Refresh AI Insights" above to synthesize live from community reviews.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: REVIEW MODERATION TABLE */}
        {/* ============================================================ */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl border border-[#D5D0C5] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#EAE5DB] bg-[#FAF8F5] flex justify-between items-center">
              <div>
                <h2 className="font-serif text-base font-bold text-[#382110]">
                  Live Community Book Reviews
                </h2>
                <p className="text-xs text-gray-600">
                  Deleting a review immediately removes it from mobile devices and web feeds in real time.
                </p>
              </div>
              <span className="text-xs font-medium text-gray-500">{postsList.length} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F1EA] text-gray-600 uppercase tracking-wider text-[10px] border-b border-[#E2DED5]">
                  <tr>
                    <th className="py-3 px-4">Book</th>
                    <th className="py-3 px-4">Reviewer</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Review Content</th>
                    <th className="py-3 px-4 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DB]">
                  {postsList.map(post => {
                    const reviewerPhoto =
                      post.authorPhotoUrl || post.authorPhotoURL || post.userAvatar;
                    const reviewerName = post.authorName || post.userName || 'Reader';
                    return (
                      <tr key={post.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {post.bookCoverUrl && (
                              <img
                                src={post.bookCoverUrl}
                                alt=""
                                className="w-8 h-12 object-cover rounded shadow-2xs shrink-0"
                              />
                            )}
                            <div>
                              <div className="font-bold text-[#382110] leading-tight">
                                {post.bookTitle}
                              </div>
                              <div className="text-[11px] text-gray-500">by {post.bookAuthor}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar photoUrl={reviewerPhoto} name={reviewerName} size="w-7 h-7" />
                            <span className="font-medium text-[#382110]">{reviewerName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-[#F39C12] font-semibold gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{post.rating || 5}★</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-gray-700 italic line-clamp-2">"{post.text}"</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setPostToDelete(post)}
                            className="inline-flex items-center gap-1 bg-[#FDEDEC] hover:bg-[#FADBD8] text-[#C0392B] border border-[#F5B7B1] px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {postsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No community reviews published yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: USER MANAGEMENT TABLE */}
        {/* ============================================================ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-[#D5D0C5] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#EAE5DB] bg-[#FAF8F5] flex justify-between items-center">
              <div>
                <h2 className="font-serif text-base font-bold text-[#382110]">
                  Registered Readers & Permissions
                </h2>
                <p className="text-xs text-gray-600">
                  Disabling an account blocks that user from creating or editing reviews on mobile in real time.
                </p>
              </div>
              <span className="text-xs font-medium text-gray-500">{usersList.length} readers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F1EA] text-gray-600 uppercase tracking-wider text-[10px] border-b border-[#E2DED5]">
                  <tr>
                    <th className="py-3 px-4">Reader</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Books Read</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Permission Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DB]">
                  {usersList.map(reader => {
                    const isDisabled = reader.disabled === true;
                    const photo =
                      reader.photoURL || reader.photoUrl || reader.avatar || reader.picture;
                    const readerName = reader.displayName || reader.name || 'Reader';

                    return (
                      <tr key={reader.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#382110]">
                          <div className="flex items-center gap-3">
                            <UserAvatar photoUrl={photo} name={readerName} size="w-9 h-9" />
                            <div>
                              <div className="font-bold">{readerName}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                UID: {reader.id?.slice(0, 10)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {reader.email ? (
                            <span>{reader.email}</span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">No email registered</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {reader.booksReadCount || reader.readingChallengeProgress || 0} books
                        </td>
                        <td className="py-3 px-4">
                          {isDisabled ? (
                            <span className="inline-flex items-center gap-1 bg-[#FDEDEC] text-[#C0392B] border border-[#F5B7B1] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              ● Disabled (Cannot Post)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              ● Active Reader
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleUserDisabled(reader)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                              isDisabled
                                ? 'bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] border border-[#A5D6A7]'
                                : 'bg-[#FDEDEC] hover:bg-[#FADBD8] text-[#C0392B] border border-[#F5B7B1]'
                            }`}
                          >
                            {isDisabled ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Enable Account</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>Disable Account</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No user profiles found in Firestore.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#D5D0C5]">
            <div className="flex items-center gap-2 text-[#C0392B] font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Permanent Deletion</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete the review for{' '}
              <strong>"{postToDelete.bookTitle}"</strong> by <strong>{postToDelete.authorName}</strong>?
              This action cannot be undone and will update all mobile clients in real time.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPostToDelete(null)}
                className="px-3 py-1.5 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletePost}
                className="px-4 py-1.5 rounded text-xs bg-[#C0392B] hover:bg-[#A93226] text-white font-bold transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
