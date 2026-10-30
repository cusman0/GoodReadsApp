/**
 * Goodreads App - Firestore Seeding Script
 * Populates Cloud Firestore with initial data:
 * - users/ (sample reader profile)
 * - posts/ (sample community reviews & reading activity)
 * - admins/ (admin permission records)
 * - summaries/latest (AI consensus summary)
 * - insights/latest (AI literary insights & mood)
 *
 * Run with: node scripts/seedFirestore.js
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDDcjNMSsDRsa2xrhePfC_xAk-Pcf-9PG8",
  authDomain: "good-readsapp-final.firebaseapp.com",
  projectId: "good-readsapp-final",
  storageBucket: "good-readsapp-final.firebasestorage.app",
  messagingSenderId: "383505732079",
  appId: "1:383505732079:web:68d76764708ee0983f261a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedFirestore() {
  console.log('🌱 Starting Cloud Firestore seeding for project:', firebaseConfig.projectId);

  try {
    // 1. Seed Demo User
    console.log('📝 Seeding users/usr_demo_reader...');
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

    // 2. Seed Admin Permissions
    console.log('🛡️ Seeding admins/usr_demo_admin...');
    await setDoc(doc(db, 'admins', 'usr_demo_admin'), {
      email: 'admin@goodreads.com',
      role: 'admin',
      createdAt: serverTimestamp(),
    });

    // 3. Seed Posts / Community Book Reviews
    console.log('📚 Seeding posts/ (community reviews)...');
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

    for (const post of postsData) {
      const { id, ...data } = post;
      await setDoc(doc(db, 'posts', id), data);
      console.log(`  ✓ Created post: ${id} ("${data.bookTitle}")`);
    }

    // 4. Seed summaries/latest
    console.log('📊 Seeding summaries/latest...');
    await setDoc(doc(db, 'summaries', 'latest'), {
      text: 'Readers are actively reviewing top fiction and sci-fi titles. The community highlights captivating character dynamics, creative world-building, and gripping plot twists across trending books.',
      postCount: postsData.length,
      lastPostAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 5. Seed insights/latest
    console.log('💡 Seeding insights/latest...');
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

    console.log('\n🎉 Cloud Firestore seeding completed successfully!');
    console.log('You can now open the Firebase Console to view your populated collections:');
    console.log('👉 https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/firestore/data');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding error:', error);
    console.error('\n⚠️ Note: Make sure your Firestore Security Rules allow writes, or temporarily set them to:');
    console.log('rules_version = \'2\'; service cloud.firestore { match /{document=**} { allow read, write: if true; } }');
    process.exit(1);
  }
}

seedFirestore();

