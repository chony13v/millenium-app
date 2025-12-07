import { admin, db } from "./firebase";

export const getDailyMetaRef = (uid: string, collection: string, dayKey: string) =>
  db.collection("users").doc(uid).collection(collection).doc(dayKey);

export const getDailyMeta = async <T>(
  tx: FirebaseFirestore.Transaction,
  ref: FirebaseFirestore.DocumentReference
) => {
  const snap = await tx.get(ref);
  return (snap.exists ? (snap.data() as T) : ({} as T)) ?? ({} as T);
};

export const setDailyMeta = (
  tx: FirebaseFirestore.Transaction,
  ref: FirebaseFirestore.DocumentReference,
  data: FirebaseFirestore.DocumentData
) => tx.set(ref, { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });