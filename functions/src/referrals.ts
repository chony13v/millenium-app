import { admin, db, functions } from "./firebase";
import {
  REDEEMER_REWARD_POINTS,
  REFERRAL_CODE_ALPHABET,
  REFERRAL_CODE_LENGTH,
  REFERRAL_MAX_REDEMPTIONS_PER_CODE,
  REFERRER_MONTHLY_CAP,
  REFERRER_REWARD_POINTS,
} from "./constants";
import { formatMonthKey } from "./time";
import { awardPointsTransaction } from "./points";

type RedeemReferralResponse = {
  success: true;
  alreadyRedeemed?: boolean;
  code?: string;
  codeUsed?: string;
  referrerUid?: string;
  redeemedAt?: admin.firestore.Timestamp;
  referrerPoints?: number;
  redeemerPoints?: number;
  message: string;
};

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

    const logInvalid = (reason: string) =>
      functions.logger.warn("referral_code_invalid", {
        reason,
        code,
        redeemerUid,
      });

    const response = await db.runTransaction<RedeemReferralResponse>(
      async (tx) => {
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
            return {
              success: true,
              alreadyRedeemed: true,
              codeUsed: markerData.code ?? code,
              referrerUid: markerData.referrerUid,
              redeemedAt: markerData.redeemedAt,
              message: "✅ Código ya canjeado anteriormente",
            };
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
          throw new functions.https.HttpsError(
            "not-found",
            "Código no existe."
          );
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
        const referrerStatsRef = db
          .collection("referral_stats")
          .doc(referrerUid);
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

        const referrerLedgerRef = db
          .collection("users")
          .doc(referrerUid)
          .collection("points_ledger")
          .doc();
        const redeemerLedgerRef = db
          .collection("users")
          .doc(redeemerUid)
          .collection("points_ledger")
          .doc();
        const redemptionRecordRef = db
          .collection("referralRedemptions")
          .doc();

        await awardPointsTransaction(tx, {
          userId: referrerUid,
          points: REFERRER_REWARD_POINTS,
          eventType: "referral_reward",
          metadata: { code, redeemerUid },
          now: nowTs,
          profileRef: referrerProfileRef,
          ledgerRef: referrerLedgerRef,
        });

        await awardPointsTransaction(tx, {
          userId: redeemerUid,
          points: REDEEMER_REWARD_POINTS,
          eventType: "referral_redeem",
          metadata: { code, referrerUid },
          now: nowTs,
          profileRef: redeemerProfileRef,
          ledgerRef: redeemerLedgerRef,
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

        return {
          success: true,
          referrerUid,
          code,
          referrerPoints: REFERRER_REWARD_POINTS,
          redeemerPoints: REDEEMER_REWARD_POINTS,
          message: "✅ Canje realizado",
        };
      }
    );

    const awardedReferrerPoints = response.alreadyRedeemed
      ? 0
      : response.referrerPoints ?? REFERRER_REWARD_POINTS;
    const awardedRedeemerPoints = response.alreadyRedeemed
      ? 0
      : response.redeemerPoints ?? REDEEMER_REWARD_POINTS;

    functions.logger.info("[referrals] Resultado canje", {
      redeemerUid,
      code,
      alreadyRedeemed: !!response.alreadyRedeemed,
      event: "referral_code_redeemed",
      referrerUid: response.referrerUid,
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

    const profileSnap = await profileRef.get();
    let existingCode =
      (profileSnap.exists ? profileSnap.data()?.referralCode : null) ?? null;

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
