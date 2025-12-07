import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/config/FirebaseConfig";

export const useFirebaseUid = () => {
  const [firebaseUid, setFirebaseUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [loadingFirebaseUid, setLoadingFirebaseUid] = useState(!auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUid(user?.uid ?? null);
      setLoadingFirebaseUid(false);
    });

    return () => unsub();
  }, []);

  return { firebaseUid, loadingFirebaseUid };
};
