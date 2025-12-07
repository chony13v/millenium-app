import { admin, db, functions } from "./firebase";
import { formatDateKeyUTC } from "./time";
import { awardPointsTransaction } from "./points";
import {
  NEWS_CLICK_POINTS,
  SOCIAL_ENGAGEMENT_POINTS,
  SOCIAL_LINK_WHITELIST,
  SocialPlatform,
} from "./constants";
import { getDailyMeta, getDailyMetaRef, setDailyMeta } from "./daily";

export const awardSocialEngagement = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Requiere sesión."
      );
    }

    const uid = context.auth.uid;
    const linkId = String(data?.linkId ?? "")
      .trim()
      .toLowerCase();
    const platform = String(data?.platform ?? "")
      .trim()
      .toLowerCase();

    functions.logger.info("[social] awardSocialEngagement called", {
      uid,
      linkId,
      platform,
    });

    const cfg = SOCIAL_LINK_WHITELIST[linkId];
    if (!cfg) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "linkId no permitido"
      );
    }
    if (cfg.platform !== platform) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "platform no coincide con linkId"
      );
    }

    const todayKey = formatDateKeyUTC(new Date());
    const metaRef = getDailyMetaRef(uid, "social_meta", todayKey);
    const profileRef = db
      .collection("users")
      .doc(uid)
      .collection("points_profile")
      .doc("profile");
    const ledgerRef = db
      .collection("users")
      .doc(uid)
      .collection("points_ledger")
      .doc();

    let alreadyAwarded = false;
    let pointsAdded = 0;

    await db.runTransaction(async (tx) => {
      const meta = await getDailyMeta<Partial<Record<SocialPlatform, boolean>>>(
        tx,
        metaRef
      );

      if (meta[platform as SocialPlatform]) {
        alreadyAwarded = true;
        return;
      }

      const now = admin.firestore.Timestamp.now();

      await awardPointsTransaction(tx, {
        userId: uid,
        points: SOCIAL_ENGAGEMENT_POINTS,
        eventType: "social_follow",
        metadata: { linkId, platform, day: todayKey },
        now,
        profileRef,
        ledgerRef,
      });

      setDailyMeta(tx, metaRef, { [platform]: true });
      pointsAdded = SOCIAL_ENGAGEMENT_POINTS;
    });

    functions.logger.info("[social] award result", {
      uid,
      platform,
      linkId,
      alreadyAwarded,
      pointsAdded,
    });

    return {
      success: true,
      alreadyAwarded,
      awardedToday: !alreadyAwarded,
      points: pointsAdded,
    };
  });

export const awardNewsClick = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    functions.logger.info("[news] award request", {
      uid: context.auth?.uid,
      newsId: data?.newsId,
    });

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Requiere sesión."
      );
    }

    const rawNewsId = data?.newsId;
    if (typeof rawNewsId !== "string" || !rawNewsId.trim()) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "newsId requerido"
      );
    }
    const newsId = rawNewsId.trim();

    const newsRef = db.collection("News").doc(newsId);
    const newsSnap = await newsRef.get();
    if (!newsSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Noticia no encontrada."
      );
    }

    const newsData = newsSnap.data() ?? {};
    const title =
      typeof newsData.title === "string" && newsData.title
        ? newsData.title
        : null;

    const uid = context.auth.uid;
    const todayKey = formatDateKeyUTC(new Date());
    const metaRef = getDailyMetaRef(uid, "news_meta", todayKey);
    const profileRef = db
      .collection("users")
      .doc(uid)
      .collection("points_profile")
      .doc("profile");
    const ledgerRef = db
      .collection("users")
      .doc(uid)
      .collection("points_ledger")
      .doc(`news_click_${todayKey}`);
    const clickLogRef = metaRef.collection("clicks").doc();

    const now = admin.firestore.Timestamp.now();
    let alreadyAwarded = false;
    let awardedNow = false;

    await db.runTransaction(async (tx) => {
      const meta = await getDailyMeta<{ clicked?: boolean }>(tx, metaRef);

      if (meta.clicked === true) {
        alreadyAwarded = true;
        return;
      }
      awardedNow = true;

      await awardPointsTransaction(tx, {
        userId: uid,
        points: NEWS_CLICK_POINTS,
        eventType: "news_click",
        metadata: { newsId, newsTitle: title, day: todayKey },
        now,
        profileRef,
        ledgerRef,
      });

      setDailyMeta(tx, metaRef, {
        clicked: true,
        newsId,
        newsTitle: title,
        day: todayKey,
        createdAt: now,
      });
    });

    await clickLogRef.set({
      newsId,
      newsTitle: title,
      clickedAt: admin.firestore.FieldValue.serverTimestamp(),
      awarded: awardedNow && !alreadyAwarded,
    });

    if (alreadyAwarded) {
      functions.logger.info("[news] already awarded today", {
        uid,
        newsId,
        title,
        day: todayKey,
      });
      return {
        success: true,
        alreadyAwarded: true,
        points: 0,
        newsId,
        title,
      };
    }

    functions.logger.info("[news] awarded news click", {
      uid,
      newsId,
      title,
      points: NEWS_CLICK_POINTS,
      day: todayKey,
    });

    return {
      success: true,
      alreadyAwarded: false,
      points: NEWS_CLICK_POINTS,
      newsId,
      title,
    };
  });
