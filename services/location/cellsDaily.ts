import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import type { EnrichedLocationEvent } from "@/services/location/enrichLocationEvent";

const HOURS_IN_DAY = 24;

type AccuracyCounts = Record<string, number>;

type CellsDailyDoc = {
  date: string;
  cityId: string | null;
  geohash: string;
  parishId: string | null;
  neighborhoodSlug: string | null;
  pings: number;
  uniqueUsers: number;
  medianAccuracy: number;
  hourlyHistogram: number[];
  isPublishable: boolean;
  accuracyCounts?: AccuracyCounts;
};

const getHourIndex = (hourString: string): number => {
  const parsedHour = Number.parseInt(hourString.slice(0, 2), 10);
  if (
    Number.isFinite(parsedHour) &&
    parsedHour >= 0 &&
    parsedHour < HOURS_IN_DAY
  ) {
    return parsedHour;
  }

  return 0;
};

const calculateMedianFromCounts = (
  counts: AccuracyCounts,
  totalCount: number
): number => {
  const sortedEntries = Object.entries(counts)
    .map(([key, value]) => [Number(key), value] as const)
    .sort(([a], [b]) => a - b);

  if (sortedEntries.length === 0 || totalCount === 0) {
    return 0;
  }

  const midpoint = (totalCount - 1) / 2;
  let cumulative = 0;

  for (let index = 0; index < sortedEntries.length; index += 1) {
    const [accuracy, count] = sortedEntries[index];
    const nextCumulative = cumulative + count;

    if (midpoint >= cumulative && midpoint < nextCumulative) {
      // Odd number of samples: the median sits within this bucket
      if (totalCount % 2 === 1) {
        return accuracy;
      }

      // Even number of samples: find the next accuracy boundary
      if (nextCumulative - cumulative > 1 || midpoint + 0.5 < nextCumulative) {
        return accuracy;
      }

      const followingEntry =
        sortedEntries[Math.min(index + 1, sortedEntries.length - 1)];
      const nextAccuracy = followingEntry?.[0] ?? accuracy;

      return (accuracy + nextAccuracy) / 2;
    }

    cumulative = nextCumulative;
  }

  return sortedEntries[sortedEntries.length - 1][0];
};

const ensureHourlyHistogram = (histogram?: number[]): number[] => {
  const base = Array.isArray(histogram) ? [...histogram] : [];

  while (base.length < HOURS_IN_DAY) {
    base.push(0);
  }

  return base.slice(0, HOURS_IN_DAY);
};

export const updateCellDailyForEvent = async (
  event: EnrichedLocationEvent
): Promise<void> => {
  const docId = `${event.date}-${event.cityId}-${event.geohash}`;
  const cellRef = doc(collection(db, "cellsDaily"), docId);
  const userSeenRef = doc(collection(cellRef, "uidsSeen"), event.userAnonId);
  const eventSeenRef = doc(
    collection(cellRef, "eventsSeen"),
    `${event.userAnonId}-${event.timestamp}`
  );

  await runTransaction(db, async (transaction) => {
    const [eventSeenSnap, cellSnap, userSeenSnap] = await Promise.all([
      transaction.get(eventSeenRef),
      transaction.get(cellRef),
      transaction.get(userSeenRef),
    ]);

    if (eventSeenSnap.exists()) {
      return;
    }

    const existingData = cellSnap.data() as CellsDailyDoc | undefined;
    const histogram = ensureHourlyHistogram(existingData?.hourlyHistogram);
    const hourIndex = getHourIndex(event.hour);
    histogram[hourIndex] = (histogram[hourIndex] ?? 0) + 1;

    const updatedPings = (existingData?.pings ?? 0) + 1;
    let updatedUniqueUsers = existingData?.uniqueUsers ?? 0;

    if (!userSeenSnap.exists()) {
      updatedUniqueUsers += 1;
      transaction.set(userSeenRef, { firstSeenAt: serverTimestamp() });
    }

    const accuracyKey = Number(event.coords.accuracy.toFixed(2)).toString();
    const accuracyCounts: AccuracyCounts = {
      ...(existingData?.accuracyCounts ?? {}),
    };
    accuracyCounts[accuracyKey] = (accuracyCounts[accuracyKey] ?? 0) + 1;
    const medianAccuracy = calculateMedianFromCounts(
      accuracyCounts,
      updatedPings
    );

    const payload: CellsDailyDoc = {
      date: event.date,
      cityId: event.cityId,
      geohash: event.geohash,
      parishId: event.parishId,
      neighborhoodSlug: event.neighborhoodSlug,
      pings: updatedPings,
      uniqueUsers: updatedUniqueUsers,
      medianAccuracy,
      hourlyHistogram: histogram,
      isPublishable: updatedUniqueUsers >= 5,
      accuracyCounts,
    };

    transaction.set(cellRef, payload, { merge: true });
    transaction.set(eventSeenRef, { createdAt: serverTimestamp() });
  });
};
