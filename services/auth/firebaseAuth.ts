import { getAuth, signInWithCustomToken } from "firebase/auth";

const FIREBASE_TOKEN_TEMPLATE = "integration_firebase";

type GetTokenFn = (options: { template?: string }) => Promise<string | null>;

export async function linkClerkSessionToFirebase(getToken: GetTokenFn) {
  const auth = getAuth();
  const token = await getToken({ template: FIREBASE_TOKEN_TEMPLATE });

  if (!token) {
    throw new Error("No se recibió token de Firebase");
  }

  if (!auth.currentUser) {
    await signInWithCustomToken(auth, token);
    console.log("✅ Sesión Firebase enlazada con Clerk");
  }

  return auth.currentUser;
}