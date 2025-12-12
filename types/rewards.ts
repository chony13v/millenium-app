import { type Timestamp } from "firebase/firestore";

export type Reward = {
  id: string;
  title: string;
  description?: string;
  cost: number;
  merchantId: string;
  merchantName?: string;
  cityId?: string | null;
  imageUrl?: string | null;
};

export type RedemptionStatus = "pending" | "validated" | "rejected" | "expired";

export type Redemption = {
  id: string;
  userId: string;
  rewardId: string;
  merchantId: string;
  status: RedemptionStatus;
  createdAt?: Timestamp | null;
  expiresAt?: Timestamp | null;
  qrUrl: string;
  cityId?: string | null;
  appVersion?: string | null;
};
