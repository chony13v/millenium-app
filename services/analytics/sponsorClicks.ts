import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";

type LogSponsorClickInput = {
  sponsorId: string;
  url: string;
  userId?: string | null;
};

export const logSponsorClick = async ({
  sponsorId,
  url,
  userId,
}: LogSponsorClickInput) => {
  try {
    await addDoc(collection(db, "sponsor_clicks"), {
      sponsorId,
      url,
      userId: userId ?? null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("[sponsor_clicks] no se pudo registrar click", error);
  }
};
