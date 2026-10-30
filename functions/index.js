/**
 * Goodreads App - Cloud Functions
 * Automatically updates `summaries/latest` and `insights/latest` when `posts/{postId}` changes.
 */

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Analyzes recent reviews and generates AI summary, trending topics, and community mood.
 * Uses Gemini API if GEMINI_API_KEY is configured, with a resilient analytical fallback.
 */
async function generateSummaryAndInsights(posts) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && posts.length > 0) {
    try {
      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const reviewSummaries = posts
        .map(
          (p, idx) =>
            `[Review ${idx + 1}] Book: "${p.bookTitle || "Untitled"}" by ${
              p.bookAuthor || "Unknown"
            } | Rating: ${p.rating || 5}★ | Review text: "${p.text || ""}"`
        )
        .join("\n");

      const prompt = `You are an AI Literary Analyst for a Goodreads reading community.
Analyze the following recent book reviews and provide an objective summary and reader insights.

Reviews:
${reviewSummaries}

Respond ONLY with a JSON object in this exact format, with no markdown code fences:
{
  "summary": "A cohesive 2-3 sentence summary synthesizing reader discussions and overall sentiment across these books.",
  "topics": ["3 to 5 trending book genres or literary themes mentioned"],
  "mood": "positive"
}
Note: "mood" MUST strictly be one of: "positive", "neutral", or "negative".`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response?.text || "";
      const cleaned = text.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.summary && Array.isArray(parsed.topics) && parsed.mood) {
        const normalizedMood = ["positive", "neutral", "negative"].includes(
          parsed.mood.toLowerCase()
        )
          ? parsed.mood.toLowerCase()
          : "positive";

        return {
          summaryText: parsed.summary,
          topics: parsed.topics,
          mood: normalizedMood,
        };
      }
    } catch (aiError) {
      logger.warn("Gemini API generation notice, falling back to analytical engine:", aiError);
    }
  }

  // Analytical engine fallback
  const totalRating = posts.reduce((acc, p) => acc + (Number(p.rating) || 5), 0);
  const avgRating = posts.length > 0 ? (totalRating / posts.length).toFixed(1) : "5.0";

  let mood = "positive";
  if (Number(avgRating) >= 3.8) {
    mood = "positive";
  } else if (Number(avgRating) <= 2.6) {
    mood = "negative";
  } else {
    mood = "neutral";
  }

  const bookTitles = [...new Set(posts.map((p) => p.bookTitle).filter(Boolean))];
  const sampleTitles = bookTitles.slice(0, 3).map((t) => `"${t}"`).join(", ");

  const commonKeywords = [
    "Fiction",
    "Science Fiction",
    "Fantasy",
    "Character Development",
    "World Building",
    "Pacing",
    "Classics",
    "Plot Twists",
  ];

  const extractedTopics = [];
  posts.forEach((p) => {
    commonKeywords.forEach((kw) => {
      if (
        (p.text && p.text.toLowerCase().includes(kw.toLowerCase())) ||
        (p.bookTitle && p.bookTitle.toLowerCase().includes(kw.toLowerCase()))
      ) {
        if (!extractedTopics.includes(kw)) {
          extractedTopics.push(kw);
        }
      }
    });
  });

  const finalTopics =
    extractedTopics.length >= 2
      ? extractedTopics.slice(0, 5)
      : ["Fiction", "Character Development", "Plot Pacing", "Favorites"];

  const summaryText =
    bookTitles.length > 0
      ? `Readers are actively discussing ${bookTitles.length} book(s) including ${sampleTitles}. Overall community sentiment is ${mood} with an average rating of ${avgRating} of 5 stars.`
      : "Community readers are actively sharing reviews and reading updates on their favorite titles.";

  return {
    summaryText,
    topics: finalTopics,
    mood,
  };
}

/**
 * Cloud Function triggered automatically on any write (create, update, delete) to `posts/{postId}`.
 * Updates `summaries/latest` and `insights/latest` in Cloud Firestore.
 */
exports.onPostChanged = onDocumentWritten("posts/{postId}", async (event) => {
  logger.info(`posts/${event.params.postId} write detected. Updating summaries and insights...`);

  try {
    const postsSnapshot = await db
      .collection("posts")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const postCount = postsSnapshot.size;

    if (postCount === 0) {
      logger.info("No posts remaining in posts collection. Resetting summaries and insights.");
      await db.doc("summaries/latest").set(
        {
          text: "No community reviews posted yet.",
          postCount: 0,
          lastPostAt: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await db.doc("insights/latest").set(
        {
          topics: ["General Reading"],
          mood: "neutral",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const latestPost = posts[0];
    const lastPostAt =
      latestPost.createdAt || admin.firestore.FieldValue.serverTimestamp();

    const { summaryText, topics, mood } = await generateSummaryAndInsights(posts);

    // Update summaries/latest
    await db.doc("summaries/latest").set(
      {
        text: summaryText,
        postCount: postCount,
        lastPostAt: lastPostAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    logger.info("Updated summaries/latest successfully", { postCount, lastPostAt });

    // Update insights/latest
    await db.doc("insights/latest").set(
      {
        topics: topics,
        mood: mood,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    logger.info("Updated insights/latest successfully", { topics, mood });
  } catch (error) {
    logger.error("Failed to update summaries or insights on post change:", error);
    throw error;
  }
});

/**
 * HTTP Endpoint to manually trigger summaries and insights refresh on demand.
 */
exports.refreshSummariesAndInsights = onRequest(async (req, res) => {
  try {
    const postsSnapshot = await db
      .collection("posts")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const posts = postsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const postCount = posts.length;
    const lastPostAt =
      postCount > 0
        ? posts[0].createdAt || admin.firestore.FieldValue.serverTimestamp()
        : null;

    const { summaryText, topics, mood } = await generateSummaryAndInsights(posts);

    await db.doc("summaries/latest").set(
      {
        text: summaryText,
        postCount: postCount,
        lastPostAt: lastPostAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await db.doc("insights/latest").set(
      {
        topics: topics,
        mood: mood,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: "Summaries and insights successfully refreshed.",
      summary: summaryText,
      topics,
      mood,
      postCount,
    });
  } catch (err) {
    logger.error("Manual refresh error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

