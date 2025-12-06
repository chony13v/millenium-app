import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";
import { app, db } from "@/config/FirebaseConfig";

const getFunctionsInstance = () => getFunctions(app, "us-central1");

export const fetchReferralCode = async (userId?: string | null) => {
  if (!userId) return null;
  const profileRef = doc(db, "users", userId, "public_profile", "profile");
  const snap = await getDoc(profileRef);
  if (!snap.exists()) return null;
  const data = snap.data() as { referralCode?: string | null; referralCodeActive?: boolean };
  if (data.referralCodeActive === false) return null;
  return data.referralCode ?? null;
};

export const ensureReferralCode = async () => {
  const functions = getFunctionsInstance();
  const callable = httpsCallable(functions, "ensureReferralCode");
  const result = await callable();
  const data = result.data as { code?: string | null };
  return data.code ?? null;
};

export const redeemReferralCode = async (code: string) => {
  const functions = getFunctionsInstance();
  const callable = httpsCallable(functions, "redeemReferralCode");
  const result = await callable({ code });
  return result.data as {
    success: boolean;
    alreadyRedeemed?: boolean;
    codeUsed?: string;
    referrerUid?: string;
    referrerPoints?: number;
    redeemerPoints?: number;
    message?: string;
  };
};
