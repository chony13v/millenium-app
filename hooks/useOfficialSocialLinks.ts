import { useCallback, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import {
  SOCIAL_ID_PLATFORM_MAP,
  SOCIAL_PLATFORMS,
  type SocialPlatform,
} from "@/constants/social";

type CategoryDoc = {
  name?: string;
  icon?: string;
  link?: string;
};

export type OfficialSocialLink = {
  id: string;
  linkId: string;
  title: string;
  link: string;
  platform: SocialPlatform;
  icon?: string | null;
};

const detectPlatform = (
  id: string,
  data: CategoryDoc
): SocialPlatform | null => {
  const normalizedId = id.toLowerCase();
  if (SOCIAL_ID_PLATFORM_MAP[normalizedId]) {
    return SOCIAL_ID_PLATFORM_MAP[normalizedId];
  }

  const haystack = `${data.name ?? ""} ${data.link ?? ""} ${normalizedId}`.toLowerCase();
  if (haystack.includes("instagram")) return "instagram";
  if (haystack.includes("tiktok")) return "tiktok";
  if (haystack.includes("youtube")) return "youtube";
  if (haystack.includes("facebook")) return "facebook";

  return null;
};

export const useOfficialSocialLinks = () => {
  const [links, setLinks] = useState<OfficialSocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const snapshot = await getDocs(collection(db, "Category"));
      const byPlatform = new Map<SocialPlatform, OfficialSocialLink>();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CategoryDoc;
        const normalizedId = docSnap.id.toLowerCase();
        const platform = detectPlatform(normalizedId, data);
        if (!platform || !data.link) return;
        if (byPlatform.has(platform)) return;

        byPlatform.set(platform, {
          id: docSnap.id,
          linkId: SOCIAL_ID_PLATFORM_MAP[normalizedId] ?? platform,
          title: data.name || docSnap.id,
          link: data.link,
          platform,
          icon: data.icon ?? null,
        });
      });

      const ordered = SOCIAL_PLATFORMS.map(
        (platform) => byPlatform.get(platform)
      ).filter(Boolean) as OfficialSocialLink[];

      setLinks(
        ordered.length > 0 ? ordered : Array.from(byPlatform.values())
      );
    } catch (err: any) {
      setError(
        err?.message ?? "No se pudieron cargar las redes oficiales. Intenta más tarde."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { links, loading, error, refresh };
};
