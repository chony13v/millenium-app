import { runTransaction, type Firestore, type Transaction } from "firebase/firestore";

// Retries Firestore transactions on transient contention errors.
const RETRYABLE_CODES = new Set(["failed-precondition", "aborted"]);
const BASE_DELAY_MS = 50;
const DEFAULT_ATTEMPTS = 8;

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const runTransactionWithRetry = async <T>(
  db: Firestore,
  executor: (tx: Transaction) => Promise<T>,
  options?: { maxAttempts?: number }
): Promise<T> => {
  const attempts = options?.maxAttempts ?? DEFAULT_ATTEMPTS;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      // Usamos un único intento interno y manejamos el backoff manualmente
      return await runTransaction(db, executor, { maxAttempts: 1 });
    } catch (err: any) {
      lastError = err;
      const code = err?.code as string | undefined;
      if (!RETRYABLE_CODES.has(code)) {
        throw err;
      }

      const isLastAttempt = attempt === attempts - 1;
      if (isLastAttempt) break;

      const backoffMs = BASE_DELAY_MS * (attempt + 1);
      await delay(backoffMs);
    }
  }

  throw lastError as any;
};
