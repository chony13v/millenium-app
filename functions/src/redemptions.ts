import { admin, db, functions } from "./firebase";
import { awardPointsTransaction } from "./points";

type RedemptionDoc = {
  status?: string;
  userId?: string;
  rewardId?: string;
  merchantId?: string;
};

type MerchantDoc = {
  name?: string;
  pinCode?: string; // TODO: almacenar hash del PIN en lugar de texto plano
  active?: boolean;
};

type RewardDoc = {
  cost?: number | string;
  merchantId?: string;
  cityId?: string | null;
  title?: string;
};

const buildRedemptionQrUrl = (redemptionId: string) =>
  `https://milleniumfc.com/canje?id=${encodeURIComponent(redemptionId)}`;

// Genera un canje y descuenta puntos en la misma transacción.
// Esta función será invocada por la app móvil al pulsar "Canjear".
export const createRedemptionWithPoints = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Requiere sesión."
      );
    }

    const rewardId =
      typeof data?.rewardId === "string" ? data.rewardId.trim() : "";
    const overrideMerchantId =
      typeof data?.merchantId === "string" ? data.merchantId.trim() : "";
    const cityId =
      typeof data?.cityId === "string" && data.cityId
        ? data.cityId.trim()
        : null;
    const rewardCostRaw =
      typeof data?.rewardCost === "number"
        ? data.rewardCost
        : typeof data?.rewardCost === "string"
        ? Number(data.rewardCost)
        : null;
    const rewardTitle =
      typeof data?.rewardTitle === "string" ? data.rewardTitle.trim() : "";

    if (!rewardId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "rewardId es requerido"
      );
    }

    const uid = context.auth.uid;
    const rewardRef = db.collection("rewards").doc(rewardId);
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

    const redemptionRef = db.collection("redemptions").doc();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 30 * 24 * 60 * 60 * 1000
    );

    let qrUrl = "";
    let newTotal = 0;
    let merchantId: string | undefined;

    await db.runTransaction(async (tx) => {
      const [rewardSnap, profileSnap] = await Promise.all([
        tx.get(rewardRef),
        tx.get(profileRef),
      ]);

      let rewardData: RewardDoc = rewardSnap.exists
        ? (rewardSnap.data() as RewardDoc)
        : {};
      // Si no existe en catálogo, usamos el costo enviado por el cliente (fallback)
      if (!rewardSnap.exists && rewardCostRaw != null) {
        rewardData = {
          ...rewardData,
          cost: rewardCostRaw,
          merchantId: overrideMerchantId || rewardData.merchantId,
          cityId: rewardData.cityId ?? cityId ?? null,
        };
        functions.logger.warn(
          "[rewards] reward not found in catalog, using client cost",
          { rewardId, rewardCost: rewardCostRaw }
        );
      } else if (!rewardSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "La recompensa no existe en el catálogo."
        );
      }

      const cost = Number(rewardData.cost ?? 0);
      if (!Number.isFinite(cost) || cost < 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "La recompensa tiene un costo inválido."
        );
      }

      const profile = (profileSnap.exists ? profileSnap.data() : {}) as {
        total?: number;
      };
      const currentTotal = profile.total ?? 0;
      if (currentTotal < cost) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Puntos insuficientes para canjear."
        );
      }

      merchantId = overrideMerchantId || rewardData.merchantId;
      if (!merchantId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "La recompensa no tiene comercio asociado."
        );
      }

      qrUrl = buildRedemptionQrUrl(redemptionRef.id);

      const awardResult = await awardPointsTransaction(tx, {
        userId: uid,
        points: -cost,
        eventType: "reward_redeem",
        metadata: {
          rewardId,
          redemptionId: redemptionRef.id,
          merchantId,
          rewardTitle: rewardTitle || rewardData.title || undefined,
        },
        now,
        profileRef,
        ledgerRef,
      });
      newTotal = awardResult.newTotal;

      tx.set(redemptionRef, {
        id: redemptionRef.id,
        userId: uid,
        rewardId,
        merchantId,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
        qrUrl,
        cityId: cityId ?? rewardData.cityId ?? null,
        appVersion: null,
      });

      functions.logger.info("[rewards] redemption_created", {
        redemptionId: redemptionRef.id,
        rewardId,
        merchantId,
        userId: uid,
        cost,
        newTotal,
      });
    });

    return {
      ok: true,
      redemptionId: redemptionRef.id,
      qrUrl,
      status: "pending",
      newTotal,
      userId: uid,
      merchantId: merchantId ?? null,
      rewardId,
    };
  });

// Esta función la invocará la web de milleniumfc.com/canje para confirmar un canje con PIN.
export const confirmRedemptionWithPin = functions
  .region("us-central1")
  .https.onCall(async (data) => {
    const rawRedemptionId = (data as { redemptionId?: unknown })?.redemptionId;
    const rawMerchantPin = (data as { merchantPin?: unknown })?.merchantPin;

    const redemptionId =
      typeof rawRedemptionId === "string" ? rawRedemptionId.trim() : "";
    const merchantPin =
      typeof rawMerchantPin === "string" ? rawMerchantPin.trim() : "";

    if (!redemptionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "redemptionId es requerido"
      );
    }

    if (!merchantPin) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "merchantPin es requerido"
      );
    }

    const redemptionRef = db.collection("redemptions").doc(redemptionId);

    let merchantId: string | undefined;
    let rewardId: string | undefined;

    await db.runTransaction(async (tx) => {
      const redemptionSnap = await tx.get(redemptionRef);
      if (!redemptionSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "El canje no existe."
        );
      }

      const redemptionData = redemptionSnap.data() as RedemptionDoc;
      merchantId = redemptionData.merchantId;
      rewardId = redemptionData.rewardId;
      const currentStatus = redemptionData.status ?? "unknown";

      if (currentStatus !== "pending") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `El canje no está pendiente (estado actual: ${currentStatus}).`
        );
      }

      if (!merchantId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Canje sin comercio asignado."
        );
      }

      const merchantRef = db.collection("merchants").doc(merchantId);
      const merchantSnap = await tx.get(merchantRef);
      if (!merchantSnap.exists) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "El comercio no existe."
        );
      }

      const merchantData = merchantSnap.data() as MerchantDoc;
      if (merchantData.active === false) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Comercio inactivo."
        );
      }

      const storedPin = merchantData.pinCode;
      if (!storedPin || typeof storedPin !== "string") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "PIN no configurado para este comercio."
        );
      }

      // Nota: idealmente compararíamos un hash del PIN en lugar de texto plano.
      if (storedPin.trim() !== merchantPin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "PIN incorrecto."
        );
      }

      tx.update(redemptionRef, {
        status: "redeemed",
        redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info("[redemptions] canje confirmado", {
        redemptionId,
        merchantId,
        rewardId,
        previousStatus: currentStatus,
      });
    });

    // Obtener el timestamp final (incluyendo el serverTimestamp resuelto)
    const updatedSnap = await redemptionRef.get();
    const updated = updatedSnap.data() as RedemptionDoc & {
      redeemedAt?: admin.firestore.Timestamp;
    };

    return {
      ok: true,
      redemptionId,
      merchantId: merchantId ?? null,
      rewardId: rewardId ?? null,
      newStatus: "redeemed",
      redeemedAt: updated?.redeemedAt ?? null,
    };
  });

// En una fase posterior se puede ampliar esta función para ajustar el saldo de puntos
// del usuario dentro de la misma transacción, una vez validado el canje.
