import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();
const BATCH_SIZE = 400;

const migrateRedemptions = async (oldId: string, newId: string) => {
  let total = 0;

  while (true) {
    const snap = await db
      .collection("redemptions")
      .where("rewardId", "==", oldId)
      .limit(BATCH_SIZE)
      .get();

    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { rewardId: newId });
    });
    await batch.commit();

    total += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }

  console.log(`[redemptions] ${oldId} -> ${newId}: ${total} documentos actualizados`);
};

const renameReward = async (oldId: string, title: unknown) => {
  const newId = typeof title === "string" ? title.trim() : "";
  if (!newId) {
    console.warn(`[rewards] ${oldId}: sin title válido, se omite`);
    return;
  }
  if (newId.includes("/")) {
    console.warn(`[rewards] ${oldId}: el title contiene "/", se omite`);
    return;
  }
  if (newId === oldId) {
    return;
  }

  const rewardsRef = db.collection("rewards");
  const oldRef = rewardsRef.doc(oldId);
  const newRef = rewardsRef.doc(newId);

  await db.runTransaction(async (tx) => {
    const [oldSnap, newSnap] = await Promise.all([
      tx.get(oldRef),
      tx.get(newRef),
    ]);

    if (!oldSnap.exists) {
      throw new Error(`[rewards] ${oldId}: documento no existe`);
    }
    if (newSnap.exists) {
      throw new Error(
        `[rewards] ${oldId}: ya existe un reward con id destino "${newId}"`
      );
    }

    tx.set(newRef, oldSnap.data() ?? {});
    tx.delete(oldRef);
  });

  await migrateRedemptions(oldId, newId);
  console.log(`[rewards] ${oldId} -> ${newId} listo`);
};

async function main() {
  const rewardsSnap = await db.collection("rewards").get();
  const seenTargets = new Set<string>();

  for (const docSnap of rewardsSnap.docs) {
    const data = docSnap.data() as { title?: unknown };
    const targetId = typeof data.title === "string" ? data.title.trim() : "";

    if (!targetId) {
      console.warn(`[rewards] ${docSnap.id}: sin title, se omite`);
      continue;
    }

    if (seenTargets.has(targetId) && targetId !== docSnap.id) {
      console.error(
        `[rewards] ${docSnap.id}: conflicto, otro reward apunta al mismo title "${targetId}"`
      );
      continue;
    }
    seenTargets.add(targetId);

    try {
      await renameReward(docSnap.id, targetId);
    } catch (err) {
      console.error(err);
    }
  }

  console.log("✅ Migración finalizada.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
