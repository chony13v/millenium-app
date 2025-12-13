import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "@/config/FirebaseConfig";

type LogSocialMediaClickInput = {
  channelId: string;
  url: string;
  userId?: string | null;
};

export const logSocialMediaClick = async ({
  channelId,
  url,
  userId,
}: LogSocialMediaClickInput) => {
  try {
    await addDoc(collection(db, "socialmedia_clicks"), {
      channelId,
      url,
      userId: userId ?? null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("[socialmedia_clicks] no se pudo registrar click", error);
  }
};
