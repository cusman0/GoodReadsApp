# ⚡ Goodreads Cloud Functions

This directory contains the Firebase Cloud Functions that automatically update `summaries/latest` and `insights/latest` when documents in the `posts/{postId}` collection change.

## Functions Included

1. **`onPostChanged` (Firestore Trigger: `posts/{postId}` write)**
   - Triggers whenever a post/review is created, edited, or deleted.
   - Fetches the latest 20 reviews from Cloud Firestore.
   - Computes:
     - **Summary**: Concise consensus summary of reader discussions and reviews.
     - **Topics**: 3-5 trending genres and literary themes.
     - **Mood**: Community sentiment (`positive`, `neutral`, `negative`).
   - Automatically writes to:
     - `summaries/latest` (`text`, `postCount`, `lastPostAt`, `updatedAt`)
     - `insights/latest` (`topics`, `mood`, `updatedAt`)

2. **`refreshSummariesAndInsights` (HTTPS Trigger)**
   - Allows administrators or the web dashboard to trigger an on-demand refresh.

## Setup & Deployment

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Set Gemini API Key (Optional)
If you wish to use Google Gemini for the summary and insights generation:
```bash
firebase functions:secrets:set GEMINI_API_KEY
```
*(If no API key is set, the function automatically uses its built-in analytical sentiment and topic engine without throwing errors.)*

### 3. Deploy to Firebase
From the project root:
```bash
firebase deploy --only functions
```

