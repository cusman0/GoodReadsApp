# 🚀 Firebase Setup Guide: Goodreads App (Android & Web)

This guide walks you through setting up Firebase for both the **React Native Android Mobile App** and the **PC Web App (Vite)** according to your project requirements.

---

## 📋 Step 1: Create a Firebase Project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Project name: e.g. `Goodreads-App`.
4. Google Analytics: Optional (you can disable or enable it).
5. Click **Create project** and wait for it to finish.

---

## 🔐 Step 2: Enable Authentication Methods

1. In the Firebase Console left menu, go to **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - **Google**:
     - Click **Google** > toggle **Enable**.
     - Choose your Project support email.
     - Click **Save**.
   - **Email/Password**:
     - Click **Email/Password** > toggle **Enable** > click **Save**.

---

## 📱 Step 3: Android Setup (React Native CLI)

### 3.1 Register Android App in Firebase
1. In Firebase Project Overview, click the **Android** icon (or go to **Project settings** > **Your apps** > **Add app** > Android).
2. Enter the following details:
   - **Android package name**: `com.goodreadsapp` *(Exact package name from your android/app/build.gradle)*
   - **App nickname**: `Goodreads Mobile`
   - **Debug signing certificate SHA-1**: **(MANDATORY for Google Sign-In)**

### 3.2 How to Get Your Debug SHA-1 Fingerprint
Open PowerShell in `C:\Users\cl5-35\Desktop\GoodReadsApp` and run:

```powershell
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for the line that says:
`SHA1: XX:XX:XX:XX:...`

Copy that SHA-1 value and paste it into the **Debug signing certificate SHA-1** field in Firebase.

### 3.3 Download `google-services.json`
1. Download the `google-services.json` file provided by Firebase.
2. Move it into your project at:
   ```
   GoodReadsApp/android/app/google-services.json
   ```

### 3.4 Configure Android Gradle Files

#### 1. In `android/build.gradle`:
Add the Google Services classpath inside `dependencies`:
```groovy
buildscript {
    dependencies {
        // ... existing dependencies
        classpath("com.google.gms:google-services:4.4.2")
    }
}
```

#### 2. In `android/app/build.gradle`:
Add this line at the bottom of the file (or under `apply plugin: "com.facebook.react"`):
```groovy
apply plugin: "com.google.gms.google-services"
```

---

## 💻 Step 4: Web Setup (`pc-web/`)

1. In Firebase Console, go to **Project Settings** > **General**.
2. Under **Your apps**, click the **Web** icon (`</>`).
3. App nickname: `Goodreads Web` (leave Firebase Hosting unchecked for now).
4. Click **Register app**.
5. Copy the `firebaseConfig` object and paste it into [`pc-web/src/firebase.ts`](file:///c:/Users/cl5-35/Desktop/GoodReadsApp/pc-web/src/firebase.ts):

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "goodreads-app-xxxx.firebaseapp.com",
  projectId: "goodreads-app-xxxx",
  storageBucket: "goodreads-app-xxxx.appspot.com",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abcdef..."
};
```

---

## 🗄️ Step 5: Cloud Firestore Database Setup

1. In Firebase Console, go to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Location: Choose the closest region (e.g., `asia-southeast1` or `us-central1`).
4. Select **Start in test mode** for development, or **Production mode**.
5. Click **Enable**.

### Firestore Security Rules (from `prompt_requirements.md`):
Go to the **Rules** tab in Firestore and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    function isUser(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }
    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    function isNotDisabled() {
      return !exists(/databases/$(database)/documents/users/$(request.auth.uid)) ||
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.disabled != true;
    }

    // Users Collection
    match /users/{uid} {
      allow read: if isSignedIn();
      allow create: if isUser(uid);
      allow update: if isUser(uid) || isAdmin();
      allow delete: if isAdmin();
    }

    // Posts / Activity Collection
    match /posts/{postId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() &&
                       request.auth.uid == request.resource.data.authorId &&
                       isNotDisabled();
      allow update: if (isUser(resource.data.authorId) && isNotDisabled()) ||
                       // Non-authors may only update likeCount
                       (isSignedIn() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likeCount']));
      allow delete: if isUser(resource.data.authorId) || isAdmin();
    }

    // Admins Collection
    match /admins/{uid} {
      allow read: if isSignedIn();
      allow write: if false; // Only manageable via Firebase Console
    }

    // Summaries
    match /summaries/latest {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isNotDisabled();
    }

    // AI Insights
    match /insights/latest {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```
Click **Publish**.

---

## 📦 Step 6: Packages Installed

### For Mobile (`GoodReadsApp`):
- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`
- `@react-native-google-signin/google-signin`

### For Web (`pc-web`):
- `firebase` (installed via `npm i firebase`)

