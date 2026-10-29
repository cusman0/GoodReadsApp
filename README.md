# Goodreads Re-creation (Mobile Version & PC Version)

A full UI recreation of **Goodreads.com** tailored for both **Mobile (React Native CLI)** and **PC / Desktop (React + Vite + Tailwind CSS)** with authentication, registration, interactive Google Sign-In, and bookshelves management.

---

## 🌟 Key Features

### 1. Authentication & Google Sign-In (Both Mobile & PC)
- **Sign In Tab:**
  - Email / Username and password with show/hide password toggle.
  - "Remember me" option and "Forgot password" link.
  - **Continue with Google:** Official Google branding with account chooser dialog.
  - Secondary quick logins with Amazon and Apple.
- **Registration (Create Account) Tab:**
  - Name, Email, Password fields with validation.
  - Sign up with Google button.
  - Terms of Service and Privacy Policy agreement notice.
- **Interactive Google OAuth Flow:**
  - Realistic account selector modal (e.g., *Ashley Valdez*).
  - One-click sign in that updates user profile, avatar, shelves, and reading challenge.
  - Sign-out functionality to easily toggle back to guest view.

---

### 2. PC / Desktop Web Version (`pc-web/`)
Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

- **Iconic Goodreads Desktop Navbar:**
  - Classic serif Goodreads branding (`#382110`).
  - Navigation links: *Home*, *My Books* (with shelf count badge), *Browse ▾*, and *Community ▾*.
  - Live instant search bar with autocomplete dropdown showing book covers, authors, and ratings.
  - Notifications bell, discussions icon, and user profile avatar dropdown.
  - **Multiplatform View Switcher:** Toggle between **Desktop PC View** and **Mobile Simulator** in 1 click.
- **Authentic 3-Column Desktop Layout:**
  - **Left Column:**
    - *Currently Reading* widget with real-time page progress bar (e.g. Page 218 of 416 - 52%) and quick progress updater.
    - *2026 Reading Challenge* tracker (14 of 30 books completed, ahead of schedule).
    - *Bookshelves* navigation (All, Read, Currently Reading, Want to Read).
  - **Center Feed:**
    - Personalized greeting banner (*"What will you read next, Ashley?"*) or Guest Callout (*"Meet your next favorite book"*).
    - Community feed updates with friend reviews, ratings, and interactive like & comment counters.
    - *Readers Also Enjoyed* recommendation cards.
  - **Right Column:**
    - *Goodreads Choice Awards 2026* showcase.
    - *News & Interviews* articles with comment counters.
    - *Quote of the Day* by Gabrielle Zevin.
    - Goodreads footer links.
- **Desktop Book Detail Modal:**
  - High-res book cover, full synopsis, genre tags, and publication specifications.
  - Interactive 5-star rating widget with hover states (*"did not like it"*, *"it was ok"*, *"liked it"*, *"really liked it"*, *"it was amazing"*).
  - Bookshelf dropdown (*Want to Read*, *Currently Reading*, *Read*, or remove from shelf).
  - Retailer links (Amazon, Kindle, Barnes & Noble).

---

### 3. Mobile Version (`App.tsx` & `src/`)
Built with **React Native CLI** (Android & iOS).

- **Mobile Navigation:**
  - **Home (🏠):** Welcome / Reading challenge banner, Currently Reading active card, Trending horizontal carousel, and Community updates feed.
  - **My Books (📚):** Shelves filter tabs (*All*, *Reading*, *Want to Read*, *Read*).
  - **Discover (🔍):** Search bar with clear button, genre tags, and Goodreads Choice Awards banner.
  - **Profile (👤):** User card with Google connection badge, reading stats grid, recently read bookshelf, and sign out button.
- **Mobile Auth Modal:**
  - Smooth bottom sheet modal for Sign In, Registration, and Google Sign In.
- **Mobile Book Details Modal:**
  - Bottom sheet with cover art, ratings summary, interactive 5 stars, shelf selector, and reading progress updater.

---

## 🚀 How to Run

### Running the PC Desktop Version
```bash
# From root directory:
npm run pc
# or
npm run web

# Or directly in pc-web folder:
cd pc-web
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
> **Tip:** Use the top bar switcher to test both the Desktop PC view and the Mobile Simulator right in the browser!

### Running the Mobile Version (React Native)
```bash
# Start Metro bundler:
npm start

# Run on Android emulator / device:
npm run android

# Run on iOS simulator (macOS only):
npm run ios

# Run Jest tests:
npm test
```

---

## 📁 Project Structure

```
GoodReadsApp/
├── App.tsx                     # React Native Mobile App root
├── src/                        # React Native Mobile source
│   ├── components/
│   │   ├── AuthModal.tsx       # Mobile Sign In, Register & Google Sign-In
│   │   ├── GoogleSignInModal.tsx
│   │   ├── BookCard.tsx
│   │   ├── BookDetailModal.tsx
│   │   ├── GoodreadsHeader.tsx
│   │   └── StarRating.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── MyBooksScreen.tsx
│   │   ├── DiscoverScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── data/mockData.ts
│   └── types/index.ts
├── pc-web/                     # PC / Desktop Web App (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx      # Desktop header with search & view switcher
│   │   │   ├── AuthModal.tsx   # Desktop Sign In, Register & Google Sign-In
│   │   │   ├── GoogleSignInModal.tsx # Interactive Google OAuth dialog
│   │   │   ├── BookDetailModal.tsx
│   │   │   ├── CurrentlyReadingWidget.tsx
│   │   │   ├── ReadingChallengeWidget.tsx
│   │   │   ├── BookshelvesWidget.tsx
│   │   │   ├── FeedItem.tsx
│   │   │   ├── NewsSidebar.tsx
│   │   │   └── MobileViewSimulator.tsx # In-browser mobile device frame
│   │   ├── data/mockData.ts
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── android/                    # Native Android project
├── ios/                        # Native iOS project
├── package.json
└── prompt_requirements.md
```
