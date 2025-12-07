import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

type Coords = { latitude: number; longitude: number };

const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];
const WEEKLY_EVENT_POINTS = 50;
const EVENT_TYPE = "weekly_event_attendance";
const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const REFERRER_REWARD_POINTS = 200;
const REDEEMER_REWARD_POINTS = 100;
const REFERRER_MONTHLY_CAP = 50;
const REFERRAL_MAX_REDEMPTIONS_PER_CODE = 500;
const SOCIAL_ENGAGEMENT_POINTS = 20;
const NEWS_CLICK_POINTS = 5;

const SOCIAL_PLATFORMS = ["instagram", "tiktok", "youtube", "facebook"] as const;
type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const SOCIAL_LINK_WHITELIST: Record<
  string,
  { platform: SocialPlatform; title: string }
> = {
  instagram: { platform: "instagram", title: "Instagram oficial" },
  tiktok: { platform: "tiktok", title: "TikTok oficial" },
  youtube: { platform: "youtube", title: "YouTube oficial" },
  facebook: { platform: "facebook", title: "Facebook oficial" },
};

const getLevelProgress = (total: number) => {
  const levelIndex = LEVEL_THRESHOLDS.findIndex(
    (threshold, idx) =>
      total >= threshold &&
      (LEVEL_THRESHOLDS[idx + 1] === undefined ||
        total < LEVEL_THRESHOLDS[idx + 1])
  );

  const level = Math.max(1, levelIndex === -1 ? 1 : levelIndex + 1);
  const currentBase = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold =
    LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const range = Math.max(1, nextThreshold - currentBase);
  const progress = Math.min(1, Math.max(0, (total - currentBase) / range));
  const xpToNext = Math.max(0, nextThreshold - total);

  return { level, progress, xpToNext };
};

const haversineDistanceMeters = (from: Coords, to: Coords) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatMonthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const formatDateKeyUTC = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;

const isSocialPlatform = (value: unknown): value is SocialPlatform =>
  typeof value === "string" &&
  SOCIAL_PLATFORMS.includes(value.toLowerCase() as SocialPlatform);

const generateReferralCode = () => {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length);
    code += REFERRAL_CODE_ALPHABET[idx];
  }
  return code;
};

const createReferralCodeForUser = async (uid: string) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateReferralCode();
    const codeRef = db.collection("referralCodes").doc(candidate);
    const snap = await codeRef.get();
    if (snap.exists) continue;

    await codeRef.set({
      referrerUid: uid,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      redeemedCount: 0,
      maxRedemptions: REFERRAL_MAX_REDEMPTIONS_PER_CODE,
      expiresAt: null,
    });

    return candidate;
  }

  throw new Error("No se pudo generar un código de referido único");
};

export const onUserCreateGenerateReferralCode = functions.auth
  .user()
  .onCreate(async (user) => {
    const uid = user.uid;
    functions.logger.info("[referrals] Generando código para nuevo usuario", {
      uid,
    });

    try {
      const code = await createReferralCodeForUser(uid);
      const profileRef = db
        .collection("users")
        .doc(uid)
        .collection("public_profile")
        .doc("profile");

      await profileRef.set(
        {
          referralCode: code,
          referralCodeCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          referralCodeActive: true,
        },
        { merge: true }
      );

      functions.logger.info("[referrals] Código generado", { uid, code });
    } catch (error) {
      functions.logger.error(
        "[referrals] Error generando código al crear usuario",
        { uid, error }
      );
    }
  });

export const redeemReferralCode = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Requiere sesión."
      );
    }

    const rawCode = data?.code;
    if (!rawCode || typeof rawCode !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Debes enviar un código válido."
      );
    }

    const code = rawCode.trim().toUpperCase();
    if (!code) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Código vacío no permitido."
      );
    }

    const redeemerUid = context.auth.uid;
    const nowTs = admin.firestore.Timestamp.now();
    const monthKey = formatMonthKey(nowTs.toDate());
    const codeRef = db.collection("referralCodes").doc(code);
    const redeemerProfileRef = db
      .collection("users")
      .doc(redeemerUid)
      .collection("points_profile")
      .doc("profile");
    const redeemerMarkerRef = db
      .collection("users")
      .doc(redeemerUid)
      .collection("referral_meta")
      .doc("redeemed");

    let response: any = null;

    const logInvalid = (reason: string) =>
      functions.logger.warn("referral_code_invalid", {
        reason,
        code,
        redeemerUid,
      });

    await db.runTransaction(async (tx) => {
      const markerSnap = await tx.get(redeemerMarkerRef);
      if (markerSnap.exists) {
        const markerData = markerSnap.data() as {
          code?: string;
          redeemedAt?: admin.firestore.Timestamp;
          referrerUid?: string;
        };

        if (markerData.code === code) {
          functions.logger.info("[referrals] marker hit same code", {
            redeemerUid,
            codeIntentado: code,
            markerPath: redeemerMarkerRef.path,
            markerData,
          });
          response = {
            success: true,
            alreadyRedeemed: true,
            codeUsed: markerData.code ?? code,
            referrerUid: markerData.referrerUid,
            redeemedAt: markerData.redeemedAt,
            message: "✅ Código ya canjeado anteriormente",
          };
          return;
        }

        functions.logger.info("[referrals] marker hit other code", {
          redeemerUid,
          codeIntentado: code,
          markerPath: redeemerMarkerRef.path,
          markerData,
        });
        logInvalid("already_redeemed_other_code");
        throw new functions.https.HttpsError(
          "failed-precondition",
          "⚠️ Ya canjeaste un código de registro previamente"
        );
      }

      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists) {
        logInvalid("code_not_found");
        throw new functions.https.HttpsError("not-found", "Código no existe.");
      }

      const codeData = codeSnap.data() as {
        referrerUid?: string;
        active?: boolean;
        redeemedCount?: number;
        maxRedemptions?: number;
        expiresAt?: admin.firestore.Timestamp | null;
      };

      const referrerUid = codeData.referrerUid;
      if (!referrerUid) {
        logInvalid("missing_referrer");
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Código inválido."
        );
      }

      if (referrerUid === redeemerUid) {
        logInvalid("self_redeem");
        throw new functions.https.HttpsError(
          "failed-precondition",
          "No puedes usar tu propio código."
        );
      }

      if (codeData.active === false) {
        logInvalid("inactive");
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Código inactivo."
        );
      }

      if (
        codeData.expiresAt &&
        codeData.expiresAt.toMillis() <= nowTs.toMillis()
      ) {
        logInvalid("expired");
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Código expirado."
        );
      }

      const redeemedCount = codeData.redeemedCount ?? 0;
      const maxRedemptions =
        codeData.maxRedemptions ?? REFERRAL_MAX_REDEMPTIONS_PER_CODE;
      if (redeemedCount >= maxRedemptions) {
        logInvalid("max_redemptions_reached");
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Este código alcanzó su máximo de usos."
        );
      }

      const referrerProfileRef = db
        .collection("users")
        .doc(referrerUid)
        .collection("points_profile")
        .doc("profile");
      const referrerStatsRef = db.collection("referral_stats").doc(referrerUid);
      const referrerProfileSnap = await tx.get(referrerProfileRef);
      const redeemerProfileSnap = await tx.get(redeemerProfileRef);
      const statsSnap = await tx.get(referrerStatsRef);

      const stats = (statsSnap.exists ? statsSnap.data() : {}) as {
        currentMonth?: string;
        count?: number;
        maxPerMonth?: number;
      };
      const currentMonth = stats.currentMonth;
      const monthCount = currentMonth === monthKey ? stats.count ?? 0 : 0;
      const monthCap = stats.maxPerMonth ?? REFERRER_MONTHLY_CAP;
      if (monthCount >= monthCap) {
        logInvalid("referrer_monthly_cap");
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "El referente alcanzó su límite mensual."
        );
      }

      const refProfile = (
        referrerProfileSnap.exists ? referrerProfileSnap.data() : {}
      ) as {
        total?: number;
        xpToNext?: number;
        level?: number;
        streakCount?: number;
        lastDailyAwardAt?: admin.firestore.Timestamp | null;
        lastCityReportAt?: admin.firestore.Timestamp | null;
        lastSurveyIdVoted?: string | null;
      };
      const redeemerProfile = (
        redeemerProfileSnap.exists ? redeemerProfileSnap.data() : {}
      ) as {
        total?: number;
        xpToNext?: number;
        level?: number;
        streakCount?: number;
        lastDailyAwardAt?: admin.firestore.Timestamp | null;
        lastCityReportAt?: admin.firestore.Timestamp | null;
        lastSurveyIdVoted?: string | null;
      };

      const refNewTotal = (refProfile.total ?? 0) + REFERRER_REWARD_POINTS;
      const redeemerNewTotal =
        (redeemerProfile.total ?? 0) + REDEEMER_REWARD_POINTS;
      const refProgress = getLevelProgress(refNewTotal);
      const redeemerProgress = getLevelProgress(redeemerNewTotal);

      const refLedgerRef = db
        .collection("users")
        .doc(referrerUid)
        .collection("points_ledger")
        .doc();
      const redeemerLedgerRef = db
        .collection("users")
        .doc(redeemerUid)
        .collection("points_ledger")
        .doc();
      const redemptionRecordRef = db.collection("referralRedemptions").doc();

      tx.set(
        referrerProfileRef,
        {
          total: refNewTotal,
          level: refProgress.level,
          xpToNext: refProgress.xpToNext,
          streakCount: refProfile.streakCount ?? 0,
          lastEventAt: nowTs,
          lastDailyAwardAt: refProfile.lastDailyAwardAt ?? null,
          lastCityReportAt: refProfile.lastCityReportAt ?? null,
          lastSurveyIdVoted: refProfile.lastSurveyIdVoted ?? null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        redeemerProfileRef,
        {
          total: redeemerNewTotal,
          level: redeemerProgress.level,
          xpToNext: redeemerProgress.xpToNext,
          streakCount: redeemerProfile.streakCount ?? 0,
          lastEventAt: nowTs,
          lastDailyAwardAt: redeemerProfile.lastDailyAwardAt ?? null,
          lastCityReportAt: redeemerProfile.lastCityReportAt ?? null,
          lastSurveyIdVoted: redeemerProfile.lastSurveyIdVoted ?? null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(refLedgerRef, {
        eventId: refLedgerRef.id,
        eventType: "referral_reward",
        points: REFERRER_REWARD_POINTS,
        createdAt: nowTs,
        awardedBy: "cloud_function",
        metadata: { code, redeemerUid },
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(redeemerLedgerRef, {
        eventId: redeemerLedgerRef.id,
        eventType: "referral_redeem",
        points: REDEEMER_REWARD_POINTS,
        createdAt: nowTs,
        awardedBy: "cloud_function",
        metadata: { code, referrerUid },
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(
        codeRef,
        {
          redeemedCount: admin.firestore.FieldValue.increment(1),
          lastRedeemedAt: nowTs,
        },
        { merge: true }
      );

      tx.set(
        referrerStatsRef,
        {
          referrerUid,
          currentMonth: monthKey,
          count: monthCount + 1,
          maxPerMonth: monthCap,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(redemptionRecordRef, {
        code,
        referrerUid,
        redeemerUid,
        redeemedAt: nowTs,
        pointsAwarded: {
          referrer: REFERRER_REWARD_POINTS,
          redeemer: REDEEMER_REWARD_POINTS,
        },
        month: monthKey,
      });

      tx.set(
        redeemerMarkerRef,
        {
          code,
          referrerUid,
          redemptionId: redemptionRecordRef.id,
          redeemedAt: nowTs,
        },
        { merge: true }
      );

      response = {
        success: true,
        referrerUid,
        code,
        referrerPoints: REFERRER_REWARD_POINTS,
        redeemerPoints: REDEEMER_REWARD_POINTS,
        message: "✅ Canje realizado",
      };
    });

    if (!response) {
      throw new functions.https.HttpsError(
        "internal",
        "No se pudo canjear el código."
      );
    }

    const awardedReferrerPoints = response?.alreadyRedeemed
      ? 0
      : REFERRER_REWARD_POINTS;
    const awardedRedeemerPoints = response?.alreadyRedeemed
      ? 0
      : REDEEMER_REWARD_POINTS;

    functions.logger.info("[referrals] Resultado canje", {
      redeemerUid,
      code,
      alreadyRedeemed: !!response?.alreadyRedeemed,
      event: "referral_code_redeemed",
      referrerUid: response?.referrerUid,
      pointsGivenReferrer: awardedReferrerPoints,
      pointsGivenRedeemer: awardedRedeemerPoints,
      timestamp: admin.firestore.Timestamp.now().toMillis(),
    });

    return response;
  });

export const ensureReferralCode = functions
  .region("us-central1")
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Requiere sesión."
      );
    }

    const uid = context.auth.uid;
    const profileRef = db
      .collection("users")
      .doc(uid)
      .collection("public_profile")
      .doc("profile");

    // Busca primero en el perfil público
    const profileSnap = await profileRef.get();
    let existingCode =
      (profileSnap.exists ? profileSnap.data()?.referralCode : null) ?? null;

    // Si no hay, busca en referralCodes por referrerUid
    if (!existingCode) {
      const existingCodeQuery = await db
        .collection("referralCodes")
        .where("referrerUid", "==", uid)
        .limit(1)
        .get();
      if (!existingCodeQuery.empty) {
        existingCode = existingCodeQuery.docs[0].id;
      }
    }

    let code = existingCode;
    if (!code) {
      code = await createReferralCodeForUser(uid);
      functions.logger.info(
        "[referrals] Código creado desde ensureReferralCode",
        {
          uid,
          code,
        }
      );
    }

    // Reactivar/asegurar que esté activo y presente en perfil
    const codeRef = db.collection("referralCodes").doc(code);
    await Promise.all([
      codeRef.set({ active: true }, { merge: true }),
      profileRef.set(
        {
          referralCode: code,
          referralCodeActive: true,
          referralCodeCreatedAt:
            profileSnap.exists && profileSnap.data()?.referralCodeCreatedAt
              ? profileSnap.data()?.referralCodeCreatedAt
              : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
    ]);

    return { code };
  });

// PATCH START social_follow (versión completa: auth + whitelist + 1 vez/día + puntos)
export const awardSocialEngagement = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    // 1) Requiere sesión
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Requiere sesión.");
    }

    const uid = context.auth.uid;
    const linkId = String(data?.linkId ?? "").trim().toLowerCase();
    const platform = String(data?.platform ?? "").trim().toLowerCase();

    functions.logger.info("[social] awardSocialEngagement called", { uid, linkId, platform });

    // 2) Validación contra whitelist
    const cfg = SOCIAL_LINK_WHITELIST[linkId];
    if (!cfg) {
      throw new functions.https.HttpsError("invalid-argument", "linkId no permitido");
    }
    if (cfg.platform !== platform) {
      throw new functions.https.HttpsError("invalid-argument", "platform no coincide con linkId");
    }

    // 3) Idempotencia diaria (una vez por plataforma al día, en UTC)
    const todayKey = formatDateKeyUTC(new Date()); // YYYY-MM-DD
    const metaRef = db.collection("users").doc(uid).collection("social_meta").doc(todayKey);
    const profileRef = db.collection("users").doc(uid).collection("points_profile").doc("profile");
    const ledgerRef = db.collection("users").doc(uid).collection("points_ledger").doc();

    let alreadyAwarded = false;
    let pointsAdded = 0;

    await db.runTransaction(async (tx) => {
      // Meta de hoy: marcamos plataforma para no repetir
      const metaSnap = await tx.get(metaRef);
      const meta = (metaSnap.exists ? metaSnap.data() : {}) as Partial<Record<SocialPlatform, boolean>>;

      if (meta[platform as SocialPlatform]) {
        alreadyAwarded = true;
        return; // ya premiado hoy para esta plataforma
      }

      // Perfil actual
      const profSnap = await tx.get(profileRef);
      const prof = (profSnap.exists ? profSnap.data() : {}) as {
        total?: number;
        level?: number;
        xpToNext?: number;
        streakCount?: number;
        lastDailyAwardAt?: admin.firestore.Timestamp | null;
        lastCityReportAt?: admin.firestore.Timestamp | null;
        lastEventAt?: admin.firestore.Timestamp | null;
        lastSurveyIdVoted?: string | null;
      };

      // 4) Sumar puntos y recalcular nivel
      const now = admin.firestore.Timestamp.now();
      const newTotal = (prof.total ?? 0) + SOCIAL_ENGAGEMENT_POINTS;
      const { level, xpToNext } = getLevelProgress(newTotal);

      tx.set(
        profileRef,
        {
          total: newTotal,
          level,
          xpToNext,
          lastEventAt: now,
          streakCount: prof.streakCount ?? 0,
          lastDailyAwardAt: prof.lastDailyAwardAt ?? null,
          lastCityReportAt: prof.lastCityReportAt ?? null,
          lastSurveyIdVoted: prof.lastSurveyIdVoted ?? null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 5) Registrar en ledger
      tx.set(ledgerRef, {
        eventId: ledgerRef.id,
        eventType: "social_follow",
        points: SOCIAL_ENGAGEMENT_POINTS,
        createdAt: now,
        awardedBy: "cloud_function",
        metadata: { linkId, platform, day: todayKey },
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6) Marcar plataforma del día como otorgada
      tx.set(
        metaRef,
        { [platform]: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

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
    const todayKey = formatDateKeyUTC(new Date()); // YYYY-MM-DD
    const metaRef = db
      .collection("users")
      .doc(uid)
      .collection("news_meta")
      .doc(todayKey);
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
      const [metaSnap, profileSnap] = await Promise.all([
        tx.get(metaRef),
        tx.get(profileRef),
      ]);

      if (metaSnap.exists && metaSnap.data()?.clicked === true) {
        alreadyAwarded = true;
        return;
      }
      awardedNow = true;

      const profileData = (profileSnap.exists ? profileSnap.data() : {}) as {
        total?: number;
        level?: number;
        xpToNext?: number;
        streakCount?: number;
      };

      const newTotal = (profileData.total ?? 0) + NEWS_CLICK_POINTS;
      const { level, xpToNext } = getLevelProgress(newTotal);

      tx.set(
        profileRef,
        {
          total: newTotal,
          level,
          xpToNext,
          streakCount: profileData.streakCount ?? 0,
          lastEventAt: now,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(ledgerRef, {
        eventId: `news_click_${todayKey}`,
        eventType: "news_click",
        points: NEWS_CLICK_POINTS,
        createdAt: now,
        awardedBy: "cloud_function",
        metadata: { newsId, newsTitle: title, day: todayKey },
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(
        metaRef,
        {
          clicked: true,
          newsId,
          newsTitle: title,
          day: todayKey,
          createdAt: now,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // Registrar clic siempre, indicando si otorgó puntos
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

export const verifyWeeklyEventAttendance = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { attendanceId, eventId, userId, coords } = data ?? {};

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Se requiere sesión."
      );
    }

    if (
      !attendanceId ||
      !eventId ||
      !userId ||
      !coords ||
      typeof coords.latitude !== "number" ||
      typeof coords.longitude !== "number"
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Parámetros incompletos."
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "No autorizado."
      );
    }

    const attendanceRef = db
      .collection("weeklyEventAttendance")
      .doc(attendanceId);
    const eventRef = db.collection("weeklyEvents").doc(eventId);
    const profileRef = db
      .collection("users")
      .doc(userId)
      .collection("points_profile")
      .doc("profile");

    const [eventSnap, attendanceSnap, existingLedgerSnap] = await Promise.all([
      eventRef.get(),
      attendanceRef.get(),
      db
        .collection("users")
        .doc(userId)
        .collection("points_ledger")
        .where("eventType", "==", EVENT_TYPE)
        .where("metadata.eventId", "==", eventId)
        .limit(1)
        .get(),
    ]);

    if (!eventSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Evento no existe.");
    }

    const eventData = eventSnap.data() as {
      active?: boolean;
      isActive?: boolean;
      radiusMeters?: number;
      locationCenter?: Coords | null;
    };

    const isActive = eventData.active ?? eventData.isActive ?? true;
    const radiusMeters = eventData.radiusMeters ?? 0;
    const locationCenter = eventData.locationCenter ?? null;

    if (!isActive) {
      await attendanceRef.set(
        {
          pointsStatus: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return {
        verified: false,
        distanceMeters: Number.MAX_SAFE_INTEGER,
        pointsAdded: 0,
      };
    }

    if (!locationCenter || !radiusMeters) {
      await attendanceRef.set(
        {
          pointsStatus: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return {
        verified: false,
        distanceMeters: Number.MAX_SAFE_INTEGER,
        pointsAdded: 0,
      };
    }

    const distanceMeters = haversineDistanceMeters(coords, locationCenter);

    if (distanceMeters > radiusMeters) {
      await attendanceRef.set(
        {
          pointsStatus: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { verified: false, distanceMeters, pointsAdded: 0 };
    }

    const alreadyAwarded =
      (attendanceSnap.exists &&
        attendanceSnap.data()?.pointsStatus === "awarded") ||
      !existingLedgerSnap.empty;

    if (alreadyAwarded) {
      await attendanceRef.set(
        {
          pointsStatus: "awarded",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { verified: true, distanceMeters, pointsAdded: 0 };
    }

    const now = admin.firestore.Timestamp.now();
    const ledgerRef = db
      .collection("users")
      .doc(userId)
      .collection("points_ledger")
      .doc();

    await db.runTransaction(async (tx) => {
      const profileSnap = await tx.get(profileRef);
      const profile = (profileSnap.exists ? profileSnap.data() : {}) as {
        total?: number;
        level?: number;
        xpToNext?: number;
      };

      const newTotal = (profile.total ?? 0) + WEEKLY_EVENT_POINTS;
      const { level, xpToNext } = getLevelProgress(newTotal);

      tx.set(
        profileRef,
        {
          total: newTotal,
          level,
          xpToNext,
          lastEventAt: now,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(ledgerRef, {
        eventId,
        eventType: EVENT_TYPE,
        points: WEEKLY_EVENT_POINTS,
        createdAt: now,
        awardedBy: "cloud_function",
        metadata: { eventId, distanceMeters },
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(
        attendanceRef,
        {
          pointsStatus: "awarded",
          verified: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return { verified: true, distanceMeters, pointsAdded: WEEKLY_EVENT_POINTS };
  });
